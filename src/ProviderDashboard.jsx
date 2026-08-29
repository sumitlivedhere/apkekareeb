import React, { useState, useMemo, useEffect, useRef } from 'react';
import { hyperlocalStore, useAllListingsSlice } from './store/hyperlocalStore';
import VoiceNotePlayer from './components/common/VoiceNotePlayer';
import PostListingModal from './components/common/PostListingModal';
import {
  deleteListingFromDB,
  submitSellerEditProposal,
  sendSellerReplyToAdmin,
  uploadVoiceNoteToStorage,
} from './services/listingService';
import {
  getOptimizedVoiceStream,
  createOptimizedMediaRecorder,
} from './utils/audioCompressor';
import {
  getCurrentUserProfile,
  isBusinessAuthorized,
  loginWith4DigitPin,
  generateActivationPin,
  markUserPinDispatched,
  verifyActivationPin,
  setCustomPermanentPin,
  logoutUser,
} from './services/authService';
import {
  getTemplatesForCategory,
} from './data/offerTemplatesRegistry';

const QUICK_PRESETS = [
  'हाँ, उपलब्ध है (Available)',
  'दुकान पर आकर देख सकते हैं',
  'कीमत फिक्स है (Price is Fixed)',
  'दुकान खुली है (Open Now)',
  'WhatsApp पर फोटो/वीडियो भेज दी है',
  'आज ही होम डिलीवरी संभव है',
  'त्योहारी डिस्काउंट ऑफर चालू है',
  'कृपया कॉल या WhatsApp पर संपर्क करें',
];

const EMOJI_PRESETS = ['🍱', '🔥', '👑', '🎁', '⚡', '🪔', '🔄', '📱', '📺', '🛏️', '🌾', '🌶️', '🍳', '🎒', '💄', '🛵', '🎨', '🩺', '📚', '🚚', '🛡️', '⏳'];

export default function ProviderDashboard({ onBack, selectedCity = 'Alwar' }) {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUserProfile());
  const [isAuthorized, setIsAuthorized] = useState(() => isBusinessAuthorized());

  // 🔒 Login & Activation Gate States ('login' | 'request_pin' | 'enter_pin' | 'set_custom_pin')
  const [authTab, setAuthTab] = useState('login');
  const [loginPhone, setLoginPhone] = useState(currentUser?.phone || '');
  const [loginPin, setLoginPin] = useState('');
  const [activationPin, setActivationPin] = useState('');
  const [generatedPinNotice, setGeneratedPinNotice] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [customPin, setCustomPin] = useState('');
  const [shopName, setShopName] = useState(() => currentUser?.business_name || '');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Active Merchant Phone
  const sellerPhone = currentUser?.phone || loginPhone;

  // Navigation & Filter States
  const [activeTab, setActiveTab] = useState('inquiries'); // 'inquiries' | 'listings' | 'offers'
  const [sortByInterest, setSortByInterest] = useState(false);
  const [selectedListingFilter, setSelectedListingFilter] = useState('all');
  const [onlyUnanswered, setOnlyUnanswered] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  // 📝 Unified Post / Edit Listing Modal State
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState(null);

  // 🎁 Offer & Combo Studio State
  const [selectedListingForOffer, setSelectedListingForOffer] = useState(null);
  const [selectedOfferCategory, setSelectedOfferCategory] = useState('sector'); // 'sector' | 'universal'
  const [isCustomOfferMode, setIsCustomOfferMode] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('🍱');
  const [offerForm, setOfferForm] = useState({
    deal_type: 'wedding',
    deal_badge: '',
    deal_details: '',
    original_price: '',
    price: '',
    token_amount: '',
    doorstep_trial: false,
  });
  const [isSavingOffer, setIsSavingOffer] = useState(false);

  // 📩 Seller-to-Admin Direct Response State
  const [replyInputs, setReplyInputs] = useState({});
  const [sellerAdminReplies, setSellerAdminReplies] = useState({});
  const [recordingAdminReplyId, setRecordingAdminReplyId] = useState(null);
  const [adminRecordingSecs, setAdminRecordingSecs] = useState(0);
  const [isSendingAdminReply, setIsSendingAdminReply] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const allListings = useAllListingsSlice();
  const [threadUpdateTick, setThreadUpdateTick] = useState(0);

  useEffect(() => {
    return hyperlocalStore.subscribe((_, changedKey) => {
      if (
        !changedKey ||
        changedKey.startsWith('thread:') ||
        changedKey === 'threads' ||
        changedKey === 'all' ||
        changedKey.startsWith('interest:')
      ) {
        setThreadUpdateTick((prev) => prev + 1);
      }
    });
  }, []);

  const showNotice = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 3500);
  };

  // 🚪 1. Merchant PIN Login Handler
  const handlePerformLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsAuthenticating(true);

    const clean = String(loginPhone).replace(/\D/g, '').slice(-10);

    if (clean.length < 10) {
      setAuthError('कृपया 10-अंकीय मोबाइल नंबर दर्ज करें (Enter 10-digit mobile).');
      setIsAuthenticating(false);
      return;
    }

    if (String(loginPin).length < 4) {
      setAuthError('कृपया कम से कम 4-अंकीय पिन दर्ज करें (Enter 4-digit PIN).');
      setIsAuthenticating(false);
      return;
    }

    try {
      const res = await loginWith4DigitPin(clean, loginPin);
      if (res.success && res.profile) {
        if (!res.profile.is_merchant && res.profile.verification_tier !== 'verified_merchant') {
          setAuthError('यह खाता सेलर के रूप में सक्रिय नहीं है। कृपया सेलर पिन (...S) से सक्रिय करें।');
          setAuthTab('request_pin');
          return;
        }
        setCurrentUser(res.profile);
        sessionStorage.setItem('townhub_business_auth', 'authorized');
        setIsAuthorized(true);
        setAuthError('');
      } else {
        setAuthError(res.error || 'पिन अमान्य है या खाता नहीं मिला (Incorrect PIN or account not found).');
      }
    } catch {
      setAuthError('Connection busy. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 📱 2. Step 1: Send Seller PIN via WhatsApp
  const handleSendSellerWhatsAppPin = async () => {
    const clean = String(loginPhone).replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setAuthError('कृपया 10-अंकीय मोबाइल नंबर दर्ज करें (Enter 10-digit mobile).');
      return;
    }

    setIsAuthenticating(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      const generatedPin = generateActivationPin('seller');
      await markUserPinDispatched(clean, generatedPin);

      const message = `Namaste ${shopName || 'Merchant Partner'}! 🙏\n\nWelcome to Aapke Kareeb (${selectedCity})!\n\nAapka Merchant Activation PIN hai: *${generatedPin}*\n\nKripya App me jakar yeh PIN darj karein aur apna man-pasand Permanent Login PIN set karein.\n\nDhanyawaad!`;
      const waUrl = `https://wa.me/91${clean}?text=${encodeURIComponent(message)}`;

      setGeneratedPinNotice(generatedPin);
      setWhatsappLink(waUrl);
      setAuthTab('enter_pin');
      setAuthSuccess(`📱 सेलर पिन (${generatedPin}) तैयार है! WhatsApp खोलें या नीचे दर्ज करें।`);
      window.open(waUrl, '_blank');
    } catch (err) {
      setAuthError(err.message || 'Error dispatching PIN.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 🔑 3. Step 2: Verify Seller PIN ending with S
  const handleVerifySellerPin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const clean = String(loginPhone).replace(/\D/g, '').slice(-10);
    if (activationPin.trim().length < 7) {
      setAuthError('सेलर पिन 6 अंक और अंत में S होना चाहिए (e.g. 739102S).');
      return;
    }

    setIsAuthenticating(true);
    try {
      const res = await verifyActivationPin(clean, activationPin);
      if (res.success) {
        setAuthTab('set_custom_pin');
        setAuthSuccess('✓ सेलर पिन सत्यापित हो गया! अब अपना स्थायी 4-अंकीय पिन सेट करें।');
      } else {
        setAuthError(res.error || 'अमान्य सेलर पिन (Invalid Seller PIN).');
      }
    } catch (err) {
      setAuthError(err.message || 'सत्यापन विफल रहा (Verification failed).');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 🔒 4. Step 3: Set Permanent PIN for Seller
  const handleSavePermanentPin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (customPin.length < 4) {
      setAuthError('पिन कम से कम 4 अंकों का होना चाहिए (PIN must be at least 4 digits).');
      return;
    }

    const clean = String(loginPhone).replace(/\D/g, '').slice(-10);
    setIsAuthenticating(true);
    try {
      const res = await setCustomPermanentPin({
        phone: clean,
        newPin: customPin,
        roleType: 'seller',
        businessName: shopName,
      });

      if (res.success && res.profile) {
        setCurrentUser(res.profile);
        sessionStorage.setItem('townhub_business_auth', 'authorized');
        setIsAuthorized(true);
      } else {
        setAuthError(res.error || 'पिन सेट करने में त्रुटि (Failed to save PIN).');
      }
    } catch (err) {
      setAuthError(err.message || 'Error saving PIN.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 🚪 Perform Logout
  const handleSellerLogout = async () => {
    if (window.confirm('लॉग आउट करना चाहते हैं? (Log out of Business Hub?)')) {
      await logoutUser();
      setCurrentUser(null);
      setIsAuthorized(false);
      setLoginPin('');
      setAuthTab('login');
    }
  };

  // 1. Strictly Filtered Merchant Listings
  const myListings = useMemo(() => {
    if (!isAuthorized || !sellerPhone) return [];

    const clean = String(sellerPhone).replace(/\D/g, '').slice(-10);
    const list = (allListings || []).filter((item) => {
      const p1 = String(item.phone || '').replace(/\D/g, '').slice(-10);
      const p2 = String(item.pending_changes?.phone || '').replace(/\D/g, '').slice(-10);
      return p1 === clean || p2 === clean;
    });

    if (sortByInterest) {
      return [...list].sort(
        (a, b) => (Number(b.interestCount || b.interest_count) || 0) - (Number(a.interestCount || a.interest_count) || 0)
      );
    }
    return list;
  }, [allListings, sellerPhone, isAuthorized, sortByInterest]);

  // 2. Customer Inquiries Aggregation
  const userInquiries = useMemo(() => {
    if (!isAuthorized || myListings.length === 0) return [];
    const threadMap = hyperlocalStore.state.threads || {};
    const inquiries = [];
    const now = Date.now();
    const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

    myListings.forEach((listing) => {
      const listingComments = threadMap[listing.id] || [];
      listingComments.forEach((comm) => {
        if (comm.created_at && now - new Date(comm.created_at).getTime() > FIVE_DAYS_MS) {
          return;
        }
        inquiries.push({
          ...comm,
          listingId: listing.id,
          listingTitle: listing.title || listing.name,
          listingPrice: listing.price || listing.rates || listing.startingPackage,
          listingImage: listing.image || (listing.images && listing.images[0]),
        });
      });
    });

    return inquiries.filter((inq) => {
      const matchesListing =
        selectedListingFilter === 'all' || String(inq.listingId) === String(selectedListingFilter);
      const matchesUnanswered = onlyUnanswered ? !inq.sellerReply : true;
      return matchesListing && matchesUnanswered;
    });
  }, [myListings, threadUpdateTick, selectedListingFilter, onlyUnanswered, isAuthorized]);

  const pendingInquiriesCount = useMemo(() => {
    return userInquiries.filter((q) => !q.sellerReply).length;
  }, [userInquiries]);

  // ✏️ Open Post Modal for Creation or Editing
  const handleOpenCreateModal = () => {
    setEditingListing(null);
    setIsPostModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingListing(item);
    setIsPostModalOpen(true);
  };

  // 🗑️ Delete Listing Handler
  const handleDeleteMerchantListing = async (listingId, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }

    try {
      await deleteListingFromDB(listingId);
      hyperlocalStore.removeListing(listingId);
      showNotice('Listing deleted successfully.');
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete listing from database.');
    }
  };

  // 🎁 1. Open Offer Studio Modal
  const handleOpenOfferStudio = (listing) => {
    const changes = listing.pending_changes || {};
    const currentCat = listing.category || 'market';
    const { sectorTemplates, universalTemplates } = getTemplatesForCategory(currentCat);
    const firstDefaultTpl = sectorTemplates[0] || universalTemplates[0];

    setSelectedListingForOffer(listing);
    setSelectedOfferCategory('sector');
    setIsCustomOfferMode(false);

    setOfferForm({
      deal_type: changes.deal_type || changes.dealType || listing.deal_type || listing.dealType || currentCat,
      deal_badge: changes.deal_badge || changes.dealBadge || listing.deal_badge || listing.dealBadge || firstDefaultTpl?.badge || '🔥 Special Deal',
      deal_details: changes.deal_details || changes.dealDetails || listing.deal_details || listing.dealDetails || firstDefaultTpl?.details || '',
      original_price: changes.original_price || changes.originalPrice || listing.original_price || listing.originalPrice || '',
      price: changes.price || listing.price || '',
      token_amount: changes.token_amount || changes.tokenAmount || listing.token_amount || listing.tokenAmount || '',
      doorstep_trial: Boolean(changes.doorstep_trial ?? changes.doorstepTrial ?? listing.doorstep_trial ?? listing.doorstepTrial ?? false),
    });
  };

  // 🎁 2. Apply 1-Tap Template Preset
  const handleApplyOfferTemplate = (tpl) => {
    setIsCustomOfferMode(false);
    setOfferForm((prev) => ({
      ...prev,
      deal_type: tpl.category || selectedListingForOffer?.category || 'special',
      deal_badge: tpl.badge,
      deal_details: tpl.details,
      price: tpl.defaultPrice || prev.price,
      original_price: tpl.defaultOriginalPrice || prev.original_price,
      token_amount: tpl.tokenAmount || '',
      doorstep_trial: Boolean(tpl.doorstepTrial),
    }));
  };

  // 🎁 3. Save & Submit Offer Proposal to Admin
  const handleSaveOffer = async (e) => {
    e.preventDefault();
    if (!selectedListingForOffer) return;

    setIsSavingOffer(true);
    try {
      const existingChanges = selectedListingForOffer.pending_changes || {};

      const updatedProposal = {
        ...selectedListingForOffer,
        ...existingChanges,
        price: offerForm.price.trim() || selectedListingForOffer.price,
        original_price: offerForm.original_price.trim() || null,
        deal_type: offerForm.deal_type,
        deal_badge: offerForm.deal_badge.trim(),
        deal_details: offerForm.deal_details.trim(),
        token_amount: offerForm.token_amount.trim() || null,
        doorstep_trial: Boolean(offerForm.doorstep_trial),
        has_pending_approval: true,
      };

      await submitSellerEditProposal(selectedListingForOffer.id, updatedProposal);

      hyperlocalStore.insertListing(selectedListingForOffer.category, {
        ...selectedListingForOffer,
        pending_changes: updatedProposal,
        has_pending_approval: true,
      });

      showNotice('Offer submitted for admin verification! It will go live once approved.');
      setSelectedListingForOffer(null);
    } catch (err) {
      console.error('Failed to save offer:', err);
      alert('Failed to submit offer proposal. Please check your internet connection.');
    } finally {
      setIsSavingOffer(false);
    }
  };

  // 🎁 4. Remove Offer from Listing
  const handleRemoveOffer = async (listing) => {
    if (!window.confirm('Remove this promotional deal and restore standard pricing?')) return;
    try {
      const existingChanges = listing.pending_changes || {};
      const updatedProposal = {
        ...listing,
        ...existingChanges,
        deal_type: null,
        deal_badge: null,
        deal_details: null,
        original_price: null,
        token_amount: null,
        doorstep_trial: false,
        has_pending_approval: true,
      };

      await submitSellerEditProposal(listing.id, updatedProposal);
      hyperlocalStore.insertListing(listing.category, {
        ...listing,
        pending_changes: updatedProposal,
        has_pending_approval: true,
      });

      showNotice('Offer removal submitted for admin approval.');
    } catch (err) {
      console.error('Failed to remove offer:', err);
    }
  };

  // 🎙️ Start Voice Recording to Admin
  const handleStartVoiceToAdmin = async (listingId) => {
    try {
      const stream = await getOptimizedVoiceStream();
      audioChunksRef.current = [];
      const mediaRecorder = createOptimizedMediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      setRecordingAdminReplyId(listingId);
      setAdminRecordingSecs(0);

      timerRef.current = setInterval(() => {
        setAdminRecordingSecs((prev) => prev + 1);
      }, 1000);
    } catch {
      alert('Microphone access denied. Please allow microphone permissions in settings.');
    }
  };

  // 🎙️ Stop and Send Voice Note to Admin
  const handleStopAndSendVoiceToAdmin = (item) => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return;

    mediaRecorder.onstop = async () => {
      clearInterval(timerRef.current);
      setIsSendingAdminReply(true);
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        const publicAudioUrl = await uploadVoiceNoteToStorage(audioBlob);
        const durationStr = `0:${adminRecordingSecs < 10 ? '0' : ''}${adminRecordingSecs}`;

        const replyPayload = {
          text: '🎤 Voice note response to Admin feedback',
          audioUrl: publicAudioUrl,
          duration: durationStr,
        };

        await sendSellerReplyToAdmin(item.id, sellerPhone, replyPayload);

        const updatedItem = {
          ...item,
          seller_feedback_reply: JSON.stringify(replyPayload),
        };
        hyperlocalStore.insertListing(item.category, updatedItem);

        showNotice('Voice note reply sent directly to Admin.');
      } catch (err) {
        console.error('Audio reply failed:', err);
      } finally {
        if (mediaRecorder.stream) mediaRecorder.stream.getTracks().forEach((t) => t.stop());
        setRecordingAdminReplyId(null);
        setAdminRecordingSecs(0);
        setIsSendingAdminReply(false);
      }
    };

    mediaRecorder.stop();
  };

  const handleCancelVoiceToAdmin = () => {
    if (mediaRecorderRef.current) {
      clearInterval(timerRef.current);
      if (mediaRecorderRef.current.stream) mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
      setRecordingAdminReplyId(null);
      setAdminRecordingSecs(0);
    }
  };

  // ✉️ Send Text Reply to Admin
  const handleSendTextReplyToAdmin = async (item) => {
    const text = (sellerAdminReplies[item.id] || '').trim();
    if (!text) return;

    setIsSendingAdminReply(true);
    try {
      const replyPayload = { text };
      await sendSellerReplyToAdmin(item.id, sellerPhone, replyPayload);

      const updatedItem = {
        ...item,
        seller_feedback_reply: text,
      };
      hyperlocalStore.insertListing(item.category, updatedItem);

      setSellerAdminReplies((prev) => ({ ...prev, [item.id]: '' }));
      showNotice('Reply sent directly to Admin.');
    } catch {
      alert('Failed to send reply to Admin.');
    } finally {
      setIsSendingAdminReply(false);
    }
  };

  // =========================================================================
  // 🔒 AUTH GUARD VIEW: LOGIN & SELLER PIN ACTIVATION (...S)
  // =========================================================================
  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 font-sans select-none">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          
          <div className="text-center space-y-1">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 text-2xl flex items-center justify-center mx-auto shadow-md font-black">
              🏪
            </div>
            <h2 className="text-sm font-black text-slate-100">Business Hub (सुरक्षित लॉगिन)</h2>
            <p className="text-[10.5px] text-slate-400 leading-relaxed">
              अपनी लिस्टिंग्स, ऑर्डर्स व ग्राहक बातचीत देखने के लिए लॉगिन या सेलर पिन से एक्टिवेट करें।
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-[10.5px] font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthTab('login');
                setAuthError('');
                setAuthSuccess('');
              }}
              className={`py-2 rounded-xl transition cursor-pointer text-center ${
                authTab === 'login' ? 'bg-amber-400 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              1. Merchant Login
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('request_pin');
                setAuthError('');
                setAuthSuccess('');
              }}
              className={`py-2 rounded-xl transition cursor-pointer text-center ${
                authTab === 'request_pin' || authTab === 'enter_pin' || authTab === 'set_custom_pin'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2. Activate PIN (...S)
            </button>
          </div>

          {authError && (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-[10.5px] text-rose-300 text-center font-bold animate-fade-in">
              ⚠️ {authError}
            </div>
          )}

          {authSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-[10.5px] text-emerald-300 text-center font-bold animate-fade-in">
              {authSuccess}
            </div>
          )}

          {/* 1. Login Form */}
          {authTab === 'login' && (
            <form onSubmit={handlePerformLogin} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-300 block mb-1">
                  Merchant Mobile Number (मोबाइल नंबर) *
                </label>
                <div className="flex items-center space-x-2">
                  <span className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 font-mono text-amber-400 font-bold text-xs">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold focus:border-amber-400 focus:outline-hidden tracking-wider font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-300 block mb-1">
                  Security PIN (पिन दर्ज करें) *
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  required
                  maxLength={6}
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 font-bold text-center text-lg tracking-widest focus:border-amber-400 focus:outline-hidden font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                {isAuthenticating ? 'Verifying PIN... ⏳' : 'Unlock Business Hub ➔'}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('request_pin');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className="text-[10px] text-amber-400 hover:underline font-bold cursor-pointer"
                >
                  New Seller? Activate via WhatsApp PIN (...S) ➔
                </button>
              </div>
            </form>
          )}

          {/* 2. Step 1: Send Seller PIN via WhatsApp */}
          {authTab === 'request_pin' && (
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-300 block mb-1">
                  Merchant Mobile Number *
                </label>
                <div className="flex items-center space-x-2">
                  <span className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 font-mono text-amber-400 font-bold text-xs">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold focus:border-amber-400 focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendSellerWhatsAppPin}
                disabled={isAuthenticating || loginPhone.replace(/\D/g, '').length !== 10}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg active:scale-95 transition cursor-pointer disabled:opacity-40 flex items-center justify-center space-x-1.5"
              >
                <span>📱</span>
                <span>Send Seller PIN to WhatsApp ➔</span>
              </button>
            </div>
          )}

          {/* 3. Step 2: Enter Received Seller PIN */}
          {authTab === 'enter_pin' && (
            <form onSubmit={handleVerifySellerPin} className="space-y-3 text-xs">
              {generatedPinNotice && (
                <div className="p-3 bg-amber-950/80 border border-amber-400/60 rounded-2xl space-y-2 text-center">
                  <span className="text-[10px] text-amber-300 font-bold block">
                    Your Dispatched Seller PIN:
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
                <label className="text-[10px] font-bold text-amber-300 block mb-1">
                  Enter 6-Digit Seller PIN (e.g. {generatedPinNotice || '739102S'}) *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={8}
                  placeholder="123456S"
                  value={activationPin}
                  onChange={(e) => setActivationPin(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-amber-400/60 rounded-xl p-3 text-center text-xl font-mono font-black tracking-widest text-amber-300 focus:outline-none uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={isAuthenticating || activationPin.length < 7}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg active:scale-95 transition cursor-pointer disabled:opacity-40"
              >
                {isAuthenticating ? 'Verifying...' : 'Verify Seller PIN ➔'}
              </button>
            </form>
          )}

          {/* 4. Step 3: Set Custom Permanent PIN */}
          {authTab === 'set_custom_pin' && (
            <form onSubmit={handleSavePermanentPin} className="space-y-3 text-xs">
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold text-center">
                ✓ Seller PIN Verified!
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Shop / Business Name</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Enfield Studio"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Set Permanent 4-Digit Login PIN *
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
                disabled={isAuthenticating || customPin.length < 4}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer active:scale-95 transition disabled:opacity-40"
              >
                {isAuthenticating ? 'Saving PIN...' : 'Save & Unlock Business Hub ➔'}
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={onBack}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-bold rounded-xl transition cursor-pointer"
          >
            ← Return to City Feed
          </button>
        </div>
      </main>
    );
  }

  // =========================================================================
  // 🌟 AUTHORIZED DASHBOARD VIEW
  // =========================================================================
  return (
    <main className="p-3.5 space-y-3.5 animate-fade-in text-slate-100 pb-28 select-none bg-slate-950 min-h-screen font-sans">
      
      {/* 1. Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 p-4 rounded-3xl text-white shadow-xl flex items-center justify-between border border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-xl font-black shadow-md">
            🏪
          </div>
          <div>
            <h1 className="text-sm font-black text-white leading-tight">Business Hub (व्यापार केंद्र)</h1>
            <p className="text-[10px] text-amber-300 font-bold">
              👤 {currentUser?.business_name || currentUser?.full_name || 'Verified Merchant'} (+91 {sellerPhone})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={handleSellerLogout}
            className="text-[10.5px] bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 px-2.5 py-1.5 rounded-xl font-bold active:scale-95 transition cursor-pointer flex items-center space-x-1"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
          <button
            type="button"
            onClick={onBack}
            className="text-xs bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-xl font-bold active:scale-95 transition cursor-pointer"
          >
            ← Back
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-2.5 bg-emerald-950/90 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold text-center animate-fade-in shadow-lg">
          ✓ {actionNotice}
        </div>
      )}

      {/* 2. Interactive Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => { setActiveTab('listings'); setSortByInterest(false); }}
          className={`p-3 rounded-2xl border text-center space-y-0.5 shadow-md transition cursor-pointer active:scale-95 ${
            activeTab === 'listings' && !sortByInterest
              ? 'bg-amber-400/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/30'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Active Ads</span>
          <span className="text-lg font-black text-amber-400">{myListings.length}</span>
          <span className="text-[9px] text-emerald-400 font-bold block">● Live</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('offers'); }}
          className={`p-3 rounded-2xl border text-center space-y-0.5 shadow-md transition cursor-pointer active:scale-95 ${
            activeTab === 'offers'
              ? 'bg-gradient-to-r from-amber-400/20 to-yellow-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/30'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] text-amber-300 font-black uppercase tracking-wider block">Active Deals</span>
          <span className="text-lg font-black text-amber-300">
            {myListings.filter((l) => Boolean(l.deal_badge || l.dealBadge || l.pending_changes?.deal_badge)).length}
          </span>
          <span className="text-[9px] text-amber-400 font-bold block">🎁 Combos</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('inquiries'); setOnlyUnanswered(true); setSelectedListingFilter('all'); }}
          className={`p-3 rounded-2xl border text-center space-y-0.5 shadow-md transition cursor-pointer active:scale-95 relative ${
            activeTab === 'inquiries' && onlyUnanswered
              ? 'bg-rose-500/20 border-rose-400 text-rose-300 ring-2 ring-rose-400/30'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          {pendingInquiriesCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>}
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Inquiries</span>
          <span className="text-lg font-black text-rose-400">💬 {pendingInquiriesCount}</span>
          <span className="text-[9px] text-rose-300 font-bold block">Need Reply</span>
        </button>
      </div>

      {/* 3. Segmented Navigation Tabs */}
      <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow-inner">
        <button
          type="button"
          onClick={() => { setActiveTab('inquiries'); setOnlyUnanswered(false); }}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center space-x-1.5 ${
            activeTab === 'inquiries' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>💬 Customer Queries</span>
          {pendingInquiriesCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center">
              {pendingInquiriesCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('listings'); setSortByInterest(false); }}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center space-x-1.5 ${
            activeTab === 'listings' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>📦 My Catalog ({myListings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('offers'); }}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center space-x-1 ${
            activeTab === 'offers'
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md font-black'
              : 'text-amber-300 hover:text-white'
          }`}
        >
          <span>🎁</span>
          <span>Offers Studio</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INQUIRIES                                                          */}
      {/* ========================================================================= */}
      {activeTab === 'inquiries' && (
        <section className="space-y-3">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-[9.5px]">
            <button
              type="button"
              onClick={() => { setSelectedListingFilter('all'); setOnlyUnanswered(false); }}
              className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                selectedListingFilter === 'all' && !onlyUnanswered ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              All Inquiries
            </button>
            {myListings.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedListingFilter(String(item.id))}
                className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition truncate max-w-[150px] cursor-pointer ${
                  selectedListingFilter === String(item.id) ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 border border-slate-800 text-slate-300'
                }`}
              >
                {item.title || item.name}
              </button>
            ))}
          </div>

          {userInquiries.length === 0 ? (
            <div className="bg-slate-900/60 p-8 rounded-2xl border border-slate-800 text-center text-slate-400 space-y-1">
              <span className="text-3xl block">📭</span>
              <p className="text-xs font-bold text-slate-300">No active customer questions.</p>
            </div>
          ) : (
            userInquiries.map((inq) => (
              <div key={inq.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-3.5 space-y-3 shadow-md">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    <img
                      src={inq.listingImage || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200'}
                      alt={inq.listingTitle}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-black text-slate-100 truncate">{inq.listingTitle}</h3>
                      <span className="text-[10px] font-bold text-amber-400 block">{inq.listingPrice}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md shrink-0">
                    {inq.timestamp}
                  </span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-extrabold text-amber-300">👤 {inq.userName}</span>
                    <span className="text-slate-400 text-[9px]">Buyer Question</span>
                  </div>
                  {inq.audioUrl ? (
                    <VoiceNotePlayer audioUrl={inq.audioUrl} duration={inq.audioDuration} senderName={inq.userName ? inq.userName.split(' ')[0] : 'Resident'} />
                  ) : (
                    <p className="text-xs text-slate-200 font-medium italic">"{inq.text}"</p>
                  )}
                </div>

                {inq.sellerReply ? (
                  <div className="bg-emerald-950/40 border-l-4 border-emerald-500 p-2.5 rounded-r-xl space-y-1">
                    <span className="text-[9px] font-black text-emerald-400 block">👑 Your Reply:</span>
                    {inq.sellerReply.type === 'audio' || inq.sellerReply.audioUrl ? (
                      <VoiceNotePlayer audioUrl={inq.sellerReply.audioUrl} duration={inq.sellerReply.duration} senderName="Your Voice Note" />
                    ) : (
                      <p className="text-xs text-emerald-100 font-semibold">{inq.sellerReply.text}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {QUICK_PRESETS.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            hyperlocalStore.addSellerReply(inq.listingId, inq.id, {
                              type: 'text',
                              text: chip,
                              timestamp: 'Just now',
                              sellerName: currentUser?.full_name || 'You (Owner)',
                            }, inq.listingTitle);
                            setThreadUpdateTick((p) => p + 1);
                          }}
                          className="text-[9.5px] bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-300 px-2.5 py-1 rounded-lg font-bold shrink-0 transition border border-slate-700 cursor-pointer active:scale-95"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <input
                        type="text"
                        value={replyInputs[inq.id] || ''}
                        onChange={(e) => setReplyInputs({ ...replyInputs, [inq.id]: e.target.value })}
                        placeholder="Type reply or tap instant chips above..."
                        className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-slate-100 focus:outline-hidden focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const text = (replyInputs[inq.id] || '').trim();
                          if (!text) return;
                          hyperlocalStore.addSellerReply(inq.listingId, inq.id, {
                            type: 'text',
                            text,
                            timestamp: 'Just now',
                            sellerName: currentUser?.full_name || 'You (Owner)',
                          }, inq.listingTitle);
                          setReplyInputs((p) => ({ ...p, [inq.id]: '' }));
                          setThreadUpdateTick((p) => p + 1);
                        }}
                        className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs rounded-xl active:scale-95 transition cursor-pointer shrink-0 shadow-md"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ACTIVE LISTINGS & DIRECT ADMIN CHAT                                */}
      {/* ========================================================================= */}
      {activeTab === 'listings' && (
        <section className="space-y-3.5">
          <div className="p-3.5 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-transparent border border-amber-400/40 rounded-2xl flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">✨ GROW YOUR BUSINESS</span>
              <h3 className="text-xs font-black text-slate-100 mt-0.5">Want to enlist another item or service?</h3>
            </div>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs rounded-xl shadow-md active:scale-95 transition cursor-pointer"
            >
              + Enlist New ➔
            </button>
          </div>

          <div className="space-y-2.5">
            {myListings.length === 0 ? (
              <div className="bg-slate-900/60 p-8 rounded-2xl border border-slate-800 text-center text-slate-400 space-y-1">
                <span className="text-3xl block">📦</span>
                <p className="text-xs font-bold text-slate-300">No active listings for this phone number.</p>
                <p className="text-[10px]">Tap "+ Enlist New" above to post your first listing.</p>
              </div>
            ) : (
              myListings.map((item) => {
                const changes = item.pending_changes || {};
                const isPending =
                  item.has_pending_approval === true ||
                  item.is_active === false ||
                  Boolean(item.pending_changes);

                const isRecordingAdmin = recordingAdminReplyId === item.id;
                const activeDealBadge = changes.deal_badge || changes.dealBadge || item.deal_badge || item.dealBadge;
                const activeDealDetails = changes.deal_details || changes.dealDetails || item.deal_details || item.dealDetails;
                const activeOrigPrice = changes.original_price || changes.originalPrice || item.original_price || item.originalPrice;

                return (
                  <div
                    key={item.id}
                    className={`bg-slate-900 rounded-2xl border p-3.5 space-y-2.5 shadow-sm transition ${
                      isPending
                        ? 'border-amber-500/50 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 min-w-0 pr-2">
                        <img
                          src={item.image || (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200'}
                          alt={item.title || item.name}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                            <span className="text-[9px] font-black uppercase text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded-md inline-block">
                              {item.category}
                            </span>
                            {isPending && (
                              <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40 animate-pulse">
                                ⏳ PENDING APPROVAL
                              </span>
                            )}
                            {activeDealBadge && (
                              <span className="text-[8.5px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-sm animate-pulse">
                                {activeDealBadge}
                              </span>
                            )}
                          </div>
                          <h3 className="text-xs font-black text-slate-100 truncate mt-0.5">{changes.title || item.title || item.name}</h3>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <p className="text-[11px] font-black text-emerald-400">{changes.price || item.price || 'Rate on Request'}</p>
                            {activeOrigPrice && (
                              <span className="text-slate-500 font-mono text-[10px] line-through">
                                {activeOrigPrice}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-1 shrink-0">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-amber-500/30 text-amber-300 font-black text-[9.5px]">
                          ⭐ {item.interestCount || item.interest_count || 0}
                        </span>
                      </div>
                    </div>

                    {activeDealDetails && (
                      <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[10px] text-amber-200">
                        🎁 <strong>Active Promotion:</strong> {activeDealDetails}
                      </div>
                    )}

                    {/* 👑 Admin Feedback Note with Audio Player */}
                    {item.admin_feedback && (
                      <div className="p-3 rounded-2xl bg-amber-950/70 border border-amber-400/50 text-[10px] text-amber-200 leading-tight space-y-2">
                        <div className="flex items-center space-x-1 font-black text-amber-300">
                          <span>👑</span>
                          <span>Admin Review Note (एडमिन संदेश):</span>
                        </div>

                        {(() => {
                          let parsed = null;
                          if (typeof item.admin_feedback === 'string' && item.admin_feedback.startsWith('{')) {
                            try {
                              parsed = JSON.parse(item.admin_feedback);
                            } catch {}
                          }

                          if (parsed && parsed.audioUrl) {
                            return (
                              <div className="space-y-1">
                                <VoiceNotePlayer audioUrl={parsed.audioUrl} duration={parsed.duration} senderName="Admin Voice Note" />
                                {parsed.text && <p className="text-amber-100 italic">"{parsed.text}"</p>}
                              </div>
                            );
                          }

                          return <p className="text-amber-100">"{item.admin_feedback}"</p>;
                        })()}

                        {/* Direct Audio / Text Reply to Admin */}
                        <div className="pt-2 border-t border-amber-500/30 space-y-1.5">
                          <span className="text-[9px] font-black text-amber-300 block">
                            Direct Reply to Admin (एडमिन को उत्तर दें):
                          </span>

                          {isRecordingAdmin ? (
                            <div className="flex items-center justify-between p-2 bg-rose-950/60 border border-rose-500/50 rounded-xl animate-pulse">
                              <span className="text-[10px] font-bold text-rose-300">
                                🎙️ Recording Voice: 0:{adminRecordingSecs < 10 ? '0' : ''}{adminRecordingSecs}
                              </span>
                              <div className="flex items-center space-x-1.5">
                                <button type="button" onClick={handleCancelVoiceToAdmin} className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[9px] rounded-lg cursor-pointer">Cancel</button>
                                <button type="button" onClick={() => handleStopAndSendVoiceToAdmin(item)} className="px-2.5 py-0.5 bg-emerald-600 text-white font-black text-[9.5px] rounded-lg cursor-pointer">Send Voice ➔</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartVoiceToAdmin(item.id)}
                                title="Record Voice Note to Admin"
                                className="w-8 h-8 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center text-xs font-black shadow-md cursor-pointer shrink-0"
                              >
                                🎙️
                              </button>

                              <input
                                type="text"
                                placeholder="Type reply to Admin..."
                                value={sellerAdminReplies[item.id] || ''}
                                onChange={(e) => setSellerAdminReplies({ ...sellerAdminReplies, [item.id]: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSendTextReplyToAdmin(item);
                                }}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-[10px] text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                              />

                              <button
                                type="button"
                                onClick={() => handleSendTextReplyToAdmin(item)}
                                disabled={isSendingAdminReply}
                                className="px-2.5 py-1.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-xl cursor-pointer active:scale-95 transition shrink-0 shadow-md"
                              >
                                Send
                              </button>
                            </div>
                          )}

                          {item.seller_feedback_reply && (
                            <div className="text-[8.5px] text-cyan-300 pt-0.5">
                              ✓ Your reply has been sent to Admin.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {isPending && !item.admin_feedback && (
                      <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[9.5px] text-amber-200">
                        ⚠️ <strong>एडमिन समीक्षाधीन:</strong> यह लिस्टिंग एडमिन द्वारा स्वीकृत होने के बाद ही शहरवासियों को लाइव दिखाई देगी।
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] flex-wrap gap-y-1.5">
                      <span className="text-slate-500 font-semibold truncate max-w-[140px]">📍 {item.location || selectedCity}</span>
                      
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-bold text-[9.5px] transition cursor-pointer active:scale-95 flex items-center space-x-1"
                          title="Edit Listing Details"
                        >
                          <span>✏️</span>
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenOfferStudio(item)}
                          className="px-2.5 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 text-slate-950 rounded-lg font-black text-[9.5px] transition cursor-pointer active:scale-95 flex items-center space-x-1 shadow-sm"
                        >
                          <span>🎁</span>
                          <span>{activeDealBadge ? 'Edit Offer' : '+ Attach Offer'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteMerchantListing(item.id, item.title || item.name)}
                          className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg font-bold text-[9.5px] transition cursor-pointer active:scale-95"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: OFFERS & COMBOS STUDIO EXPLORER                                    */}
      {/* ========================================================================= */}
      {activeTab === 'offers' && (
        <section className="space-y-3.5">
          <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 border border-amber-400/40 p-3.5 rounded-3xl space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🎁</span>
              <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                High-Conversion Promotional Offer Studio
              </h3>
            </div>
            <p className="text-[10.5px] text-slate-300 leading-relaxed">
              Attach promotional deals (Combos, Kits, Flat Discounts, Advance Locks) to multiply your store inquiries across {selectedCity}!
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Select an item to configure or attach an offer:
            </h4>

            {myListings.length === 0 ? (
              <div className="bg-slate-900/60 p-8 rounded-2xl border border-slate-800 text-center text-slate-400">
                <p className="text-xs font-bold text-slate-300">No active catalog items.</p>
                <p className="text-[10px]">Post your first listing in the "My Catalog" tab.</p>
              </div>
            ) : (
              myListings.map((item) => {
                const changes = item.pending_changes || {};
                const activeDealBadge = changes.deal_badge || changes.dealBadge || item.deal_badge || item.dealBadge;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenOfferStudio(item)}
                    className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-400/50 rounded-2xl flex items-center justify-between cursor-pointer transition"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 uppercase">
                          {item.category}
                        </span>
                        {activeDealBadge && (
                          <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
                            {activeDealBadge}
                          </span>
                        )}
                      </div>
                      <h5 className="text-xs font-black text-slate-100 mt-1 truncate">
                        {changes.title || item.title || item.name}
                      </h5>
                      <span className="text-emerald-400 font-bold text-[10px]">{changes.price || item.price}</span>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-xl shadow shrink-0"
                    >
                      {activeDealBadge ? 'Configure ➔' : '+ Setup Deal'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 🎁 CONTEXT-AWARE OFFER & COMBO STUDIO MODAL                               */}
      {/* ========================================================================= */}
      {selectedListingForOffer && (() => {
        const { sectorTemplates, universalTemplates } = getTemplatesForCategory(selectedListingForOffer.category);
        const currentCatName = String(selectedListingForOffer.category || 'This Shop').toUpperCase();

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in select-none">
            <div className="bg-slate-900 border border-amber-500/40 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
              
              <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="min-w-0 pr-2">
                  <span className="text-[8.5px] font-black text-amber-400 uppercase tracking-wider block">
                    🎁 PROMOTIONAL COMBOS & OFFERS • {currentCatName}
                  </span>
                  <h3 className="text-xs font-black text-slate-100 truncate mt-0.5">
                    {selectedListingForOffer.title || selectedListingForOffer.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedListingForOffer(null)}
                  className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center text-xs font-black cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveOffer} className="p-4 overflow-y-auto space-y-3.5 flex-1 text-xs">
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[9.5px] font-bold text-slate-400 block">
                      1. Select Relevant Offer Type (ऑफर प्रकार):
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomOfferMode(!isCustomOfferMode);
                        if (!isCustomOfferMode) {
                          setOfferForm((p) => ({ ...p, deal_badge: `${customEmoji} Custom Deal` }));
                        }
                      }}
                      className="text-[9.5px] font-bold text-amber-400 underline cursor-pointer"
                    >
                      {isCustomOfferMode ? '← Pick Trade Presets' : '✨ Build Custom Tag'}
                    </button>
                  </div>

                  {!isCustomOfferMode && (
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10.5px] font-bold">
                      <button
                        type="button"
                        onClick={() => setSelectedOfferCategory('sector')}
                        className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
                          selectedOfferCategory === 'sector'
                            ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🎯 {currentCatName} Deals ({sectorTemplates.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedOfferCategory('universal')}
                        className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
                          selectedOfferCategory === 'universal'
                            ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🛡️ Flat Deals ({universalTemplates.length})
                      </button>
                    </div>
                  )}
                </div>

                {!isCustomOfferMode ? (
                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-bold text-slate-400 block">
                      2. Tap a Preset to Auto-Fill (टैप करके चुनें):
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-0.5 scrollbar-none">
                      {(selectedOfferCategory === 'sector' ? sectorTemplates : universalTemplates).map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => handleApplyOfferTemplate(tpl)}
                          className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                            offerForm.deal_badge === tpl.badge
                              ? 'bg-amber-400/20 border-amber-400 text-amber-200 shadow-xs'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span className="text-[10px] font-black block truncate text-slate-200">
                            {tpl.badge}
                          </span>
                          <span className="text-[8.5px] text-slate-400 block truncate">
                            {tpl.hindiTitle}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 p-2.5 bg-slate-950 rounded-2xl border border-slate-800">
                    <label className="text-[9.5px] font-bold text-slate-400 block">
                      Pick Emoji for Custom Badge:
                    </label>
                    <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {EMOJI_PRESETS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setCustomEmoji(emoji);
                            setOfferForm((p) => ({
                              ...p,
                              deal_badge: `${emoji} ${p.deal_badge.replace(/^[^\s]+\s*/, '') || 'Special Deal'}`,
                            }));
                          }}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition cursor-pointer ${
                            customEmoji === emoji
                              ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400'
                              : 'bg-slate-900 border border-slate-800 text-slate-200'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-slate-300 block">
                    Promotional Tag / Badge Name (बैज का नाम) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5-in-1 Phone Kit or Flat ₹500 OFF"
                    value={offerForm.deal_badge}
                    onChange={(e) => setOfferForm({ ...offerForm, deal_badge: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-black text-xs focus:border-amber-400 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9.5px] font-bold text-slate-400 block mb-1">
                      Special Offer Rate (ऑफर मूल्य) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ₹4,999"
                      value={offerForm.price}
                      onChange={(e) => setOfferForm({ ...offerForm, price: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-black text-xs focus:border-amber-400 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[9.5px] font-bold text-slate-400 block mb-1">
                      Original Price (काटकर दिखाने के लिए)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ₹7,500"
                      value={offerForm.original_price}
                      onChange={(e) => setOfferForm({ ...offerForm, original_price: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-400 font-mono text-xs focus:border-amber-400 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-slate-300 block">
                    Combo Inclusions & Freebies (कॉम्बो में क्या-क्या मिलेगा?)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe exact inclusions and free items..."
                    value={offerForm.deal_details}
                    onChange={(e) => setOfferForm({ ...offerForm, deal_details: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 text-xs placeholder-slate-500 focus:border-amber-400 focus:outline-hidden leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9.5px] font-bold text-slate-400 block mb-1">
                      Advance Token Lock
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ₹500"
                      value={offerForm.token_amount}
                      onChange={(e) => setOfferForm({ ...offerForm, token_amount: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-amber-200 text-xs focus:border-amber-400 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-slate-950 rounded-xl border border-slate-800 mt-3">
                    <div>
                      <span className="text-[10px] font-bold block text-slate-200">Ghar Par Trial</span>
                      <span className="text-[8.5px] text-slate-400 block">घर पर ट्रायल</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={offerForm.doorstep_trial}
                      onChange={(e) => setOfferForm({ ...offerForm, doorstep_trial: e.target.checked })}
                      className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                  <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block">
                    👁️ Customer Feed Card Preview:
                  </span>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-xs">
                      {offerForm.deal_badge || '🔥 Special Offer'}
                    </span>
                    <span className="text-emerald-400 font-black text-xs">
                      {offerForm.price || '₹0'}
                    </span>
                    {offerForm.original_price && (
                      <span className="text-slate-500 font-mono text-[10px] line-through">
                        {offerForm.original_price}
                      </span>
                    )}
                    {offerForm.doorstep_trial && (
                      <span className="text-[9px] font-bold bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/30">
                        🚚 Ghar Par Trial
                      </span>
                    )}
                  </div>
                  {offerForm.deal_details && (
                    <p className="text-[10px] text-amber-200/90 italic pt-1">
                      "{offerForm.deal_details}"
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center space-x-2">
                  <button
                    type="submit"
                    disabled={isSavingOffer || !offerForm.deal_badge.trim() || !offerForm.price.trim()}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition disabled:opacity-40"
                  >
                    {isSavingOffer ? 'Submitting to Admin... ⏳' : '✓ Submit Offer for Admin Approval'}
                  </button>

                  {(selectedListingForOffer.deal_badge || selectedListingForOffer.dealBadge) && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOffer(selectedListingForOffer)}
                      className="px-3 py-3 bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer"
                      title="Remove Offer"
                    >
                      Remove
                    </button>
                  )}
                </div>

              </form>

            </div>
          </div>
        );
      })()}

      {/* 📝 Unified Guided Post / Edit Listing Wizard Modal */}
      {isPostModalOpen && (
        <PostListingModal
          isOpen={isPostModalOpen}
          initialData={editingListing}
          onClose={() => {
            setIsPostModalOpen(false);
            setEditingListing(null);
          }}
          selectedCity={selectedCity}
        />
      )}
    </main>
  );
}