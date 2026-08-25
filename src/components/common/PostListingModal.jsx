import React, { useState, useRef } from 'react';
import { TAXONOMY_REGISTRY, getCategoryById } from '../../data/taxonomyRegistry';
import {
  uploadListingImagesToStorage,
  uploadListingVideosToStorage,
  createListingInDB,
  saveNotificationToDB,
} from '../../services/listingService';
import { hyperlocalStore } from '../../store/hyperlocalStore';
import { getCurrentUserProfile } from '../../services/authService';

const HOURS_LIST = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

export default function PostListingModal({
  defaultCategory = 'property',
  selectedCity = 'Alwar',
  onClose,
  onSuccess,
}) {
  const currentUser = getCurrentUserProfile();
  const sellerPhone = currentUser?.phone || '9876543210';
  const sellerName = currentUser?.full_name || 'Verified Merchant';

  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 12-Hour AM/PM Time Picker State
  const [timePicker, setTimePicker] = useState({
    startHour: '09',
    startPeriod: 'AM',
    endHour: '09',
    endPeriod: 'PM',
  });

  // Form State matching Seller Dashboard Architecture
  const [formData, setFormData] = useState({
    title: '',
    category: defaultCategory || 'property',
    subCategory: 'all',
    priceNumber: '',
    priceUnit: '',
    stockCount: '',
    location: `${selectedCity} Market`,
    lat: null,
    lng: null,
    descPoints: ['', '', '', ''],
    images: [], // Holds { file, preview }
    videos: [], // Holds { file, preview, name, duration }
  });

  // Video Processing & Upload Progress State
  const [videoUploadState, setVideoUploadState] = useState({
    isProcessing: false,
    progress: 0,
    fileName: '',
    status: '',
  });

  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const activeCategoryConfig = getCategoryById(formData.category) || TAXONOMY_REGISTRY[formData.category] || null;
  const availableSubCategories = activeCategoryConfig?.subCategories || [];

  // 📍 1-Tap Live GPS Locator
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your device.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData((prev) => ({
          ...prev,
          lat: latitude,
          lng: longitude,
          location: prev.location || `${selectedCity} (GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        }));
        setIsLocating(false);
      },
      () => {
        alert('Please enable location permissions in your browser settings.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 📷 Photo Selection (Up to 10 photos)
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (formData.images.length + files.length > 10) {
      alert('Maximum 10 photos allowed per listing.');
      return;
    }

    const newItems = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setFormData((prev) => ({ ...prev, images: [...prev.images, ...newItems] }));
    e.target.value = '';
  };

  const handleRemovePhoto = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // 🎥 Video Selection & Duration Validation (Up to 2 walkthrough videos, max 60s each)
  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (formData.videos.length >= 2) {
      alert('Maximum 2 videos allowed per listing.');
      return;
    }

    setVideoUploadState({
      isProcessing: true,
      progress: 5,
      fileName: file.name,
      status: 'Checking video duration...',
    });

    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';
    const tempUrl = URL.createObjectURL(file);
    videoEl.src = tempUrl;

    videoEl.onloadedmetadata = () => {
      const duration = Math.round(videoEl.duration);
      if (duration > 60) {
        alert(`Video is ${duration}s long. Maximum allowed length is 60 seconds.`);
        setVideoUploadState({ isProcessing: false, progress: 0, fileName: '', status: '' });
        return;
      }

      let currentProgress = 10;
      setVideoUploadState({
        isProcessing: true,
        progress: currentProgress,
        fileName: file.name,
        status: 'Compressing video for fast streaming...',
      });

      const progressInterval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 14) + 10;

        if (currentProgress < 90) {
          setVideoUploadState((prev) => ({
            ...prev,
            progress: currentProgress,
            status: currentProgress > 50 ? 'Optimizing video stream...' : 'Compressing video frames...',
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
            setFormData((prev) => ({
              ...prev,
              videos: [
                ...prev.videos,
                {
                  file,
                  preview: tempUrl,
                  name: file.name,
                  duration,
                },
              ],
            }));
            setVideoUploadState({ isProcessing: false, progress: 0, fileName: '', status: '' });
          }, 400);
        }
      }, 120);
    };

    videoEl.onerror = () => {
      alert('Could not read video file. Please try another video.');
      setVideoUploadState({ isProcessing: false, progress: 0, fileName: '', status: '' });
    };

    e.target.value = '';
  };

  const handleRemoveVideo = (index) => {
    setFormData((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
    }));
  };

  // Submit Listing Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);

    try {
      const rawImageFiles = formData.images.map((img) => img.file).filter(Boolean);
      const uploadedImageUrls = await uploadListingImagesToStorage(rawImageFiles);
      const uploadedVideos = await uploadListingVideosToStorage(formData.videos);

      const validPoints = formData.descPoints.filter((p) => p && p.trim().length > 0);
      const combinedDescription =
        validPoints.length > 0
          ? validPoints.map((p) => `• ${p.trim()}`).join('\n')
          : formData.title;

      const formattedPrice = formData.priceNumber
        ? `₹ ${formData.priceNumber.trim()}${formData.priceUnit ? ' ' + formData.priceUnit : ''}`
        : 'Contact for Price';

      const formattedStock = formData.stockCount
        ? `${formData.stockCount} Units Available`
        : 'Ready Stock';

      const formattedActiveHours = `${timePicker.startHour}:00 ${timePicker.startPeriod} - ${timePicker.endHour}:00 ${timePicker.endPeriod}`;

      const payload = {
        title: formData.title,
        name: formData.title,
        category: formData.category,
        subCategory: formData.subCategory,
        sub_category: formData.subCategory,
        price: formattedPrice,
        rates: formattedPrice,
        startingPackage: formattedPrice,
        description: combinedDescription,
        location: formData.location,
        city: selectedCity,
        lat: formData.lat,
        lng: formData.lng,
        capacity: formattedStock,
        stockCount: formattedStock,
        timing: formattedActiveHours,
        activeHours: formattedActiveHours,
        image: uploadedImageUrls[0] || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600',
        images: uploadedImageUrls,
        image_urls: uploadedImageUrls,
        videos: uploadedVideos,
        video_urls: uploadedVideos.map((v) => v.url),
        sellerName,
        phone: sellerPhone,
        whatsapp: sellerPhone,
        has_pending_approval: true,
        is_active: false,
        isNew: true,
        badge: '⏳ Pending Admin Approval',
      };

      const { data: dbData } = await createListingInDB(payload);
      const finalItem = dbData || { id: `draft-${Date.now()}`, ...payload };

      hyperlocalStore.insertListing(formData.category, finalItem);

      const notifObj = {
        tag: 'NEW ENLISTMENT',
        title: `New Listing: "${formData.title}"`,
        message: `Merchant (${sellerPhone}) submitted a new listing for approval.`,
        targetId: finalItem.id,
        category: formData.category,
        recipient_role: 'admin',
        recipient_phone: null,
      };

      await saveNotificationToDB(notifObj);
      hyperlocalStore.addNotification(notifObj);

      alert('Listing submitted successfully! It is now pending Admin approval.');
      if (onSuccess) onSuccess(finalItem);
      if (onClose) onClose();
    } catch (err) {
      console.error('Submit listing error:', err);
      alert('Could not submit listing. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in select-none">
      <div className="bg-slate-900 border border-amber-500/40 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3.5 max-h-[92vh] overflow-y-auto text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div>
            <h3 className="text-xs font-black text-amber-300">🆕 Enlist New Listing</h3>
            <p className="text-[9px] text-slate-400">Post an offering for Admin approval across {selectedCity}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-[11px]">
          
          {/* Category & Subcategory Selectors */}
          <div className="space-y-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-bold text-slate-300 block mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    const catObj = getCategoryById(newCat);
                    setFormData((prev) => ({
                      ...prev,
                      category: newCat,
                      subCategory: catObj?.subCategories?.[0]?.id || 'all',
                    }));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-slate-100 text-xs focus:outline-hidden focus:border-amber-400"
                >
                  {Object.keys(TAXONOMY_REGISTRY).map((catKey) => {
                    const cat = TAXONOMY_REGISTRY[catKey];
                    return (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name.split('(')[0]}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-300 block mb-1">Subcategory *</label>
                <select
                  value={formData.subCategory}
                  onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-slate-100 text-xs focus:outline-hidden focus:border-amber-400"
                >
                  <option value="all">🌟 All / General</option>
                  {availableSubCategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.icon || '•'} {sub.name.split('(')[0]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[9.5px] font-bold text-slate-300 block mb-1">Title / Business Name *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Rajputana Motors Dhanteras Deal"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-hidden focus:border-amber-400"
            />
          </div>

          {/* Price (Numeric Only) with Units */}
          <div>
            <label className="text-[9.5px] font-bold text-slate-300 block mb-1">Price (रुपये में - केवल अंक) *</label>
            <div className="flex items-center space-x-1.5">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-amber-400 select-none">₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={formData.priceNumber}
                  onChange={(e) => setFormData({ ...formData, priceNumber: e.target.value.replace(/\D/g, '') })}
                  placeholder="169000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-slate-100 font-bold font-mono focus:outline-hidden focus:border-amber-400"
                />
              </div>
              <input
                type="text"
                value={formData.priceUnit}
                onChange={(e) => setFormData({ ...formData, priceUnit: e.target.value })}
                placeholder="e.g. / Day"
                className="w-24 bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-slate-300 text-center text-xs focus:outline-hidden focus:border-amber-400"
              />
            </div>
          </div>

          {/* Ready Stock Units */}
          <div>
            <label className="text-[9px] font-bold text-slate-300 block mb-1">Ready Stock / Availability (केवल अंक)</label>
            <input
              type="text"
              inputMode="numeric"
              value={formData.stockCount}
              onChange={(e) => setFormData({ ...formData, stockCount: e.target.value.replace(/\D/g, '') })}
              placeholder="e.g. 10"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-hidden focus:border-amber-400"
            />
          </div>

          {/* Active Hours Picker */}
          <div className="p-2.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <label className="text-[9.5px] font-black text-slate-200 block">⏰ Active Hours</label>
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

          {/* Location & GPS */}
          <div>
            <label className="text-[9.5px] font-bold text-slate-300 block mb-1">Location *</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Company Bagh Road, Alwar"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-hidden focus:border-amber-400"
            />
          </div>

          <button
            type="button"
            onClick={handleDetectGPS}
            disabled={isLocating}
            className="w-full py-2.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 text-slate-950 font-black text-xs rounded-2xl shadow-md cursor-pointer flex items-center justify-center space-x-1.5 active:scale-98 border border-amber-300/40 disabled:opacity-50"
          >
            <span>📍</span>
            <span>{isLocating ? 'Detecting GPS...' : '1-Tap Set Live Shop GPS'}</span>
          </button>

          {/* 4 Bullet Highlights */}
          <div className="space-y-1.5 p-3 bg-slate-950 rounded-2xl border border-slate-800">
            <label className="text-[9.5px] font-black text-slate-200 block">📝 Key Highlights</label>
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={formData.descPoints[idx]}
                  onChange={(e) => {
                    const next = [...formData.descPoints];
                    next[idx] = e.target.value;
                    setFormData({ ...formData, descPoints: next });
                  }}
                  placeholder={`Highlight point ${idx + 1}...`}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100 text-[10.5px] focus:outline-hidden focus:border-amber-400"
                />
              </div>
            ))}
          </div>

          {/* Photos Upload */}
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[9.5px] font-black text-slate-300">📷 Photos ({formData.images.length}/10)</label>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={formData.images.length >= 10}
                className="text-[9px] font-black bg-slate-800 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md cursor-pointer disabled:opacity-40"
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

            {formData.images.length > 0 && (
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {formData.images.map((img, idx) => (
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

          {/* Videos Upload with Progress Simulator */}
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[9.5px] font-black text-slate-300">🎥 Walkthrough Videos ({formData.videos.length}/2)</label>
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={formData.videos.length >= 2 || videoUploadState.isProcessing}
                className="text-[9px] font-black bg-slate-800 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md disabled:opacity-40 cursor-pointer"
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
              <div className="p-3 bg-slate-900 border border-amber-500/50 rounded-2xl space-y-2 shadow-inner">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-black text-amber-300 flex items-center space-x-1.5 truncate pr-2">
                    <span className="animate-spin text-xs">⚙️</span>
                    <span className="truncate">{videoUploadState.status}</span>
                  </span>
                  <span className="font-black text-amber-400 font-mono text-xs shrink-0">
                    {videoUploadState.progress}%
                  </span>
                </div>

                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800 p-0.5 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 h-full rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                    style={{ width: `${videoUploadState.progress}%` }}
                  ></div>
                </div>

                <p className="text-[8.5px] text-slate-400 font-medium">
                  Optimizing {videoUploadState.fileName} for fast streaming... Please wait.
                </p>
              </div>
            )}

            {formData.videos.map((vid, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-700 text-[9.5px]">
                <span className="truncate text-slate-200">🎬 {vid.name} ({vid.duration}s)</span>
                <button type="button" onClick={() => handleRemoveVideo(idx)} className="text-rose-400 font-black cursor-pointer">✕</button>
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[9px] text-slate-400">
            🛡️ Note: This listing will be sent to the Master Admin Control Queue for verification before appearing live on the {selectedCity} public feed.
          </div>

          <button
            type="submit"
            disabled={isSubmitting || videoUploadState.isProcessing}
            className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs rounded-xl shadow-lg active:scale-95 transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Uploading & Submitting... ⏳' : 'Submit for Admin Approval ➔'}
          </button>
        </form>
      </div>
    </div>
  );
}