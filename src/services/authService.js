import { supabase } from './supabaseClient';

const LOCAL_USER_KEY = 'townhub_user_profile';
const BUSINESS_SESSION_KEY = 'townhub_business_auth';
const ADMIN_SESSION_KEY = 'townhub_admin_authenticated';

/**
 * Clean 10-digit mobile number helper
 */
export const sanitizePhone = (phone) => String(phone || '').replace(/\D/g, '').slice(-10);

/**
 * Safe query deletion helpers (prevents Supabase thenable .catch() runtime TypeError)
 */
async function safeDeleteIn(table, column, values) {
  if (!supabase || !values || (Array.isArray(values) && values.length === 0)) return;
  try {
    const { error } = await supabase.from(table).delete().in(column, values);
    if (error) console.warn(`safeDeleteIn on ${table}.${column} warning:`, error.message);
  } catch (err) {
    console.warn(`safeDeleteIn on ${table} caught:`, err);
  }
}

async function safeDeleteEq(table, column, value) {
  if (!supabase || value === undefined || value === null || value === '') return;
  try {
    const { error } = await supabase.from(table).delete().eq(column, value);
    if (error) console.warn(`safeDeleteEq on ${table}.${column} warning:`, error.message);
  } catch (err) {
    console.warn(`safeDeleteEq on ${table} caught:`, err);
  }
}

/**
 * Generates a clean 6-digit numeric activation PIN
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
  const cleanPin = String(pin).trim();
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
  return Boolean(
    (profile?.is_merchant ||
      profile?.verification_tier === 'merchant' ||
      profile?.verification_tier === 'verified_merchant') &&
      (isAuth || profile?.is_verified)
  );
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
    if (
      profile.is_merchant ||
      profile.verification_tier === 'merchant' ||
      profile.verification_tier === 'verified_merchant'
    ) {
      sessionStorage.setItem(BUSINESS_SESSION_KEY, 'authorized');
    }
  }
}

export const saveCurrentUserProfile = setLocalUserProfile;

/* ========================================================================= */
/* 🔍 USER STATUS & LOGIN                                                    */
/* ========================================================================= */

/**
 * Check if mobile number already has an account & enforce ban guard
 */
export async function checkUserExistence(phone) {
  const cleanPhone = sanitizePhone(phone);
  if (cleanPhone.length !== 10) {
    return { exists: false, hasPin: false, isBanned: false, profile: null };
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking user existence:', error);
      }

      if (data) {
        if (data.is_banned) {
          return { exists: true, hasPin: false, isBanned: true, profile: data };
        }
        const hasSetPin = Boolean(
          data.secret_pin_hash || data.resident_pin_hash || data.business_pin_hash
        );
        const isFullyVerified = Boolean(data.is_verified && data.status === 'active');
        return {
          exists: true,
          hasPin: hasSetPin,
          isVerified: isFullyVerified,
          isBanned: false,
          profile: data,
        };
      }
    } catch (err) {
      console.warn('Database user check note:', err);
    }
  }

  const cached = getCurrentUserProfile();
  if (cached && sanitizePhone(cached.phone) === cleanPhone) {
    return {
      exists: true,
      hasPin: Boolean(cached.secret_pin_hash || cached.resident_pin_hash),
      isVerified: Boolean(cached.is_verified && cached.status === 'active'),
      isBanned: Boolean(cached.is_banned),
      profile: cached,
    };
  }

  return { exists: false, hasPin: false, isVerified: false, isBanned: false, profile: null };
}

/**
 * Log in Resident or Merchant with their 4-digit permanent Security PIN
 */
export async function loginWith4DigitPin(phone, pin) {
  const cleanPhone = sanitizePhone(phone);
  const cleanPin = String(pin).trim();

  if (cleanPhone.length !== 10) {
    return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
  }
  if (cleanPin.length < 4) {
    return { success: false, error: 'PIN must be at least 4 digits.' };
  }

  const pinHash = await hashPin(cleanPin);

  if (supabase) {
    try {
      const { data: user, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (error || !user) {
        return { success: false, error: 'Account not found. Please register first.' };
      }

      if (user.is_banned) {
        return { success: false, error: '⛔ This mobile number is suspended by Admin.' };
      }

      const isPinValid =
        user.secret_pin_hash === pinHash ||
        user.resident_pin_hash === pinHash ||
        user.business_pin_hash === pinHash;

      if (!isPinValid) {
        return { success: false, error: 'Incorrect Security PIN.' };
      }

      if (
        !user.is_verified ||
        user.status === 'temporary' ||
        user.status === 'pending_activation'
      ) {
        return {
          success: false,
          isPendingActivation: true,
          error: 'Your account is pending WhatsApp PIN activation from Admin.',
        };
      }

      const sessionProfile = {
        id: user.id,
        user_id: user.id,
        phone: user.phone,
        full_name: user.full_name,
        area_name: user.area_name || 'Town Center',
        city: user.city || 'Alwar',
        role: user.is_merchant ? 'seller' : 'user',
        is_merchant: Boolean(user.is_merchant),
        is_verified: true,
        status: user.status || 'active',
        business_name: user.business_name || null,
        verification_tier:
          user.verification_tier || (user.is_merchant ? 'merchant' : 'resident'),
      };

      setLocalUserProfile(sessionProfile);

      supabase
        .from('user_profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('phone', cleanPhone)
        .then(() => {});

      return { success: true, profile: sessionProfile };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  const cached = getCurrentUserProfile();
  if (cached && sanitizePhone(cached.phone) === cleanPhone) {
    setLocalUserProfile(cached);
    return { success: true, profile: cached };
  }

  return { success: false, error: 'User not found in local session.' };
}

/* ========================================================================= */
/* 📲 STEP 1: REQUEST ADMIN WHATSAPP ACTIVATION                             */
/* ========================================================================= */

/**
 * Register user intent and return pre-formatted WhatsApp link to Admin
 */
export async function requestWhatsAppActivation({
  phone,
  fullName,
  areaName = 'Ranjeet Nagar',
  isMerchant = false,
  businessName = '',
  city = 'Alwar',
}) {
  const cleanPhone = sanitizePhone(phone);
  if (cleanPhone.length !== 10) {
    return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
  }
  if (!fullName || !fullName.trim()) {
    return { success: false, error: 'Please provide your full name.' };
  }

  const payload = {
    phone: cleanPhone,
    full_name: fullName.trim(),
    area_name: areaName.trim() || 'Town Center',
    city: city || 'Alwar',
    is_merchant: Boolean(isMerchant),
    business_name: isMerchant ? (businessName || fullName).trim() : null,
    verification_tier: isMerchant ? 'merchant' : 'resident',
    is_verified: false,
    status: 'pending_activation',
    last_login_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      await supabase.from('user_profiles').upsert(payload, { onConflict: 'phone' });
    } catch (err) {
      console.warn('Supabase registration intent note:', err.message);
    }
  }

  const cached = getCurrentUserProfile() || {};
  setLocalUserProfile({ ...cached, ...payload });

  const adminWhatsAppNumber = '919116544765';
  const message = encodeURIComponent(
    `Namaste Admin! 🙏\n` +
      `Please approve my Aapke Kareeb (${city}) account:\n\n` +
      `👤 Name: ${fullName.trim()}\n` +
      `📞 Phone: +91 ${cleanPhone}\n` +
      `📍 Colony: ${areaName}\n` +
      `🏷️ Role: ${
        isMerchant
          ? `Merchant / Seller (${businessName || fullName})`
          : 'Resident Member'
      }\n\n` +
      `Please send me my 6-digit Activation PIN. Thank you!`
  );

  const whatsappUrl = `https://wa.me/${adminWhatsAppNumber}?text=${message}`;

  return {
    success: true,
    phone: cleanPhone,
    whatsappUrl,
    message:
      'Activation request registered. Please connect with Admin on WhatsApp for your 6-digit PIN.',
  };
}

/* ========================================================================= */
/* 🔑 STEP 2: VERIFY ADMIN PIN & SET OWN 4-DIGIT PERMANENT PIN              */
/* ========================================================================= */

/**
 * Verifies admin-issued 6-digit activation PIN from WhatsApp and sets user's permanent 4-digit PIN
 */
export async function verifyActivationPinAndSetPermanentPin({
  phone,
  activationPin,
  newPermanentPin,
}) {
  const cleanPhone = sanitizePhone(phone);
  const cleanActivationPin = String(activationPin || '').trim().replace(/[US]$/i, '');
  const cleanNewPin = String(newPermanentPin || '').trim();

  if (cleanPhone.length !== 10) {
    return { success: false, error: 'Valid 10-digit phone number is required.' };
  }
  if (!cleanActivationPin) {
    return { success: false, error: 'Please enter the 6-digit PIN received on WhatsApp.' };
  }
  if (cleanNewPin.length < 4 || cleanNewPin.length > 6) {
    return { success: false, error: 'Permanent PIN must be 4 to 6 digits.' };
  }

  if (supabase) {
    try {
      const { data: user, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (error || !user) {
        return {
          success: false,
          error: 'Profile not found. Please submit registration details first.',
        };
      }

      const dbPin = String(user.admin_activation_pin || '').trim().replace(/[US]$/i, '');
      if (!dbPin || dbPin !== cleanActivationPin) {
        return {
          success: false,
          error: 'Invalid Activation PIN. Please check the code sent on WhatsApp.',
        };
      }

      const hashedPin = await hashPin(cleanNewPin);

      const updates = {
        is_verified: true,
        status: 'active',
        admin_activation_pin: null, // Consume PIN
        secret_pin_hash: hashedPin,
        resident_pin_hash: hashedPin,
        business_pin_hash: user.is_merchant ? hashedPin : null,
        merchant_verified_at: user.is_merchant ? new Date().toISOString() : null,
        last_login_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('phone', cleanPhone);

      if (updateError) throw updateError;

      const sessionProfile = {
        id: user.id,
        user_id: user.id,
        phone: user.phone,
        full_name: user.full_name,
        area_name: user.area_name || 'Town Center',
        city: user.city || 'Alwar',
        role: user.is_merchant ? 'seller' : 'user',
        is_merchant: Boolean(user.is_merchant),
        is_verified: true,
        status: 'active',
        business_name: user.business_name || null,
        verification_tier: user.is_merchant ? 'merchant' : 'resident',
      };

      setLocalUserProfile(sessionProfile);
      return { success: true, profile: sessionProfile, roleType: user.is_merchant ? 'seller' : 'user' };
    } catch (err) {
      console.error('Activation verification error:', err);
      return { success: false, error: err.message || 'Verification failed.' };
    }
  }

  return { success: false, error: 'Database connection unavailable.' };
}

/* ========================================================================= */
/* 👑 MASTER ADMIN CRM CONTROLS & SAFE CASCADE DELETION ENGINE              */
/* ========================================================================= */

/**
 * Toggle ban state for user profile and updates active listing states
 */
export async function adminToggleBanUser(phone, shouldBan = true) {
  const cleanPhone = sanitizePhone(phone);
  if (!cleanPhone) return { success: false, error: 'Invalid phone number' };

  if (supabase) {
    try {
      const { error: userError } = await supabase
        .from('user_profiles')
        .update({
          is_banned: Boolean(shouldBan),
          status: shouldBan ? 'banned' : 'active',
        })
        .eq('phone', cleanPhone);

      if (userError) throw userError;

      // Update listings active status according to ban state
      await supabase
        .from('listings')
        .update({ is_active: !shouldBan })
        .eq('phone', cleanPhone);

      return { success: true };
    } catch (err) {
      console.error('Toggle ban error:', err);
      return { success: false, error: err.message };
    }
  }
  return { success: true };
}

/**
 * Guaranteed Cascading User Deletion Pipeline
 * Cleanly removes child records in foreign key order before deleting user_profiles
 */
export async function adminDeleteUser(userId, phone) {
  const cleanPhone = sanitizePhone(phone);
  if (!cleanPhone && !userId) return { success: false, error: 'User identifier required' };

  if (supabase) {
    try {
      // 1. Resolve user ID if only phone was provided
      let resolvedUserId = userId;
      if (!resolvedUserId && cleanPhone) {
        const { data: userRec } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('phone', cleanPhone)
          .maybeSingle();
        resolvedUserId = userRec?.id || null;
      }

      // 2. Fetch all listings owned by this user
      let listingIds = [];
      const { data: userListings } = await supabase
        .from('listings')
        .select('id')
        .or(`phone.eq.${cleanPhone}${resolvedUserId ? `,user_id.eq.${resolvedUserId}` : ''}`);

      if (userListings && userListings.length > 0) {
        listingIds = userListings.map((l) => l.id);
      }

      // 3. Cascade delete child records tied to listings
      if (listingIds.length > 0) {
        await safeDeleteIn('user_carts', 'listing_id', listingIds);
        await safeDeleteIn('listing_interests', 'listing_id', listingIds);
        await safeDeleteIn('listing_reports', 'listing_id', listingIds);
        await safeDeleteIn('listing_reviews', 'listing_id', listingIds);
        await safeDeleteIn('listing_threads', 'listing_id', listingIds);
      }

      // 4. Cascade delete child records tied directly to user phone
      if (cleanPhone) {
        await safeDeleteEq('user_carts', 'phone', cleanPhone);
        await safeDeleteEq('listing_interests', 'phone', cleanPhone);
        await safeDeleteEq('listing_reports', 'reporter_phone', cleanPhone);
        await safeDeleteEq('listing_reviews', 'phone', cleanPhone);
        await safeDeleteEq('notifications', 'recipient_phone', cleanPhone);
      }

      // 5. Cascade delete child records tied to resolved user ID
      if (resolvedUserId) {
        await safeDeleteEq('listing_reports', 'reporter_id', resolvedUserId);
        await safeDeleteEq('listing_reviews', 'user_id', resolvedUserId);
        await safeDeleteEq('listing_threads', 'user_id', resolvedUserId);
        await safeDeleteEq('notifications', 'user_id', resolvedUserId);
      }

      // 6. Delete all listings
      if (listingIds.length > 0) {
        await safeDeleteIn('listings', 'id', listingIds);
      }
      if (cleanPhone) {
        await safeDeleteEq('listings', 'phone', cleanPhone);
      }

      // 7. Delete user profile record
      const { error: deleteUserError } = await supabase
        .from('user_profiles')
        .delete()
        .or(`phone.eq.${cleanPhone}${resolvedUserId ? `,id.eq.${resolvedUserId}` : ''}`);

      if (deleteUserError) throw deleteUserError;

      return { success: true };
    } catch (err) {
      console.error('Cascading user deletion error:', err);
      return { success: false, error: err.message };
    }
  }

  return { success: true };
}

/**
 * Cascading Purge of all listings owned by a seller
 */
export async function adminDeleteAllSellerListings(phone) {
  const cleanPhone = sanitizePhone(phone);
  if (!cleanPhone) return { success: false, error: 'Phone number required' };

  if (supabase) {
    try {
      const { data: listings } = await supabase
        .from('listings')
        .select('id')
        .eq('phone', cleanPhone);

      if (listings && listings.length > 0) {
        const ids = listings.map((l) => l.id);
        await safeDeleteIn('user_carts', 'listing_id', ids);
        await safeDeleteIn('listing_interests', 'listing_id', ids);
        await safeDeleteIn('listing_reports', 'listing_id', ids);
        await safeDeleteIn('listing_reviews', 'listing_id', ids);
        await safeDeleteIn('listing_threads', 'listing_id', ids);
        await safeDeleteIn('listings', 'id', ids);
      }
      return { success: true };
    } catch (err) {
      console.error('Purge listings error:', err);
      return { success: false, error: err.message };
    }
  }
  return { success: true };
}

/**
 * Demote Verified Merchant to Basic Resident
 */
export async function adminDemoteMerchant(phone) {
  const cleanPhone = sanitizePhone(phone);
  if (!cleanPhone) return { success: false, error: 'Phone number required' };

  if (supabase) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          is_merchant: false,
          verification_tier: 'resident',
        })
        .eq('phone', cleanPhone);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Demote merchant error:', err);
      return { success: false, error: err.message };
    }
  }
  return { success: true };
}

export async function logoutUser() {
  setLocalUserProfile(null);
  sessionStorage.removeItem(BUSINESS_SESSION_KEY);
  try {
    const { hyperlocalStore } = await import('../store/hyperlocalStore');
    hyperlocalStore.resetCartOnLogout();
  } catch {}
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {}
  }
}

export function logoutAdmin() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

/**
 * Fetch categorized user lists for Master Admin CRM
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
      console.warn('Supabase CRM fetch error:', err.message);
    }
  }

  const allUsers = Array.isArray(dbUsers) ? dbUsers : [];

  return {
    tier1Users: allUsers.filter(
      (u) => !u.is_banned && (!u.is_verified || u.verification_tier === 'resident')
    ),
    tier2Users: allUsers.filter(
      (u) => !u.is_banned && u.is_verified && !u.is_merchant
    ),
    tier3Merchants: allUsers.filter(
      (u) => !u.is_banned && (u.is_merchant || u.verification_tier === 'merchant' || u.verification_tier === 'verified_merchant')
    ),
    bannedUsers: allUsers.filter((u) => Boolean(u.is_banned)),
    totalCount: allUsers.length,
    allUsers,
  };
}

/**
 * Update/Upsert Admin Activation PIN for manual onboarding
 */
export async function markUserPinDispatched(phone, pinCode) {
  const cleanPhone = sanitizePhone(phone);
  if (!cleanPhone) return { success: false, error: 'Phone number required' };

  if (supabase) {
    try {
      const cleanNumericPin = String(pinCode).trim().replace(/[US]$/i, '');
      const { error } = await supabase
        .from('user_profiles')
        .upsert(
          {
            phone: cleanPhone,
            full_name: 'Invited Member',
            area_name: 'Town Center',
            admin_activation_pin: cleanNumericPin,
            status: 'pending_activation',
            last_login_at: new Date().toISOString(),
          },
          { onConflict: 'phone' }
        );

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('markUserPinDispatched error:', err);
      return { success: false, error: err.message };
    }
  }

  return { success: true };
}

// ── Backward-Compatibility Export Aliases ─────────────────────
export const registerTier1User = async ({ phone, fullName, areaName, pin, city }) => {
  return requestWhatsAppActivation({
    phone,
    fullName,
    areaName,
    isMerchant: false,
    city,
  });
};

export const requestAndSendWhatsAppPin = async ({ phone, type, fullName, city }) => {
  const isMerchant = type === 'seller' || type === 'merchant';
  const res = await requestWhatsAppActivation({ phone, fullName, isMerchant, city });
  return {
    success: res.success,
    whatsappUrl: res.whatsappUrl,
    error: res.error,
    roleType: isMerchant ? 'seller' : 'user',
  };
};

export const verifyActivationPin = async (phone, pinInput, customPin = '1234') => {
  return verifyActivationPinAndSetPermanentPin({
    phone,
    activationPin: pinInput,
    newPermanentPin: customPin,
  });
};

export const verifyTier2WhatsAppPin = verifyActivationPin;
export const verifyAdminActivationPin = verifyActivationPin;
export const loginResidentWithPin = loginWith4DigitPin;

export const setCustomPermanentPin = async ({ phone, newPin, roleType, businessName }) => {
  return verifyActivationPinAndSetPermanentPin({
    phone,
    activationPin: '',
    newPermanentPin: newPin,
  });
};