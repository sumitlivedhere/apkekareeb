import React, { useState, useEffect, useRef } from 'react';
import {
  requestSmsOtp,
  verifySmsOtpAndRegister,
  loginResidentWithPin,
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

  const [step, setStep] = useState('login_pin');

  // Step 1: Persona
  const [fullName, setFullName] = useState('');
  const [targetCity, setTargetCity] = useState(selectedCity || 'Alwar');
  const [areaName, setAreaName] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Step 2: Geofence State
  const [userCoords, setUserCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState('');
  const [geoDetails, setGeoDetails] = useState(null);

  // Step 3: SMS OTP & PIN Setup
  const [phone, setPhone] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [residentPin, setResidentPin] = useState('');
  const [confirmResidentPin, setConfirmResidentPin] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Step 4: Merchant Upgrade State
  const [upiId, setUpiId] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessPin, setBusinessPin] = useState('');
  const [confirmBusinessPin, setConfirmBusinessPin] = useState('');

  // Returning User PIN Login
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const recognitionRef = useRef(null);

  // Voice Input Setup
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

  // 60-Second Cooldown Timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleToggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in this browser. Please type your name.');
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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (loginPhone.length !== 10 || loginPin.length !== 4) {
      setErrorMsg('Please enter a 10-digit phone and 4-digit PIN.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const res = await loginResidentWithPin(loginPhone, loginPin);
    setIsLoading(false);

    if (res.success && res.profile) {
      if (onSuccess) onSuccess(res.profile);
      onClose();
    } else {
      setErrorMsg(res.error || 'Authentication failed.');
    }
  };

  const handlePersonaSubmit = (e) => {
    e.preventDefault();
    if (!fullName.trim() || !areaName.trim()) {
      setErrorMsg('Please enter both your name and colony.');
      return;
    }
    setErrorMsg('');
    setStep('step2_geofence');
  };

  const handleGeofenceCheck = async () => {
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
        setTimeout(() => {
          setIsLoading(false);
          setStep('step3_sms_otp');
        }, 400);
      } else {
        setGeoStatus('mismatch');
        setIsLoading(false);
      }
    } catch (err) {
      setGeoStatus('error');
      setErrorMsg(err.message || 'GPS verification failed. Please allow location permissions.');
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await requestSmsOtp(phone);
    setIsLoading(false);

    if (res.success) {
      setIsOtpSent(true);
      setCountdown(60);
      setSuccessMsg(`OTP sent via SMS to +91 ${phone}`);
      if (res.debug_otp) {
        setSuccessMsg(`[Dev Mode] OTP: ${res.debug_otp}`);
      }
    } else {
      setErrorMsg(res.error || 'Failed to send SMS OTP.');
    }
  };

  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    if (enteredOtp.length !== 6 || residentPin.length !== 4 || residentPin !== confirmResidentPin) {
      setErrorMsg('Please enter 6-digit OTP and matching 4-digit PINs.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const res = await verifySmsOtpAndRegister({
      phone,
      enteredOtp,
      fullName,
      areaName,
      city: targetCity,
      pin: residentPin,
      lat: userCoords?.lat || null,
      lng: userCoords?.lng || null,
    });

    setIsLoading(false);

    if (res.success && res.profile) {
      setStep('step4_merchant_prompt');
    } else {
      setErrorMsg(res.error || 'Registration failed.');
    }
  };

  const handleLaunchUpiPayment = () => {
    const upiUrl = formatUpiHandshakeUrl({
      payeeVpa: OFFICIAL_UPI_VPA,
      payeeName: 'TownHub Merchant KYC',
      phone,
      amount: '1',
    });
    window.location.href = upiUrl;
    setStep('step4_merchant_setup');
  };

  const handleFinalizeMerchant = async (e) => {
    e.preventDefault();
    const cleanUpi = upiId.toLowerCase().trim();

    if (!cleanUpi.includes('@') || !businessName.trim() || businessPin.length !== 4 || businessPin !== confirmBusinessPin) {
      setErrorMsg('Please check all fields and ensure 4-digit PINs match.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const res = await upgradeToMerchant({
      phone,
      businessName,
      businessPin,
      upiId: cleanUpi,
    });

    setIsLoading(false);

    if (res.success && res.profile) {
      if (onSuccess) onSuccess(res.profile);
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to complete merchant upgrade.');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/85 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-fade-in text-slate-100 font-sans">
      <div className="bg-[#111b21] border border-[#222e35] rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-4 space-y-4 shadow-2xl pb-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222e35] pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-xl bg-[#25D366] text-[#111b21] flex items-center justify-center text-lg font-black shadow-md">
              🛡️
            </span>
            <div>
              <h3 className="text-xs font-black text-white">{actionTitle}</h3>
              <p className="text-[10px] text-[#25D366] font-bold">
                {targetCity} Verified Resident Network
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

        {errorMsg && (
          <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-bold text-center">
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-[11px] font-bold text-center">
            ✓ {successMsg}
          </div>
        )}

        {/* VIEW 0: RETURNING USER LOGIN */}
        {step === 'login_pin' && (
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
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                4-Digit Resident PIN (4 अंकों का पिन)
              </label>
              <input
                type="password"
                required
                maxLength={4}
                placeholder="••••"
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl p-3 text-center text-lg font-mono font-black tracking-widest text-white focus:outline-hidden focus:border-[#25D366]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || loginPhone.length !== 10 || loginPin.length !== 4}
              className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-40 text-[#111b21] font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
            >
              {isLoading ? 'Verifying...' : '➔ Login with PIN'}
            </button>

            <div className="pt-2 border-t border-[#222e35] flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setStep('step1_persona');
                }}
                className="text-[#25D366] font-bold hover:underline"
              >
                + New Resident? Register
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('Reset PIN by verifying your phone via SMS OTP.');
                  setStep('step1_persona');
                }}
                className="text-slate-400 hover:text-white"
              >
                Forgot PIN?
              </button>
            </div>
          </form>
        )}

        {/* STEP 1: PERSONA DETAILS */}
        {step === 'step1_persona' && (
          <form onSubmit={handlePersonaSubmit} className="space-y-3.5 text-xs">
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
                  placeholder="e.g. Rahul Sharma"
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
                Colony / Sector / Mohalla (कॉलोनी / क्षेत्र) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Budh Vihar / NEB Extension"
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl p-2.5 text-white font-semibold focus:outline-hidden focus:border-[#25D366]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                Select Your Shahar / Town (शहर) *
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

            <button
              type="submit"
              disabled={!fullName.trim() || !areaName.trim()}
              className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-40 text-[#111b21] font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
            >
              ➔ Aage Badhein (Next)
            </button>

            <button
              type="button"
              onClick={() => setStep('login_pin')}
              className="w-full text-center text-[10px] text-slate-400 hover:text-white pt-1"
            >
              ← Already registered? Login with PIN
            </button>
          </form>
        )}

        {/* STEP 2: GEOFENCE VERIFICATION */}
        {step === 'step2_geofence' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-[#202c33] rounded-2xl border border-[#2a3942] text-center space-y-2">
              <span className="text-2xl block">📍</span>
              <h4 className="text-sm font-black text-white leading-snug">
                "{fullName}" जी, क्या आप {targetCity} के निवासी हैं?
              </h4>
              <p className="text-[10px] text-slate-300">
                To prevent remote spam and scam activity, TownHub verifies that your device is within 15 km of {targetCity}.
              </p>
            </div>

            {geoStatus === 'mismatch' && geoDetails && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/50 rounded-xl space-y-1 text-center">
                <span className="text-xs font-black text-rose-300 block">
                  🚫 LOCATION MISMATCH
                </span>
                <p className="text-[10px] text-rose-200">
                  Your live GPS is {geoDetails.distanceKm} km away from {targetCity} center (Allowed: {geoDetails.maxAllowedKm} km).
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleGeofenceCheck}
                disabled={isLoading}
                className="py-3 bg-[#25D366] hover:bg-[#20bd5a] text-[#111b21] font-black text-xs rounded-xl shadow-lg active:scale-95 transition cursor-pointer"
              >
                {isLoading ? 'Checking GPS...' : '✓ हाँ (Yes)'}
              </button>

              <button
                type="button"
                onClick={() => {
                  alert('Visitor mode active. You can browse listings but cannot post.');
                  onClose();
                }}
                className="py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg active:scale-95 transition cursor-pointer"
              >
                ✕ नहीं (Visitor)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep('step1_persona')}
              className="w-full text-center text-[10px] text-slate-400 hover:text-white"
            >
              ← Edit Name or Colony
            </button>
          </div>
        )}

        {/* STEP 3: SMS OTP DISPATCH & PIN SETUP */}
        {step === 'step3_sms_otp' && (
          <form onSubmit={handleVerifyOtpAndRegister} className="space-y-3 text-xs">
            <div className="p-3 bg-[#202c33] rounded-2xl border border-[#2a3942] space-y-2.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">GPS Location:</span>
                <span className="text-[#25D366] font-bold">✓ Verified in {targetCity}</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Mobile Number (मोबाइल नंबर) *
                </label>
                <div className="flex items-center space-x-2">
                  <span className="bg-[#111b21] border border-[#2a3942] rounded-xl px-2.5 py-2 font-mono text-slate-400 font-bold">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    disabled={isOtpSent}
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 bg-[#111b21] border border-[#2a3942] rounded-xl p-2 text-white font-mono font-bold focus:outline-hidden focus:border-[#25D366] disabled:opacity-60"
                  />
                  {!isOtpSent && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isLoading || phone.length !== 10}
                      className="px-3 py-2 bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-40 text-[#111b21] font-black rounded-xl shadow-md cursor-pointer text-[11px]"
                    >
                      {isLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  )}
                </div>
              </div>

              {isOtpSent && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-400">
                      Enter 6-Digit SMS OTP *
                    </label>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={countdown > 0 || isLoading}
                      className="text-[10px] text-[#25D366] font-bold hover:underline disabled:opacity-50"
                    >
                      {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    placeholder="123456"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-[#111b21] border border-[#2a3942] rounded-xl p-2.5 text-center text-lg font-mono font-black tracking-widest text-white focus:outline-hidden focus:border-[#25D366]"
                  />
                </div>
              )}
            </div>

            {isOtpSent && (
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Set 4-Digit Resident PIN (लॉगिन पिन) *
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    placeholder="••••"
                    value={residentPin}
                    onChange={(e) => setResidentPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl p-2.5 text-center text-lg font-mono font-black tracking-widest text-white focus:outline-hidden focus:border-[#25D366]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Confirm 4-Digit PIN *
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    placeholder="••••"
                    value={confirmResidentPin}
                    onChange={(e) => setConfirmResidentPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl p-2.5 text-center text-lg font-mono font-black tracking-widest text-white focus:outline-hidden focus:border-[#25D366]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || enteredOtp.length !== 6 || residentPin.length !== 4 || residentPin !== confirmResidentPin}
                  className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-40 text-[#111b21] font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
                >
                  {isLoading ? 'Verifying OTP...' : '✓ Complete Registration'}
                </button>
              </div>
            )}
          </form>
        )}

        {/* STEP 4A: ₹1 UPI MERCHANT UPGRADE PROMPT */}
        {step === 'step4_merchant_prompt' && (
          <div className="space-y-3.5 text-xs text-center">
            <div className="p-3.5 bg-[#202c33] rounded-2xl border border-[#2a3942] space-y-2">
              <span className="text-3xl block">🏪</span>
              <h4 className="text-sm font-black text-white">
                विक्रेता / सेवा प्रदाता (Seller/Provider) बनना चाहते हैं?
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Pay <strong className="text-amber-400">₹1</strong> via UPI to link and verify your bank account. Your UPI ID will be registered with your Business ID.
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
                onClick={() => setStep('step4_merchant_setup')}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer active:scale-95 transition"
              >
                ➔ I Have Paid ₹1 (Set Business PIN)
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onSuccess) onSuccess({ full_name: fullName, phone, city: targetCity });
                  onClose();
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[11px] font-bold rounded-xl cursor-pointer"
              >
                Skip & Continue as Resident
              </button>
            </div>
          </div>
        )}

        {/* STEP 4B: SET BUSINESS ID & UNIQUE UPI */}
        {step === 'step4_merchant_setup' && (
          <form onSubmit={handleFinalizeMerchant} className="space-y-3 text-xs">
            <div className="p-3 bg-[#202c33] rounded-2xl border border-[#2a3942] space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Bank Verification:</span>
                <span className="text-[#25D366] font-bold">✓ ₹1 UPI Initiated</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Your Bank Payout UPI ID (1 UPI = 1 Account) *
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

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Verified Mobile Number
                </label>
                <input
                  type="text"
                  disabled
                  value={`+91 ${phone}`}
                  className="w-full bg-[#111b21]/60 border border-[#2a3942] rounded-xl p-2 text-slate-400 font-mono font-bold cursor-not-allowed"
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
              {isLoading ? 'Checking UPI & Activating...' : '✓ Complete Business Registration'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}