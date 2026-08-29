import React, { useState, useEffect, useRef } from 'react';
import { TAXONOMY_REGISTRY, TAXONOMY_TREE, getCategoryById, sanitizeSubCategoryId } from '../../data/taxonomyRegistry';
import { compressImage } from '../../utils/imageCompressor';
import {
  uploadListingImagesToStorage,
  uploadListingVideosToStorage,
  createListingInDB,
  submitSellerEditProposal,
  saveNotificationToDB,
  getCategoryFallback,
} from '../../services/listingService';
import { hyperlocalStore } from '../../store/hyperlocalStore';
import { getCurrentUserProfile } from '../../services/authService';
import { TOWN_CENTERS } from '../../utils/geoFence';
import { CITY_ZONES } from '../../data/cityZones';
import { supabase } from '../../services/supabaseClient';

import { getListingSchema } from '../../data/listingFormSchemaRegistry';
import { resolveLocalityCoordinates } from '../../data/cityZones';

const HOURS_LIST = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

// Service categories that switch to service-specific pricing and operations
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

const sanitizePhone = (p) => (p ? String(p).replace(/\D/g, '').slice(-10) : '');

export default function PostListingModal({
  isOpen,
  onClose,
  initialCategory = 'market',
  initialSubCategory = 'all',
  selectedCity = 'Alwar',
  initialData = null,
  onSuccess,
  onListingCreated,
}) {
  if (!isOpen) return null;

  const isEditMode = Boolean(initialData?.id);
  const currentUser = getCurrentUserProfile();
  const cleanPhone = String(currentUser?.phone || '').replace(/\D/g, '').slice(-10);

  // Step wizard: 1 (Category & Basics) -> 2 (Adaptive Pricing & Specs) -> 3 (Media, Highlights & GPS)
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [category, setCategory] = useState(initialData?.category || initialCategory || 'market');
  const [subCategory, setSubCategory] = useState(initialData?.subCategory || initialData?.sub_category || initialSubCategory || 'all');
  const [title, setTitle] = useState(initialData?.title || initialData?.name || '');
  const [sellerName, setSellerName] = useState(initialData?.sellerName || initialData?.seller_name || currentUser?.business_name || currentUser?.full_name || '');
  const [phone, setPhone] = useState(initialData?.phone ? String(initialData.phone).replace(/\D/g, '').slice(-10) : cleanPhone || '');
  const [whatsapp, setWhatsapp] = useState(initialData?.whatsapp ? String(initialData.whatsapp).replace(/\D/g, '').slice(-10) : cleanPhone || '');
  const [locationName, setLocationName] = useState(initialData?.location || initialData?.location_name || currentUser?.area_name || 'Town Center');
  const [targetCity, setTargetCity] = useState(initialData?.city || selectedCity || 'Alwar');

  // Pricing & Metrics
  const [price, setPrice] = useState(() => {
    const rawPrice = initialData?.price || initialData?.rates || '';
    return rawPrice ? String(rawPrice).replace(/[₹]/g, '').trim() : '';
  });
  const [originalPrice, setOriginalPrice] = useState(() => {
    const rawOrig = initialData?.original_price || initialData?.originalPrice || '';
    return rawOrig ? String(rawOrig).replace(/[₹]/g, '').trim() : '';
  });
  const [dynamicSpecs, setDynamicSpecs] = useState(() => initialData?.specs || initialData?.pending_changes?.specs || {});

  // 4 Key Bullet Highlights
  const [descPoints, setDescPoints] = useState(() => {
    if (initialData?.description) {
      const lines = initialData.description.split('\n').map((l) => l.replace(/^[•\-\d.\s]+/, '').trim()).filter(Boolean);
      return [lines[0] || '', lines[1] || '', lines[2] || '', lines[3] || ''];
    }
    return ['', '', '', ''];
  });
  const [experience, setExperience] = useState(() => initialData?.experience || '5+ Years Exp');
  const [visitingCharge, setVisitingCharge] = useState(() => {
    const vc = initialData?.visitingCharge || initialData?.visiting_charge;
    return vc ? String(vc).replace(/\D/g, '') : '';
  });

  // 12-Hour AM/PM Time Picker State
  const [timePicker, setTimePicker] = useState(() => {
    const timingStr = initialData?.timing || initialData?.activeHours || '09:00 AM - 09:00 PM';
    const match = timingStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)\s*-\s*(\d{1,2}):?(\d{2})?\s*(AM|PM)/i);
    if (match) {
      return {
        startHour: match[1].padStart(2, '0'),
        startPeriod: match[3].toUpperCase(),
        endHour: match[4].padStart(2, '0'),
        endPeriod: match[6].toUpperCase(),
      };
    }
    return { startHour: '09', startPeriod: 'AM', endHour: '09', endPeriod: 'PM' };
  });

  // Media & GPS Geolocation State
  const [images, setImages] = useState(() => {
    const rawImages = initialData?.images || initialData?.image_urls || (initialData?.image ? [initialData.image] : []);
    return rawImages.map((img) => (typeof img === 'string' ? { preview: img, url: img, isExisting: true } : img));
  });
  const [videos, setVideos] = useState(() => {
    const rawVideos = initialData?.videos || initialData?.video_urls || [];
    return rawVideos.map((v) =>
      typeof v === 'string'
        ? { preview: v, url: v, name: 'Attached Video', duration: 30, isExisting: true }
        : { ...v, preview: v.url, isExisting: true }
    );
  });
  const [lat, setLat] = useState(() => initialData?.lat || null);
  const [lng, setLng] = useState(() => initialData?.lng || null);
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

  // Update subcategory if category changes and current subcategory is not valid
  useEffect(() => {
    if (availableSubCategories.length > 0 && subCategory === 'all') {
      // Keep 'all' or default to first subcategory
    }
  }, [category, availableSubCategories]);

  // 🛰️ 3-Tier Geolocation Resolution
  const handleDetectGPS = () => {
    setIsLocating(true);
    setGpsStatus('🛰️ Contacting GPS satellites...');
    setErrorMsg('');

    if (!navigator.geolocation) {
      applyLocalityOrCityFallback('GPS not supported on device. Locality/City Center anchored.');
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
        console.warn('GPS location timeout or denied, using locality/town center fallback:', err.message);
        applyLocalityOrCityFallback('GPS signal unavailable. Locality/City Center anchored.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const applyLocalityOrCityFallback = (statusMsg = '') => {
    // Tier 2: Match locality against cityZones registry
    const localityCoords = resolveLocalityCoordinates(locationName, targetCity);
    if (localityCoords && localityCoords.lat && localityCoords.lng) {
      setLat(localityCoords.lat);
      setLng(localityCoords.lng);
      setGpsStatus(`📍 Locality Mapped: ${localityCoords.lat}, ${localityCoords.lng}`);
      return;
    }

    // Tier 3: Town center anchor
    const center = (TOWN_CENTERS && TOWN_CENTERS[targetCity]) || (TOWN_CENTERS && TOWN_CENTERS['Alwar']) || { lat: 27.5530, lng: 76.6346 };
    setLat(center.lat);
    setLng(center.lng);
    setGpsStatus(statusMsg || `📍 Anchored to ${targetCity} Town Center: ${center.lat}, ${center.lng}`);
  };

  // 📷 Photo Selection
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
      isExisting: false,
    }));

    setImages((prev) => [...prev, ...newItems]);
    e.target.value = '';
  };

  const handleRemovePhoto = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // 🎥 Video Selection
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
                isExisting: false,
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

  // 🚀 Submit Pipeline (Handles both New Enlistment and Staged Edit Proposal)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim() || !sellerName.trim() || !phone.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    const cleanSellerPhone = sanitizePhone(phone);
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
      // 1. Upload new media files
      const existingImageUrls = images
        .map((img) => img.url || (typeof img === 'string' && img.startsWith('http') ? img : null))
        .filter(Boolean);
      const newImageFiles = images.filter((img) => img.file instanceof File || img.file instanceof Blob).map((img) => img.file);
      const uploadedNewImageUrls = newImageFiles.length > 0 ? await uploadListingImagesToStorage(newImageFiles) : [];
      const finalImageUrls = [...existingImageUrls, ...uploadedNewImageUrls];

      const existingVideos = videos.filter((v) => !v.file && (v.url || typeof v === 'string'));
      const newVideoObjects = videos.filter((v) => v.file instanceof File || v.file instanceof Blob);
      const uploadedNewVideos = newVideoObjects.length > 0 ? await uploadListingVideosToStorage(newVideoObjects) : [];
      const finalVideos = [...existingVideos, ...uploadedNewVideos];

      // 2. Format Descriptions & Pricing
      const validPoints = descPoints.filter((p) => p && p.trim().length > 0);
      const combinedDescription =
        validPoints.length > 0
          ? validPoints.map((p) => `• ${p.trim()}`).join('\n')
          : title.trim();

      const formattedPrice = price.trim()
        ? (price.trim().startsWith('₹') ? price.trim() : `₹ ${price.trim()}`)
        : 'Contact for Price';

      const formattedOrigPrice = originalPrice.trim()
        ? (originalPrice.trim().startsWith('₹') ? originalPrice.trim() : `₹ ${originalPrice.trim()}`)
        : null;

      const formattedActiveHours = `${timePicker.startHour}:00 ${timePicker.startPeriod} - ${timePicker.endHour}:00 ${timePicker.endPeriod}`;
      const resolvedCapacity = dynamicSpecs.stock_status || dynamicSpecs.property_type || dynamicSpecs.vehicle_type || formattedActiveHours;

      const payload = {
        title: title.trim(),
        name: title.trim(),
        category: category.toLowerCase(),
        sub_category: sanitizeSubCategoryId ? sanitizeSubCategoryId(category, subCategory) : subCategory,
        subCategory: sanitizeSubCategoryId ? sanitizeSubCategoryId(category, subCategory) : subCategory,
        price: formattedPrice,
        rates: formattedPrice,
        startingPackage: formattedPrice,
        original_price: formattedOrigPrice,
        originalPrice: formattedOrigPrice,
        description: combinedDescription,
        location: locationName.trim(),
        location_name: locationName.trim(),
        city: targetCity,
        lat: finalLat,
        lng: finalLng,
        timing: formattedActiveHours,
        activeHours: formattedActiveHours,
        capacity: resolvedCapacity,
        stockCount: resolvedCapacity,
        condition: dynamicSpecs.condition || dynamicSpecs.device_condition || (isService ? 'Verified Service' : 'Brand New'),
        specs: dynamicSpecs,
        image: finalImageUrls[0] || getCategoryFallback(category),
        image_url: finalImageUrls[0] || getCategoryFallback(category),
        images: finalImageUrls,
        image_urls: finalImageUrls,
        videos: finalVideos,
        video_urls: finalVideos.map((v) => (typeof v === 'string' ? v : v.url)),
        seller_name: sellerName.trim(),
        sellerName: sellerName.trim(),
        phone: cleanSellerPhone,
        whatsapp: sanitizePhone(whatsapp || phone) || cleanSellerPhone,
        user_id: currentUser?.id || null,
      };

      if (isEditMode) {
        // 3A. STAGED PROPOSAL PIPELINE FOR EXISTING LISTING
        const editPayload = {
          ...initialData,
          ...payload,
          has_pending_approval: true,
          admin_feedback: null,
          seller_feedback_reply: null,
        };

        const { data: dbProposal } = await submitSellerEditProposal(initialData.id, editPayload);
        const updatedItem = {
          ...initialData,
          id: dbProposal?.id || initialData.id,
          pending_changes: payload,
          has_pending_approval: true,
          admin_feedback: null,
          seller_feedback_reply: null,
        };

        hyperlocalStore.insertListing(initialData.category, updatedItem);

        const notifObj = {
          tag: 'EDIT PROPOSAL',
          title: `Edit Request: "${payload.title}"`,
          message: `${payload.seller_name} (+91 ${cleanSellerPhone}) submitted updates for approval.`,
          targetId: updatedItem.id,
          category: payload.category,
          recipient_role: 'admin',
          recipient_phone: null,
          metadata: {
            listingId: updatedItem.id,
            sellerPhone: cleanSellerPhone,
            category: payload.category,
          },
        };
        await saveNotificationToDB(notifObj);
        hyperlocalStore.addNotification(notifObj);

        if (onSuccess) onSuccess(updatedItem);
        if (onListingCreated) onListingCreated(updatedItem);
        if (onClose) onClose();
      } else {
        // 3B. NEW ENLISTMENT PIPELINE
        const newDraft = {
          ...payload,
          is_active: false,
          has_pending_approval: true,
          isNew: true,
          badge: '⏳ Pending Admin Approval',
          verification_badge: '⏳ Pending Approval',
          created_at: new Date().toISOString(),
        };

        const { data: dbData } = await createListingInDB(newDraft);
        const finalItem = dbData || { id: `draft-${Date.now()}`, ...newDraft };

        hyperlocalStore.insertListing(category, finalItem);

        // Notifications
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
      }
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
                {isEditMode
                  ? 'EDIT LISTING & PROPOSE CHANGES'
                  : isService
                  ? 'SERVICE & KAARIGAR ENLISTMENT'
                  : 'PRODUCT & DEAL ENLISTMENT'}
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

              {/* Contextual Title & Seller Name using Schema */}
              {(() => {
                const schema = getListingSchema(category);
                return (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">
                        {schema.guidance?.titleLabel || (isService ? 'Service Title / Offering Name *' : 'Product / Deal Title *')}
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={schema.guidance?.titlePlaceholder || 'Enter offering title...'}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-bold focus:outline-hidden focus:border-amber-400"
                      />
                      {schema.guidance?.titleHelp && (
                        <p className="text-[8.5px] text-slate-500 mt-1 italic">{schema.guidance.titleHelp}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">
                        {schema.guidance?.sellerLabel || (isService ? 'Agency / Master Kaarigar Name *' : 'Shop / Business / Seller Name *')}
                      </label>
                      <input
                        type="text"
                        required
                        value={sellerName}
                        onChange={(e) => setSellerName(e.target.value)}
                        placeholder={schema.guidance?.sellerPlaceholder || 'e.g. Royal Business Store'}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-bold focus:outline-hidden focus:border-amber-400"
                      />
                    </div>
                  </>
                );
              })()}

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
          {/* 🟡 STEP 2: CATEGORY-SPECIFIC PRICING & ADAPTIVE SPECS       */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (() => {
            const schema = getListingSchema(category);
            return (
              <div className="space-y-3 animate-fade-in">
                
                {/* Pricing Fields */}
                <div className="grid grid-cols-2 gap-2">
                  <div className={schema.pricing?.showOriginalPrice ? 'col-span-1' : 'col-span-2'}>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">
                      {schema.pricing?.priceLabel || 'Price / Offer Rate *'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-amber-400 select-none">₹</span>
                      <input
                        type="text"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value.replace(/[^\d./\w\s-]/g, ''))}
                        placeholder={schema.pricing?.pricePlaceholder || '1499'}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2.5 text-slate-100 font-bold font-mono focus:outline-hidden focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {schema.pricing?.showOriginalPrice && (
                    <div>
                      <label className="text-[9.5px] font-bold text-slate-400 block mb-1">
                        Original M.R.P (Strike-off)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">₹</span>
                        <input
                          type="text"
                          value={originalPrice}
                          onChange={(e) => setOriginalPrice(e.target.value.replace(/[^\d./\w\s-]/g, ''))}
                          placeholder="e.g. 2499"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-slate-400 font-mono text-xs focus:border-amber-400 outline-none line-through"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Adaptive Category Specifications */}
                {(schema.specifications || []).map((spec) => (
                  <div key={spec.key}>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">{spec.label}</label>
                    {spec.type === 'select' ? (
                      <select
                        value={dynamicSpecs[spec.key] || spec.default || ''}
                        onChange={(e) => setDynamicSpecs({ ...dynamicSpecs, [spec.key]: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-bold text-xs focus:border-amber-400 outline-none"
                      >
                        {spec.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder={spec.placeholder || ''}
                        value={dynamicSpecs[spec.key] || ''}
                        onChange={(e) => setDynamicSpecs({ ...dynamicSpecs, [spec.key]: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 text-xs focus:border-amber-400 outline-none"
                      />
                    )}
                  </div>
                ))}

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

              {/* 4 Context-Tailored Key Highlights */}
              {(() => {
                const schema = getListingSchema(category);
                const placeholders = schema.guidance?.bulletPlaceholders || [
                  'Highlight key feature or quality guarantee...',
                  'Special discount, bundle or offer inclusions...',
                  'Colonies or areas served in Alwar...',
                  'Warranty, return or delivery support details...',
                ];

                return (
                  <div className="space-y-1.5 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <label className="text-[10px] font-black text-slate-200 block">
                      📝 Key Highlights (4 मुख्य विशेषताएं)
                    </label>
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
                          placeholder={`Point ${idx + 1}: ${placeholders[idx] || ''}`}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100 text-xs focus:outline-hidden focus:border-amber-400 placeholder:text-slate-600"
                        />
                      </div>
                    ))}
                  </div>
                );
              })()}

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
          );
          })()}

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
                        <img src={img.preview || img.url} alt="Thumb" className="w-full h-full object-cover" />
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
                    <span className="truncate text-slate-200">🎬 {vid.name || `Video ${idx + 1}`} ({vid.duration || 30}s)</span>
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
                  <span>
                    {isSubmitting
                      ? 'Submitting Changes... ⏳'
                      : isEditMode
                      ? '✓ Submit Edit Proposal'
                      : '🚀 Publish & Go Live'}
                  </span>
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}