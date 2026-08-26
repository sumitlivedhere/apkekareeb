import React, { useState, useEffect, useRef } from 'react';
import {
  registerTemporaryUser,
  verifyAdminActivationPin,
  setPermanentSecretPin,
  loginWithSecretPin,
  upgradeToMerchant,
  formatUpiHandshakeUrl,
  OFFICIAL_UPI_VPA,
} from '../../services/authService';
import {
  getLiveBrowserCoordinates,
  verifyTownResidency,
  TOWN_CENTERS,
} from '../../utils/geoFence';

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  actionTitle = 'Join TownHub Community',
  selectedCity = 'Alwar',
}) {
  if (!isOpen) return null;

  // Active Modes: 'temp_register' | 'activate_pin' | 'set_secret_pin' | 'login' | 'merchant_upgrade' | 'merchant_setup'
  const [authMode, setAuthMode] = useState('temp_register');

  // Step 1: Quick Join Persona & Location
  const [fullName, setFullName] = useState('');
  const [targetCity, setTargetCity] = useState(selectedCity || 'Alwar');
  const [areaName, setAreaName] = useState('');
  const [phone, setPhone] = useState('');
  const [isListening, setIsListening] = useState(false);

  // GPS Geofence State
  const [userCoords, setUserCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState('idle'); // 'idle' | 'checking' | 'passed' | 'mismatch' | 'error'
  const [geoDetails, setGeoDetails] = useState(null);

  // Step 2 & 3: Admin Activation & 6-Digit Secret PIN
  const [activationPhone, setActivationPhone] = useState('');
  const [activationPin, setActivationPin] = useState('');
  const [secretPin, setSecretPin] = useState('');
  const [confirmSecretPin, setConfirmSecretPin] = useState('');
  const [showPins, setShowPins] = useState(false);

  // Step 4: Standard Login
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');

  // Step 5: ₹1 UPI Merchant Upgrade
  const [upiId, setUpiId] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessPin, setBusinessPin] = useState('');
  const [confirmBusinessPin, setConfirmBusinessPin] = useState('');

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const recognitionRef = useRef(null);

  // 🎙️ Speech Recognition Setup for Hindi/English Voice Input
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
      setErrorMsg('Voice input is not supported on this browser. Please type your name.');
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

  // 📍 GPS Geofence Verification Check
  const handleCheckGPS = async () => {
    setIsLoading(true);
    setGeoStatus('checking');
    setErrorMsg('');
    try {
      const coords = await getLiveBrowserCoordinates();
      setUserCoords(coords);
      const verification = verifyTownResidency(coords.lat, coords.lng, targetCity);
      setGeoDetails(verification);

      if (verification.isWithinBoundary) {
        setGeoStatus('passed');
        setSuccessMsg(`✓ GPS Verified: Device located within ${verification.distanceKm} km of ${targetCity}`);
      } else {
        setGeoStatus('mismatch');
        setErrorMsg(`Location Mismatch: ${verification.distanceKm} km from ${targetCity} (Allowed: ${verification.maxAllowedKm} km).`);
      }
    } catch (err) {
      setGeoStatus('error');
      setErrorMsg(err.message || 'GPS verification failed. Please grant browser location permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  // 🌟 1. Temporary Registration
  const handleTempRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!fullName.trim() || cleanPhone.length !== 10) {
      setErrorMsg('Please enter your full name and a valid 10-digit WhatsApp number.');
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
      setSuccessMsg(`Welcome ${fullName}! Temporary profile activated for comments, likes & cart.`);
      setTimeout(() => {
        if (onSuccess) onSuccess(res.profile);
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.error || 'Temporary registration failed. Please try again.');
    }
  };

  // 🌟 2. Verify Admin Activation PIN
  const handleVerifyAdminPin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanPhone = activationPhone.replace(/\D/g, '').slice(-10);
    const cleanPin = activationPin.trim().toUpperCase();

    if (cleanPhone.length !== 10 || !cleanPin) {
      setErrorMsg('Please enter your 10-digit mobile number and the Admin PIN sent to your WhatsApp.');
      return;
    }

    setIsLoading(true);
    const res = await verifyAdminActivationPin({ phone: cleanPhone, activationPin: cleanPin });
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg('Admin PIN Verified! Please create your private 6-digit Secret PIN below.');
      setTimeout(() => {
        setSuccessMsg('');
        setAuthMode('set_secret_pin');
      }, 700);
    } else {
      setErrorMsg(res.error || 'Invalid Admin Activation PIN. Check your WhatsApp message.');
    }
  };

  // 🌟 3. Set Permanent 6-Digit Secret PIN
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
      setSuccessMsg('Account permanently activated! 6-digit Secret PIN created successfully.');
      setTimeout(() => {
        if (onSuccess) onSuccess(res.profile);
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.error || 'Failed to save Secret PIN.');
    }
  };

  // 🌟 4. Standard User Login
  const handleLoginSubmit = async (e) => {
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
      if (onSuccess) onSuccess(res.profile);
      onClose();
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

  // 🌟 5. Launch ₹1 UPI Handshake for Merchant Upgrade
  const handleLaunchUpiPayment = () => {
    const cleanPhone = (phone || loginPhone || activationPhone).replace(/\D/g, '').slice(-10);
    const upiUrl = formatUpiHandshakeUrl({
      payeeVpa: OFFICIAL_UPI_VPA,
      payeeName: 'TownHub Merchant KYC',
      phone: cleanPhone || '9876543210',
      amount: '1',
    });
    window.location.href = upiUrl;
    setAuthMode('merchant_setup');
  };

  // 🌟 6. Complete Merchant Upgrade Setup
  const handleFinalizeMerchant = async (e) => {
    e.preventDefault();
    const cleanPhone = (phone || loginPhone || activationPhone).replace(/\D/g, '').slice(-10);
    const cleanUpi = upiId.toLowerCase().trim();

    if (!cleanUpi.includes('@') || !businessName.trim() || businessPin.length !== 4 || businessPin !== confirmBusinessPin) {
      setErrorMsg('Please enter a valid UPI ID (@), business name, and matching 4-digit business PINs.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    const res = await upgradeToMerchant({
      phone: cleanPhone,
      businessName: businessName.trim(),
      businessPin,
      upiId: cleanUpi,
    });
    setIsLoading(false);

    if (res.success && res.profile) {
      setSuccessMsg('🏪 Merchant KYC Completed! Business Dashboard Unlocked.');
      setTimeout(() => {
        if (onSuccess) onSuccess(res.profile);
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.error || 'Failed to complete merchant upgrade.');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/85 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-fade-in text-slate-100 font-sans">
      <div className="bg-[#111b21] border border-[#222e35] rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-4 space-y-3.5 shadow-2xl pb-6">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-[#222e35] pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-xl bg-[#25D366] text-[#111b21] flex items-center justify-center text-lg font-black shadow-md">
              🛡️
            </span>
            <div>
              <h3 className="text-xs font-black text-white">{actionTitle}</h3>
              <p className="text-[10px] text-[#25D366] font-bold">
                {targetCity} Resident & Merchant Portal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 bg-[#202c33] hover:bg-[#2a3942] text-slate-300 rounded-full flex items-center justify-center text-xs font-black cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 4-Way Navigation Tab Switcher */}
        <div className="grid grid-cols-4 gap-1 bg-[#0b141a] p-1 rounded-2xl border border-[#222e35] text-[9.5px] font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('temp_register');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-1.5 rounded-xl transition cursor-pointer text-center ${
              authMode === 'temp_register'
                ? 'bg-[#25D366] text-[#111b21] font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Join
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('activate_pin');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-1.5 rounded-xl transition cursor-pointer text-center ${
              authMode === 'activate_pin' || authMode === 'set_secret_pin'
                ? 'bg-[#25D366] text-[#111b21] font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2. Activate
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-1.5 rounded-xl transition cursor-pointer text-center ${
              authMode === 'login'
                ? 'bg-[#25D366] text-[#111b21] font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            3. Login
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('merchant_upgrade');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-1.5 rounded-xl transition cursor-pointer text-center ${
              authMode === 'merchant_upgrade' || authMode === 'merchant_setup'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-amber-400/80 hover:text-amber-300'
            }`}
          >
            🏪 KYC
          </button>
        </div>

        {/* Dynamic Status Alerts */}
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

        {/* ========================================================================= */}
        {/* 🌟 VIEW 1: QUICK TEMPORARY JOIN (WITH VOICE MIC & GPS GEOFENCE)           */}
        {/* ========================================================================= */}
        {authMode === 'temp_register' && (
          <form onSubmit={handleTempRegister} className="space-y-3 text-xs">
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
                Colony / Sector / Mohalla (कॉलोनी / क्षेत्र)
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
                <span className="bg-[#202c33] border border-[#2a3942] rounded-xl px-2.5 py-2.5 font-mono text-slate-400 font-bold">
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
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-400">
                  Select Your Shahar / Town (शहर) *
                </label>
                <button
                  type="button"
                  onClick={handleCheckGPS}
                  disabled={isLoading}
                  className="text-[9.5px] text-amber-300 hover:text-amber-200 font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <span>📍</span>
                  <span>{geoStatus === 'passed' ? '✓ GPS Verified' : 'Check GPS Location'}</span>
                </button>
              </div>
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

            <div className="p-2.5 rounded-2xl bg-[#202c33]/80 border border-[#2a3942] text-[10px] text-amber-300 leading-relaxed">
              💡 <strong>Instant Access:</strong> Comment on listings, save favorites & track Surprise Me deals. Admin will dispatch your Activation PIN within 24 hours.
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

        {/* ========================================================================= */}
        {/* 🌟 VIEW 2: ADMIN ACTIVATION PIN VERIFICATION                              */}
        {/* ========================================================================= */}
        {authMode === 'activate_pin' && (
          <form onSubmit={handleVerifyAdminPin} className="space-y-3 text-xs">
            <div className="p-3 bg-[#202c33] rounded-2xl border border-[#2a3942] space-y-2.5">
              <div className="flex items-center space-x-1.5 text-amber-400 text-[10px] font-bold">
                <span>💬</span>
                <span>Enter WhatsApp PIN sent by TownHub Admin</span>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Registered WhatsApp Mobile Number
                </label>
                <div className="flex items-center space-x-2">
                  <span className="bg-[#111b21] border border-[#2a3942] rounded-xl px-2.5 py-2 font-mono text-slate-400 font-bold">
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

        {/* ========================================================================= */}
        {/* 🌟 VIEW 3: SET SECRET 6-DIGIT PERSONAL PIN                                */}
        {/* ========================================================================= */}
        {authMode === 'set_secret_pin' && (
          <form onSubmit={handleSetSecretPin} className="space-y-3 text-xs">
            <div className="p-3 bg-[#202c33] rounded-2xl border border-[#2a3942] space-y-2.5">
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

              <p className="text-[9.5px] text-slate-400 leading-tight">
                🔒 This 6-digit PIN is completely private to you for all future logins.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || secretPin.length !== 6 || secretPin !== confirmSecretPin}
              className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-40 text-[#111b21] font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
            >
              {isLoading ? 'Activating Profile...' : '✓ Complete Permanent Registration'}
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* 🌟 VIEW 4: STANDARD USER LOGIN (MOBILE + 6-DIGIT SECRET PIN)               */}
        {/* ========================================================================= */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                Registered Mobile Number (मोबाइल नंबर)
              </label>
              <div className="flex items-center space-x-2">
                <span className="bg-[#202c33] border border-[#2a3942] rounded-xl px-2.5 py-2.5 font-mono text-slate-400 font-bold">
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
              {isLoading ? 'Verifying...' : '➔ Login with PIN'}
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* 🌟 VIEW 5: ₹1 UPI MERCHANT UPGRADE PROMPT                                  */}
        {/* ========================================================================= */}
        {authMode === 'merchant_upgrade' && (
          <div className="space-y-3.5 text-xs text-center">
            <div className="p-3.5 bg-[#202c33] rounded-2xl border border-[#2a3942] space-y-2">
              <span className="text-3xl block">🏪</span>
              <h4 className="text-sm font-black text-white">
                विक्रेता / सेवा प्रदाता (Seller/Provider) बनना चाहते हैं?
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Pay <strong className="text-amber-400">₹1</strong> via UPI to link and verify your bank account. Your bank UPI ID will be registered with your Business ID.
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleLaunchUpiPayment}
                className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-[#111b21] font-black text-xs rounded-xl shadow-lg active:scale-95 transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>💳</span>
                <span>Open UPI App (Pay ₹1) ➔</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('merchant_setup')}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer active:scale-95 transition"
              >
                ➔ I Have Paid ₹1 (Set Business ID)
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 🌟 VIEW 6: MERCHANT BUSINESS ID & UPI PROFILE SETUP                       */}
        {/* ========================================================================= */}
        {authMode === 'merchant_setup' && (
          <form onSubmit={handleFinalizeMerchant} className="space-y-3 text-xs">
            <div className="p-3 bg-[#202c33] rounded-2xl border border-[#2a3942] space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Bank KYC Verification:</span>
                <span className="text-[#25D366] font-bold">✓ ₹1 UPI Initiated</span>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Bank Payout UPI ID (1 UPI = 1 Business Account) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. rahul@okhdfcbank or 9116544765@ybl"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value.toLowerCase().trim())}
                  className="w-full bg-[#111b21] border border-[#2a3942] rounded-xl p-2.5 text-white font-mono font-bold focus:outline-hidden focus:border-[#25D366]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Business / Shop / Service Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sharma Electricals & Sanitations"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-[#111b21] border border-[#2a3942] rounded-xl p-2.5 text-white font-semibold focus:outline-hidden focus:border-[#25D366]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                Set 4-Digit Business Security PIN (डैशबोर्ड पिन) *
              </label>
              <input
                type="password"
                required
                maxLength={4}
                placeholder="••••"
                value={businessPin}
                onChange={(e) => setBusinessPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl p-2.5 text-center text-lg font-mono font-black tracking-widest text-white focus:outline-hidden focus:border-[#25D366]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                Confirm 4-Digit Business PIN *
              </label>
              <input
                type="password"
                required
                maxLength={4}
                placeholder="••••"
                value={confirmBusinessPin}
                onChange={(e) => setConfirmBusinessPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl p-2.5 text-center text-lg font-mono font-black tracking-widest text-white focus:outline-hidden focus:border-[#25D366]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !upiId.includes('@') || !businessName.trim() || businessPin.length !== 4 || businessPin !== confirmBusinessPin}
              className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-40 text-[#111b21] font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
            >
              {isLoading ? 'Verifying & Upgrading...' : '✓ Complete Merchant KYC Registration'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}