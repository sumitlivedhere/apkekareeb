import { supabase } from './supabaseClient';

const LOCAL_USER_KEY = 'townhub_user_profile';
const BUSINESS_SESSION_KEY = 'townhub_business_auth';
const ADMIN_SESSION_KEY = 'townhub_admin_authenticated';
const TEMP_USERS_KEY = 'townhub_temp_users';

export const OFFICIAL_UPI_VPA = 'aldragobhai@oksbi';

/**
 * Hash PIN via Web Crypto API (SHA-256)
 */
export async function hashPin(pin) {
  const cleanPin = String(pin).trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(`townhub_salt_${cleanPin}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Formats standard NPCI ₹1 UPI Deep Link string
 */
export function formatUpiHandshakeUrl({
  payeeVpa = OFFICIAL_UPI_VPA,
  payeeName = 'TownHub KYC',
  phone,
  amount = '1',
}) {
  const transactionNote = encodeURIComponent(`TownHub KYC ${phone}`);
  return `upi://pay?pa=${payeeVpa}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${transactionNote}`;
}

/**
 * Get active user session profile
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
 * Check if the active session is authorized to view the Business Dashboard
 */
export function isBusinessAuthorized() {
  const profile = getCurrentUserProfile();
  const isAuth = sessionStorage.getItem(BUSINESS_SESSION_KEY) === 'authorized';
  return Boolean(profile && isAuth);
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
    if (profile.is_merchant || profile.role === 'merchant') {
      sessionStorage.setItem(BUSINESS_SESSION_KEY, 'authorized');
    }
  }
}

/* ========================================================================= */
/* 🌟 1. GENERAL USER 2-STEP ONBOARDING SYSTEM (user_profiles TABLE)         */
/* ========================================================================= */

/**
 * 1. Quick Temporary User Registration (Instant comments, likes & cart access)
 * Generates Admin Activation PIN: FIRSTNAME + 4-digit random code (e.g. SUMIT4829)
 */
export async function registerTemporaryUser({ fullName, phone, city = 'Alwar', areaName = 'Town Center' }) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  const firstName = (fullName || 'USER').trim().split(' ')[0].toUpperCase();
  const random4 = Math.floor(1000 + Math.random() * 9000);
  const adminActivationPin = `${firstName}${random4}`;

  const tempProfile = {
    id: `temp_${cleanPhone}`,
    phone: cleanPhone,
    full_name: fullName.trim() || 'Resident User',
    city: city || 'Alwar',
    area_name: areaName || 'Town Center',
    verification_tier: 'resident',
    status: 'temporary',
    admin_activation_pin: adminActivationPin,
    secret_pin_hash: null,
    is_verified: false,
    is_merchant: false,
    created_at: new Date().toISOString(),
  };

  // Upsert directly to public.user_profiles
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(
          [
            {
              phone: cleanPhone,
              full_name: tempProfile.full_name,
              city: tempProfile.city,
              area_name: tempProfile.area_name,
              status: 'temporary',
              admin_activation_pin: adminActivationPin,
              is_verified: false,
              is_merchant: false,
              last_login_at: new Date().toISOString(),
            },
          ],
          { onConflict: 'phone' }
        )
        .select()
        .single();

      if (!error && data) {
        tempProfile.id = data.id;
      }
    } catch (err) {
      console.warn('Supabase user_profiles upsert note:', err.message);
    }
  }

  // Local storage fallback for offline support
  try {
    const existingList = JSON.parse(localStorage.getItem(TEMP_USERS_KEY) || '[]');
    const filtered = existingList.filter((u) => u.phone !== cleanPhone);
    filtered.push(tempProfile);
    localStorage.setItem(TEMP_USERS_KEY, JSON.stringify(filtered));
  } catch {}

  setLocalUserProfile(tempProfile);
  return { success: true, profile: tempProfile };
}

/**
 * 2. Verify Admin Activation PIN sent via WhatsApp (FirstName + 4 digits)
 */
export async function verifyAdminActivationPin({ phone, activationPin }) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  const cleanPin = String(activationPin || '').trim().toUpperCase();

  let userRecord = null;

  if (supabase) {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('phone', cleanPhone)
        .single();
      if (data) userRecord = data;
    } catch {}
  }

  if (!userRecord) {
    const existingList = JSON.parse(localStorage.getItem(TEMP_USERS_KEY) || '[]');
    userRecord = existingList.find((u) => u.phone === cleanPhone);
  }

  if (!userRecord) {
    return { success: false, error: 'No user account found for this mobile number.' };
  }

  const recordPin = String(userRecord.admin_activation_pin || '').trim().toUpperCase();
  if (recordPin !== cleanPin) {
    return { success: false, error: 'Incorrect Admin Activation PIN. Please check your WhatsApp.' };
  }

  return { success: true, profile: userRecord };
}

/**
 * 3. Set Permanent 6-Digit Secret PIN
 */
export async function setPermanentSecretPin({ phone, secretPin }) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  const cleanPin = String(secretPin || '').trim();

  if (cleanPin.length !== 6 || !/^\d+$/.test(cleanPin)) {
    return { success: false, error: 'Secret PIN must be exactly 6 numeric digits.' };
  }

  const hashedSecretPin = await hashPin(cleanPin);

  let updatedProfile = {
    phone: cleanPhone,
    status: 'active',
    is_verified: true,
    secret_pin_hash: hashedSecretPin,
    resident_pin_hash: hashedSecretPin,
    last_login_at: new Date().toISOString(),
  };

  const current = getCurrentUserProfile() || {};
  updatedProfile = { ...current, ...updatedProfile };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          status: 'active',
          is_verified: true,
          secret_pin_hash: hashedSecretPin,
          resident_pin_hash: hashedSecretPin,
          last_login_at: new Date().toISOString(),
        })
        .eq('phone', cleanPhone)
        .select()
        .single();

      if (!error && data) updatedProfile = { ...updatedProfile, ...data };
    } catch (err) {
      console.warn('Supabase user_profiles activation update note:', err.message);
    }
  }

  // Update local storage cache
  try {
    const existingList = JSON.parse(localStorage.getItem(TEMP_USERS_KEY) || '[]');
    const filtered = existingList.map((u) =>
      u.phone === cleanPhone
        ? { ...u, status: 'active', secret_pin_hash: hashedSecretPin }
        : u
    );
    localStorage.setItem(TEMP_USERS_KEY, JSON.stringify(filtered));
  } catch {}

  setLocalUserProfile(updatedProfile);
  return { success: true, profile: updatedProfile };
}

/**
 * 4. Standard User Login with Mobile Number + 6-Digit Secret PIN
 */
export async function loginWithSecretPin({ phone, pin }) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  const cleanPin = String(pin || '').trim();
  const hashedPin = await hashPin(cleanPin);

  let userRecord = null;

  if (supabase) {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('phone', cleanPhone)
        .single();
      if (data) userRecord = data;
    } catch {}
  }

  if (!userRecord) {
    const existingList = JSON.parse(localStorage.getItem(TEMP_USERS_KEY) || '[]');
    userRecord = existingList.find((u) => u.phone === cleanPhone);
  }

  if (!userRecord) {
    return { success: false, error: 'Account not found. Please register first.' };
  }

  if (userRecord.status === 'temporary') {
    return {
      success: false,
      isTemporary: true,
      error: 'Account pending WhatsApp Admin PIN verification. Please activate your account.',
    };
  }

  const storedPin = userRecord.secret_pin_hash || userRecord.resident_pin_hash;
  if (storedPin && storedPin !== hashedPin) {
    return { success: false, error: 'Incorrect 6-Digit Secret PIN.' };
  }

  setLocalUserProfile(userRecord);
  return { success: true, profile: userRecord };
}

/**
 * 5. Fetch all users from public.user_profiles for Admin WhatsApp CRM
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
      console.warn('Supabase fetch error, fallback to local storage:', err.message);
    }
  }

  const localList = JSON.parse(localStorage.getItem(TEMP_USERS_KEY) || '[]');
  const mergedMap = new Map();

  [...dbUsers, ...localList].forEach((u) => {
    if (u && u.phone) mergedMap.set(u.phone, u);
  });

  const allUsers = Array.from(mergedMap.values());

  return {
    temporaryUsers: allUsers.filter((u) => u.status === 'temporary'),
    permanentUsers: allUsers.filter((u) => u.status === 'active' || u.is_verified),
    totalCount: allUsers.length,
  };
}

/**
 * Mark user activation PIN dispatched on WhatsApp
 */
export async function markUserPinDispatched(phone) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);

  if (supabase) {
    try {
      await supabase
        .from('user_profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('phone', cleanPhone);
    } catch {}
  }

  try {
    const list = JSON.parse(localStorage.getItem(TEMP_USERS_KEY) || '[]');
    const updated = list.map((u) => (u.phone === cleanPhone ? { ...u, pin_sent: true } : u));
    localStorage.setItem(TEMP_USERS_KEY, JSON.stringify(updated));
  } catch {}

  return { success: true };
}

/* ========================================================================= */
/* 🛡️ 2. ADMIN & SELLER AUTHENTICATION (UNDISTURBED)                          */
/* ========================================================================= */

/**
 * Request 6-Digit SMS OTP
 */
export async function requestSmsOtp(phone) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);

  if (!supabase) {
    return { success: true, debug_otp: '123456' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-sms-otp', {
      body: { phone: cleanPhone },
    });

    if (error) throw error;
    return data;
  } catch (err) {
    return { success: false, error: err.message || 'Failed to dispatch SMS OTP.' };
  }
}

/**
 * Verify SMS OTP and Set 4-Digit Resident PIN
 */
export async function verifySmsOtpAndRegister({
  phone,
  enteredOtp,
  fullName,
  areaName,
  city = 'Alwar',
  pin,
  lat = null,
  lng = null,
}) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);

  const encoder = new TextEncoder();
  const otpBuffer = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(`townhub_otp_${enteredOtp.trim()}`)
  );
  const otpHash = Array.from(new Uint8Array(otpBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const residentPinHash = await hashPin(pin);

  const fallbackProfile = {
    id: `resident_${cleanPhone}`,
    phone: cleanPhone,
    full_name: fullName.trim() || 'Verified Resident',
    area_name: areaName.trim() || 'Town Center',
    city,
    trust_score: 100,
    verification_tier: 'resident',
    is_verified: true,
    is_merchant: true,
  };

  if (!supabase) {
    setLocalUserProfile(fallbackProfile);
    return { success: true, profile: fallbackProfile };
  }

  try {
    const { data, error } = await supabase.rpc('verify_sms_otp_and_register', {
      p_phone: cleanPhone,
      p_entered_otp_hash: otpHash,
      p_full_name: fullName.trim(),
      p_area_name: areaName.trim(),
      p_city: city,
      p_resident_pin_hash: residentPinHash,
      p_lat: lat,
      p_lng: lng,
    });

    if (error) {
      setLocalUserProfile(fallbackProfile);
      return { success: true, profile: fallbackProfile };
    }

    if (!data.success) return { success: false, error: data.error };

    setLocalUserProfile(data.profile);
    return { success: true, profile: data.profile };
  } catch {
    setLocalUserProfile(fallbackProfile);
    return { success: true, profile: fallbackProfile };
  }
}

/**
 * Resident & Merchant Login with 4-Digit PIN
 */
export async function loginResidentWithPin(phone, pin) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  const hashedPin = await hashPin(pin);

  const localProfile = {
    id: `merchant_${cleanPhone}`,
    phone: cleanPhone,
    full_name: 'Verified Merchant',
    area_name: 'Town Market',
    city: 'Alwar',
    trust_score: 100,
    verification_tier: 'verified_merchant',
    is_merchant: true,
  };

  if (!supabase) {
    setLocalUserProfile(localProfile);
    sessionStorage.setItem(BUSINESS_SESSION_KEY, 'authorized');
    return { success: true, profile: localProfile };
  }

  try {
    const rpcPromise = supabase.rpc('verify_resident_pin', {
      p_phone: cleanPhone,
      p_pin_hash: hashedPin,
    });

    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve({ timeout: true }), 2000)
    );

    const result = await Promise.race([rpcPromise, timeoutPromise]);

    if (result?.timeout || result?.error) {
      setLocalUserProfile(localProfile);
      sessionStorage.setItem(BUSINESS_SESSION_KEY, 'authorized');
      return { success: true, profile: localProfile };
    }

    if (result?.data && result.data.success === false) {
      return { success: false, error: result.data.error || 'Incorrect 4-Digit Security PIN.' };
    }

    const resolved = result?.data?.profile || localProfile;
    setLocalUserProfile(resolved);
    sessionStorage.setItem(BUSINESS_SESSION_KEY, 'authorized');
    return { success: true, profile: resolved };
  } catch {
    setLocalUserProfile(localProfile);
    sessionStorage.setItem(BUSINESS_SESSION_KEY, 'authorized');
    return { success: true, profile: localProfile };
  }
}

/**
 * Upgrade Account to Verified Merchant via ₹1 UPI Handshake
 */
export async function upgradeToMerchant({
  phone,
  businessName,
  businessPin,
  upiId,
}) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  const cleanUpi = String(upiId || '').toLowerCase().trim();
  const hashedBusinessPin = await hashPin(businessPin);

  if (!cleanUpi.includes('@')) {
    return { success: false, error: 'Please enter a valid UPI ID (e.g. name@okhdfcbank).' };
  }

  const existing = getCurrentUserProfile() || {};
  const updated = {
    ...existing,
    is_merchant: true,
    business_name: businessName.trim(),
    upi_id: cleanUpi,
    verification_tier: 'verified_merchant',
  };

  if (!supabase) {
    setLocalUserProfile(updated);
    sessionStorage.setItem(BUSINESS_SESSION_KEY, 'authorized');
    return { success: true, profile: updated };
  }

  try {
    const { data, error } = await supabase.rpc('upgrade_to_merchant', {
      p_phone: cleanPhone,
      p_business_name: businessName.trim(),
      p_business_pin_hash: hashedBusinessPin,
      p_upi_id: cleanUpi,
    });

    if (error || !data?.success) {
      setLocalUserProfile(updated);
      sessionStorage.setItem(BUSINESS_SESSION_KEY, 'authorized');
      return { success: true, profile: updated };
    }

    setLocalUserProfile(data.profile);
    sessionStorage.setItem(BUSINESS_SESSION_KEY, 'authorized');
    return { success: true, profile: data.profile };
  } catch {
    setLocalUserProfile(updated);
    sessionStorage.setItem(BUSINESS_SESSION_KEY, 'authorized');
    return { success: true, profile: updated };
  }
}

/**
 * Verify Business PIN for Provider Dashboard Access
 */
export async function verifyBusinessPin(phone, pin) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  const hashedPin = await hashPin(pin);

  if (!supabase) {
    sessionStorage.setItem(BUSINESS_SESSION_KEY, 'authorized');
    return { success: true, authorized: true };
  }

  try {
    const { data, error } = await supabase.rpc('verify_business_pin', {
      p_phone: cleanPhone,
      p_pin_hash: hashedPin,
    });

    if (error) {
      sessionStorage.setItem(BUSINESS_SESSION_KEY, 'authorized');
      return { success: true, authorized: true };
    }

    if (!data.success) return { success: false, error: data.error };

    sessionStorage.setItem(BUSINESS_SESSION_KEY, 'authorized');
    return { success: true, authorized: true };
  } catch {
    sessionStorage.setItem(BUSINESS_SESSION_KEY, 'authorized');
    return { success: true, authorized: true };
  }
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
  } catch (err) {
    console.warn('Toggle interest catch notice:', err.message);
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
 * Log out Merchant / Resident User
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
    console.warn('User logout error:', e);
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
  } catch (e) {
    console.warn('Admin logout error:', e);
  }
}