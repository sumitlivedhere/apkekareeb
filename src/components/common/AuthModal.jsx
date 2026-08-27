import React, { useState, useEffect, useRef } from 'react';
import {
  checkUserExistence,
  loginWith4DigitPin,
  registerTier1User,
  verifyTier2WhatsAppPin,
  completeTier3MerchantKyc,
  formatUpiHandshakeUrl,
  OFFICIAL_UPI_VPA,
} from '../../services/authService';
import { TOWN_CENTERS } from '../../utils/geoFence';

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  actionTitle = 'Sign In to Continue',
  selectedCity = 'Alwar',
}) {
  if (!isOpen) return null;

  // Active Flow Modes: 'phone' | 'login_pin' | 'register' | 'tier2_pin' | 'tier3_kyc'
  const [authMode, setAuthMode] = useState('phone');

  // Tier 1 Form Fields
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [fullName, setFullName] = useState('');
  const [areaName, setAreaName] = useState('');
  const [targetCity, setTargetCity] = useState(selectedCity || 'Alwar');
  const [showPin, setShowPin] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Tier 2 WhatsApp PIN Field
  const [sixDigitPin, setSixDigitPin] = useState('');

  // Tier 3 Merchant KYC Fields
  const [businessName, setBusinessName] = useState('');
  const [merchantCategory, setMerchantCategory] = useState('market');
  const [upiId, setUpiId] = useState('');
  const [txnRef, setTxnRef] = useState('');

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const recognitionRef = useRef(null);

  // 🎙️ Speech Recognition Setup for Voice Input
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
      setAuthMode('login_pin');
    } else {
      setAuthMode('register');
    }
  };

  // 2. Tier 1 4-Digit MPIN Login
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
      setSuccessMsg(`Welcome back, ${res.profile.full_name}!`);
      setTimeout(() => {
        if (onSuccess) onSuccess(res.profile);
        onClose();
      }, 500);
    } else {
      setErrorMsg(res.error || 'Incorrect 4-Digit MPIN.');
    }
  };

  // 3. Tier 1 Registration
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
      setErrorMsg('Please set a 4-digit MPIN.');
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
      setSuccessMsg('Account created successfully!');
      setTimeout(() => {
        if (onSuccess) onSuccess(res.profile);
        onClose();
      }, 500);
    } else {
      setErrorMsg(res.error || 'Registration failed.');
    }
  };

  // 4. Tier 2 Admin WhatsApp PIN Verify
  const handleTier2WhatsAppVerify = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (sixDigitPin.length !== 6) {
      setErrorMsg('Please enter the 6-digit WhatsApp PIN.');
      return;
    }

    setIsLoading(true);
    const res = await verifyTier2WhatsAppPin(cleanPhone, sixDigitPin);
    setIsLoading(false);

    if (res.success && res.profile) {
      setSuccessMsg('🎉 Tier 2 Verified Resident Unlocked!');
      setTimeout(() => {
        if (onSuccess) onSuccess(res.profile);
        onClose();
      }, 700);
    } else {
      setErrorMsg(res.error || 'Invalid 6-digit WhatsApp PIN.');
    }
  };

  // 5. Tier 3 Merchant ₹1 UPI KYC Activation
  const handleTier3KycSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!businessName.trim() || !upiId.trim()) {
      setErrorMsg('Please enter your business name and UPI ID.');
      return;
    }

    setIsLoading(true);
    const res = await completeTier3MerchantKyc({
      phone: cleanPhone,
      businessName: businessName.trim(),
      category: merchantCategory,
      upiId: upiId.trim(),
      txnRef: txnRef.trim(),
    });
    setIsLoading(false);

    if (res.success && res.profile) {
      setSuccessMsg('🏪 Tier 3 Merchant Account Activated!');
      setTimeout(() => {
        if (onSuccess) onSuccess(res.profile);
        onClose();
      }, 700);
    } else {
      setErrorMsg(res.error || 'Merchant KYC verification failed.');
    }
  };

  const upiPayUrl = formatUpiHandshakeUrl({
    payeeVpa: OFFICIAL_UPI_VPA,
    payeeName: 'Aapke Kareeb KYC',
    phone: phone || '9876543210',
    amount: '1',
  });

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/85 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-fade-in text-slate-100 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-4 space-y-3.5 shadow-2xl pb-6">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center text-sm font-black shadow-md">
              AK
            </span>
            <div>
              <h3 className="text-xs font-black text-slate-100">{actionTitle}</h3>
              <p className="text-[10px] text-amber-400 font-bold">{targetCity} • Aapke Kareeb</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full flex items-center justify-center text-xs font-black cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Dynamic Mode Switcher */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('phone');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-1.5 rounded-xl transition cursor-pointer text-center ${
              authMode === 'phone' || authMode === 'login_pin' || authMode === 'register'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Login / Join
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('tier2_pin');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-1.5 rounded-xl transition cursor-pointer text-center ${
              authMode === 'tier2_pin'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Tier 2 PIN
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('tier3_kyc');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-1.5 rounded-xl transition cursor-pointer text-center ${
              authMode === 'tier3_kyc'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Seller KYC
          </button>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-bold text-center animate-fade-in">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-[11px] font-bold text-center animate-fade-in">
            ✓ {successMsg}
          </div>
        )}

        {/* ─── STEP 1: MOBILE NUMBER INPUT ─── */}
        {authMode === 'phone' && (
          <form onSubmit={handlePhoneCheck} className="space-y-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                Mobile Number (मोबाइल नंबर)
              </label>
              <div className="flex items-center space-x-2">
                <span className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2.5 font-mono text-amber-400 font-bold text-xs">
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

        {/* ─── STEP 2A: 4-DIGIT MPIN LOGIN ─── */}
        {authMode === 'login_pin' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300 font-bold">Welcome back, {fullName}</span>
              <button
                type="button"
                onClick={() => setAuthMode('phone')}
                className="text-[10px] text-amber-400 font-bold hover:underline"
              >
                Change
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-400">4-Digit MPIN</label>
                <button
                  type="button"
                  onClick={() => setShowPin((p) => !p)}
                  className="text-[9px] text-amber-400 font-bold hover:underline"
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
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-center text-xl font-mono font-black tracking-widest text-amber-300 focus:outline-none focus:border-amber-400"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || pin.length !== 4}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
            >
              {isLoading ? 'Verifying MPIN...' : 'Log In ➔'}
            </button>
          </form>
        )}

        {/* ─── STEP 2B: REGISTRATION WITH 4-DIGIT PIN ─── */}
        {authMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300 font-bold">Create Account for +91 {phone}</span>
              <button
                type="button"
                onClick={() => setAuthMode('phone')}
                className="text-[10px] text-amber-400 font-bold hover:underline"
              >
                Change
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-400">Full Name (पूरा नाम) *</label>
                <span className="text-[9px] text-amber-400 font-semibold">बोलकर बताएं</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleToggleVoiceInput}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
                    isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-950 border border-slate-800 text-amber-400'
                  }`}
                >
                  🎙️
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">Locality (कॉलोनी / क्षेत्र)</label>
              <input
                type="text"
                placeholder="e.g. Budh Vihar / Scheme 2"
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">Set 4-Digit MPIN *</label>
              <input
                type="password"
                inputMode="numeric"
                required
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-center text-lg font-mono font-black tracking-widest text-amber-300 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !fullName.trim() || pin.length !== 4}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
            >
              {isLoading ? 'Creating Account...' : 'Complete Sign Up ➔'}
            </button>
          </form>
        )}

        {/* ─── TIER 2: ADMIN 6-DIGIT WHATSAPP PIN VERIFY ─── */}
        {authMode === 'tier2_pin' && (
          <form onSubmit={handleTier2WhatsAppVerify} className="space-y-3 text-xs">
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-amber-400 block">💬 Admin WhatsApp Activation</span>
              <p className="text-[10px] text-slate-400">
                Enter the 6-digit approval PIN sent by Admin to your WhatsApp.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">Registered Mobile Number</label>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">6-Digit WhatsApp PIN</label>
              <input
                type="password"
                inputMode="numeric"
                required
                maxLength={6}
                placeholder="••••••"
                value={sixDigitPin}
                onChange={(e) => setSixDigitPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950 border border-amber-400/60 rounded-xl p-2.5 text-center text-xl font-mono font-black tracking-widest text-amber-300 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || phone.length !== 10 || sixDigitPin.length !== 6}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
            >
              {isLoading ? 'Verifying...' : 'Unlock Tier 2 Badge ➔'}
            </button>
          </form>
        )}

        {/* ─── TIER 3: MERCHANT ₹1 UPI KYC ─── */}
        {authMode === 'tier3_kyc' && (
          <form onSubmit={handleTier3KycSubmit} className="space-y-2.5 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Registered Mobile Number *</label>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Shop / Business Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Royal Lehengas & Sherwani"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Business Payout UPI ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. shopname@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-amber-300 font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-1.5">
              <p className="text-[10px] text-slate-300 font-semibold">Step 1: Complete ₹1 KYC verification via UPI</p>
              <a
                href={upiPayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md active:scale-95 transition"
              >
                ⚡ 1-Tap Pay ₹1 via UPI App
              </a>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Step 2: UPI Reference / UTR Number *</label>
              <input
                type="text"
                required
                placeholder="12-digit UTR Number"
                value={txnRef}
                onChange={(e) => setTxnRef(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !businessName.trim() || !upiId.trim() || !txnRef.trim()}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
            >
              {isLoading ? 'Activating Merchant...' : 'Complete Merchant Activation ➔'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}