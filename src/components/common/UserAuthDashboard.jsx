import React, { useState, useEffect, useRef } from 'react';
import {
  getCurrentUserProfile,
  checkUserExistence,
  loginWith4DigitPin,
  registerTier1User,
  verifyTier2WhatsAppPin,
  completeTier3MerchantKyc,
  formatUpiHandshakeUrl,
  logoutUser,
  OFFICIAL_UPI_VPA,
} from '../../services/authService';
import { TOWN_CENTERS } from '../../utils/geoFence';

export default function UserAuthDashboard({ selectedCity = 'Alwar', onBack, onAuthSuccess }) {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUserProfile());

  // Form Navigation Steps: 'phone' | 'login_pin' | 'register' | 'tier2_modal' | 'tier3_modal'
  const [authStep, setAuthStep] = useState('phone');

  // Tier 1 Registration & Login Fields
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [fullName, setFullName] = useState('');
  const [areaName, setAreaName] = useState('');
  const [targetCity, setTargetCity] = useState(selectedCity || 'Alwar');
  const [showPin, setShowPin] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Tier 2 WhatsApp PIN Verification Fields
  const [sixDigitPin, setSixDigitPin] = useState('');

  // Tier 3 Merchant ₹1 UPI KYC Fields
  const [businessName, setBusinessName] = useState('');
  const [merchantCategory, setMerchantCategory] = useState('market');
  const [upiId, setUpiId] = useState('');
  const [txnRef, setTxnRef] = useState('');

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const recognitionRef = useRef(null);

  // 🎙️ Voice Input Setup for Full Name
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'hi-IN';
      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setFullName(transcript.replace(/[.,]/g, '').trim());
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const handleToggleVoiceInput = () => {
    if (!recognitionRef.current) {
      setErrorMsg('Voice input is not supported on this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setErrorMsg('');
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // 1. Phone Number Check
  const handlePhoneCheck = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    const { exists, hasPin, profile } = await checkUserExistence(cleanPhone);
    setIsLoading(false);

    if (exists && hasPin) {
      setFullName(profile?.full_name || '');
      setAreaName(profile?.area_name || '');
      setAuthStep('login_pin');
    } else {
      setAuthStep('register');
    }
  };

  // 2. Tier 1 Login with 4-Digit MPIN
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (pin.length !== 4) {
      setErrorMsg('Please enter your 4-digit MPIN.');
      return;
    }

    setIsLoading(true);
    const res = await loginWith4DigitPin(cleanPhone, pin);
    setIsLoading(false);

    if (res.success && res.profile) {
      setCurrentUser(res.profile);
      setSuccessMsg(`Welcome back, ${res.profile.full_name}!`);
      if (onAuthSuccess) onAuthSuccess(res.profile);
    } else {
      setErrorMsg(res.error || 'Incorrect 4-Digit MPIN.');
    }
  };

  // 3. Tier 1 One-Time Registration with 4-Digit MPIN
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (pin.length !== 4) {
      setErrorMsg('Please choose a 4-digit MPIN for future logins.');
      return;
    }

    setIsLoading(true);
    const res = await registerTier1User({
      phone: cleanPhone,
      fullName: fullName.trim(),
      areaName: areaName.trim() || 'Town Center',
      pin,
      city: targetCity,
    });
    setIsLoading(false);

    if (res.success && res.profile) {
      setCurrentUser(res.profile);
      setSuccessMsg('Account created successfully!');
      if (onAuthSuccess) onAuthSuccess(res.profile);
    } else {
      setErrorMsg(res.error || 'Registration failed.');
    }
  };

  // 4. Tier 2 Admin WhatsApp 6-Digit PIN Verification
  const handleTier2WhatsAppVerify = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (sixDigitPin.length !== 6) {
      setErrorMsg('Please enter the 6-digit PIN sent by Admin to your WhatsApp.');
      return;
    }

    setIsLoading(true);
    const res = await verifyTier2WhatsAppPin(currentUser.phone, sixDigitPin);
    setIsLoading(false);

    if (res.success && res.profile) {
      setCurrentUser(res.profile);
      setAuthStep('phone');
      setSuccessMsg('🎉 Verified Resident Badge Unlocked! You can now comment, review, and ask queries.');
      if (onAuthSuccess) onAuthSuccess(res.profile);
    } else {
      setErrorMsg(res.error || 'Invalid 6-digit WhatsApp PIN.');
    }
  };

  // 5. Tier 3 Merchant ₹1 UPI KYC Activation
  const handleTier3KycSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!businessName.trim() || !upiId.trim()) {
      setErrorMsg('Please enter your business name and UPI ID.');
      return;
    }

    setIsLoading(true);
    const res = await completeTier3MerchantKyc({
      phone: currentUser.phone,
      businessName: businessName.trim(),
      category: merchantCategory,
      upiId: upiId.trim(),
      txnRef: txnRef.trim(),
    });
    setIsLoading(false);

    if (res.success && res.profile) {
      setCurrentUser(res.profile);
      setAuthStep('phone');
      setSuccessMsg('🏪 Merchant Account Activated! You can now post listings and manage deals.');
      if (onAuthSuccess) onAuthSuccess(res.profile);
    } else {
      setErrorMsg(res.error || 'Merchant KYC verification failed.');
    }
  };

  // 6. Logout
  const handleLogout = async () => {
    if (window.confirm('Do you want to log out of your session?')) {
      await logoutUser();
      setCurrentUser(null);
      setPhone('');
      setPin('');
      setSixDigitPin('');
      setAuthStep('phone');
    }
  };

  // ₹1 UPI Handshake Deep Link
  const upiPayUrl = formatUpiHandshakeUrl({
    payeeVpa: OFFICIAL_UPI_VPA,
    payeeName: 'Aapke Kareeb KYC',
    phone: currentUser?.phone,
    amount: '1',
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between max-w-md mx-auto relative shadow-2xl font-sans select-none pb-24">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-amber-300 font-black text-xs flex items-center justify-center transition cursor-pointer active:scale-90"
          >
            ←
          </button>
          <div>
            <div className="flex items-center space-x-1.5 text-[9px] font-black text-amber-400 tracking-wider">
              <span>👤 RESIDENT HUB</span>
              <span>•</span>
              <span className="text-slate-400">{selectedCity.toUpperCase()}</span>
            </div>
            <h1 className="text-xs font-black text-slate-100">
              {currentUser ? 'My Profile & Tier Level' : 'Sign In / Register'}
            </h1>
          </div>
        </div>

        {currentUser && (
          <button
            type="button"
            onClick={handleLogout}
            className="px-2.5 py-1 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-[10px] font-bold cursor-pointer active:scale-95 transition"
          >
            Logout ✕
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-4">
        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-300 text-xs font-bold text-center animate-fade-in">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold text-center animate-fade-in">
            ✓ {successMsg}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* 🌟 LOGGED-IN PROFILE VIEW                                      */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {currentUser ? (
          <div className="space-y-4 animate-fade-in">
            {/* Identity Card */}
            <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 text-2xl flex items-center justify-center font-black shadow-lg">
                    {currentUser.is_merchant || currentUser.verification_tier === 'verified_merchant'
                      ? '🏪'
                      : currentUser.verification_tier === 'verified_resident'
                      ? '⭐'
                      : '👤'}
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-100 leading-tight">
                      {currentUser.full_name || 'Resident User'}
                    </h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      📱 +91 {currentUser.phone}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
                    currentUser.is_merchant || currentUser.verification_tier === 'verified_merchant'
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                      : currentUser.verification_tier === 'verified_resident'
                      ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {currentUser.is_merchant || currentUser.verification_tier === 'verified_merchant'
                    ? 'Tier 3 • Merchant'
                    : currentUser.verification_tier === 'verified_resident'
                    ? 'Tier 2 • Verified'
                    : 'Tier 1 • Basic'}
                </span>
              </div>

              {/* Permissions Strip */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
                <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/80">
                  <span className="text-base">👀</span>
                  <p className="text-[9.5px] font-bold text-slate-300 mt-1">Browse & Call</p>
                  <span className="text-[8px] font-black text-emerald-400 uppercase">Tier 1 ✓</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/80">
                  <span className="text-base">💬</span>
                  <p className="text-[9.5px] font-bold text-slate-300 mt-1">Query & Comment</p>
                  <span
                    className={`text-[8px] font-black uppercase ${
                      currentUser.verification_tier !== 'resident' ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {currentUser.verification_tier !== 'resident' ? 'Tier 2 ✓' : 'Locked'}
                  </span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/80">
                  <span className="text-base">🏪</span>
                  <p className="text-[9.5px] font-bold text-slate-300 mt-1">Post Deals</p>
                  <span
                    className={`text-[8px] font-black uppercase ${
                      currentUser.is_merchant || currentUser.verification_tier === 'verified_merchant'
                        ? 'text-emerald-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {currentUser.is_merchant || currentUser.verification_tier === 'verified_merchant'
                      ? 'Tier 3 ✓'
                      : 'Locked'}
                  </span>
                </div>
              </div>

              {/* Location & Score */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-xs">
                <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Locality</span>
                  <span className="text-slate-200 font-bold text-[11px] truncate block mt-0.5">
                    📍 {currentUser.area_name || 'Town Center'}, {currentUser.city || selectedCity}
                  </span>
                </div>
                <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Trust Score</span>
                  <span className="text-emerald-400 font-black text-[11px] block mt-0.5">
                    ⭐ 100 / 100 Score
                  </span>
                </div>
              </div>
            </div>

            {/* ─── TIER 2 UPGRADE GATE (If User is Tier 1) ─── */}
            {currentUser.verification_tier === 'resident' && authStep !== 'tier2_modal' && (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 shadow-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <h3 className="text-xs font-black text-slate-100">Unlock Tier 2: Verified Resident</h3>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed">
                      Enables asking voice/text questions, writing reviews, and participating in town threads.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthStep('tier2_modal')}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-amber-400/40 cursor-pointer active:scale-95 transition"
                >
                  Enter 6-Digit Admin WhatsApp PIN ➔
                </button>
              </div>
            )}

            {/* Tier 2 PIN Form */}
            {authStep === 'tier2_modal' && (
              <form
                onSubmit={handleTier2WhatsAppVerify}
                className="p-4 bg-slate-900 border border-amber-500/40 rounded-3xl space-y-3 animate-fade-in shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-black text-amber-400 uppercase">Tier 2 WhatsApp PIN Verification</h4>
                  <button
                    type="button"
                    onClick={() => setAuthStep('phone')}
                    className="text-slate-400 hover:text-white text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-[10.5px] text-slate-300 leading-relaxed">
                  Enter the 6-digit activation PIN sent by Admin to your WhatsApp (+91 {currentUser.phone}):
                </p>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={sixDigitPin}
                  onChange={(e) => setSixDigitPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full bg-slate-950 border border-amber-400/60 rounded-xl px-3 py-3 text-center text-2xl tracking-widest font-mono text-amber-300 focus:outline-none"
                  required
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={isLoading || sixDigitPin.length !== 6}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer active:scale-95 transition disabled:opacity-40"
                  >
                    {isLoading ? 'Verifying PIN...' : 'Verify & Unlock Tier 2 ➔'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthStep('phone')}
                    className="px-3 py-3 bg-slate-800 text-slate-400 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* ─── TIER 3 MERCHANT KYC GATE (If User is Tier 2) ─── */}
            {currentUser.verification_tier === 'verified_resident' && !currentUser.is_merchant && authStep !== 'tier3_modal' && (
              <div className="p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/40 rounded-3xl space-y-3 shadow-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🏪</span>
                  <div>
                    <h3 className="text-xs font-black text-amber-300">Open Your Local Shop (Tier 3)</h3>
                    <p className="text-[10.5px] text-slate-300 leading-relaxed">
                      Post unlimited inventory, offer deals, and receive direct WhatsApp customer leads.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthStep('tier3_modal')}
                  className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
                >
                  Complete ₹1 UPI KYC ➔
                </button>
              </div>
            )}

            {/* Tier 3 Merchant Form */}
            {authStep === 'tier3_modal' && (
              <form
                onSubmit={handleTier3KycSubmit}
                className="p-4 bg-slate-900 border border-amber-500/40 rounded-3xl space-y-3 animate-fade-in shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-black text-amber-400 uppercase">Tier 3: Merchant ₹1 UPI KYC</h4>
                  <button
                    type="button"
                    onClick={() => setAuthStep('phone')}
                    className="text-slate-400 hover:text-white text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">
                      Shop / Business Name (दुकान / व्यापार का नाम) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Royal Lehengas & Sherwani"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">
                      Primary Category (श्रेणी) *
                    </label>
                    <select
                      value={merchantCategory}
                      onChange={(e) => setMerchantCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
                    >
                      <option value="fashion">👗 Fashion & Boutique</option>
                      <option value="shaadi">💍 Shaadi & Bridal</option>
                      <option value="electronics">📱 Electronics & Mobile</option>
                      <option value="furniture">🛋️ Furniture & Home</option>
                      <option value="market">🛍️ Daily Market & Kirana</option>
                      <option value="medical">🏥 Medical & Clinic</option>
                      <option value="restaurants">🍽️ Restaurants & Food</option>
                      <option value="property">🏢 Property & Rentals</option>
                      <option value="kaarigar">🛠️ Kaarigar & Trades</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">
                      Your Business UPI ID (लेनदेन हेतु UPI ID) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. shopname@okicici"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* 1-Tap ₹1 Pay Button */}
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-center">
                    <p className="text-[10.5px] text-slate-300 font-semibold">
                      Step 1: Complete ₹1 KYC verification via UPI
                    </p>
                    <a
                      href={upiPayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md active:scale-95 transition"
                    >
                      ⚡ 1-Tap Pay ₹1 via UPI App (GPay / PhonePe / Paytm)
                    </a>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">
                      Step 2: UPI Reference / UTR Number (12 Digits) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 423984129841"
                      value={txnRef}
                      onChange={(e) => setTxnRef(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex space-x-2 pt-1">
                  <button
                    type="submit"
                    disabled={isLoading || !businessName.trim() || !upiId.trim() || !txnRef.trim()}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer active:scale-95 transition disabled:opacity-40"
                  >
                    {isLoading ? 'Activating Merchant...' : 'Complete Merchant Activation ➔'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthStep('phone')}
                    className="px-3 py-3 bg-slate-800 text-slate-400 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Quick Explore Button */}
            <button
              type="button"
              onClick={onBack}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>Explore Town Feed & Deals</span>
              <span>➔</span>
            </button>
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════ */
          /* 🌟 AUTHENTICATION WORKFLOW (PHONE ➔ LOGIN OR ONE-TIME REG)     */
          /* ═══════════════════════════════════════════════════════════════ */
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl animate-fade-in">
            {/* STEP 1: MOBILE NUMBER ENTRY */}
            {authStep === 'phone' && (
              <form onSubmit={handlePhoneCheck} className="space-y-4 text-xs">
                <div>
                  <h2 className="text-sm font-black text-slate-100">Enter Your Mobile Number</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Access town deals, verified contacts, and local updates across {selectedCity}.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Mobile Number (मोबाइल नंबर)
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 font-mono text-amber-400 font-bold text-xs">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || phone.replace(/\D/g, '').length !== 10}
                  className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
                >
                  {isLoading ? 'Checking Account...' : 'Continue ➔'}
                </button>
              </form>
            )}

            {/* STEP 2A: EXISTING USER 4-DIGIT MPIN LOGIN */}
            {authStep === 'login_pin' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black text-slate-100">Welcome Back, {fullName}</h2>
                    <button
                      type="button"
                      onClick={() => setAuthStep('phone')}
                      className="text-[10px] text-amber-400 font-bold hover:underline"
                    >
                      Change
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Enter your 4-digit MPIN for +91 {phone}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-400">
                      4-Digit MPIN (4 अंकों का पिन)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPin((p) => !p)}
                      className="text-[9px] text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      {showPin ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    required
                    maxLength={4}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-center text-2xl font-mono font-black tracking-widest text-amber-300 focus:outline-none focus:border-amber-400"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || pin.length !== 4}
                  className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
                >
                  {isLoading ? 'Verifying...' : 'Log In (Tier 1) ➔'}
                </button>
              </form>
            )}

            {/* STEP 2B: NEW USER REGISTRATION WITH 4-DIGIT PIN */}
            {authStep === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black text-slate-100">Create Resident Account</h2>
                    <button
                      type="button"
                      onClick={() => setAuthStep('phone')}
                      className="text-[10px] text-amber-400 font-bold hover:underline"
                    >
                      Change
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    One-time setup for +91 {phone} in {targetCity}.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-400">
                      Your Full Name (आपका पूरा नाम) *
                    </label>
                    <span className="text-[9px] text-amber-400 font-semibold">बोलकर या लिखकर बताएं</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={handleToggleVoiceInput}
                      title="बोलकर नाम बताएं"
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-base transition active:scale-90 cursor-pointer ${
                        isListening
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-slate-950 border border-slate-800 text-amber-400 hover:bg-slate-800'
                      }`}
                    >
                      🎙️
                    </button>
                  </div>
                  {isListening && (
                    <p className="text-[10px] text-rose-400 font-bold mt-1 animate-pulse">
                      Listening... बोलिए अपना नाम
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Locality / Mohalla in {targetCity} (कॉलोनी / क्षेत्र)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Budh Vihar / Scheme 2"
                    value={areaName}
                    onChange={(e) => setAreaName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Town / Shahar (शहर) *
                  </label>
                  <select
                    value={targetCity}
                    onChange={(e) => setTargetCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-bold focus:outline-none focus:border-amber-400"
                  >
                    {Object.keys(TOWN_CENTERS).map((city) => (
                      <option key={city} value={city} className="bg-slate-900 text-slate-100">
                        📍 {city} ({TOWN_CENTERS[city].name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Set 4-Digit MPIN (4 अंकों का पिन बनाएं) *
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    required
                    maxLength={4}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-center text-xl font-mono font-black tracking-widest text-amber-300 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !fullName.trim() || pin.length !== 4}
                  className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
                >
                  {isLoading ? 'Creating Account...' : 'Complete Sign Up (Tier 1) ➔'}
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}