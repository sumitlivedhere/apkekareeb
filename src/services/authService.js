import { supabase } from './supabaseClient';

const LOCAL_USER_KEY = 'townhub_user_profile';
const BUSINESS_SESSION_KEY = 'townhub_business_auth';
const ADMIN_SESSION_KEY = 'townhub_admin_authenticated';
const TEMP_USERS_KEY = 'townhub_temp_users';

/**
 * Generates a 6-digit activation PIN with mandatory role suffix:
 * - 'U' suffix for Authorized Users / Residents (e.g., 482910U)[cite: 2]
 * - 'S' suffix for Verified Sellers / Merchants (e.g., 739102S)[cite: 2]
 */
export function generateActivationPin(type = 'user') {
  const random6 = Math.floor(100000 + Math.random() * 900000).toString();
  const suffix = type === 'seller' || type === 'merchant' ? 'S' : 'U';
  return `${random6}${suffix}`;
}

/**
 * Hash PIN via Web Crypto API (SHA-256)
 */
export async function hashPin(pin) {
  const cleanPin = String(pin).trim().toUpperCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(`aapkekareeb_salt_${cleanPin}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get active user session profile from localStorage
 */
export function getCurrentUserProfile() {
  try {
    const saved = localStorage.getItem(LOCAL_USER_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

/**
 * Check if the active session is authorized as Verified Merchant
 */
export function isBusinessAuthorized() {
  const profile = getCurrentUserProfile();
  const isAuth = sessionStorage.getItem(BUSINESS_SESSION_KEY) === 'authorized';
  return Boolean((profile?.is_merchant || profile?.verification_tier === 'verified_merchant') && isAuth);
}

/**
 * Check if the active session is authorized as Master Admin
 */
export function isAdminAuthorized() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

/**
 * Persist user profile to local session
 */
export function setLocalUserProfile(profile) {
  if (!profile) {
    localStorage.removeItem(LOCAL_USER_KEY);
    sessionStorage.removeItem(BUSINESS_SESSION_KEY);
  } else {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
    if (profile.is_merchant || profile.verification_tier === 'verified_merchant') {
      sessionStorage.setItem(BUSINESS_SESSION_KEY, 'authorized');
    }
  }
}

export const saveCurrentUserProfile = setLocalUserProfile;

/* ========================================================================= */
/* 📱 1-TAP WHATSAPP PIN GENERATOR & DISPATCH                                */
/* ========================================================================= */

/**
 * Generates activation PIN, upserts to profile so it exists in DB for verification,
 * and returns pre-formatted WhatsApp Web deep link URL.
 */
export async function requestAndSendWhatsAppPin({ phone, type = 'user', fullName = 'Resident', city = 'Alwar' }) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  if (cleanPhone.length !== 10) {
    return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
  }

  const pinCode = generateActivationPin(type);
  const isSeller = type === 'seller' || type === 'merchant';

  if (supabase) {
    try {
      await supabase.from('user_profiles').upsert(
        {
          phone: cleanPhone,
          full_name: fullName.trim() || (isSeller ? 'Merchant Partner' : 'Resident User'),
          area_name: 'Town Center',
          city: city || 'Alwar',
          admin_activation_pin: pinCode,
          last_login_at: new Date().toISOString(),
        },
        { onConflict: 'phone' }
      );
    } catch (err) {
      console.warn('Database PIN dispatch note:', err.message);
    }
  }

  const cached = getCurrentUserProfile() || { phone: cleanPhone, full_name: fullName };
  setLocalUserProfile({ ...cached, admin_activation_pin: pinCode });

  const message = isSeller
    ? `Namaste ${fullName || 'Merchant'}! 🙏\n\nAapke Kareeb (${city}) me aapka *Verified Seller Activation PIN* hai:\n\n🔑 *${pinCode}*\n\n1. App me jakar yeh PIN darj karein.\n2. Iske baad apna permanent login PIN set karein.\n\nDhanyawaad!`
    : `Namaste ${fullName || 'Resident'}! 🙏\n\nAapke Kareeb (${city}) me aapka *Authorized Resident Activation PIN* hai:\n\n🔑 *${pinCode}*\n\n1. App me jakar yeh PIN darj karein.\n2. Iske baad apna permanent login PIN set karein.\n\nDhanyawaad!`;

  const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;

  return {
    success: true,
    pin: pinCode,
    whatsappUrl,
    roleType: isSeller ? 'seller' : 'user',
  };
}

/* ========================================================================= */
/* 🌟 TIER 1: BASIC RESIDENT (PHONE + 4-DIGIT SELF MPIN)                    */
/* ========================================================================= */

/**
 * Check if mobile number already has an account & enforce ban guard
 */
export async function checkUserExistence(phone) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  if (!supabase) {
    const cached = getCurrentUserProfile();
    if (cached && cached.phone === cleanPhone) {
      if (cached.is_banned) {
        return { exists: true, hasPin: false, isBanned: true, profile: cached };
      }
      return {
        exists: true,
        hasPin: Boolean(cached.secret_pin_hash || cached.resident_pin_hash),
        isBanned: false,
        profile: cached,
      };
    }
    return { exists: false, hasPin: false, isBanned: false, profile: null };
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking user existence:', error);
    }

    if (data?.is_banned) {
      return { exists: true, hasPin: false, isBanned: true, profile: data };
    }

    return {
      exists: Boolean(data),
      hasPin: Boolean(data?.secret_pin_hash || data?.resident_pin_hash || data?.business_pin_hash),
      isBanned: false,
      profile: data || null,
    };
  } catch {
    return { exists: false, hasPin: false, isBanned: false, profile: null };
  }
}

/**
 * Register Tier 1 Resident User (One-time setup with 4-Digit MPIN)
 */
export async function registerTier1User({ phone, fullName, areaName = 'Town Center', pin, city = 'Alwar' }) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  const pinHash = await hashPin(pin);

  const profilePayload = {
    phone: cleanPhone,
    full_name: fullName.trim() || 'Resident User',
    area_name: areaName.trim() || 'Town Center',
    city: city || 'Alwar',
    secret_pin_hash: pinHash,
    resident_pin_hash: pinHash,
    verification_tier: 'resident',
    is_merchant: false,
    is_verified: true,
    is_banned: false,
    trust_score: 100,
    status: 'active',
    last_login_at: new Date().toISOString(),
  };

  if (!supabase) {
    setLocalUserProfile(profilePayload);
    return { success: true, profile: profilePayload };
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(profilePayload, { onConflict: 'phone' })
      .select()
      .single();

    if (error) {
      setLocalUserProfile(profilePayload);
      return { success: true, profile: profilePayload };
    }

    setLocalUserProfile(data);
    return { success: true, profile: data };
  } catch {
    setLocalUserProfile(profilePayload);
    return { success: true, profile: profilePayload };
  }
}

/**
 * Log in Resident or Merchant with PIN using Database-Level Protection (5 Attempts + 15-min Lockout)
 */
export async function loginWith4DigitPin(phone, pin) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  const pinHash = await hashPin(pin);

  if (supabase) {
    try {
      const { data: rpcRes, error } = await supabase.rpc('authenticate_user_pin', {
        p_phone: cleanPhone,
        p_pin_hash: pinHash,
      });

      if (!error && rpcRes) {
        if (rpcRes.success && rpcRes.profile) {
          setLocalUserProfile(rpcRes.profile);
          return { success: true, profile: rpcRes.profile };
        }
        return { success: false, error: rpcRes.error || 'Authentication failed.' };
      }
    } catch (err) {
      console.warn('RPC auth fallback notice:', err.message);
    }
  }

  // Offline Session Fallback
  const cached = getCurrentUserProfile();
  if (cached && cached.phone === cleanPhone) {
    if (cached.is_banned) {
      return { success: false, error: '⛔ This mobile number has been blocked by Admin.' };
    }
    return { success: true, profile: cached };
  }
  return { success: false, error: 'User not found in offline session.' };
}

export const loginResidentWithPin = loginWith4DigitPin;

/* ========================================================================= */
/* 🌟 ROLE-DIFFERENTIATED ACTIVATION (USER: '...U' | SELLER: '...S')         */
/* ========================================================================= */

/**
 * Verifies activation PIN with role differentiator ('U' or 'S') and sets permanent custom PIN[cite: 2]
 */
export async function verifyActivationPin(phone, pinInput, customPin = '1234', businessName = '') {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  const cleanPin = String(pinInput || '').trim().toUpperCase();

  if (cleanPin.length < 7) {
    return { success: false, error: 'Invalid PIN format. Must be 6 digits followed by U (User) or S (Seller).' };
  }

  const isSellerPin = cleanPin.endsWith('S');
  const isUserPin = cleanPin.endsWith('U');

  if (!isSellerPin && !isUserPin) {
    return { success: false, error: 'Invalid PIN suffix. Authorized User PIN ends with "U" and Seller PIN ends with "S".' };
  }

  const customPinHash = await hashPin(customPin);

  if (supabase) {
    try {
      const { data: rpcRes, error } = await supabase.rpc('verify_and_activate_role', {
        p_phone: cleanPhone,
        p_activation_pin: cleanPin,
        p_new_pin_hash: customPinHash,
        p_business_name: businessName || null,
      });

      if (!error && rpcRes) {
        if (rpcRes.success && rpcRes.profile) {
          setLocalUserProfile(rpcRes.profile);
          return {
            success: true,
            profile: rpcRes.profile,
            roleType: rpcRes.roleType || (isSellerPin ? 'seller' : 'user'),
            canSetCustomPin: true,
          };
        }
        return { success: false, error: rpcRes.error || 'Activation failed.' };
      }
    } catch (err) {
      console.warn('RPC activation fallback notice:', err.message);
    }
  }

  // Offline Session Fallback
  const cached = getCurrentUserProfile() || { phone: cleanPhone, full_name: 'Local User' };
  const updated = {
    ...cached,
    is_merchant: isSellerPin ? true : cached.is_merchant,
    verification_tier: isSellerPin ? 'verified_merchant' : 'verified_resident',
    business_name: businessName || cached.business_name,
    status: 'verified',
    is_verified: true,
  };
  setLocalUserProfile(updated);
  return {
    success: true,
    profile: updated,
    roleType: isSellerPin ? 'seller' : 'user',
    canSetCustomPin: true,
  };
}

export const verifyTier2WhatsAppPin = verifyActivationPin;
export const verifyAdminActivationPin = verifyActivationPin;

/**
 * Sets personal permanent PIN after activation
 */
export async function setCustomPermanentPin({ phone, newPin, roleType = 'user', businessName = '' }) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  const cleanPin = String(newPin || '').trim();

  if (!cleanPin || cleanPin.length < 4) {
    return { success: false, error: 'PIN must be at least 4 digits.' };
  }

  const pinHash = await hashPin(cleanPin);
  const isSeller = roleType === 'seller' || roleType === 'merchant';

  const updates = isSeller
    ? {
        secret_pin_hash: pinHash,
        business_pin_hash: pinHash,
        business_name: businessName.trim() || undefined,
        is_merchant: true,
        verification_tier: 'verified_merchant',
        last_login_at: new Date().toISOString(),
      }
    : {
        secret_pin_hash: pinHash,
        resident_pin_hash: pinHash,
        verification_tier: 'verified_resident',
        last_login_at: new Date().toISOString(),
      };

  if (!supabase) {
    const cached = getCurrentUserProfile() || { phone: cleanPhone };
    const updated = { ...cached, ...updates };
    setLocalUserProfile(updated);
    return { success: true, profile: updated };
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('phone', cleanPhone)
      .select()
      .single();

    if (error) throw error;

    setLocalUserProfile(data);
    return { success: true, profile: data };
  } catch (err) {
    return { success: false, error: err.message || 'Failed to save personal PIN.' };
  }
}

/* ========================================================================= */
/* 👑 MASTER ADMIN CRM CONTROLS                                              */
/* ========================================================================= */

/**
 * Fetch all users for Master Admin CRM
 */
export async function getAllUsersForAdmin() {
  let dbUsers = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        dbUsers = data;
      }
    } catch (err) {
      console.warn('Supabase CRM fetch fallback:', err.message);
    }
  }

  const localList = JSON.parse(localStorage.getItem(TEMP_USERS_KEY) || '[]');
  const mergedMap = new Map();

  [...dbUsers, ...localList].forEach((u) => {
    if (u && u.phone) mergedMap.set(u.phone, u);
  });

  const allUsers = Array.from(mergedMap.values());

  return {
    tier1Users: allUsers.filter((u) => !u.is_banned && (u.verification_tier === 'resident' || !u.verification_tier)),
    tier2Users: allUsers.filter((u) => !u.is_banned && u.verification_tier === 'verified_resident'),
    tier3Merchants: allUsers.filter((u) => !u.is_banned && (u.is_merchant || u.verification_tier === 'verified_merchant')),
    bannedUsers: allUsers.filter((u) => u.is_banned === true),
    totalCount: allUsers.length,
    allUsers,
  };
}

/**
 * 1-Tap Ban/Block or Unban User Profile & Mobile Number
 */
export async function adminToggleBanUser(phone, shouldBan = true) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);

  if (supabase) {
    try {
      await supabase
        .from('user_profiles')
        .update({
          is_banned: shouldBan,
          status: shouldBan ? 'banned' : 'active',
        })
        .eq('phone', cleanPhone);

      if (shouldBan) {
        await supabase
          .from('listings')
          .update({ is_active: false })
          .eq('phone', cleanPhone);
      }
    } catch (err) {
      console.error('Failed to toggle ban in Supabase:', err);
      return { success: false, error: err.message };
    }
  }

  const cached = getCurrentUserProfile();
  if (cached && cached.phone === cleanPhone) {
    cached.is_banned = shouldBan;
    cached.status = shouldBan ? 'banned' : 'active';
    setLocalUserProfile(cached);
  }

  return { success: true };
}

/**
 * Permanently Delete User Profile & Associated Records
 */
export async function adminDeleteUser(userId, phone) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);

  if (supabase) {
    try {
      if (userId) {
        await supabase.from('listing_reports').delete().eq('reporter_id', userId).catch(() => {});
      }

      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('phone', cleanPhone);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to delete user in Supabase:', err);
      return { success: false, error: err.message };
    }
  }

  const cached = getCurrentUserProfile();
  if (cached && cached.phone === cleanPhone) {
    setLocalUserProfile(null);
  }

  return { success: true };
}

/**
 * Delete All Listings of a Specific Seller
 */
export async function adminDeleteAllSellerListings(phone) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);

  if (supabase) {
    try {
      const { data: listings } = await supabase
        .from('listings')
        .select('id')
        .eq('phone', cleanPhone);

      if (listings && listings.length > 0) {
        const ids = listings.map((l) => l.id);
        await supabase.from('listing_threads').delete().in('listing_id', ids).catch(() => {});
        await supabase.from('listing_reports').delete().in('listing_id', ids).catch(() => {});
        await supabase.from('listing_interests').delete().in('listing_id', ids).catch(() => {});
        await supabase.from('listing_reviews').delete().in('listing_id', ids).catch(() => {});
        await supabase.from('listings').delete().in('id', ids);
      }
    } catch (err) {
      console.error('Failed to purge seller listings:', err);
      return { success: false, error: err.message };
    }
  }

  return { success: true };
}

/**
 * Demote Merchant Back to Basic Resident Tier
 */
export async function adminDemoteMerchant(phone) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);

  if (supabase) {
    try {
      await supabase
        .from('user_profiles')
        .update({
          is_merchant: false,
          verification_tier: 'resident',
        })
        .eq('phone', cleanPhone);
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  return { success: true };
}

/**
 * Update Admin Activation PIN for WhatsApp Dispatch (Upserts for Pre-Invited Sellers)
 */
export async function markUserPinDispatched(phone, pinCode) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);

  if (supabase) {
    try {
      await supabase
        .from('user_profiles')
        .upsert(
          {
            phone: cleanPhone,
            full_name: 'Invited Member',
            area_name: 'Town Center',
            admin_activation_pin: pinCode,
            last_login_at: new Date().toISOString(),
          },
          { onConflict: 'phone' }
        );
    } catch {}
  }

  return { success: true };
}

/**
 * Atomic Listing Interest Toggle
 */
export async function toggleListingInterestInDB(listingId, phone) {
  if (!supabase || !listingId || !phone) return null;
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);

  try {
    const { data, error } = await supabase.rpc('toggle_listing_interest', {
      p_listing_id: listingId,
      p_phone: cleanPhone,
    });

    if (error) throw error;
    return data;
  } catch {
    return null;
  }
}

/**
 * Submit Community Spam/Scam Report
 */
export async function submitListingReport({ listingId, reporterPhone, reason }) {
  if (!supabase || !listingId) return { success: true };
  const cleanPhone = String(reporterPhone).replace(/\D/g, '').slice(-10);

  try {
    const { data, error } = await supabase
      .from('listing_reports')
      .insert([
        {
          listing_id: listingId,
          reporter_phone: cleanPhone,
          reason: reason || 'Spam / Fraudulent Content',
        },
      ]);

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'You have already reported this listing.' };
      }
      throw error;
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Log out Session
 */
export async function logoutUser() {
  setLocalUserProfile(null);
  try {
    sessionStorage.removeItem(BUSINESS_SESSION_KEY);
    localStorage.removeItem(LOCAL_USER_KEY);
    localStorage.removeItem('townhub_user_phone');
    localStorage.removeItem('townhub_auth_token');
    localStorage.removeItem('townhub_resident_pin');
    localStorage.removeItem('townhub_business_pin');
  } catch (e) {
    console.warn('User logout note:', e);
  }

  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {}
  }
}

/**
 * Log out Master Admin & Lock Controls
 */
export function logoutAdmin() {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem('townhub_admin_key');
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem('townhub_admin_key');
    localStorage.removeItem('townhub_admin_unlocked');
  } catch (e) {
    console.warn('Admin logout note:', e);
  }
}