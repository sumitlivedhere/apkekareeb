import React, { useState, useEffect, useRef } from 'react';
import {
  checkUserExistence,
  loginWith4DigitPin,
  registerTier1User,
  verifyActivationPin,
  setCustomPermanentPin,
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

  // Flow steps: 'phone' | 'login_pin' | 'register' | 'verify_pin' | 'set_custom_pin'
  const [authMode, setAuthMode] = useState('phone');

  // Tier 1 Fields
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [fullName, setFullName] = useState('');
  const [areaName, setAreaName] = useState('');
  const [targetCity, setTargetCity] = useState(selectedCity || 'Alwar');
  const [showPin, setShowPin] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Activation & Custom PIN Fields
  const [activationPinInput, setActivationPinInput] = useState('');
  const [customPinInput, setCustomPinInput] = useState('');
  const [businessNameInput, setBusinessNameInput] = useState('');
  const [verifiedRoleType, setVerifiedRoleType] = useState('user'); // 'user' | 'seller'

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const recognitionRef = useRef(null);

  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);

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

  // 1. Phone Check
  const handlePhoneCheck = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    const { exists, hasPin, isBanned, profile } = await checkUserExistence(cleanPhone);
    setIsLoading(false);

    if (isBanned) {
      setErrorMsg('⛔ This mobile number has been blocked by Admin.');
      return;
    }

    if (exists && hasPin) {
      setFullName(profile?.full_name || '');
      setAreaName(profile?.area_name || '');
      setAuthMode('login_pin');
    } else {
      setAuthMode('register');
    }
  };

  // 2. Login with PIN
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (pin.length < 4) {
      setErrorMsg('Please enter your login PIN.');
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
      setErrorMsg(res.error || 'Incorrect PIN.');
    }
  };

  // 3. Register New Resident
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (pin.length < 4) {
      setErrorMsg('Please set a PIN with at least 4 digits.');
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

  // 4. Verify 6-Digit WhatsApp PIN (...U or ...S)
  const handleVerifyActivation = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter your 10-digit mobile number first.');
      return;
    }

    setIsLoading(true);
    const res = await verifyActivationPin(cleanPhone, activationPinInput);
    setIsLoading(false);

    if (res.success) {
      setVerifiedRoleType(res.roleType);
      setAuthMode('set_custom_pin');
      setSuccessMsg(`✓ ${res.roleType === 'seller' ? 'Seller (...S)' : 'User (...U)'} PIN Verified! Now set your personal permanent PIN.`);
    } else {
      setErrorMsg(res.error || 'Invalid activation PIN.');
    }
  };

  // 5. Save Permanent Custom PIN
  const handleSetCustomPin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (customPinInput.length < 4) {
      setErrorMsg('Please set a PIN with at least 4 digits.');
      return;
    }

    setIsLoading(true);
    const res = await setCustomPermanentPin({
      phone: cleanPhone,
      newPin: customPinInput,
      roleType: verifiedRoleType,
      businessName: businessNameInput,
    });
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg(
        verifiedRoleType === 'seller'
          ? '🎉 Merchant Account Activated! Your custom PIN is set.'
          : '🎉 Verified Resident Status Activated! Your custom PIN is set.'
      );
      setTimeout(() => {
        if (onSuccess) onSuccess(res.profile);
        onClose();
      }, 700);
    } else {
      setErrorMsg(res.error || 'Failed to save custom PIN.');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/85 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-fade-in text-slate-100 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-4 space-y-3.5 shadow-2xl pb-6">
        
        {/* Header */}
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

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-[10px] font-bold">
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
            1. Login / Register
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('verify_pin');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-1.5 rounded-xl transition cursor-pointer text-center ${
              authMode === 'verify_pin' || authMode === 'set_custom_pin'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Enter WhatsApp PIN (U/S)
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-bold text-center animate-fade-in">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-[11px] font-bold text-center animate-fade-in">
            {successMsg}
          </div>
        )}

        {/* ─── STEP 1: MOBILE NUMBER ─── */}
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
              disabled={isLoading || cleanPhone.length !== 10}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
            >
              {isLoading ? 'Checking...' : 'Continue ➔'}
            </button>
          </form>
        )}

        {/* ─── STEP 2A: LOGIN WITH PIN ─── */}
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
                <label className="text-[10px] font-bold text-slate-400">Enter Your Login PIN</label>
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
                maxLength={6}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-center text-xl font-mono font-black tracking-widest text-amber-300 focus:outline-none focus:border-amber-400"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || pin.length < 4}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
            >
              {isLoading ? 'Verifying PIN...' : 'Log In ➔'}
            </button>
          </form>
        )}

        {/* ─── STEP 2B: REGISTER NEW RESIDENT ─── */}
        {authMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300 font-bold">New Account for +91 {cleanPhone}</span>
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
                <label className="text-[10px] font-bold text-slate-400">Full Name *</label>
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
              <label className="block text-[10px] font-bold text-slate-400 mb-1">Set 4-Digit Login PIN *</label>
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

        {/* ─── STEP 3: ENTER 6-DIGIT WHATSAPP PIN (...U OR ...S) ─── */}
        {authMode === 'verify_pin' && (
          <form onSubmit={handleVerifyActivation} className="space-y-3 text-xs">
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
              <label className="block text-[10px] font-bold text-amber-300 mb-1">
                Enter 6-Digit PIN + Suffix (e.g. 482910U or 739102S) *
              </label>
              <input
                type="text"
                required
                autoFocus
                maxLength={8}
                placeholder="123456S or 123456U"
                value={activationPinInput}
                onChange={(e) => setActivationPinInput(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-amber-400/60 rounded-xl p-2.5 text-center text-amber-300 font-mono font-black text-lg tracking-widest focus:outline-none uppercase"
              />
              <span className="text-[9.5px] text-slate-400 block text-center mt-1">
                Authorized User PIN ends with <strong>U</strong> • Seller PIN ends with <strong>S</strong>
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading || cleanPhone.length !== 10 || activationPinInput.length < 7}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
            >
              {isLoading ? 'Verifying PIN...' : 'Verify WhatsApp PIN ➔'}
            </button>
          </form>
        )}

        {/* ─── STEP 4: SET OWN PERMANENT CUSTOM PIN ─── */}
        {authMode === 'set_custom_pin' && (
          <form onSubmit={handleSetCustomPin} className="space-y-3 text-xs">
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold text-center">
              ✓ {verifiedRoleType === 'seller' ? 'Seller (...S)' : 'Authorized User (...U)'} PIN Verified!
            </div>

            {verifiedRoleType === 'seller' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Shop / Business Name (दुकान का नाम)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Royal Enfield Studio"
                  value={businessNameInput}
                  onChange={(e) => setBusinessNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-bold focus:border-amber-400 outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                Set Your Personal Permanent Login PIN (4 to 6 digits) *
              </label>
              <input
                type="password"
                inputMode="numeric"
                required
                autoFocus
                maxLength={6}
                placeholder="••••"
                value={customPinInput}
                onChange={(e) => setCustomPinInput(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-center text-white font-mono font-bold text-base tracking-widest focus:border-amber-400 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || customPinInput.length < 4}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
            >
              {isLoading ? 'Saving Personal PIN...' : 'Save & Activate Account ➔'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}