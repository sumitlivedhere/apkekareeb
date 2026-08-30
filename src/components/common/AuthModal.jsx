import React, { useState, useEffect, useRef } from 'react';
import {
  checkUserExistence,
  loginWith4DigitPin,
  requestWhatsAppActivation,
  verifyActivationPinAndSetPermanentPin,
  sanitizePhone,
} from '../../services/authService';
import { CITY_ZONES } from '../../data/cityZones';

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  actionTitle = 'Sign In to Continue',
  selectedCity = 'Alwar',
}) {
  if (!isOpen) return null;

  // Modes: 'phone' | 'login_pin' | 'request_activation' | 'enter_pin'
  const [authMode, setAuthMode] = useState('phone');

  // Form Fields
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [fullName, setFullName] = useState('');
  const [areaName, setAreaName] = useState('Ranjeet Nagar');
  const [isMerchant, setIsMerchant] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Activation Fields
  const [activationPinInput, setActivationPinInput] = useState('');
  const [newPermanentPin, setNewPermanentPin] = useState('');

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const recognitionRef = useRef(null);

  const cleanPhone = sanitizePhone(phone);

  // Speech Recognition for Name Input
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
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const resetAlerts = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  // ── 1. Phone Check ────────────────────────────────────────────
  const handlePhoneCheck = async (e) => {
    e.preventDefault();
    resetAlerts();

    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    const { exists, hasPin, isVerified, isBanned, profile } = await checkUserExistence(cleanPhone);
    setIsLoading(false);

    if (isBanned) {
      setErrorMsg('⛔ This mobile number is suspended by Admin.');
      return;
    }

    if (exists && isVerified && hasPin) {
      setFullName(profile?.full_name || '');
      setAreaName(profile?.area_name || 'Ranjeet Nagar');
      setAuthMode('login_pin');
    } else if (exists && !isVerified) {
      setFullName(profile?.full_name || '');
      setAreaName(profile?.area_name || 'Ranjeet Nagar');
      setErrorMsg('Account pending WhatsApp PIN activation.');
      setAuthMode('enter_pin');
    } else {
      setAuthMode('request_activation');
    }
  };

  // ── 2. Submit Login via 4-Digit PIN ───────────────────────────
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    resetAlerts();

    if (pin.length < 4) {
      setErrorMsg('Please enter your 4-digit PIN.');
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
      }, 400);
    } else if (res.isPendingActivation) {
      setErrorMsg(res.error);
      setAuthMode('enter_pin');
    } else {
      setErrorMsg(res.error || 'Incorrect PIN.');
    }
  };

  // ── 3. Request WhatsApp Verification ──────────────────────────
  const handleRequestActivationSubmit = async (e) => {
    e.preventDefault();
    resetAlerts();

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setIsLoading(true);
    const res = await requestWhatsAppActivation({
      phone: cleanPhone,
      fullName: fullName.trim(),
      areaName,
      isMerchant,
      businessName,
      city: selectedCity,
    });
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg(res.message);
      window.open(res.whatsappUrl, '_blank');
      setAuthMode('enter_pin');
    } else {
      setErrorMsg(res.error || 'Failed to request activation.');
    }
  };

  // ── 4. Verify Admin WhatsApp PIN & Set Own 4-Digit PIN ────────
  const handleVerifyActivationSubmit = async (e) => {
    e.preventDefault();
    resetAlerts();

    if (!activationPinInput.trim()) {
      setErrorMsg('Please enter the 6-digit PIN received from Admin on WhatsApp.');
      return;
    }
    if (newPermanentPin.length < 4) {
      setErrorMsg('Please create a PIN with at least 4 digits.');
      return;
    }

    setIsLoading(true);
    const res = await verifyActivationPinAndSetPermanentPin({
      phone: cleanPhone,
      activationPin: activationPinInput,
      newPermanentPin,
    });
    setIsLoading(false);

    if (res.success && res.profile) {
      setSuccessMsg('🎉 Account verified and activated!');
      setTimeout(() => {
        if (onSuccess) onSuccess(res.profile);
        onClose();
      }, 500);
    } else {
      setErrorMsg(res.error || 'Invalid activation code.');
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
              <p className="text-[10px] text-amber-400 font-bold">{selectedCity} • Aapke Kareeb</p>
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

        {/* ─── SCREEN 1: ENTER PHONE NUMBER ─── */}
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

        {/* ─── SCREEN 2: LOGIN WITH 4-DIGIT PIN ─── */}
        {authMode === 'login_pin' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300 font-bold">Welcome back, {fullName}</span>
              <button
                type="button"
                onClick={() => {
                  resetAlerts();
                  setAuthMode('phone');
                }}
                className="text-[10px] text-amber-400 font-bold hover:underline"
              >
                Change
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-400">Enter Your 4-Digit Security PIN</label>
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

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  resetAlerts();
                  setAuthMode('request_activation');
                }}
                className="text-[10px] text-slate-400 hover:text-amber-300 hover:underline"
              >
                Forgot PIN? Reset via WhatsApp
              </button>
            </div>
          </form>
        )}

        {/* ─── SCREEN 3: REQUEST WHATSAPP ACTIVATION ─── */}
        {authMode === 'request_activation' && (
          <form onSubmit={handleRequestActivationSubmit} className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300 font-bold">Register: +91 {cleanPhone}</span>
              <button
                type="button"
                onClick={() => {
                  resetAlerts();
                  setAuthMode('phone');
                }}
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
                  placeholder="e.g. Ramesh Saini"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
                  autoFocus
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
              <select
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
              >
                {Object.keys(CITY_ZONES).map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="modalMerchantToggle"
                checked={isMerchant}
                onChange={(e) => setIsMerchant(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0 cursor-pointer accent-amber-400"
              />
              <label htmlFor="modalMerchantToggle" className="text-xs font-bold text-slate-300 cursor-pointer">
                I am a Business / Seller (दुकानदार / कारीगर)
              </label>
            </div>

            {isMerchant && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Shop / Business Name (दुकान का नाम) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alwar Auto Spares"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !fullName.trim()}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>📲</span>
              <span>{isLoading ? 'Connecting...' : 'Request PIN via WhatsApp'}</span>
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  resetAlerts();
                  setAuthMode('enter_pin');
                }}
                className="text-[10px] text-amber-400 hover:underline"
              >
                Already have WhatsApp PIN? Enter here
              </button>
            </div>
          </form>
        )}

        {/* ─── SCREEN 4: ENTER WHATSAPP PIN & CREATE PERMANENT PIN ─── */}
        {authMode === 'enter_pin' && (
          <form onSubmit={handleVerifyActivationSubmit} className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300 font-bold">Activating: +91 {cleanPhone}</span>
              <button
                type="button"
                onClick={() => {
                  resetAlerts();
                  setAuthMode('phone');
                }}
                className="text-[10px] text-amber-400 font-bold hover:underline"
              >
                Change
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-amber-300 mb-1">
                Enter 6-Digit WhatsApp PIN received from Admin *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="e.g. 849201"
                value={activationPinInput}
                onChange={(e) => setActivationPinInput(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950 border border-amber-400/60 rounded-xl p-2.5 text-center text-amber-300 font-mono font-black text-lg tracking-widest focus:outline-none"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                Create Permanent 4-Digit Security PIN *
              </label>
              <input
                type="password"
                inputMode="numeric"
                required
                maxLength={6}
                placeholder="Choose 4 digits"
                value={newPermanentPin}
                onChange={(e) => setNewPermanentPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-center text-white font-mono font-bold text-base tracking-widest focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || activationPinInput.length !== 6 || newPermanentPin.length < 4}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
            >
              {isLoading ? 'Activating Account...' : 'Set PIN & Enter App ➔'}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  resetAlerts();
                  setAuthMode('request_activation');
                }}
                className="text-[10px] text-slate-400 hover:text-amber-300 hover:underline"
              >
                Didn't get WhatsApp PIN? Resend request
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}