import React, { useState, useEffect, useRef } from 'react';
import {
  getCurrentUserProfile,
  checkUserExistence,
  loginWith4DigitPin,
  requestWhatsAppActivation,
  verifyActivationPinAndSetPermanentPin,
  logoutUser,
  sanitizePhone,
} from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import { CITY_ZONES } from '../../data/cityZones';

export default function UserAuthDashboard({ selectedCity = 'Alwar', onBack, onAuthSuccess }) {
  const { isDark } = useTheme();
  const [currentUser, setCurrentUser] = useState(() => getCurrentUserProfile());

  // Navigation: 'overview' | 'phone' | 'login_pin' | 'request_activation' | 'enter_pin'
  const [authStep, setAuthStep] = useState(() => (getCurrentUserProfile()?.is_verified ? 'overview' : 'phone'));

  // Fields
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [fullName, setFullName] = useState('');
  const [areaName, setAreaName] = useState('Ranjeet Nagar');
  const [isMerchant, setIsMerchant] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Activation Fields
  const [activationPin, setActivationPin] = useState('');
  const [newPermanentPin, setNewPermanentPin] = useState('');

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const recognitionRef = useRef(null);

  const cleanPhone = sanitizePhone(phone || currentUser?.phone);
  const isMerchantUser = Boolean(currentUser?.is_merchant || currentUser?.verification_tier === 'verified_merchant');

  useEffect(() => {
    const user = getCurrentUserProfile();
    setCurrentUser(user);
    if (user && user.is_verified) {
      setAuthStep('overview');
    }
  }, []);

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

  // 1. Smart Phone Verification Check
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
      setAuthStep('login_pin');
    } else {
      // Unverified or new number: open the request form
      setFullName(profile?.full_name || '');
      setAreaName(profile?.area_name || 'Ranjeet Nagar');
      setAuthStep('request_activation');
    }
  };

  // 2. PIN Login
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
      setCurrentUser(res.profile);
      setAuthStep('overview');
      setSuccessMsg(`Welcome back, ${res.profile.full_name}!`);
      if (onAuthSuccess) onAuthSuccess(res.profile);
    } else if (res.isPendingActivation) {
      setErrorMsg(res.error);
      setAuthStep('enter_pin');
    } else {
      setErrorMsg(res.error || 'Incorrect PIN.');
    }
  };

  // 3. Request WhatsApp PIN
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
      setAuthStep('enter_pin');
    } else {
      setErrorMsg(res.error || 'Registration failed.');
    }
  };

  // 4. Verify Admin WhatsApp PIN & Set Own 4-Digit PIN
  const handleVerifyActivationSubmit = async (e) => {
    e.preventDefault();
    resetAlerts();

    if (activationPin.trim().length !== 6) {
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
      activationPin,
      newPermanentPin,
    });
    setIsLoading(false);

    if (res.success && res.profile) {
      setCurrentUser(res.profile);
      setAuthStep('overview');
      setSuccessMsg('🎉 Account verified and permanent PIN saved!');
      if (onAuthSuccess) onAuthSuccess(res.profile);
    } else {
      setErrorMsg(res.error || 'Invalid 6-digit WhatsApp PIN.');
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Do you want to log out from this device?')) {
      await logoutUser();
      setCurrentUser(null);
      setPhone('');
      setPin('');
      setActivationPin('');
      setNewPermanentPin('');
      setAuthStep('phone');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between max-w-md mx-auto relative shadow-2xl font-sans select-none pb-24">
      {/* Top Header */}
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
              <span>👤 RESIDENT & SELLER STATION</span>
              <span>•</span>
              <span className="text-slate-400">{selectedCity.toUpperCase()}</span>
            </div>
            <h1 className="text-xs font-black text-slate-100">
              {currentUser?.is_verified ? 'My Account Status' : 'Sign In / Register'}
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
        {errorMsg && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-300 text-xs font-bold text-center animate-fade-in">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold text-center animate-fade-in">
            {successMsg}
          </div>
        )}

        {/* ─── 1. VERIFIED PROFILE OVERVIEW ─── */}
        {currentUser && authStep === 'overview' && (
          <div className="space-y-4 animate-fade-in text-xs">
            <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 text-2xl flex items-center justify-center font-black shadow-lg">
                    {isMerchantUser ? '🏪' : '👤'}
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-100 leading-tight">
                      {currentUser.full_name || 'Resident Member'}
                    </h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      📱 +91 {currentUser.phone}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[9.5px] font-black uppercase px-2.5 py-1 rounded-full border ${
                    isMerchantUser
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                      : 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40'
                  }`}
                >
                  {isMerchantUser ? 'Verified Merchant' : 'Verified Resident'}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-1 text-slate-300">
                <p>📍 <strong>Locality:</strong> {currentUser.area_name || 'Town Center'}, {currentUser.city || 'Alwar'}</p>
                {currentUser.business_name && (
                  <p>🏬 <strong>Shop Name:</strong> {currentUser.business_name}</p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  resetAlerts();
                  setPhone(currentUser.phone);
                  setAuthStep('enter_pin');
                }}
                className="py-3 bg-slate-900 border border-slate-800 hover:border-amber-400 text-amber-300 font-bold rounded-2xl text-xs active:scale-95 transition cursor-pointer"
              >
                Reset PIN 🔑
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="py-3 bg-rose-950/60 border border-rose-800/80 text-rose-300 font-bold rounded-2xl text-xs active:scale-95 transition cursor-pointer"
              >
                Log Out 🔒
              </button>
            </div>
          </div>
        )}

        {/* ─── 2. ENTER PHONE NUMBER ─── */}
        {authStep === 'phone' && (
          <form
            onSubmit={handlePhoneCheck}
            className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 text-xs shadow-xl animate-fade-in"
          >
            <div>
              <h2 className="text-sm font-black text-slate-100">Sign In or Register</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Enter your mobile number to access your account or register in {selectedCity}.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">Mobile Number</label>
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
              disabled={isLoading || cleanPhone.length !== 10}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
            >
              {isLoading ? 'Checking...' : 'Continue ➔'}
            </button>
          </form>
        )}

        {/* ─── 3. LOGIN WITH 4-DIGIT PIN ─── */}
        {authStep === 'login_pin' && (
          <form
            onSubmit={handleLoginSubmit}
            className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 text-xs shadow-xl animate-fade-in"
          >
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
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-center text-2xl font-mono font-black tracking-widest text-amber-300 focus:outline-none focus:border-amber-400"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || pin.length < 4}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
            >
              {isLoading ? 'Verifying...' : 'Log In ➔'}
            </button>
          </form>
        )}

        {/* ─── 4. REQUEST WHATSAPP ACTIVATION ─── */}
        {authStep === 'request_activation' && (
          <form
            onSubmit={handleRequestActivationSubmit}
            className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3.5 text-xs shadow-xl animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-100">Join Aapke Kareeb</h2>
                <p className="text-[10px] text-slate-400">+91 {cleanPhone}</p>
              </div>
              <button
                type="button"
                onClick={() => setAuthStep('phone')}
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
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-semibold focus:outline-none"
              >
                {Object.keys(CITY_ZONES).map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="userAuthMerchantCheck"
                checked={isMerchant}
                onChange={(e) => setIsMerchant(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0 cursor-pointer accent-amber-400"
              />
              <label htmlFor="userAuthMerchantCheck" className="text-xs font-bold text-slate-300 cursor-pointer">
                I am a Business / Seller (दुकानदार / कारीगर)
              </label>
            </div>

            {isMerchant && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Shop / Business Name *</label>
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
              <span>{isLoading ? 'Connecting...' : 'Request PIN on WhatsApp'}</span>
            </button>

            <div className="text-center pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  resetAlerts();
                  setAuthStep('enter_pin');
                }}
                className="text-[11px] font-bold text-amber-400 hover:underline"
              >
                Already have a 6-digit WhatsApp PIN? Enter here ➔
              </button>
            </div>
          </form>
        )}

        {/* ─── 5. ENTER WHATSAPP PIN & SET PERMANENT PIN ─── */}
        {authStep === 'enter_pin' && (
          <form
            onSubmit={handleVerifyActivationSubmit}
            className="p-5 bg-slate-900 border border-amber-500/40 rounded-3xl space-y-3.5 animate-fade-in shadow-xl text-xs"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-100">Activate Account</h2>
                <p className="text-[10px] text-slate-400">Mobile: +91 {cleanPhone}</p>
              </div>
              <button
                type="button"
                onClick={() => setAuthStep('phone')}
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
                value={activationPin}
                onChange={(e) => setActivationPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950 border border-amber-400/60 rounded-xl p-3 text-center text-amber-300 font-mono font-black text-xl tracking-widest focus:outline-none"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                Create Permanent 4-Digit Security PIN *
              </label>
              <input
                type="password"
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
              disabled={isLoading || activationPin.length !== 6 || newPermanentPin.length < 4}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
            >
              {isLoading ? 'Activating...' : 'Set PIN & Complete Setup ➔'}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  resetAlerts();
                  setAuthStep('request_activation');
                }}
                className="text-[10px] text-slate-400 hover:text-amber-300 hover:underline"
              >
                Didn't get PIN? Request again on WhatsApp
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}