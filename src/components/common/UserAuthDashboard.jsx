import React, { useState, useEffect, useRef } from 'react';
import {
  getCurrentUserProfile,
  registerTemporaryUser,
  verifyAdminActivationPin,
  setPermanentSecretPin,
  loginWithSecretPin,
  logoutUser,
} from '../../services/authService';
import { TOWN_CENTERS } from '../../utils/geoFence';

export default function UserAuthDashboard({ selectedCity = 'Alwar', onBack, onAuthSuccess }) {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUserProfile());

  // Active Modes: 'login' | 'temp_register' | 'activate_pin' | 'set_secret_pin'
  const [authMode, setAuthMode] = useState('login');

  // Form Fields - Login
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');

  // Form Fields - Quick Temporary Register
  const [fullName, setFullName] = useState('');
  const [targetCity, setTargetCity] = useState(selectedCity || 'Alwar');
  const [areaName, setAreaName] = useState('');
  const [phone, setPhone] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Form Fields - Admin PIN & 6-Digit Secret PIN
  const [activationPhone, setActivationPhone] = useState('');
  const [activationPin, setActivationPin] = useState('');
  const [secretPin, setSecretPin] = useState('');
  const [confirmSecretPin, setConfirmSecretPin] = useState('');
  const [showPins, setShowPins] = useState(false);

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const recognitionRef = useRef(null);

  // 🎙️ Hindi / English Speech Recognition
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

  // 1. Standard Login with 6-Digit Secret PIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanPhone = loginPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10 || loginPin.length !== 6) {
      setErrorMsg('Please enter your 10-digit mobile number and 6-digit Secret PIN.');
      return;
    }

    setIsLoading(true);
    const res = await loginWithSecretPin({ phone: cleanPhone, pin: loginPin });
    setIsLoading(false);

    if (res.success && res.profile) {
      setCurrentUser(res.profile);
      if (onAuthSuccess) onAuthSuccess(res.profile);
    } else {
      if (res.isTemporary) {
        setErrorMsg(res.error);
        setActivationPhone(cleanPhone);
        setAuthMode('activate_pin');
      } else {
        setErrorMsg(res.error || 'Authentication failed. Please check your credentials.');
      }
    }
  };

  // 2. Quick Temporary Registration
  const handleTempRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!fullName.trim() || cleanPhone.length !== 10) {
      setErrorMsg('Please enter your full name and valid 10-digit WhatsApp number.');
      return;
    }

    setIsLoading(true);
    const res = await registerTemporaryUser({
      fullName: fullName.trim(),
      phone: cleanPhone,
      city: targetCity,
      areaName: areaName.trim() || 'Town Center',
    });
    setIsLoading(false);

    if (res.success && res.profile) {
      setCurrentUser(res.profile);
      setSuccessMsg(`Welcome ${fullName}! Temporary profile activated for comments, likes & Surprise Me.`);
      if (onAuthSuccess) onAuthSuccess(res.profile);
    } else {
      setErrorMsg(res.error || 'Temporary registration failed.');
    }
  };

  // 3. Verify Admin Activation PIN
  const handleVerifyAdminPin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanPhone = activationPhone.replace(/\D/g, '').slice(-10);
    const cleanPin = activationPin.trim().toUpperCase();

    if (cleanPhone.length !== 10 || !cleanPin) {
      setErrorMsg('Please enter your 10-digit mobile number and WhatsApp Admin PIN.');
      return;
    }

    setIsLoading(true);
    const res = await verifyAdminActivationPin({ phone: cleanPhone, activationPin: cleanPin });
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg('Admin PIN Verified! Please set your private 6-digit Secret PIN below.');
      setTimeout(() => {
        setSuccessMsg('');
        setAuthMode('set_secret_pin');
      }, 700);
    } else {
      setErrorMsg(res.error || 'Invalid Admin Activation PIN. Check your WhatsApp message.');
    }
  };

  // 4. Set Permanent 6-Digit Secret PIN
  const handleSetSecretPin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanPhone = activationPhone.replace(/\D/g, '').slice(-10);
    if (secretPin.length !== 6 || !/^\d+$/.test(secretPin)) {
      setErrorMsg('Secret PIN must be exactly 6 numeric digits.');
      return;
    }
    if (secretPin !== confirmSecretPin) {
      setErrorMsg('Secret PIN and Confirmation PIN do not match.');
      return;
    }

    setIsLoading(true);
    const res = await setPermanentSecretPin({ phone: cleanPhone, secretPin });
    setIsLoading(false);

    if (res.success && res.profile) {
      setCurrentUser(res.profile);
      setSuccessMsg('Account permanently activated with your 6-digit Secret PIN!');
      if (onAuthSuccess) onAuthSuccess(res.profile);
    } else {
      setErrorMsg(res.error || 'Failed to save Secret PIN.');
    }
  };

  // 5. Logout User
  const handleLogout = async () => {
    if (window.confirm('Do you want to log out of your TownHub resident account?')) {
      await logoutUser();
      setCurrentUser(null);
      setLoginPhone('');
      setLoginPin('');
      setAuthMode('login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between max-w-md mx-auto relative shadow-2xl font-sans select-none pb-24">
      
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#111b21] border-b border-[#222e35] px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-[#202c33] hover:bg-[#2a3942] text-amber-300 font-black text-xs flex items-center justify-center transition cursor-pointer active:scale-90"
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
              {currentUser ? 'My Resident Account' : 'Login / Register as Resident'}
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

      {/* Main Content Arena */}
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

        {/* ========================================================================= */}
        {/* 🌟 LOGGED IN ACCOUNT PROFILE VIEW                                         */}
        {/* ========================================================================= */}
        {currentUser ? (
          <div className="space-y-4 animate-fade-in">
            {/* Account Card */}
            <div className="bg-[#111b21] border border-[#222e35] rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 text-2xl flex items-center justify-center font-black shadow-lg">
                    👤
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-100 leading-tight">
                      {currentUser.full_name || 'Verified Resident'}
                    </h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      📱 +91 {currentUser.phone}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
                    currentUser.status === 'temporary' || !currentUser.is_verified
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                  }`}
                >
                  {currentUser.status === 'temporary' || !currentUser.is_verified
                    ? '⏳ Temporary User'
                    : '✓ Permanent Resident'}
                </span>
              </div>

              {/* Status Specific Help Banner */}
              {currentUser.status === 'temporary' && (
                <div className="p-3.5 bg-amber-950/30 border border-amber-400/30 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-amber-300 font-black text-[11px]">
                    <span>⏳ Verification PIN Pending</span>
                    <span>Admin WhatsApp Dispatch</span>
                  </div>
                  <p className="text-slate-300 text-[10.5px] leading-relaxed">
                    You can already like listings, post comments, and discover Surprise Me deals. Within 24 hours, Admin will WhatsApp your Activation PIN to set your private 6-digit Secret PIN.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActivationPhone(currentUser.phone);
                      setAuthMode('activate_pin');
                      setCurrentUser(null);
                    }}
                    className="w-full py-2 bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer active:scale-95 transition"
                  >
                    I Have Received My PIN (Activate Now) ➔
                  </button>
                </div>
              )}

              {/* Account Metrics Strip */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#222e35] text-xs">
                <div className="bg-[#202c33] p-3 rounded-2xl border border-[#2a3942]">
                  <span className="text-[9px] text-slate-400 block font-bold uppercase">Town Location</span>
                  <span className="text-slate-100 font-bold text-xs mt-0.5 block truncate">
                    📍 {currentUser.area_name || 'Town Center'}, {currentUser.city || selectedCity}
                  </span>
                </div>

                <div className="bg-[#202c33] p-3 rounded-2xl border border-[#2a3942]">
                  <span className="text-[9px] text-slate-400 block font-bold uppercase">Community Trust</span>
                  <span className="text-emerald-400 font-black text-xs mt-0.5 block">
                    ⭐ 100 / 100 Score
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Navigation Shortcuts */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={onBack}
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Explore Town Feed & Deals</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* 🌟 AUTHENTICATION WORKFLOW (LOGIN / REGISTER / ACTIVATE)                   */
          /* ========================================================================= */
          <div className="bg-[#111b21] border border-[#222e35] rounded-3xl p-5 space-y-4 shadow-xl">
            
            {/* Segmented Mode Switcher */}
            <div className="grid grid-cols-3 gap-1 bg-[#0b141a] p-1 rounded-2xl border border-[#222e35] text-[10px] font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`py-2 rounded-xl transition cursor-pointer text-center ${
                  authMode === 'login'
                    ? 'bg-[#25D366] text-[#111b21] font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1. Login
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('temp_register');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`py-2 rounded-xl transition cursor-pointer text-center ${
                  authMode === 'temp_register'
                    ? 'bg-[#25D366] text-[#111b21] font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2. Quick Join
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('activate_pin');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`py-2 rounded-xl transition cursor-pointer text-center ${
                  authMode === 'activate_pin' || authMode === 'set_secret_pin'
                    ? 'bg-[#25D366] text-[#111b21] font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                3. Activate
              </button>
            </div>

            {/* TAB 1: STANDARD 6-DIGIT PIN LOGIN */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Registered Mobile Number (मोबाइल नंबर)
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-2.5 font-mono text-slate-400 font-bold">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 bg-[#202c33] border border-[#2a3942] rounded-xl p-2.5 text-white font-mono font-bold focus:outline-hidden focus:border-[#25D366]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-400">
                      6-Digit Secret PIN (6 अंकों का पिन)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPins((p) => !p)}
                      className="text-[9px] text-[#25D366] font-bold hover:underline cursor-pointer"
                    >
                      {showPins ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showPins ? 'text' : 'password'}
                    required
                    maxLength={6}
                    placeholder="••••••"
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl p-3 text-center text-lg font-mono font-black tracking-widest text-white focus:outline-hidden focus:border-[#25D366]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || loginPhone.replace(/\D/g, '').length !== 10 || loginPin.length !== 6}
                  className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-40 text-[#111b21] font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
                >
                  {isLoading ? 'Verifying PIN...' : '➔ Login with Secret PIN'}
                </button>

                <div className="pt-2 border-t border-[#222e35] flex items-center justify-between text-[10.5px]">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setAuthMode('temp_register');
                    }}
                    className="text-[#25D366] font-bold hover:underline cursor-pointer"
                  >
                    + New Resident? Quick Join
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setActivationPhone(loginPhone);
                      setAuthMode('activate_pin');
                    }}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    Enter WhatsApp PIN?
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: QUICK TEMPORARY REGISTRATION */}
            {authMode === 'temp_register' && (
              <form onSubmit={handleTempRegister} className="space-y-3.5 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-400">
                      Your Full Name (आपका पूरा नाम) *
                    </label>
                    <span className="text-[9px] text-[#25D366] font-semibold">बोलकर या लिखकर बताएं</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sumit Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="flex-1 bg-[#202c33] border border-[#2a3942] rounded-xl p-2.5 text-white font-semibold focus:outline-hidden focus:border-[#25D366]"
                    />
                    <button
                      type="button"
                      onClick={handleToggleVoiceInput}
                      title="बोलकर नाम बताएं"
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-base transition active:scale-90 cursor-pointer ${
                        isListening
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-[#202c33] border border-[#2a3942] text-[#25D366] hover:bg-[#2a3942]'
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
                    Colony / Mohalla / Area (कॉलोनी / क्षेत्र)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Budh Vihar / Scheme 2"
                    value={areaName}
                    onChange={(e) => setAreaName(e.target.value)}
                    className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl p-2.5 text-white font-semibold focus:outline-hidden focus:border-[#25D366]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    WhatsApp Number (व्हाट्सएप नंबर) *
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-2.5 font-mono text-slate-400 font-bold">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 bg-[#202c33] border border-[#2a3942] rounded-xl p-2.5 text-white font-mono font-bold focus:outline-hidden focus:border-[#25D366]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Select Your Town / Shahar (शहर) *
                  </label>
                  <select
                    value={targetCity}
                    onChange={(e) => setTargetCity(e.target.value)}
                    className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl p-2.5 text-white font-bold focus:outline-hidden focus:border-[#25D366]"
                  >
                    {Object.keys(TOWN_CENTERS).map((city) => (
                      <option key={city} value={city} className="bg-[#111b21] text-white">
                        📍 {city} ({TOWN_CENTERS[city].name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-[#202c33]/80 border border-[#2a3942] rounded-2xl text-[10.5px] text-amber-300 leading-relaxed">
                  💡 <strong>Instant Access:</strong> Start exploring immediately. Admin will dispatch your WhatsApp Activation PIN within 24 hours.
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !fullName.trim() || phone.replace(/\D/g, '').length !== 10}
                  className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-40 text-[#111b21] font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
                >
                  {isLoading ? 'Creating Temporary Profile...' : '➔ Start As Temporary User'}
                </button>
              </form>
            )}

            {/* TAB 3: ADMIN WHATSAPP PIN VERIFICATION */}
            {authMode === 'activate_pin' && (
              <form onSubmit={handleVerifyAdminPin} className="space-y-3.5 text-xs">
                <div className="p-3.5 bg-[#202c33] rounded-2xl border border-[#2a3942] space-y-2.5">
                  <div className="flex items-center space-x-1.5 text-amber-400 text-[10px] font-bold">
                    <span>💬</span>
                    <span>Enter PIN received from Admin on WhatsApp</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">
                      Registered WhatsApp Mobile Number
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="bg-[#111b21] border border-[#2a3942] rounded-xl px-3 py-2 font-mono text-slate-400 font-bold">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="9876543210"
                        value={activationPhone}
                        onChange={(e) => setActivationPhone(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 bg-[#111b21] border border-[#2a3942] rounded-xl p-2 text-white font-mono font-bold focus:outline-hidden focus:border-[#25D366]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">
                      Admin Activation PIN (FirstName + 4 Digits)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SUMIT4829"
                      value={activationPin}
                      onChange={(e) => setActivationPin(e.target.value.toUpperCase())}
                      className="w-full bg-[#111b21] border border-amber-400/60 rounded-xl p-2.5 text-center text-sm font-mono font-black tracking-widest text-amber-300 uppercase focus:outline-hidden focus:border-[#25D366]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || activationPhone.replace(/\D/g, '').length !== 10 || !activationPin.trim()}
                  className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-40 text-[#111b21] font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
                >
                  {isLoading ? 'Verifying Admin PIN...' : 'Verify & Set 6-Digit PIN ➔'}
                </button>
              </form>
            )}

            {/* TAB 4: SET 6-DIGIT SECRET PIN */}
            {authMode === 'set_secret_pin' && (
              <form onSubmit={handleSetSecretPin} className="space-y-3.5 text-xs">
                <div className="p-3.5 bg-[#202c33] rounded-2xl border border-[#2a3942] space-y-2.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-emerald-400 font-bold">
                      ✓ Verified: +91 {activationPhone}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPins((p) => !p)}
                      className="text-slate-400 hover:text-white font-bold cursor-pointer"
                    >
                      {showPins ? '🙈 Hide' : '👁️ Show'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">
                      Create 6-Digit Secret PIN (गोपनीय पिन बनाएं) *
                    </label>
                    <input
                      type={showPins ? 'text' : 'password'}
                      required
                      maxLength={6}
                      placeholder="••••••"
                      value={secretPin}
                      onChange={(e) => setSecretPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[#111b21] border border-[#2a3942] rounded-xl p-2.5 text-center text-lg font-mono font-black tracking-widest text-white focus:outline-hidden focus:border-[#25D366]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">
                      Confirm 6-Digit Secret PIN (पिन दोबारा दर्ज करें) *
                    </label>
                    <input
                      type={showPins ? 'text' : 'password'}
                      required
                      maxLength={6}
                      placeholder="••••••"
                      value={confirmSecretPin}
                      onChange={(e) => setConfirmSecretPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[#111b21] border border-[#2a3942] rounded-xl p-2.5 text-center text-lg font-mono font-black tracking-widest text-white focus:outline-hidden focus:border-[#25D366]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || secretPin.length !== 6 || secretPin !== confirmSecretPin}
                  className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-40 text-[#111b21] font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
                >
                  {isLoading ? 'Activating Account...' : '✓ Complete Permanent Registration'}
                </button>
              </form>
            )}

          </div>
        )}

      </main>
    </div>
  );
}