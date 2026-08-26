import React, { useState, useRef, useMemo, useEffect } from 'react';
import { TAXONOMY_REGISTRY, getCategoryById, sanitizeSubCategoryId } from '../data/taxonomyRegistry';
import { getTemplatesForCategory } from '../data/offerTemplatesRegistry';
import {
  uploadListingImagesToStorage,
  uploadListingVideosToStorage,
  getCategoryFallback,
  createListingInDB,
} from '../services/listingService';
import { processVideoOptimistic } from '../utils/videoCompressor';
import { getCurrentUserProfile } from '../services/authService';
import AuthModal from './common/AuthModal';

const EMOJI_PRESETS = ['🍱', '🔥', '👑', '🎁', '⚡', '🪔', '🔄', '📱', '📺', '🛏️', '🌾', '🌶️', '🍳', '🎒', '💄', '🛵', '🎨', '🩺', '📚', '🚚', '🛡️', '⏳'];

export default function ContextualListingModal({
  currentScreen,
  selectedCategory = 'property',
  selectedSubCategory = 'all',
  selectedCity = 'Alwar',
  onClose,
}) {
  // 🛡️ User Authentication & Verification State
  const [currentUser, setCurrentUser] = useState(() => getCurrentUserProfile());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // 🌟 1. Cascading Category & Subsection State
  const [category, setCategory] = useState(() => {
    if (selectedCategory && selectedCategory !== 'home' && selectedCategory !== 'surprise') {
      return selectedCategory;
    }
    return 'property';
  });

  const categoryConfig = useMemo(() => {
    return getCategoryById(category) || TAXONOMY_REGISTRY[0] || {};
  }, [category]);

  const availableSubCategories = useMemo(() => {
    return Array.isArray(categoryConfig.subCategories) ? categoryConfig.subCategories : [];
  }, [categoryConfig]);

  const [subCategory, setSubCategory] = useState(() => {
    if (selectedSubCategory && selectedSubCategory !== 'all') {
      return selectedSubCategory;
    }
    return availableSubCategories[0]?.id || 'all';
  });

  // 🎁 2. Context-Aware Offer & Combo Studio State
  const { sectorTemplates, universalTemplates } = useMemo(() => {
    return getTemplatesForCategory(category);
  }, [category]);

  const [attachOffer, setAttachOffer] = useState(false);
  const [selectedOfferTab, setSelectedOfferTab] = useState('sector'); // 'sector' | 'universal'
  const [isCustomOfferMode, setIsCustomOfferMode] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('🍱');

  const [offerFields, setOfferFields] = useState({
    deal_type: category,
    deal_badge: '',
    deal_details: '',
    original_price: '',
    token_amount: '',
    doorstep_trial: false,
  });

  // Category switch handler: resets subcategory and context-aware offer type
  const handleCategoryChange = (newCatId) => {
    setCategory(newCatId);
    setOfferFields((prev) => ({ ...prev, deal_type: newCatId }));
    const newConfig = getCategoryById(newCatId);
    if (newConfig?.subCategories?.length > 0) {
      setSubCategory(newConfig.subCategories[0].id);
    } else {
      setSubCategory('all');
    }
  };

  // 1-Tap Offer Template Applier
  const handleApplyOfferTemplate = (tpl) => {
    setIsCustomOfferMode(false);
    setAttachOffer(true);
    setOfferFields((prev) => ({
      ...prev,
      deal_type: tpl.category || category,
      deal_badge: tpl.badge,
      deal_details: tpl.details,
      original_price: tpl.defaultOriginalPrice || prev.original_price,
      token_amount: tpl.tokenAmount || '',
      doorstep_trial: Boolean(tpl.doorstepTrial),
    }));
    if (tpl.defaultPrice) {
      setPrice(tpl.defaultPrice);
    }
  };

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [stockCount, setStockCount] = useState('');
  const [sellerName, setSellerName] = useState(() => currentUser?.full_name || '');
  const [phone, setPhone] = useState(() => currentUser?.phone || '');
  const [description, setDescription] = useState('');

  // 🛡️ Honeypot Anti-Bot Trap State
  const [honeypotField, setHoneypotField] = useState('');

  // 🖼️ 3. Multi-Photo State (Up to 10 photos) with Cover Image Selector
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]); // Raw File[]
  const [previewUrls, setPreviewUrls] = useState([]);     // Local blob URL[]
  const [coverIndex, setCoverIndex] = useState(0);         // Index of chosen cover photo

  // 🎬 4. Video Upload State (Up to 2 videos, max 60 sec each)
  const videoInputRef = useRef(null);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);

  // 📍 Location & Submission State
  const [locationAddress, setLocationAddress] = useState(() => currentUser?.area_name || '');
  const [gpsData, setGpsData] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionDone, setSubmissionDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync profile details if user logs in mid-flow
  useEffect(() => {
    if (currentUser) {
      if (!sellerName) setSellerName(currentUser.full_name || '');
      if (!phone) setPhone(currentUser.phone || '');
      if (!locationAddress) setLocationAddress(currentUser.area_name || '');
    }
  }, [currentUser]);

  // 📸 Multi-Photo Selection Handler (Max 10)
  const handleMultipleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = 10 - selectedFiles.length;
    if (remaining <= 0) {
      setErrorMsg('You can upload a maximum of 10 photos.');
      return;
    }

    setErrorMsg('');
    const newFiles = files.slice(0, remaining);
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (indexToRemove) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setPreviewUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));

    if (coverIndex === indexToRemove) {
      setCoverIndex(0);
    } else if (coverIndex > indexToRemove) {
      setCoverIndex((prev) => prev - 1);
    }
  };

  // 🎬 Video Pipeline (<100ms Poster Generation)
  const handleVideoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (selectedVideos.length + files.length > 2) {
      setErrorMsg('Maximum 2 product / service videos allowed per listing.');
      return;
    }

    setErrorMsg('');
    setIsProcessingVideo(true);

    try {
      for (const file of files) {
        const processed = await processVideoOptimistic(file);

        if (processed.durationSec > 60.5) {
          setErrorMsg(`"${file.name}" is ${processed.durationSec}s long. Videos must be 60 seconds or less.`);
          continue;
        }

        setSelectedVideos((prev) => [...prev, processed].slice(0, 2));
      }
    } catch {
      setErrorMsg('Could not process video file. Please ensure it is a valid MP4, WebM, or MOV format.');
    } finally {
      setIsProcessingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleRemoveVideo = (indexToRemove) => {
    setSelectedVideos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsData({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
        });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setLocationError('Could not fetch GPS. Please type address manually.');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // 🚀 Submit Form (Enforces is_active: false for Admin Verification)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🛡️ Silent Bot Trap
    if (honeypotField) {
      onClose();
      return;
    }

    if (!title.trim() || !sellerName.trim() || !locationAddress.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    // 🛡️ Verified Phone Gate
    if (!currentUser && phone.length !== 10) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const cleanSub = sanitizeSubCategoryId(category, subCategory);
    const fallbackImg = getCategoryFallback(category);

    try {
      // 1. Order photos so the selected cover photo is uploaded at index 0
      const orderedPhotos = [...selectedFiles];
      if (orderedPhotos.length > 0 && coverIndex < orderedPhotos.length) {
        const [chosenCoverFile] = orderedPhotos.splice(coverIndex, 1);
        orderedPhotos.unshift(chosenCoverFile);
      }

      // 2. Upload Photos & Videos to Supabase Storage in parallel
      const [uploadedPhotoUrls, uploadedVideoObjects] = await Promise.all([
        orderedPhotos.length > 0
          ? uploadListingImagesToStorage(orderedPhotos)
          : Promise.resolve([]),
        selectedVideos.length > 0
          ? uploadListingVideosToStorage(selectedVideos.map((v) => v.file || v))
          : Promise.resolve([]),
      ]);

      const finalImages = uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : [fallbackImg];
      const rawStockDigits = String(stockCount || '').replace(/\D/g, '');

      const newListingDraft = {
        title: title.trim(),
        name: title.trim(),
        category,
        subCategory: cleanSub,
        sub_category: cleanSub,
        price: price.trim() || 'Contact for Price',
        original_price: attachOffer && offerFields.original_price ? offerFields.original_price.trim() : null,
        deal_type: attachOffer ? (offerFields.deal_type || category) : null,
        deal_badge: attachOffer ? (offerFields.deal_badge.trim() || null) : null,
        deal_details: attachOffer ? (offerFields.deal_details.trim() || null) : null,
        token_amount: attachOffer ? (offerFields.token_amount.trim() || null) : null,
        doorstep_trial: attachOffer ? Boolean(offerFields.doorstep_trial) : false,
        rates: price.trim() || 'Contact for Price',
        sellerName: sellerName.trim(),
        phone: phone.trim() || '9876543201',
        whatsapp: phone.trim() || '9876543201',
        location: locationAddress.trim(),
        location_name: locationAddress.trim(),
        city: selectedCity,
        lat: gpsData ? gpsData.lat : null,
        lng: gpsData ? gpsData.lng : null,
        capacity: rawStockDigits ? `${rawStockDigits} Units Available` : 'Ready Stock',
        stockCount: rawStockDigits ? `${rawStockDigits} Units Available` : 'Ready Stock',
        image: finalImages[0],
        images: finalImages,
        image_urls: finalImages,
        videos: uploadedVideoObjects,
        video_urls: uploadedVideoObjects.map((v) => (typeof v === 'string' ? v : v.url)),
        description: description.trim(),
        is_active: false, // 🔒 ALWAYS FALSE UNTIL MASTER ADMIN APPROVES
        has_pending_approval: true,
      };

      // 3. Insert into Supabase listings table with is_active: false & dispatch Admin notification
      await createListingInDB(newListingDraft);

      setSubmissionDone(true);
      setTimeout(() => {
        onClose();
      }, 2400);
    } catch (err) {
      console.error('Submission failed:', err);
      setErrorMsg(err.message || 'Error uploading files to storage. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submissionDone) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none">
        <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl w-full max-w-sm p-6 text-center space-y-3 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-emerald-950 text-emerald-400 text-3xl flex items-center justify-center mx-auto border border-emerald-500/40">
            ✓
          </div>
          <h3 className="text-sm font-black text-slate-100">
            Listing Sent for Admin Approval!
          </h3>
          <p className="text-xs text-amber-300 font-bold">
            आपकी लिस्टिंग व ऑफर एडमिन समीक्षा के लिए भेज दी गई है।
          </p>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Your listing will appear live across {selectedCity} as soon as TownHub Admin verifies the details[cite: 2].
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fade-in p-0 sm:p-4 select-none">
        <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto p-4 space-y-4 shadow-2xl text-slate-100 pb-8">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-white flex items-center space-x-1.5">
                <span>{categoryConfig.icon || '📝'}</span>
                <span>Post in {categoryConfig.name?.split('(')[0] || category}</span>
              </h3>
              <p className="text-[10px] text-slate-400">
                Submitting to <strong className="text-amber-400">{selectedCity}</strong> (Admin Approval Required)[cite: 2]
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:scale-90 rounded-full text-slate-300 font-bold text-xs flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-2.5 bg-rose-500/20 border border-rose-400/40 rounded-xl text-rose-300 text-xs font-bold text-center">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            
            {/* 🛡️ Invisible Honeypot Input for Bot Detection */}
            <input
              type="text"
              name="company_tax_check"
              value={honeypotField}
              onChange={(e) => setHoneypotField(e.target.value)}
              tabIndex="-1"
              autoComplete="off"
              style={{ display: 'none', position: 'absolute', opacity: 0 }}
            />

            {/* 🌟 1. SELECT MAIN CATEGORY */}
            <div>
              <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                1. Select Main Category (मुख्य श्रेणी) *
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 pr-8 text-white font-bold focus:outline-hidden focus:border-amber-400 appearance-none cursor-pointer"
                >
                  {TAXONOMY_REGISTRY.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-slate-900 text-white font-bold">
                      {cat.icon || '📌'} {cat.name} {cat.hindiName ? `(${cat.hindiName})` : ''}
                    </option>
                  ))}
                </select>
                <span className="absolute right-3 top-3 text-xs text-amber-400 pointer-events-none">
                  ▼
                </span>
              </div>
            </div>

            {/* 🌟 2. SELECT CATEGORY SUBSECTION */}
            <div>
              <label className="block text-[10px] font-bold text-amber-300 uppercase tracking-wider mb-1">
                2. Select Subsection / Trade (उप-श्रेणी) *
              </label>
              <div className="relative">
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 pr-8 text-white font-bold focus:outline-hidden focus:border-amber-400 appearance-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-white font-bold">🌟 All / General</option>
                  {availableSubCategories.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white font-bold">
                      {s.icon || '🔸'} {s.name} {s.hindiName ? `(${s.hindiName})` : ''}
                    </option>
                  ))}
                </select>
                <span className="absolute right-3 top-3 text-xs text-slate-400 pointer-events-none">
                  ▼
                </span>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                Listing Title / Business Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Designer Wedding Sherwani Set or 5-Star Refrigerator"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-hidden focus:border-amber-400 font-semibold"
              />
            </div>

            {/* Price & Stock */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Price / Rent / Rates *
                </label>
                <input
                  type="text"
                  required
                  placeholder="₹ 4,999"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-emerald-400 font-bold focus:outline-hidden focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Ready Stock Units
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5 Units"
                  value={stockCount}
                  onChange={(e) => setStockCount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-cyan-300 focus:outline-hidden focus:border-amber-400"
                />
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 🎁 3. CONTEXT-AWARE OFFER & COMBO BUILDER STUDIO                          */}
            {/* ========================================================================= */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-amber-500/40 space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center space-x-1">
                  <span>🎁 Attach Promotional Offer / Combo</span>
                </span>
                <button
                  type="button"
                  onClick={() => setAttachOffer(!attachOffer)}
                  className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black transition cursor-pointer ${
                    attachOffer
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {attachOffer ? '✓ Offer Active' : '+ Add Deal'}
                </button>
              </div>

              {attachOffer && (
                <div className="space-y-2.5 pt-1">
                  
                  {/* Category Sector Tabs */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-bold text-slate-400 block">
                        Select Preset Category:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomOfferMode(!isCustomOfferMode);
                          if (!isCustomOfferMode) {
                            setOfferFields((p) => ({ ...p, deal_badge: `${customEmoji} Custom Deal` }));
                          }
                        }}
                        className="text-[9px] font-bold text-amber-400 underline cursor-pointer"
                      >
                        {isCustomOfferMode ? '← Pick Presets' : '✨ Custom Badge'}
                      </button>
                    </div>

                    {!isCustomOfferMode && (
                      <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setSelectedOfferTab('sector')}
                          className={`flex-1 py-1 rounded-lg transition cursor-pointer text-center ${
                            selectedOfferTab === 'sector' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400'
                          }`}
                        >
                          🎯 {String(category).toUpperCase()} ({sectorTemplates.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedOfferTab('universal')}
                          className={`flex-1 py-1 rounded-lg transition cursor-pointer text-center ${
                            selectedOfferTab === 'universal' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400'
                          }`}
                        >
                          🛡️ Har Dukaan Tags ({universalTemplates.length})
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Ready Presets Picker or Custom Emoji Grid */}
                  {!isCustomOfferMode ? (
                    <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-0.5 scrollbar-none">
                      {(selectedOfferTab === 'sector' ? sectorTemplates : universalTemplates).map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => handleApplyOfferTemplate(tpl)}
                          className={`p-1.5 rounded-xl text-left border transition cursor-pointer ${
                            offerFields.deal_badge === tpl.badge
                              ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span className="text-[9.5px] font-black block truncate text-slate-200">{tpl.badge}</span>
                          <span className="text-[8px] text-slate-400 block truncate">{tpl.hindiTitle}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1.5 p-2 bg-slate-900 rounded-xl border border-slate-800">
                      <label className="text-[8.5px] font-bold text-slate-400 block">Pick Badge Emoji:</label>
                      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {EMOJI_PRESETS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setCustomEmoji(emoji);
                              setOfferFields((p) => ({
                                ...p,
                                deal_badge: `${emoji} ${p.deal_badge.replace(/^[^\s]+\s*/, '') || 'Special Deal'}`,
                              }));
                            }}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition cursor-pointer ${
                              customEmoji === emoji ? 'bg-amber-400 text-slate-950' : 'bg-slate-950 text-slate-200'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Offer Badge Name */}
                  <div>
                    <label className="text-[9px] font-bold text-slate-300 block mb-0.5">Offer Badge Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. 🍱 6-in-1 Groom Kit @ ₹4,999 or 🔥 Flat ₹500 OFF"
                      value={offerFields.deal_badge}
                      onChange={(e) => setOfferFields({ ...offerFields, deal_badge: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-amber-300 font-black text-xs"
                    />
                  </div>

                  {/* Strike Price & Inclusions */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8.5px] font-bold text-slate-400 block mb-0.5">Original Strikethrough Price</label>
                      <input
                        type="text"
                        placeholder="e.g. ₹ 7,500"
                        value={offerFields.original_price}
                        onChange={(e) => setOfferFields({ ...offerFields, original_price: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-slate-400 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[8.5px] font-bold text-slate-400 block mb-0.5">Sawa Token Lock</label>
                      <input
                        type="text"
                        placeholder="e.g. ₹ 500"
                        value={offerFields.token_amount}
                        onChange={(e) => setOfferFields({ ...offerFields, token_amount: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-amber-200 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-300 block mb-0.5">Offer Inclusions & Free Items</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Includes: Safa, Mojari, Mala, Alteration & Dry Cleaning."
                      value={offerFields.deal_details}
                      onChange={(e) => setOfferFields({ ...offerFields, deal_details: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100 text-[10px]"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[9.5px] font-bold text-slate-300">Ghar Par Trial Available (घर पर ट्रायल)</span>
                    <input
                      type="checkbox"
                      checked={offerFields.doorstep_trial}
                      onChange={(e) => setOfferFields({ ...offerFields, doorstep_trial: e.target.checked })}
                      className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 📸 4. MULTI-PHOTO UPLOAD (UP TO 10 PHOTOS) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  Photos ({previewUrls.length}/10)
                </label>
                <span className="text-[9px] text-amber-400 font-bold">
                  Tap photo to set as Cover 🌟
                </span>
              </div>

              {previewUrls.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {previewUrls.map((imgSrc, idx) => {
                    const isCover = idx === coverIndex;
                    return (
                      <div
                        key={idx}
                        onClick={() => setCoverIndex(idx)}
                        className={`relative h-20 rounded-xl overflow-hidden border cursor-pointer transition shadow-inner bg-slate-950 group ${
                          isCover
                            ? 'border-amber-400 ring-2 ring-amber-400/50 scale-[1.02]'
                            : 'border-slate-700 hover:border-slate-500 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img src={imgSrc} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />

                        {isCover ? (
                          <span className="absolute bottom-1 left-1 bg-amber-400 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-md">
                            ★ Cover
                          </span>
                        ) : (
                          <span className="absolute bottom-1 left-1 bg-slate-900/80 text-slate-300 text-[7px] font-bold px-1 py-0.2 rounded group-hover:bg-amber-400 group-hover:text-slate-950 transition">
                            Set Cover
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(idx);
                          }}
                          className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black cursor-pointer shadow-md"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {previewUrls.length < 10 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="h-16 border-2 border-dashed border-slate-700 hover:border-amber-400/80 rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-slate-950/60 transition group p-2 text-center"
                >
                  <span className="text-lg group-hover:scale-110 transition">📸</span>
                  <span className="text-[10px] font-black text-slate-300 mt-0.5">
                    + Add Photos (Upload up to 10)
                  </span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleMultipleFiles}
              />
            </div>

            {/* 🎬 5. SHORT VIDEO UPLOAD */}
            <div className="space-y-2 p-3 bg-slate-950/70 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-cyan-300 uppercase tracking-wider">
                  Product Videos ({selectedVideos.length}/2)
                </label>
                <span className="text-[9px] text-slate-400 font-bold">Max 60s ⚡</span>
              </div>

              {selectedVideos.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedVideos.map((vid, idx) => (
                    <div key={idx} className="relative h-20 rounded-xl overflow-hidden border border-cyan-500/40 bg-black group shadow-md">
                      <img src={vid.posterUrl} alt="video preview" className="w-full h-full object-cover opacity-90" />
                      <button
                        type="button"
                        onClick={() => handleRemoveVideo(idx)}
                        className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black cursor-pointer shadow-md"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {selectedVideos.length < 2 && (
                <div
                  onClick={() => !isProcessingVideo && videoInputRef.current?.click()}
                  className="h-14 border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-cyan-950/20 transition group p-1 text-center"
                >
                  <span className="text-sm">🎬</span>
                  <span className="text-[9.5px] font-black text-cyan-300">
                    {isProcessingVideo ? 'Processing Video...' : '+ Upload Video Reel'}
                  </span>
                </div>
              )}

              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                multiple
                className="hidden"
                onChange={handleVideoUpload}
              />
            </div>

            {/* Contact Person & Phone */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Contact Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="9876543201"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-hidden focus:border-amber-400 font-mono"
                />
              </div>
            </div>

            {/* 📍 Address & 1-Tap GPS */}
            <div className="space-y-2 p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Shop Address / Area *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Company Bagh Road, Alwar"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                {!gpsData ? (
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    disabled={isLocating}
                    className="w-full py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-[10px] font-black flex items-center justify-center space-x-1 transition cursor-pointer"
                  >
                    <span>{isLocating ? '⏳' : '🎯'}</span>
                    <span>{isLocating ? 'Locating...' : '1-Tap Set Exact Shop GPS'}</span>
                  </button>
                ) : (
                  <div className="w-full flex items-center justify-between bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      ✓ GPS Coordinates Attached ({gpsData.lat}, {gpsData.lng})
                    </span>
                    <button
                      type="button"
                      onClick={() => setGpsData(null)}
                      className="text-slate-400 hover:text-rose-400 text-xs font-black cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {locationError && (
                <p className="text-[10px] text-rose-400 font-medium">{locationError}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                Detailed Description & Highlights
              </label>
              <textarea
                rows="3"
                placeholder="List specifications, terms, features..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-hidden focus:border-amber-400 resize-none font-medium"
              ></textarea>
            </div>

            {/* Live Customer Feed Preview Card */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
              <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block">
                👁️ Live Customer Feed Preview:
              </span>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                {attachOffer && offerFields.deal_badge && (
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-xs">
                    {offerFields.deal_badge}
                  </span>
                )}
                <span className="text-emerald-400 font-black text-xs">
                  {price || 'Contact for Price'}
                </span>
                {attachOffer && offerFields.original_price && (
                  <span className="text-slate-500 font-mono text-[10px] line-through">
                    {offerFields.original_price}
                  </span>
                )}
              </div>
              {attachOffer && offerFields.deal_details && (
                <p className="text-[10px] text-amber-200/90 italic pt-1">
                  "{offerFields.deal_details}"
                </p>
              )}
            </div>

            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-[9.5px] text-amber-200">
              🛡️ <strong>Admin Approval Notice:</strong> All listings and deals posted from the feed are sent to Master Admin verification before going live across {selectedCity}[cite: 2].
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isProcessingVideo}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-xs rounded-2xl shadow-lg active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Uploading Media & Submitting... ⏳' : '✓ Submit Listing & Offer for Approval'}
            </button>
          </form>
        </div>
      </div>

      {/* 🛡️ Resident Verification Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        selectedCity={selectedCity}
        actionTitle="Verify Phone to Submit Listing"
        onSuccess={(profile) => {
          setCurrentUser(profile);
          setSellerName(profile.full_name || sellerName);
          setPhone(profile.phone || phone);
          setIsAuthModalOpen(false);
        }}
      />
    </>
  );
}