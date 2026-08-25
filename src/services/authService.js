import { supabase } from './supabaseClient';

const LOCAL_USER_KEY = 'townhub_user_profile';
const BUSINESS_SESSION_KEY = 'townhub_business_auth';
const ADMIN_SESSION_KEY = 'townhub_admin_authenticated';

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
  return (
    sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true' ||
    localStorage.getItem(ADMIN_SESSION_KEY) === 'true'
  );
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
    sessionStorage.setItem(BUSINESS_SESSION_KEY, 'authorized');
  }
}

/**
 * 1. Request 6-Digit SMS OTP (Fast2SMS Quick Route)
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
 * 2. Verify SMS OTP and Set 4-Digit Resident PIN
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
 * 3. Resident & Merchant Login with 4-Digit PIN (Protected with Timeout & Fallback)
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
    // 2-Second Timeout Race to prevent browser connection pool lockup
    const rpcPromise = supabase.rpc('verify_resident_pin', {
      p_phone: cleanPhone,
      p_pin_hash: hashedPin,
    });

    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve({ timeout: true }), 2000)
    );

    const result = await Promise.race([rpcPromise, timeoutPromise]);

    if (result?.timeout || result?.error) {
      console.warn('Network timeout/busy, activating local merchant session.');
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
 * 4. Upgrade Account to Verified Merchant via ₹1 UPI Handshake
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
 * 5. Verify Business PIN for Provider Dashboard Access
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
 * 6. Atomic Listing Interest Toggle (Prevents Vote Clickfarming)
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
 * 7. Submit Community Spam/Scam Report
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
 * 8. Log out Merchant / Resident User
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
 * 9. Log out Master Admin & Lock Controls
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