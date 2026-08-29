import React, { useState, useEffect, useRef } from 'react';
import {
  getCurrentUserProfile,
  checkUserExistence,
  loginWith4DigitPin,
  registerTier1User,
  requestAndSendWhatsAppPin,
  verifyActivationPin,
  setCustomPermanentPin,
  logoutUser,
} from '../../services/authService';

export default function UserAuthDashboard({ selectedCity = 'Alwar', onBack, onAuthSuccess }) {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUserProfile());

  // Navigation: 'overview' | 'phone' | 'login_pin' | 'register' | 'request_pin' | 'enter_pin' | 'set_custom_pin'
  const [authStep, setAuthStep] = useState(() => (getCurrentUserProfile() ? 'overview' : 'phone'));

  // Fields
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [fullName, setFullName] = useState('');
  const [areaName, setAreaName] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Activation & Custom PIN Fields
  const [activationPin, setActivationPin] = useState('');
  const [generatedPinNotice, setGeneratedPinNotice] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [customPin, setCustomPin] = useState('');
  const [businessName, setBusinessName] = useState(() => currentUser?.business_name || '');
  const [verifiedRole, setVerifiedRole] = useState('user'); // 'user' | 'seller'

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const recognitionRef = useRef(null);

  const cleanPhone = String(phone || currentUser?.phone || '').replace(/\D/g, '').slice(-10);
  const isMerchant = currentUser?.is_merchant || currentUser?.verification_tier === 'verified_merchant';
  const isVerifiedUser = currentUser?.verification_tier === 'verified_resident';

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
      setErrorMsg('⛔ This mobile number is blocked by Admin.');
      return;
    }

    if (exists && hasPin) {
      setFullName(profile?.full_name || '');
      setAreaName(profile?.area_name || '');
      setAuthStep('login_pin');
    } else {
      setAuthStep('register');
    }
  };

  // 2. PIN Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

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
    } else {
      setErrorMsg(res.error || 'Incorrect PIN.');
    }
  };

  // 3. Register New Account
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
      city: selectedCity,
    });
    setIsLoading(false);

    if (res.success && res.profile) {
      setCurrentUser(res.profile);
      setAuthStep('overview');
      setSuccessMsg('Account created successfully!');
      if (onAuthSuccess) onAuthSuccess(res.profile);
    } else {
      setErrorMsg(res.error || 'Registration failed.');
    }
  };

  // 4. Send WhatsApp PIN
  const handleRequestWhatsAppPin = async (type) => {
    const targetPhone = currentUser?.phone || cleanPhone;
    if (!targetPhone || targetPhone.length !== 10) {
      setErrorMsg('Please enter your 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await requestAndSendWhatsAppPin({
        phone: targetPhone,
        type: type,
        fullName: currentUser?.full_name || fullName || (type === 'seller' ? 'Merchant' : 'Resident'),
        city: selectedCity,
      });

      if (res.success) {
        setVerifiedRole(res.roleType);
        setGeneratedPinNotice(res.pin);
        setWhatsappLink(res.whatsappUrl);
        setAuthStep('enter_pin');
        setSuccessMsg(`📱 PIN (${res.pin}) generated! Tap "Open WhatsApp" or enter below.`);
        window.open(res.whatsappUrl, '_blank');
      } else {
        setErrorMsg(res.error || 'Failed to dispatch WhatsApp PIN.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error dispatching PIN.');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Verify 6-Digit WhatsApp PIN
  const handleVerifyPin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const targetPhone = currentUser?.phone || cleanPhone;
    if (activationPin.trim().length < 7) {
      setErrorMsg('PIN must be 6 digits ending with U (User) or S (Seller).');
      return;
    }

    setIsLoading(true);
    const res = await verifyActivationPin(targetPhone, activationPin);
    setIsLoading(false);

    if (res.success) {
      setVerifiedRole(res.roleType);
      setAuthStep('set_custom_pin');
      setSuccessMsg(`✓ ${res.roleType === 'seller' ? 'Seller (...S)' : 'User (...U)'} PIN Verified! Now set your permanent personal PIN.`);
    } else {
      setErrorMsg(res.error || 'Invalid 6-digit WhatsApp PIN.');
    }
  };

  // 6. Save Permanent Custom PIN
  const handleSaveCustomPin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (customPin.length < 4) {
      setErrorMsg('PIN must be at least 4 digits.');
      return;
    }

    const targetPhone = currentUser?.phone || cleanPhone;
    setIsLoading(true);
    const res = await setCustomPermanentPin({
      phone: targetPhone,
      newPin: customPin,
      roleType: verifiedRole,
      businessName: businessName,
    });
    setIsLoading(false);

    if (res.success) {
      setCurrentUser(res.profile);
      setAuthStep('overview');
      setSuccessMsg(
        verifiedRole === 'seller'
          ? '🏪 Merchant Account Verified! Your permanent PIN is set.'
          : '⭐ Verified Resident Account Active! Your permanent PIN is set.'
      );
      if (onAuthSuccess) onAuthSuccess(res.profile);
    } else {
      setErrorMsg(res.error || 'Failed to save personal PIN.');
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Do you want to log out from this device?')) {
      await logoutUser();
      setCurrentUser(null);
      setPhone('');
      setPin('');
      setActivationPin('');
      setCustomPin('');
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
              {currentUser ? 'My Profile & Account Status' : 'Sign In / Register'}
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

        {/* 1. PROFILE OVERVIEW */}
        {currentUser && authStep === 'overview' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 text-2xl flex items-center justify-center font-black shadow-lg">
                    {isMerchant ? '🏪' : isVerifiedUser ? '⭐' : '👤'}
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
                    isMerchant
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                      : isVerifiedUser
                      ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {isMerchant ? 'Tier 3 • Merchant' : isVerifiedUser ? 'Tier 2 • Verified' : 'Tier 1 • Basic'}
                </span>
              </div>

              {currentUser.business_name && (
                <div className="text-xs text-amber-300 font-bold pt-1 border-t border-slate-800">
                  🏪 Shop: {currentUser.business_name}
                </div>
              )}
            </div>

            {/* Upgrade Options: 1-Tap WhatsApp Request */}
            {!isMerchant && (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 shadow-lg">
                <h3 className="text-xs font-black text-amber-400 flex items-center space-x-1.5">
                  <span>🔑</span>
                  <span>Activate Status via WhatsApp</span>
                </h3>
                <p className="text-[10.5px] text-slate-300 leading-relaxed">
                  Send an instant 6-digit WhatsApp PIN to your registered number (+91 {currentUser.phone}) to unlock Verified Resident (<strong>...U</strong>) or Verified Merchant (<strong>...S</strong>) privileges.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleRequestWhatsAppPin('user')}
                    className="py-3 px-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer active:scale-95 transition flex flex-col items-center justify-center space-y-0.5"
                  >
                    <span>👤 Send User PIN</span>
                    <span className="text-[8.5px] font-normal opacity-90">(Ends in ...U)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRequestWhatsAppPin('seller')}
                    className="py-3 px-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer active:scale-95 transition flex flex-col items-center justify-center space-y-0.5"
                  >
                    <span>🏪 Send Seller PIN</span>
                    <span className="text-[8.5px] font-normal opacity-90">(Ends in ...S)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. PHONE FORM */}
        {(!currentUser || authStep === 'phone') && authStep !== 'login_pin' && authStep !== 'register' && authStep !== 'enter_pin' && authStep !== 'set_custom_pin' && (
          <form onSubmit={handlePhoneCheck} className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 text-xs shadow-xl animate-fade-in">
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

        {/* 3. LOGIN PIN FORM */}
        {authStep === 'login_pin' && (
          <form onSubmit={handleLoginSubmit} className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 text-xs shadow-xl animate-fade-in">
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

        {/* 4. REGISTRATION FORM */}
        {authStep === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 text-xs shadow-xl animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-100">Create New Account</h2>
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
              <input
                type="text"
                placeholder="e.g. Budh Vihar / Scheme 2"
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
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
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-center text-xl font-mono font-black tracking-widest text-amber-300 focus:outline-none focus:border-amber-400"
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

        {/* 5. ENTER RECEIVED WHATSAPP PIN */}
        {authStep === 'enter_pin' && (
          <form onSubmit={handleVerifyPin} className="p-5 bg-slate-900 border border-amber-500/40 rounded-3xl space-y-3.5 animate-fade-in shadow-xl text-xs">
            {generatedPinNotice && (
              <div className="p-3 bg-amber-950/80 border border-amber-400/60 rounded-2xl space-y-2 text-center">
                <span className="text-[10px] text-amber-300 font-bold block">
                  Dispatched {verifiedRole === 'seller' ? 'Seller' : 'User'} PIN:
                </span>
                <span className="text-xl font-mono font-black text-amber-400 tracking-widest block">
                  {generatedPinNotice}
                </span>
                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-3 py-1.5 bg-emerald-500 text-slate-950 font-black text-[10px] rounded-lg shadow-sm"
                  >
                    💬 Open WhatsApp ➔
                  </a>
                )}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-amber-300 mb-1">
                Enter 6-Digit PIN + Suffix (e.g. {generatedPinNotice || '739102S'}) *
              </label>
              <input
                type="text"
                required
                autoFocus
                maxLength={8}
                placeholder="123456S / 123456U"
                value={activationPin}
                onChange={(e) => setActivationPin(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-amber-400/60 rounded-xl p-3 text-center text-2xl font-mono font-black tracking-widest text-amber-300 focus:outline-none uppercase"
              />
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                type="submit"
                disabled={isLoading || activationPin.length < 7}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer active:scale-95 transition disabled:opacity-40"
              >
                {isLoading ? 'Verifying...' : 'Verify PIN ➔'}
              </button>
              <button
                type="button"
                onClick={() => setAuthStep(currentUser ? 'overview' : 'phone')}
                className="px-3 py-3 bg-slate-800 text-slate-400 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* 6. SET PERMANENT CUSTOM PIN */}
        {authStep === 'set_custom_pin' && (
          <form onSubmit={handleSaveCustomPin} className="p-5 bg-slate-900 border border-amber-500/40 rounded-3xl space-y-3.5 animate-fade-in shadow-xl text-xs">
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold text-center">
              ✓ {verifiedRole === 'seller' ? 'Seller (...S)' : 'Authorized User (...U)'} PIN Verified!
            </div>

            {verifiedRole === 'seller' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Shop / Business Name</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Enfield Studio"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                Set Your Personal Permanent PIN (4 to 6 digits) *
              </label>
              <input
                type="password"
                inputMode="numeric"
                required
                autoFocus
                maxLength={6}
                placeholder="••••"
                value={customPin}
                onChange={(e) => setCustomPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-center text-xl font-mono font-black tracking-widest text-amber-300 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || customPin.length < 4}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer active:scale-95 transition disabled:opacity-40"
            >
              {isLoading ? 'Saving PIN...' : 'Save Permanent PIN ➔'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}