import React, { useState, useEffect, useRef } from 'react';
import { TAXONOMY_REGISTRY, TAXONOMY_TREE, getCategoryById, sanitizeSubCategoryId } from '../../data/taxonomyRegistry';
import {
  uploadListingImagesToStorage,
  uploadListingVideosToStorage,
  createListingInDB,
  saveNotificationToDB,
} from '../../services/listingService';
import { hyperlocalStore } from '../../store/hyperlocalStore';
import { getCurrentUserProfile } from '../../services/authService';
import { TOWN_CENTERS } from '../../utils/geoFence';
import { supabase } from '../../services/supabaseClient';

const HOURS_LIST = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

// Service & Hire categories that switch to service-specific fields
const SERVICE_CATEGORIES = new Set([
  'kaarigar',
  'transporters',
  'transport',
  'white-collar',
  'education',
  'medical',
  'fitness',
  'creators',
  'advertising',
]);

export default function PostListingModal({
  isOpen = true,
  defaultCategory,
  initialCategory = 'market',
  initialSubCategory = 'all',
  selectedCity = 'Alwar',
  onClose,
  onSuccess,
  onListingCreated,
}) {
  if (isOpen === false) return null;

  const currentUser = getCurrentUserProfile();
  const cleanUserPhone = String(currentUser?.phone || '').replace(/\D/g, '').slice(-10);
  const defaultSellerName = currentUser?.business_name || currentUser?.full_name || 'Verified Merchant';

  // 3-Step Guided Wizard: 1 (Basics) -> 2 (Pricing & Operations) -> 3 (Media & Geolocation)
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [category, setCategory] = useState(defaultCategory || initialCategory || 'market');
  const [subCategory, setSubCategory] = useState(initialSubCategory || 'all');
  const [title, setTitle] = useState('');
  const [sellerName, setSellerName] = useState(defaultSellerName);
  const [phone, setPhone] = useState(cleanUserPhone || '');
  const [whatsapp, setWhatsapp] = useState(cleanUserPhone || '');
  const [locationName, setLocationName] = useState(currentUser?.area_name || `${selectedCity} Market`);
  const [targetCity, setTargetCity] = useState(selectedCity || 'Alwar');

  // Pricing & Operational Metrics
  const [priceNumber, setPriceNumber] = useState('');
  const [priceUnit, setPriceUnit] = useState('');
  const [stockCount, setStockCount] = useState('');
  const [capacity, setCapacity] = useState('Ready Stock');
  const [condition, setCondition] = useState('Brand New');
  const [experience, setExperience] = useState('5+ Years Exp');
  const [visitingCharge, setVisitingCharge] = useState('');
  const [descPoints, setDescPoints] = useState(['', '', '', '']);

  // 12-Hour AM/PM Time Picker State
  const [timePicker, setTimePicker] = useState({
    startHour: '09',
    startPeriod: 'AM',
    endHour: '09',
    endPeriod: 'PM',
  });

  // Media & GPS Geolocation State
  const [images, setImages] = useState([]); // Array of { file, preview }
  const [videos, setVideos] = useState([]); // Array of { file, preview, name, duration }
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');

  // Video Upload Simulation State
  const [videoUploadState, setVideoUploadState] = useState({
    isProcessing: false,
    progress: 0,
    fileName: '',
    status: '',
  });

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const isService = SERVICE_CATEGORIES.has(category.toLowerCase());
  const activeCategoryConfig = getCategoryById(category) || (TAXONOMY_REGISTRY && TAXONOMY_REGISTRY[category]) || {};
  const availableSubCategories = activeCategoryConfig?.subCategories || [];

  // Synchronize subcategory options on category change
  useEffect(() => {
    if (availableSubCategories.length > 0 && subCategory === 'all') {
      // Keep 'all' or default to first subcategory if mandatory
    }
  }, [category, availableSubCategories]);

  // 🛰️ 3-Tier Geolocation Strategy
  const handleDetectGPS = () => {
    setIsLocating(true);
    setGpsStatus('Accessing GPS satellite coordinates...');
    setErrorMsg('');

    if (!navigator.geolocation) {
      setGpsStatus(`GPS not supported. Anchored to ${targetCity} Town Center.`);
      applyCityFallback();
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = Number(pos.coords.latitude.toFixed(6));
        const longitude = Number(pos.coords.longitude.toFixed(6));
        setLat(latitude);
        setLng(longitude);
        setGpsStatus(`📍 GPS Locked: ${latitude}, ${longitude}`);
        setIsLocating(false);
      },
      (err) => {
        console.warn('GPS location timeout or denied, using city fallback:', err.message);
        setGpsStatus(`GPS unavailable. Anchored to ${targetCity} Town Center.`);
        applyCityFallback();
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const applyCityFallback = () => {
    const center = (TOWN_CENTERS && TOWN_CENTERS[targetCity]) || (TOWN_CENTERS && TOWN_CENTERS['Alwar']) || { lat: 27.5530, lng: 76.6346 };
    setLat(center.lat);
    setLng(center.lng);
  };

  // 📷 Photo Selection (Up to 10 photos)
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (images.length + files.length > 10) {
      setErrorMsg('Maximum 10 photos allowed per listing.');
      return;
    }

    const newItems = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newItems]);
    e.target.value = '';
  };

  const handleRemovePhoto = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // 🎥 Video Selection & Length Check (Up to 2 videos, max 60s each)
  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (videos.length >= 2) {
      setErrorMsg('Maximum 2 videos allowed per listing.');
      return;
    }

    setVideoUploadState({
      isProcessing: true,
      progress: 5,
      fileName: file.name,
      status: 'Checking video length...',
    });

    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';
    const tempUrl = URL.createObjectURL(file);
    videoEl.src = tempUrl;

    videoEl.onloadedmetadata = () => {
      const duration = Math.round(videoEl.duration);
      if (duration > 60) {
        setErrorMsg(`Video is ${duration}s long. Maximum allowed length is 60 seconds.`);
        setVideoUploadState({ isProcessing: false, progress: 0, fileName: '', status: '' });
        return;
      }

      let currentProgress = 10;
      setVideoUploadState({
        isProcessing: true,
        progress: currentProgress,
        fileName: file.name,
        status: 'Optimizing video for mobile streaming...',
      });

      const progressInterval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 15) + 10;

        if (currentProgress < 90) {
          setVideoUploadState((prev) => ({
            ...prev,
            progress: currentProgress,
            status: currentProgress > 50 ? 'Compressing video stream...' : 'Optimizing frames...',
          }));
        } else {
          clearInterval(progressInterval);
          setVideoUploadState({
            isProcessing: true,
            progress: 100,
            fileName: file.name,
            status: 'Video ready!',
          });

          setTimeout(() => {
            setVideos((prev) => [
              ...prev,
              {
                file,
                preview: tempUrl,
                name: file.name,
                duration,
              },
            ]);
            setVideoUploadState({ isProcessing: false, progress: 0, fileName: '', status: '' });
          }, 300);
        }
      }, 100);
    };

    videoEl.onerror = () => {
      setErrorMsg('Could not read video file. Please try another format.');
      setVideoUploadState({ isProcessing: false, progress: 0, fileName: '', status: '' });
    };

    e.target.value = '';
  };

  const handleRemoveVideo = (index) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  // 🚀 Submit Listing
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim() || !sellerName.trim() || !phone.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    const cleanSellerPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanSellerPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    // Resolve Geolocation coordinates
    let finalLat = lat;
    let finalLng = lng;
    if (!finalLat || !finalLng) {
      const center = (TOWN_CENTERS && TOWN_CENTERS[targetCity]) || (TOWN_CENTERS && TOWN_CENTERS['Alwar']) || { lat: 27.5530, lng: 76.6346 };
      finalLat = center.lat;
      finalLng = center.lng;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload Media
      const rawImageFiles = images.map((img) => img.file).filter(Boolean);
      const uploadedImageUrls = await uploadListingImagesToStorage(rawImageFiles);
      const uploadedVideos = await uploadListingVideosToStorage(videos);

      // 2. Format Descriptions & Pricing
      const validPoints = descPoints.filter((p) => p && p.trim().length > 0);
      const combinedDescription =
        validPoints.length > 0
          ? validPoints.map((p) => `• ${p.trim()}`).join('\n')
          : title.trim();

      const formattedPrice = priceNumber
        ? `₹ ${priceNumber.trim()}${priceUnit ? ' ' + priceUnit.trim() : ''}`
        : visitingCharge
        ? `₹ ${visitingCharge.trim()} / Visit`
        : 'Contact for Price';

      const formattedStock = stockCount
        ? `${stockCount} Units Available`
        : capacity;

      const formattedActiveHours = `${timePicker.startHour}:00 ${timePicker.startPeriod} - ${timePicker.endHour}:00 ${timePicker.endPeriod}`;

      const payload = {
        title: title.trim(),
        name: title.trim(),
        category: category.toLowerCase(),
        sub_category: sanitizeSubCategoryId ? sanitizeSubCategoryId(category, subCategory) : subCategory,
        subCategory: sanitizeSubCategoryId ? sanitizeSubCategoryId(category, subCategory) : subCategory,
        price: formattedPrice,
        rates: formattedPrice,
        startingPackage: formattedPrice,
        description: combinedDescription,
        location: locationName.trim(),
        location_name: locationName.trim(),
        city: targetCity,
        lat: finalLat,
        lng: finalLng,
        timing: formattedActiveHours,
        activeHours: formattedActiveHours,
        capacity: isService ? formattedActiveHours : formattedStock,
        stock_count: stockCount ? parseInt(stockCount, 10) : null,
        condition: isService ? 'Verified Service' : condition,
        experience: isService ? experience : undefined,
        image: uploadedImageUrls[0] || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600',
        image_url: uploadedImageUrls[0] || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600',
        images: uploadedImageUrls,
        image_urls: uploadedImageUrls,
        videos: uploadedVideos,
        video_urls: uploadedVideos.map((v) => (typeof v === 'string' ? v : v.url)),
        seller_name: sellerName.trim(),
        sellerName: sellerName.trim(),
        phone: cleanSellerPhone,
        whatsapp: (whatsapp || phone).replace(/\D/g, '').slice(-10),
        has_pending_approval: true,
        is_active: false,
        isNew: true,
        verification_badge: '⏳ Pending Approval',
        badge: '⏳ Pending Admin Approval',
        user_id: currentUser?.id || null,
      };

      // 3. Database Insertion
      const { data: dbData } = await createListingInDB(payload);
      const finalItem = dbData || { id: `draft-${Date.now()}`, ...payload };

      // 4. Client Store Hydration
      hyperlocalStore.insertListing(category, finalItem);

      // 5. Admin & Seller Telemetry Notifications
      const adminNotif = {
        tag: 'NEW ENLISTMENT',
        title: `🏪 New Listing: "${payload.title}"`,
        message: `${payload.seller_name} (+91 ${cleanSellerPhone}) submitted an offering in ${category}, ${targetCity}.`,
        targetId: finalItem.id,
        category: payload.category,
        recipient_role: 'admin',
        recipient_phone: null,
        metadata: {
          listingId: finalItem.id,
          sellerPhone: cleanSellerPhone,
          category: payload.category,
          city: targetCity,
        },
      };

      await saveNotificationToDB(adminNotif);
      hyperlocalStore.addNotification(adminNotif);

      const sellerNotif = {
        tag: 'APPROVED',
        title: `⏳ "${payload.title}" Submitted for Review`,
        message: `Your listing in ${activeCategoryConfig.name || category} has been submitted to Master Admin for approval.`,
        targetId: finalItem.id,
        category: payload.category,
        recipient_role: 'seller',
        recipient_phone: cleanSellerPhone,
        metadata: {
          listingId: finalItem.id,
        },
      };

      if (supabase && cleanSellerPhone) {
        await supabase.from('notifications').insert([
          {
            tag: sellerNotif.tag,
            title: sellerNotif.title,
            message: sellerNotif.message,
            recipient_role: 'seller',
            recipient_phone: cleanSellerPhone,
            metadata: sellerNotif.metadata,
          },
        ]);
      }
      hyperlocalStore.addNotification(sellerNotif);

      if (onSuccess) onSuccess(finalItem);
      if (onListingCreated) onListingCreated(finalItem);
      if (onClose) onClose();
    } catch (err) {
      console.error('Submit listing error:', err);
      setErrorMsg('Could not submit listing. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoriesList = TAXONOMY_TREE || Object.values(TAXONOMY_REGISTRY || {});

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in select-none text-slate-100 font-sans">
      <div className="bg-slate-900 border border-amber-500/40 w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base">{isService ? '🛠️' : '🏪'}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                {isService ? 'SERVICE & KAARIGAR ENLISTMENT' : 'PRODUCT & DEAL ENLISTMENT'}
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-100 mt-0.5">
              Step {currentStep} of 3: {currentStep === 1 ? 'Category & Basics' : currentStep === 2 ? 'Pricing & Operations' : 'Media & Shop GPS'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center text-xs font-black cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Step Progression Bar */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <div className={`h-1.5 rounded-lg transition ${currentStep >= 1 ? 'bg-amber-400' : 'bg-slate-800'}`} />
          <div className={`h-1.5 rounded-lg transition ${currentStep >= 2 ? 'bg-amber-400' : 'bg-slate-800'}`} />
          <div className={`h-1.5 rounded-lg transition ${currentStep >= 3 ? 'bg-amber-400' : 'bg-slate-800'}`} />
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-bold text-center animate-fade-in">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          {/* ═══════════════════════════════════════════════════════════ */}
          {/* 🟢 STEP 1: CATEGORY, TITLE & SELLER BASICS                  */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="space-y-3 animate-fade-in">
              {/* Category & Subcategory Selectors */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9.5px] font-bold text-slate-400 block mb-1">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        setCategory(newCat);
                        const catObj = getCategoryById(newCat) || (TAXONOMY_REGISTRY && TAXONOMY_REGISTRY[newCat]);
                        setSubCategory(catObj?.subCategories?.[0]?.id || 'all');
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-slate-100 text-xs font-bold focus:outline-hidden focus:border-amber-400"
                    >
                      {categoriesList.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name ? cat.name.split('(')[0] : cat.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[9.5px] font-bold text-slate-400 block mb-1">Subcategory *</label>
                    <select
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-slate-100 text-xs font-bold focus:outline-hidden focus:border-amber-400"
                    >
                      <option value="all">🌟 All / General</option>
                      {availableSubCategories.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.icon || '•'} {sub.name ? sub.name.split('(')[0] : sub.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Title / Name */}
              <div>
                <label className="text-[10px] font-bold text-slate-300 block mb-1">
                  {isService ? 'Service Title / Offering Name *' : 'Product / Deal Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isService ? 'e.g. 24/7 Electrician & Inverter Repair' : 'e.g. Pure Georgette Bridal Lehenga'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-bold focus:outline-hidden focus:border-amber-400"
                />
              </div>

              {/* Business Name */}
              <div>
                <label className="text-[10px] font-bold text-slate-300 block mb-1">
                  {isService ? 'Agency / Master Kaarigar Name *' : 'Shop / Business / Seller Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  placeholder="e.g. Rajputana Motors / Sharma Sweets"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-bold focus:outline-hidden focus:border-amber-400"
                />
              </div>

              {/* Contact Numbers */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Calling Mobile (+91) *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-mono font-bold focus:outline-hidden focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">WhatsApp Number (+91)</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-mono font-bold focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!title.trim() || !sellerName.trim() || phone.replace(/\D/g, '').length !== 10) {
                    setErrorMsg('Please enter a valid title, seller name, and 10-digit mobile number.');
                    return;
                  }
                  setErrorMsg('');
                  setCurrentStep(2);
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-md active:scale-95 transition cursor-pointer"
              >
                Continue to Step 2 ➔
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* 🟡 STEP 2: PRICING, AVAILABILITY & TIMINGS                  */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div className="space-y-3 animate-fade-in">
              {/* Product Pricing vs Service Visiting Charges */}
              {!isService ? (
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">Price (रुपये में) *</label>
                  <div className="flex items-center space-x-1.5">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-amber-400 select-none">₹</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={priceNumber}
                        onChange={(e) => setPriceNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="1499"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2.5 text-slate-100 font-bold font-mono focus:outline-hidden focus:border-amber-400"
                      />
                    </div>
                    <input
                      type="text"
                      value={priceUnit}
                      onChange={(e) => setPriceUnit(e.target.value)}
                      placeholder="e.g. / Pair"
                      className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-2 py-2.5 text-slate-300 text-center text-xs focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">Visiting / Inspection Fee</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-amber-400">₹</span>
                      <input
                        type="text"
                        value={visitingCharge}
                        onChange={(e) => setVisitingCharge(e.target.value.replace(/\D/g, ''))}
                        placeholder="250 / Visit"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-2 py-2 text-slate-100 font-bold font-mono focus:border-amber-400 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">Experience / Tier</label>
                    <input
                      type="text"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="e.g. 5+ Years Exp"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-100 font-bold focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Retail Stock vs Service Working Hours */}
              {!isService ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9.5px] font-bold text-slate-400 block mb-1">Ready Stock Availability</label>
                    <select
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-bold focus:border-amber-400 outline-none"
                    >
                      <option value="Ready Stock">In Stock / Ready</option>
                      <option value="Limited Stock">Limited Stock</option>
                      <option value="Made to Order">Made to Order</option>
                      <option value="On Order (1-2 Days)">On Order (1-2 Days)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9.5px] font-bold text-slate-400 block mb-1">Condition</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-bold focus:border-amber-400 outline-none"
                    >
                      <option value="Brand New">Brand New</option>
                      <option value="Like New">Like New / Refurbished</option>
                      <option value="Good">Gently Used</option>
                    </select>
                  </div>
                </div>
              ) : null}

              {/* Active Hours Picker */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <label className="text-[10px] font-black text-slate-200 block">⏰ Active Service / Shop Timings</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-1">
                    <select
                      value={timePicker.startHour}
                      onChange={(e) => setTimePicker({ ...timePicker, startHour: e.target.value })}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-1.5 px-2 text-slate-100 text-xs font-bold focus:outline-hidden focus:border-amber-400"
                    >
                      {HOURS_LIST.map((h) => <option key={h} value={h}>{h}:00</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => setTimePicker({ ...timePicker, startPeriod: timePicker.startPeriod === 'AM' ? 'PM' : 'AM' })}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-black text-[10px] cursor-pointer"
                    >
                      {timePicker.startPeriod}
                    </button>
                  </div>

                  <div className="flex items-center space-x-1">
                    <select
                      value={timePicker.endHour}
                      onChange={(e) => setTimePicker({ ...timePicker, endHour: e.target.value })}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-1.5 px-2 text-slate-100 text-xs font-bold focus:outline-hidden focus:border-amber-400"
                    >
                      {HOURS_LIST.map((h) => <option key={h} value={h}>{h}:00</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => setTimePicker({ ...timePicker, endPeriod: timePicker.endPeriod === 'AM' ? 'PM' : 'AM' })}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-black text-[10px] cursor-pointer"
                    >
                      {timePicker.endPeriod}
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 Bullet Highlights */}
              <div className="space-y-1.5 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <label className="text-[10px] font-black text-slate-200 block">📝 Key Highlights (bullet points)</label>
                {[0, 1, 2, 3].map((idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={descPoints[idx]}
                      onChange={(e) => {
                        const next = [...descPoints];
                        next[idx] = e.target.value;
                        setDescPoints(next);
                      }}
                      placeholder={`Key highlight ${idx + 1}...`}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100 text-xs focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                ))}
              </div>

              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-3 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setCurrentStep(3);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-md active:scale-95 transition cursor-pointer"
                >
                  Continue to Step 3 ➔
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* 🔵 STEP 3: MEDIA UPLOAD & PRECISE GPS PINNING               */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <div className="space-y-3 animate-fade-in">
              {/* Location & GPS */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-400 flex items-center space-x-1">
                    <span>📍</span>
                    <span>Locality & Live Shop GPS</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    disabled={isLocating}
                    className="px-2.5 py-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 rounded-lg text-[10px] font-bold cursor-pointer active:scale-95 transition"
                  >
                    {isLocating ? '🛰️ Locking...' : '🛰️ 1-Tap Set Live GPS'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g. Company Bagh Road"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-100 text-xs focus:border-amber-400 outline-none"
                  />
                  <select
                    value={targetCity}
                    onChange={(e) => setTargetCity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-100 text-xs font-bold focus:border-amber-400 outline-none"
                  >
                    {Object.keys(TOWN_CENTERS || { Alwar: {} }).map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {gpsStatus && (
                  <p className="text-[10px] font-mono text-emerald-400 font-semibold">{gpsStatus}</p>
                )}
              </div>

              {/* Photos Upload */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-300">📷 Photos ({images.length}/10)</label>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={images.length >= 10}
                    className="text-[9.5px] font-black bg-slate-800 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md cursor-pointer disabled:opacity-40"
                  >
                    + Add Photos
                  </button>
                </div>

                <input
                  type="file"
                  ref={photoInputRef}
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                {images.length > 0 && (
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-700">
                        <img src={img.preview} alt="Thumb" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[8px] flex items-center justify-center cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Videos Upload */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-300">🎥 Walkthrough Videos ({videos.length}/2)</label>
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={videos.length >= 2 || videoUploadState.isProcessing}
                    className="text-[9.5px] font-black bg-slate-800 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md disabled:opacity-40 cursor-pointer"
                  >
                    + Add Video
                  </button>
                </div>

                <input
                  type="file"
                  ref={videoInputRef}
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />

                {videoUploadState.isProcessing && (
                  <div className="p-2.5 bg-slate-900 border border-amber-500/50 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-amber-300 truncate pr-2">
                        {videoUploadState.status}
                      </span>
                      <span className="font-mono text-amber-400 font-black">{videoUploadState.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${videoUploadState.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {videos.map((vid, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-700 text-[10px]">
                    <span className="truncate text-slate-200">🎬 {vid.name} ({vid.duration}s)</span>
                    <button type="button" onClick={() => handleRemoveVideo(idx)} className="text-rose-400 font-black cursor-pointer">✕</button>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-3 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || videoUploadState.isProcessing}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  <span>{isSubmitting ? 'Submitting Listing... ⏳' : '🚀 Publish & Go Live'}</span>
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}