import { supabase } from './supabaseClient';

const LOCAL_USER_KEY = 'townhub_user_profile';
const BUSINESS_SESSION_KEY = 'townhub_business_auth';
const ADMIN_SESSION_KEY = 'townhub_admin_authenticated';
const TEMP_USERS_KEY = 'townhub_temp_users';

/**
 * Generates a 6-digit activation PIN with mandatory role suffix:
 * - 'U' suffix for Authorized Users / Residents (e.g., 482910U)
 * - 'S' suffix for Verified Sellers / Merchants (e.g., 739102S)
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
      return { exists: true, hasPin: Boolean(cached.resident_pin_hash), isBanned: false, profile: cached };
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
      hasPin: Boolean(data?.resident_pin_hash),
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
 * Log in Resident or Merchant with PIN
 */
export async function loginWith4DigitPin(phone, pin) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  const pinHash = await hashPin(pin);

  if (!supabase) {
    const cached = getCurrentUserProfile();
    if (cached && cached.phone === cleanPhone) {
      if (cached.is_banned) {
        return { success: false, error: '⛔ This mobile number has been blocked by Admin.' };
      }
      return { success: true, profile: cached };
    }
    return { success: false, error: 'User not found in offline session.' };
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (error || !data) {
      return { success: false, error: 'User account not found. Please register first.' };
    }

    if (data.is_banned) {
      return { success: false, error: '⛔ This mobile number has been blocked by Admin for policy violations.' };
    }

    const matchesResident = data.resident_pin_hash && data.resident_pin_hash === pinHash;
    const matchesBusiness = data.business_pin_hash && data.business_pin_hash === pinHash;

    if (!matchesResident && !matchesBusiness) {
      return { success: false, error: 'Incorrect PIN. Please try again.' };
    }

    await supabase
      .from('user_profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.id);

    setLocalUserProfile(data);
    return { success: true, profile: data };
  } catch (err) {
    return { success: false, error: err.message || 'Login failed.' };
  }
}

export const loginResidentWithPin = loginWith4DigitPin;

/* ========================================================================= */
/* 🌟 ROLE-DIFFERENTIATED ACTIVATION (USER: '...U' | SELLER: '...S')         */
/* ========================================================================= */

/**
 * Verifies activation PIN with role differentiator ('U' or 'S')
 */
export async function verifyActivationPin(phone, pinInput) {
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

  if (!supabase) {
    const cached = getCurrentUserProfile() || { phone: cleanPhone, full_name: 'Local User' };
    const updated = {
      ...cached,
      is_merchant: isSellerPin ? true : cached.is_merchant,
      verification_tier: isSellerPin ? 'verified_merchant' : 'verified_resident',
      status: 'verified',
      is_verified: true,
    };
    setLocalUserProfile(updated);
    return { success: true, profile: updated, roleType: isSellerPin ? 'seller' : 'user', canSetCustomPin: true };
  }

  try {
    const { data: user, error: fetchErr } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('phone', cleanPhone)
      .single();

    if (fetchErr || !user) {
      return { success: false, error: 'User account not found. Please register first.' };
    }

    if (user.is_banned) {
      return { success: false, error: '⛔ Account is blocked by Admin.' };
    }

    const expectedPin = String(user.admin_activation_pin || '').trim().toUpperCase();
    if (!expectedPin || expectedPin !== cleanPin) {
      return {
        success: false,
        error: `Invalid activation PIN. Please enter the exact ${isSellerPin ? 'Seller (...S)' : 'User (...U)'} PIN dispatched by Admin.`,
      };
    }

    const updates = isSellerPin
      ? {
          is_merchant: true,
          verification_tier: 'verified_merchant',
          status: 'verified',
          is_verified: true,
          merchant_verified_at: new Date().toISOString(),
        }
      : {
          verification_tier: 'verified_resident',
          status: 'verified',
          is_verified: true,
        };

    const { data: updatedUser, error: updateErr } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    setLocalUserProfile(updatedUser);
    return {
      success: true,
      profile: updatedUser,
      roleType: isSellerPin ? 'seller' : 'user',
      canSetCustomPin: true,
    };
  } catch (err) {
    return { success: false, error: err.message || 'Verification failed.' };
  }
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
        business_pin_hash: pinHash,
        business_name: businessName.trim() || undefined,
        is_merchant: true,
        verification_tier: 'verified_merchant',
        last_login_at: new Date().toISOString(),
      }
    : {
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
 * Update Admin Activation PIN for WhatsApp Dispatch
 */
export async function markUserPinDispatched(phone, pinCode) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);

  if (supabase) {
    try {
      await supabase
        .from('user_profiles')
        .update({
          admin_activation_pin: pinCode,
          last_login_at: new Date().toISOString(),
        })
        .eq('phone', cleanPhone);
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