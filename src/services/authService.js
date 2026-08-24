import { supabase } from './supabaseClient';

const LOCAL_USER_KEY = 'townhub_user_profile';
const BUSINESS_SESSION_KEY = 'townhub_business_auth';

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

export function getCurrentUserProfile() {
  try {
    const saved = localStorage.getItem(LOCAL_USER_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function setLocalUserProfile(profile) {
  if (!profile) {
    localStorage.removeItem(LOCAL_USER_KEY);
    localStorage.removeItem(BUSINESS_SESSION_KEY);
  } else {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
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

  if (!supabase) {
    const profile = {
      id: `dev_${Date.now()}`,
      phone: cleanPhone,
      full_name: fullName.trim(),
      area_name: areaName.trim(),
      city,
      trust_score: 100,
      verification_tier: 'resident',
      is_verified: true,
      is_merchant: false,
    };
    setLocalUserProfile(profile);
    return { success: true, profile };
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

    if (error) throw error;
    if (!data.success) return { success: false, error: data.error };

    setLocalUserProfile(data.profile);
    return { success: true, profile: data.profile };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * 3. Resident Login with 4-Digit PIN (0 SMS sent)
 */
export async function loginResidentWithPin(phone, pin) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  const hashedPin = await hashPin(pin);

  if (!supabase) {
    const fallback = {
      id: `dev_${Date.now()}`,
      phone: cleanPhone,
      full_name: 'Verified Resident',
      area_name: 'Town Center',
      city: 'Alwar',
      trust_score: 100,
      verification_tier: 'resident',
      is_merchant: false,
    };
    setLocalUserProfile(fallback);
    return { success: true, profile: fallback };
  }

  try {
    const { data, error } = await supabase.rpc('verify_resident_pin', {
      p_phone: cleanPhone,
      p_pin_hash: hashedPin,
    });

    if (error) throw error;
    if (!data.success) return { success: false, error: data.error };

    setLocalUserProfile(data.profile);
    return { success: true, profile: data.profile };
  } catch (err) {
    return { success: false, error: err.message };
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

  if (!supabase) {
    const existing = getCurrentUserProfile() || {};
    const updated = {
      ...existing,
      is_merchant: true,
      business_name: businessName.trim(),
      upi_id: cleanUpi,
      verification_tier: 'verified_merchant',
    };
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

    if (error) throw error;
    if (!data.success) return { success: false, error: data.error };

    setLocalUserProfile(data.profile);
    sessionStorage.setItem(BUSINESS_SESSION_KEY, 'authorized');
    return { success: true, profile: data.profile };
  } catch (err) {
    return { success: false, error: err.message };
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

    if (error) throw error;
    if (!data.success) return { success: false, error: data.error };

    sessionStorage.setItem(BUSINESS_SESSION_KEY, 'authorized');
    return { success: true, authorized: true };
  } catch (err) {
    return { success: false, error: err.message };
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
 * 8. User Logout
 */
export async function logoutUser() {
  setLocalUserProfile(null);
  sessionStorage.removeItem(BUSINESS_SESSION_KEY);
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {}
  }
}