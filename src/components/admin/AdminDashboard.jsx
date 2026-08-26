import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAllListingsSlice, hyperlocalStore, hydrateFromDB } from '../../store/hyperlocalStore';
import UserManagementCRM from './UserManagementCRM';

import {
  approveListingChanges,
  rejectListingChanges,
  sendAdminFeedbackToSeller,
  uploadVoiceNoteToStorage,
  uploadListingImagesToStorage,
  uploadListingVideosToStorage,
  saveNotificationToDB,
} from '../../services/listingService';
import { logoutAdmin, isAdminAuthorized } from '../../services/authService';
import { TAXONOMY_REGISTRY, getCategoryById } from '../../data/taxonomyRegistry';
import {
  getOptimizedVoiceStream,
  createOptimizedMediaRecorder,
} from '../../utils/audioCompressor';
import VoiceNotePlayer from '../common/VoiceNotePlayer';

const MASTER_ADMIN_SECRET = 'JagadUsha@NEBExt3/33';

export default function AdminDashboard({ onBack, selectedCity = 'Alwar' }) {
  const [isAdminAuth, setIsAdminAuth] = useState(() => isAdminAuthorized());
  const [enteredKey, setEnteredKey] = useState('');
  const [keyError, setKeyError] = useState('');

  const allListings = useAllListingsSlice();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'all' | 'users'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState(null);

  // ⏱️ Time Filter States
  const [timeFilterType, setTimeFilterType] = useState('all'); // 'all' | 'hours' | 'days' | 'last_week' | 'last_month' | 'this_year'
  const [timeValue, setTimeValue] = useState(1); // 1-24 for hours, 1-7 for days

  // 👤 1-Tap Merchant Portfolio Dossier State
  const [selectedSeller, setSelectedSeller] = useState(null); // { phone, name }
  const [sellerPortfolioTab, setSellerPortfolioTab] = useState('all'); // 'all' | 'approved' | 'pending' | 'feedback'

  // 🔍 Interactive Review Studio Modal & Admin Correction State
  const [inspectingItem, setInspectingItem] = useState(null);
  const [isAdminEditing, setIsAdminEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    category: 'property',
    subCategory: 'all',
    price: '',
    capacity: '',
    location: '',
    timing: '09:00 AM - 09:00 PM',
    description: '',
    descPoints: ['', '', '', ''],
    images: [],
    videos: [],
  });

  const [activeMediaTab, setActiveMediaTab] = useState('photos'); // 'photos' | 'videos'
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);

  const adminPhotoInputRef = useRef(null);
  const adminVideoInputRef = useRef(null);

  // 📷 Fullscreen Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxType, setLightboxType] = useState('photos'); // 'photos' | 'videos'

  // 🎙️ Admin Voice Recording & Feedback State
  const [feedbackText, setFeedbackText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [recordedVoiceNote, setRecordedVoiceNote] = useState(null);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isAdminAuth) {
      hydrateFromDB();
    }
  }, [isAdminAuth]);

  // Authenticate Master Secret Key
  const handleVerifyAdminKey = (e) => {
    e.preventDefault();
    if (enteredKey.trim() === MASTER_ADMIN_SECRET) {
      sessionStorage.setItem('townhub_admin_authenticated', 'true');
      setIsAdminAuth(true);
      setKeyError('');
    } else {
      setKeyError('Invalid Master Secret Key. Access Denied.');
    }
  };

  // 🚪 Lock & Exit
  const handleAdminLogout = () => {
    if (window.confirm('Lock and exit Master Admin Control?')) {
      logoutAdmin();
      setIsAdminAuth(false);
      setEnteredKey('');
      if (onBack) onBack();
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await hydrateFromDB();
    setIsRefreshing(false);
  };

  // ⏱️ Time Filter Calculator
  const applyTimeFilter = (timestamp) => {
    if (timeFilterType === 'all') return true;
    if (!timestamp) return true;

    const itemTime = new Date(timestamp).getTime();
    const now = Date.now();

    if (timeFilterType === 'hours') {
      return now - itemTime <= timeValue * 60 * 60 * 1000;
    }
    if (timeFilterType === 'days') {
      return now - itemTime <= timeValue * 24 * 60 * 60 * 1000;
    }
    if (timeFilterType === 'last_week') {
      return now - itemTime <= 7 * 24 * 60 * 60 * 1000;
    }
    if (timeFilterType === 'last_month') {
      return now - itemTime <= 30 * 24 * 60 * 60 * 1000;
    }
    if (timeFilterType === 'this_year') {
      const currentYear = new Date().getFullYear();
      return new Date(itemTime).getFullYear() === currentYear;
    }
    return true;
  };

  // 1. Pending Approvals Filter
  const pendingApprovals = useMemo(() => {
    return allListings.filter((item) => {
      const isPending =
        item.has_pending_approval === true ||
        item.is_active === false ||
        Boolean(item.pending_changes);

      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sellerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phone?.includes(searchQuery);

      return isPending && matchesCat && matchesSearch && applyTimeFilter(item.created_at);
    });
  }, [allListings, selectedCategory, searchQuery, timeFilterType, timeValue]);

  // 2. Approved & Live Listings Filter
  const approvedListings = useMemo(() => {
    return allListings.filter((item) => {
      const isApproved = item.is_active === true && !item.has_pending_approval;
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sellerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phone?.includes(searchQuery);

      return isApproved && matchesCat && matchesSearch && applyTimeFilter(item.created_at);
    });
  }, [allListings, selectedCategory, searchQuery, timeFilterType, timeValue]);

  // 3. All Listings Filter
  const allFilteredListings = useMemo(() => {
    return allListings.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sellerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phone?.includes(searchQuery);

      return matchesCat && matchesSearch && applyTimeFilter(item.created_at);
    });
  }, [allListings, selectedCategory, searchQuery, timeFilterType, timeValue]);

  // 👤 Specific Selected Seller's Listings
  const sellerListings = useMemo(() => {
    if (!selectedSeller?.phone) return [];
    const cleanTargetPhone = String(selectedSeller.phone).replace(/\D/g, '').slice(-10);

    return allListings.filter((item) => {
      const p1 = String(item.phone || '').replace(/\D/g, '').slice(-10);
      const p2 = String(item.pending_changes?.phone || '').replace(/\D/g, '').slice(-10);
      return p1 === cleanTargetPhone || p2 === cleanTargetPhone;
    });
  }, [allListings, selectedSeller]);

  const sellerApproved = useMemo(() => {
    return sellerListings.filter((i) => i.is_active === true && !i.has_pending_approval);
  }, [sellerListings]);

  const sellerPending = useMemo(() => {
    return sellerListings.filter(
      (i) =>
        (i.has_pending_approval || !i.is_active || Boolean(i.pending_changes)) &&
        !i.admin_feedback &&
        !i.seller_feedback_reply
    );
  }, [sellerListings]);

  const sellerFeedbackActive = useMemo(() => {
    return sellerListings.filter(
      (i) =>
        (i.has_pending_approval || !i.is_active || Boolean(i.pending_changes)) &&
        (Boolean(i.admin_feedback) || Boolean(i.seller_feedback_reply))
    );
  }, [sellerListings]);

  const displayedSellerListings = useMemo(() => {
    if (sellerPortfolioTab === 'approved') return sellerApproved;
    if (sellerPortfolioTab === 'pending') return sellerPending;
    if (sellerPortfolioTab === 'feedback') return sellerFeedbackActive;
    return sellerListings;
  }, [sellerPortfolioTab, sellerListings, sellerApproved, sellerPending, sellerFeedbackActive]);

  // Populate Admin Correction Form & Media State
  const handleOpenInspector = (item) => {
    const changes = item.pending_changes || {};
    const effectiveTitle = changes.title || item.title || item.name || '';
    const effectivePrice = changes.price || item.price || item.rates || '';
    const effectiveCap = changes.capacity || item.capacity || item.stockCount || 'Ready Stock';
    const effectiveLocation = changes.location || item.location || selectedCity;
    const effectiveTiming = changes.timing || item.timing || item.activeHours || '09:00 AM - 09:00 PM';
    const effectiveCat = changes.category || item.category || 'property';
    const effectiveSubCat = changes.subCategory || changes.sub_category || item.subCategory || item.sub_category || 'all';
    const effectiveDesc = changes.description || item.description || '';

    const photos = changes.images || changes.image_urls || item.images || (changes.image ? [changes.image] : [item.image]);
    const cleanPhotos = photos.map((p) => (typeof p === 'string' ? p : p.url || p.preview)).filter(Boolean);
    const videos = changes.videos || changes.video_urls || item.videos || [];

    let parsedPoints = ['', '', '', ''];
    if (effectiveDesc) {
      const lines = effectiveDesc.split('\n').map((l) => l.replace(/^[•\-\d.\s]+/, '').trim()).filter(Boolean);
      parsedPoints = [lines[0] || '', lines[1] || '', lines[2] || '', lines[3] || ''];
    }

    setEditFormData({
      title: effectiveTitle,
      category: effectiveCat,
      subCategory: effectiveSubCat,
      price: effectivePrice,
      capacity: effectiveCap,
      location: effectiveLocation,
      timing: effectiveTiming,
      description: effectiveDesc,
      descPoints: parsedPoints,
      images: cleanPhotos,
      videos: videos,
    });

    setInspectingItem(item);
    setIsAdminEditing(false);
    setActivePhotoIdx(0);
    setActiveVideoIdx(0);
    setActiveMediaTab('photos');
    setFeedbackText(item.admin_feedback || '');
    setRecordedVoiceNote(null);
  };

  // 📷 Admin Add Photo Handler
  const handleAdminAddPhoto = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newPreviews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      isNew: true,
    }));
    setEditFormData((prev) => ({ ...prev, images: [...prev.images, ...newPreviews] }));
    e.target.value = '';
  };

  const handleAdminRemovePhoto = (idx) => {
    setEditFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  // 🎥 Admin Add Video Handler
  const handleAdminAddVideo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const tempUrl = URL.createObjectURL(file);
    setEditFormData((prev) => ({
      ...prev,
      videos: [...prev.videos, { file, url: tempUrl, name: file.name, duration: 30, isNew: true }],
    }));
    e.target.value = '';
  };

  const handleAdminRemoveVideo = (idx) => {
    setEditFormData((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== idx),
    }));
  };

  // 🟢 Approve & Publish Handler
  const handleApprove = async (item) => {
    setActionInProgressId(item.id);
    try {
      let finalChanges = item.pending_changes || {};
      let finalImages = editFormData.images;
      let finalVideos = editFormData.videos;

      if (isAdminEditing) {
        const newImageFiles = finalImages.filter((img) => img?.file).map((img) => img.file);
        const uploadedNewImageUrls = newImageFiles.length > 0 ? await uploadListingImagesToStorage(newImageFiles) : [];
        const existingImageUrls = finalImages.filter((img) => typeof img === 'string');
        finalImages = [...existingImageUrls, ...uploadedNewImageUrls];

        const newVideoObjects = finalVideos.filter((v) => v?.file);
        const uploadedNewVideos = newVideoObjects.length > 0 ? await uploadListingVideosToStorage(newVideoObjects) : [];
        const existingVideos = finalVideos.filter((v) => !v?.file);
        finalVideos = [...existingVideos, ...uploadedNewVideos];

        const validPoints = editFormData.descPoints.filter((p) => p && p.trim().length > 0);
        const combinedDesc =
          validPoints.length > 0
            ? validPoints.map((p) => `• ${p.trim()}`).join('\n')
            : editFormData.title;

        finalChanges = {
          ...finalChanges,
          title: editFormData.title.trim(),
          name: editFormData.title.trim(),
          category: editFormData.category,
          subCategory: editFormData.subCategory,
          sub_category: editFormData.subCategory,
          price: editFormData.price.trim(),
          rates: editFormData.price.trim(),
          startingPackage: editFormData.price.trim(),
          capacity: editFormData.capacity.trim(),
          stockCount: editFormData.capacity.trim(),
          location: editFormData.location.trim(),
          timing: editFormData.timing.trim(),
          activeHours: editFormData.timing.trim(),
          description: combinedDesc,
          image: finalImages[0] || item.image,
          images: finalImages,
          image_urls: finalImages,
          videos: finalVideos,
          video_urls: finalVideos.map((v) => (typeof v === 'string' ? v : v.url)),
        };
      }

      const updatedPayload = {
        ...item,
        ...finalChanges,
        is_active: true,
        has_pending_approval: false,
        pending_changes: null,
        admin_feedback: null,
        badge: '🟢 Verified Listing',
      };

      await approveListingChanges(item.id, updatedPayload);
      hyperlocalStore.insertListing(updatedPayload.category || item.category, updatedPayload);

      const notifObj = {
        tag: 'APPROVED',
        title: `Listing Approved: "${finalChanges.title || item.title}"`,
        message: `Listing is verified and live across ${selectedCity}${isAdminEditing ? ' with verified admin media/text corrections.' : '.'}`,
        targetId: item.id,
        category: updatedPayload.category,
        recipient_role: 'seller',
        recipient_phone: finalChanges.phone || item.phone,
      };
      await saveNotificationToDB(notifObj);
      hyperlocalStore.addNotification(notifObj);

      if (inspectingItem?.id === item.id) {
        setInspectingItem(null);
        setIsAdminEditing(false);
      }
    } catch (err) {
      console.error('Approve error:', err);
      alert('Failed to approve listing. Please check your network connection.');
    } finally {
      setActionInProgressId(null);
    }
  };

  // 🔴 Reject Changes Handler
  const handleReject = async (item) => {
    setActionInProgressId(item.id);
    try {
      const reason = feedbackText.trim() || 'Listing could not be approved based on community guidelines.';
      await rejectListingChanges(item.id, reason);
      const cleanedPayload = {
        ...item,
        has_pending_approval: false,
        pending_changes: null,
        admin_feedback: reason,
      };
      hyperlocalStore.insertListing(item.category, cleanedPayload);

      const notifObj = {
        tag: 'REJECTED',
        title: `Changes Rejected: "${item.title}"`,
        message: reason,
        targetId: item.id,
        category: item.category,
        recipient_role: 'seller',
        recipient_phone: item.phone,
      };
      await saveNotificationToDB(notifObj);
      hyperlocalStore.addNotification(notifObj);

      if (inspectingItem?.id === item.id) {
        setInspectingItem(null);
        setIsAdminEditing(false);
      }
    } catch (err) {
      console.error('Reject error:', err);
      alert('Failed to reject changes.');
    } finally {
      setActionInProgressId(null);
    }
  };

  // 🎙️ Admin Voice Recording Handlers
  const handleStartAdminVoice = async () => {
    try {
      const stream = await getOptimizedVoiceStream();
      audioChunksRef.current = [];
      const mediaRecorder = createOptimizedMediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      setIsRecordingVoice(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      alert('Microphone access denied. Please allow microphone permissions.');
    }
  };

  const handleStopAdminVoice = () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return;

    mediaRecorder.onstop = async () => {
      clearInterval(timerRef.current);
      setIsUploadingVoice(true);

      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        const publicAudioUrl = await uploadVoiceNoteToStorage(audioBlob);
        const durationStr = `0:${recordingSeconds < 10 ? '0' : ''}${recordingSeconds}`;

        setRecordedVoiceNote({
          audioUrl: publicAudioUrl,
          duration: durationStr,
        });
      } catch (err) {
        console.error('Audio upload failed:', err);
      } finally {
        if (mediaRecorder.stream) mediaRecorder.stream.getTracks().forEach((t) => t.stop());
        setIsRecordingVoice(false);
        setRecordingSeconds(0);
        setIsUploadingVoice(false);
      }
    };

    mediaRecorder.stop();
  };

  const handleCancelAdminVoice = () => {
    if (mediaRecorderRef.current) {
      clearInterval(timerRef.current);
      if (mediaRecorderRef.current.stream) mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
      setIsRecordingVoice(false);
      setRecordingSeconds(0);
    }
  };

  const handleSendFeedbackNote = async (item) => {
    if (!feedbackText.trim() && !recordedVoiceNote) {
      alert('Please enter a feedback message or record a voice note.');
      return;
    }

    setIsSendingFeedback(true);
    try {
      const sellerPhone = item.pending_changes?.phone || item.phone;
      const feedbackPayload = {
        text: feedbackText.trim() || '🎤 Voice note review feedback from TownHub Admin',
        audioUrl: recordedVoiceNote?.audioUrl || null,
        duration: recordedVoiceNote?.duration || null,
      };

      await sendAdminFeedbackToSeller(item.id, sellerPhone, feedbackPayload);

      const updatedItem = {
        ...item,
        admin_feedback: recordedVoiceNote
          ? JSON.stringify(feedbackPayload)
          : feedbackText.trim(),
      };
      hyperlocalStore.insertListing(item.category, updatedItem);

      alert(`Feedback note sent directly to merchant (${sellerPhone}).`);
      setFeedbackText('');
      setRecordedVoiceNote(null);
      if (inspectingItem?.id === item.id) setInspectingItem(null);
    } catch {
      alert('Failed to send feedback note.');
    } finally {
      setIsSendingFeedback(false);
    }
  };

  // =========================================================================
  // 🔒 MASTER ADMIN AUTH GATE
  // =========================================================================
  if (!isAdminAuth) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 font-sans select-none">
        <div className="w-full max-w-sm bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 text-2xl flex items-center justify-center mx-auto shadow-md">
              👑
            </div>
            <h2 className="text-sm font-black text-slate-100">Master Admin Control</h2>
            <p className="text-[10px] text-slate-400">
              Enter your Master Secret Key to access the content moderation queue.
            </p>
          </div>

          <form onSubmit={handleVerifyAdminKey} className="space-y-3 text-xs">
            <div>
              <label className="text-[9.5px] font-bold text-slate-300 block mb-1">
                Admin Secret Key (मास्टर की) *
              </label>
              <input
                type="password"
                required
                autoFocus
                value={enteredKey}
                onChange={(e) => setEnteredKey(e.target.value)}
                placeholder="Enter secret key..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold focus:border-amber-400 focus:outline-hidden text-center text-sm tracking-wider"
              />
            </div>

            {keyError && (
              <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-[9.5px] text-rose-300 text-center font-bold">
                ⚠️ {keyError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs rounded-xl shadow-lg active:scale-95 transition cursor-pointer"
            >
              Unlock Moderation Queue ➔
            </button>
          </form>

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-28 select-none">
      
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-300 font-black text-xs flex items-center justify-center transition cursor-pointer"
          >
            ←
          </button>
          <div>
            <div className="flex items-center space-x-1.5 text-[9px] font-black text-amber-400 tracking-wider">
              <span>👑 MASTER ADMIN CONTROL</span>
              <span>•</span>
              <span className="text-slate-400">{selectedCity.toUpperCase()}</span>
            </div>
            <h2 className="text-xs font-black text-slate-100">
              Content & Seller Moderation Queue
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs border border-slate-700 transition cursor-pointer"
            title="Refresh Database Queue"
          >
            {isRefreshing ? '⏳' : '🔄'}
          </button>

          <button
            type="button"
            onClick={handleAdminLogout}
            title="Lock and Log Out of Admin"
            className="px-2.5 py-1 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-[10px] font-bold border border-rose-800 transition cursor-pointer flex items-center space-x-1"
          >
            <span>🔒</span>
            <span>Lock & Exit</span>
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto p-3.5 space-y-3.5">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-900 border border-amber-500/40 p-2.5 rounded-2xl text-center shadow-xs">
            <span className="block text-base font-black text-amber-300">{pendingApprovals.length}</span>
            <span className="text-[8.5px] text-amber-300/80 font-bold uppercase tracking-wider">Pending</span>
          </div>
          <div className="bg-slate-900 border border-emerald-500/40 p-2.5 rounded-2xl text-center shadow-xs">
            <span className="block text-base font-black text-emerald-400">{approvedListings.length}</span>
            <span className="text-[8.5px] text-emerald-300/80 font-bold uppercase tracking-wider">Approved Live</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl text-center shadow-xs">
            <span className="block text-base font-black text-slate-300">{allFilteredListings.length}</span>
            <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider">Total Listings</span>
          </div>
        </div>

        {/* 🌟 4-Way Tab Switcher with Resident CRM */}
        <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-[9.5px]">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`py-2 text-center rounded-xl font-black transition cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pending ({pendingApprovals.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`py-2 text-center rounded-xl font-black transition cursor-pointer ${
              activeTab === 'approved'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Approved ({approvedListings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`py-2 text-center rounded-xl font-black transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-slate-700 to-slate-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({allFilteredListings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`py-2 text-center rounded-xl font-black transition cursor-pointer flex items-center justify-center space-x-0.5 ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md'
                : 'text-slate-400 hover:text-purple-300'
            }`}
          >
            <span>👥</span>
            <span>Users</span>
          </button>
        </div>

        {/* 🌟 USER MANAGEMENT CRM TAB */}
        {activeTab === 'users' && (
          <div className="animate-fade-in">
            <UserManagementCRM selectedCity={selectedCity} />
          </div>
        )}

        {/* LISTINGS CONTENT & FILTERS (Only shown for listings tabs) */}
        {activeTab !== 'users' && (
          <>
            {/* ⏱️ Dynamic Time Filter Bar */}
            <div className="p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                  <span>⏱️ Filter Timeline</span>
                </span>

                <select
                  value={timeFilterType}
                  onChange={(e) => {
                    setTimeFilterType(e.target.value);
                    if (e.target.value === 'hours') setTimeValue(1);
                    if (e.target.value === 'days') setTimeValue(1);
                  }}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1 text-slate-200 font-bold text-[10px] focus:outline-hidden"
                >
                  <option value="all">All Time (हमेशा)</option>
                  <option value="hours">Hours Range (घंटे)</option>
                  <option value="days">Days Range (दिन)</option>
                  <option value="last_week">Last Week (पिछले 7 दिन)</option>
                  <option value="last_month">Last Month (पिछला महीना)</option>
                  <option value="this_year">This Year (इस साल)</option>
                </select>
              </div>

              {timeFilterType === 'hours' && (
                <div className="flex items-center justify-between p-2 bg-slate-950 rounded-xl border border-slate-800 text-[10px]">
                  <span className="text-amber-300 font-bold">Past {timeValue} Hour{timeValue > 1 ? 's' : ''}:</span>
                  <div className="flex items-center space-x-1.5">
                    {[1, 2, 4, 8, 12, 24].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setTimeValue(h)}
                        className={`px-2 py-0.5 rounded-lg font-mono font-bold transition cursor-pointer ${
                          timeValue === h ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {timeFilterType === 'days' && (
                <div className="flex items-center justify-between p-2 bg-slate-950 rounded-xl border border-slate-800 text-[10px]">
                  <span className="text-cyan-300 font-bold">Past {timeValue} Day{timeValue > 1 ? 's' : ''}:</span>
                  <div className="flex items-center space-x-1.5">
                    {[1, 2, 3, 5, 7].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setTimeValue(d)}
                        className={`px-2 py-0.5 rounded-lg font-mono font-bold transition cursor-pointer ${
                          timeValue === d ? 'bg-cyan-400 text-slate-950' : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Search & Sector Filters */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search by title, phone, or merchant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
              />

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-xs text-amber-300 font-bold focus:outline-hidden"
              >
                <option value="all">All Sectors</option>
                {Object.keys(TAXONOMY_REGISTRY).map((catKey) => {
                  const cat = TAXONOMY_REGISTRY[catKey];
                  return <option key={cat.id} value={cat.id}>{cat.name.split('(')[0]}</option>;
                })}
              </select>
            </div>

            {/* 1. Pending Approvals Queue Tab */}
            {activeTab === 'pending' && (
              <div className="space-y-3">
                {pendingApprovals.length === 0 ? (
                  <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-1.5">
                    <span className="text-2xl block">✅</span>
                    <h4 className="text-xs font-black text-slate-200">No Pending Reviews</h4>
                    <p className="text-[10px] text-slate-400">All submissions in this time window have been approved.</p>
                  </div>
                ) : (
                  pendingApprovals.map((item) => {
                    const changes = item.pending_changes || {};
                    const isProposal = Boolean(item.pending_changes);
                    const sellerPhone = changes.phone || item.phone;
                    const sellerName = changes.sellerName || item.sellerName;

                    return (
                      <div
                        key={item.id}
                        className="bg-slate-900 border border-amber-500/40 rounded-2xl p-3.5 space-y-3 shadow-md relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1 pr-2">
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider inline-block">
                              {isProposal ? '✏️ PROPOSED EDIT' : '🆕 NEW ENLISTMENT'}
                            </span>
                            <h4 className="text-xs font-black text-slate-100 mt-1 truncate">
                              {changes.title || item.title}
                            </h4>

                            {/* 👤 1-Tap Merchant Dossier Trigger */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSeller({ phone: sellerPhone, name: sellerName });
                                setSellerPortfolioTab('all');
                              }}
                              className="mt-0.5 text-[10px] text-amber-300 hover:text-amber-200 font-bold flex items-center space-x-1 cursor-pointer group"
                            >
                              <span className="group-hover:underline">👤 {sellerName}</span>
                              <span>•</span>
                              <span className="font-mono">📞 {sellerPhone}</span>
                              <span className="text-[8px] bg-amber-400/20 px-1 py-0.2 rounded text-amber-300 font-bold">
                                View All ({allListings.filter(l => String(l.phone || l.pending_changes?.phone).slice(-10) === String(sellerPhone).slice(-10)).length}) ➔
                              </span>
                            </button>
                          </div>

                          <span className="text-[9px] text-slate-400 font-semibold bg-slate-800 px-2 py-0.5 rounded-md shrink-0">
                            {changes.category || item.category}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[10px]">
                          <div>
                            <span className="text-slate-400 block text-[8.5px]">Price & Stock</span>
                            <span className="text-emerald-400 font-black">{changes.price || item.price}</span>
                            <span className="text-slate-400 text-[8.5px]"> • {changes.capacity || item.capacity || 'Ready Stock'}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenInspector(item)}
                            className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 text-slate-950 font-black text-[10px] rounded-xl shadow-md cursor-pointer active:scale-95 transition flex items-center space-x-1"
                          >
                            <span>🔍</span>
                            <span>Inspect & Review</span>
                          </button>
                        </div>

                        {/* Action Controls */}
                        <div className="flex items-center space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleApprove(item)}
                            disabled={actionInProgressId === item.id}
                            className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-[10.5px] rounded-xl shadow-md active:scale-95 transition cursor-pointer disabled:opacity-50"
                          >
                            {actionInProgressId === item.id ? 'Publishing... ⏳' : '✓ Quick Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(item)}
                            disabled={actionInProgressId === item.id}
                            className="px-3.5 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-black text-[10.5px] rounded-xl active:scale-95 transition cursor-pointer disabled:opacity-50"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* 2. Approved & Live Listings Tab */}
            {activeTab === 'approved' && (
              <div className="space-y-2.5">
                {approvedListings.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-900 border border-emerald-500/30 rounded-2xl flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[8px] font-black text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded-md border border-emerald-500/30">
                          LIVE
                        </span>
                        <h4 className="text-xs font-black text-slate-100 truncate">{item.title}</h4>
                      </div>
                      
                      {/* 👤 1-Tap Merchant Dossier */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSeller({ phone: item.phone, name: item.sellerName });
                          setSellerPortfolioTab('all');
                        }}
                        className="text-[9.5px] text-amber-300 hover:text-amber-200 mt-0.5 block text-left cursor-pointer"
                      >
                        👤 {item.sellerName} • 📞 {item.phone} • <span className="text-emerald-400 font-bold">{item.price}</span>
                      </button>
                    </div>
                    <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 shrink-0 uppercase">
                      {item.category}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 3. All Listings Tab */}
            {activeTab === 'all' && (
              <div className="space-y-2">
                {allFilteredListings.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="text-xs font-black text-slate-100 truncate">{item.title}</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSeller({ phone: item.phone, name: item.sellerName });
                          setSellerPortfolioTab('all');
                        }}
                        className="text-[9.5px] text-slate-400 hover:text-amber-300 text-left block cursor-pointer"
                      >
                        👤 {item.sellerName} • 📞 {item.phone} • <span className="text-amber-400 font-bold">{item.price}</span>
                      </button>
                    </div>
                    <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 shrink-0 uppercase">
                      {item.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 👤 1-TAP MERCHANT PORTFOLIO / DOSSIER MODAL                               */}
      {/* ========================================================================= */}
      {selectedSeller && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in select-none">
          <div className="bg-slate-900 border border-amber-500/40 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Dossier Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 shrink-0">
              <div className="flex items-center justify-between pb-2 border-b border-slate-900">
                <div>
                  <span className="text-[8.5px] font-black text-amber-400 uppercase tracking-wider block">
                    👑 MERCHANT DOSSIER & PORTFOLIO
                  </span>
                  <h3 className="text-sm font-black text-slate-100 flex items-center space-x-1.5 mt-0.5">
                    <span>👤 {selectedSeller.name}</span>
                  </h3>
                  <span className="text-cyan-300 font-mono text-[11px] block">📞 {selectedSeller.phone}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSeller(null)}
                  className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Instant WhatsApp & Phone Actions */}
              <div className="flex items-center justify-between pt-2.5">
                <span className="text-[9.5px] text-slate-400 font-bold">
                  Total Listings: <span className="text-amber-400">{sellerListings.length}</span>
                </span>
                
                <div className="flex items-center space-x-2">
                  <a
                    href={`https://wa.me/91${String(selectedSeller.phone).slice(-10)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 rounded-lg font-bold text-[9.5px] flex items-center space-x-1"
                  >
                    <span>💬</span>
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={`tel:+91${String(selectedSeller.phone).slice(-10)}`}
                    className="px-2.5 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-lg font-bold text-[9.5px] flex items-center space-x-1"
                  >
                    <span>📞</span>
                    <span>Call</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Categorization Pills */}
            <div className="p-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center space-x-1.5 overflow-x-auto text-[9.5px] font-bold shrink-0">
              <button
                type="button"
                onClick={() => setSellerPortfolioTab('all')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  sellerPortfolioTab === 'all' ? 'bg-slate-700 text-white font-black' : 'bg-slate-900 text-slate-400'
                }`}
              >
                All ({sellerListings.length})
              </button>

              <button
                type="button"
                onClick={() => setSellerPortfolioTab('approved')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  sellerPortfolioTab === 'approved' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 text-emerald-400'
                }`}
              >
                🟢 Live ({sellerApproved.length})
              </button>

              <button
                type="button"
                onClick={() => setSellerPortfolioTab('pending')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  sellerPortfolioTab === 'pending' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-900 text-amber-300'
                }`}
              >
                ⏳ Pending ({sellerPending.length})
              </button>

              <button
                type="button"
                onClick={() => setSellerPortfolioTab('feedback')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  sellerPortfolioTab === 'feedback' ? 'bg-cyan-400 text-slate-950 font-black' : 'bg-slate-900 text-cyan-300'
                }`}
              >
                💬 Replied/Notes ({sellerFeedbackActive.length})
              </button>
            </div>

            {/* Portfolio Listings Scroll Area */}
            <div className="p-3.5 overflow-y-auto space-y-2.5 flex-1">
              {displayedSellerListings.length === 0 ? (
                <div className="text-center p-8 text-slate-500 text-xs font-bold">
                  No listings in this category.
                </div>
              ) : (
                displayedSellerListings.map((item) => {
                  const isPending = item.has_pending_approval || !item.is_active || Boolean(item.pending_changes);
                  const hasFeedback = Boolean(item.admin_feedback) || Boolean(item.seller_feedback_reply);

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border bg-slate-950 space-y-2 ${
                        hasFeedback
                          ? 'border-cyan-500/40 bg-cyan-950/20'
                          : isPending
                          ? 'border-amber-500/40'
                          : 'border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center space-x-1.5 mb-1">
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                              {item.category}
                            </span>
                            {isPending && (
                              <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                ⏳ PENDING
                              </span>
                            )}
                            {hasFeedback && (
                              <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                                💬 FEEDBACK
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-black text-slate-100 truncate">
                            {item.pending_changes?.title || item.title}
                          </h4>
                          <span className="text-emerald-400 font-bold text-[10px]">
                            {item.pending_changes?.price || item.price}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenInspector(item)}
                          className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[9.5px] rounded-xl shadow cursor-pointer shrink-0"
                        >
                          🔍 Inspect
                        </button>
                      </div>

                      {item.admin_feedback && (
                        <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[9px] text-amber-200">
                          👑 <strong>Your Note:</strong> "{item.admin_feedback}"
                        </div>
                      )}

                      {item.seller_feedback_reply && (
                        <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-400/30 text-[9px] text-cyan-200">
                          👤 <strong>Merchant Reply:</strong> "{item.seller_feedback_reply}"
                        </div>
                      )}

                      {isPending && (
                        <div className="flex items-center space-x-2 pt-1 border-t border-slate-900">
                          <button
                            type="button"
                            onClick={() => handleApprove(item)}
                            disabled={actionInProgressId === item.id}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9.5px] rounded-lg cursor-pointer"
                          >
                            ✓ Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(item)}
                            disabled={actionInProgressId === item.id}
                            className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-black text-[9.5px] rounded-lg cursor-pointer"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔍 FULL INTERACTIVE REVIEW STUDIO MODAL                                   */}
      {/* ========================================================================= */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in select-none">
          <div className="bg-slate-900 border border-amber-500/40 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            
            {/* Modal Top Bar */}
            <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="min-w-0 pr-2">
                <span className="text-[8.5px] font-black text-amber-400 uppercase tracking-wider block">
                  🔍 MODERATION INSPECTOR {isAdminEditing && '• ✏️ CORRECTION MODE'}
                </span>
                <h3 className="text-xs font-black text-slate-100 truncate">
                  {inspectingItem.pending_changes?.title || inspectingItem.title}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAdminEditing((prev) => !prev)}
                  className={`px-2.5 py-1 rounded-xl text-[9.5px] font-black transition cursor-pointer ${
                    isAdminEditing
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-amber-300 border border-amber-400/40'
                  }`}
                >
                  {isAdminEditing ? '👁️ View Original' : '✏️ Edit & Correct'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInspectingItem(null);
                    setIsAdminEditing(false);
                  }}
                  className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable Inspector Studio */}
            <div className="p-4 overflow-y-auto space-y-3.5 flex-1 text-xs">
              
              {/* Media Player Box with Fullscreen Trigger */}
              {(() => {
                const photos = editFormData.images || [];
                const cleanPhotos = photos.map((p) => (typeof p === 'string' ? p : p.url || p.preview)).filter(Boolean);
                const videos = editFormData.videos || [];

                return (
                  <div className="space-y-2">
                    {/* Media Mode Tabs */}
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setActiveMediaTab('photos')}
                        className={`flex-1 py-1 rounded-lg transition cursor-pointer ${
                          activeMediaTab === 'photos' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400'
                        }`}
                      >
                        📷 Photos ({cleanPhotos.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveMediaTab('videos')}
                        className={`flex-1 py-1 rounded-lg transition cursor-pointer ${
                          activeMediaTab === 'videos' ? 'bg-cyan-400 text-slate-950 font-black' : 'text-slate-400'
                        }`}
                      >
                        🎬 Videos ({videos.length})
                      </button>
                    </div>

                    {/* Preview Screen */}
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-inner flex items-center justify-center group">
                      {activeMediaTab === 'photos' || videos.length === 0 ? (
                        cleanPhotos.length > 0 ? (
                          <img
                            src={cleanPhotos[activePhotoIdx] || cleanPhotos[0]}
                            alt="Inspect"
                            onClick={() => {
                              setLightboxIndex(activePhotoIdx);
                              setLightboxType('photos');
                              setIsLightboxOpen(true);
                            }}
                            className="w-full h-full object-contain cursor-zoom-in"
                          />
                        ) : (
                          <span className="text-slate-500 text-xs">No photos attached</span>
                        )
                      ) : (
                        <video
                          key={videos[activeVideoIdx]?.url || videos[activeVideoIdx]?.preview}
                          src={videos[activeVideoIdx]?.url || videos[activeVideoIdx]?.preview}
                          controls
                          autoPlay
                          playsInline
                          className="w-full h-full object-contain"
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setLightboxIndex(activeMediaTab === 'photos' ? activePhotoIdx : activeVideoIdx);
                          setLightboxType(activeMediaTab);
                          setIsLightboxOpen(true);
                        }}
                        className="absolute bottom-2 right-2 px-2 py-1 bg-slate-950/80 backdrop-blur-md rounded-lg text-white text-[9px] font-bold border border-slate-700 cursor-pointer shadow-md"
                      >
                        🔍 Tap for Fullscreen
                      </button>
                    </div>

                    {/* Photo Thumbnails */}
                    {activeMediaTab === 'photos' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-slate-400 font-bold">Attached Photos</span>
                          {isAdminEditing && (
                            <button
                              type="button"
                              onClick={() => adminPhotoInputRef.current?.click()}
                              className="text-amber-300 font-black underline cursor-pointer"
                            >
                              + Add Photo
                            </button>
                          )}
                          <input type="file" ref={adminPhotoInputRef} multiple accept="image/*" onChange={handleAdminAddPhoto} className="hidden" />
                        </div>

                        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                          {cleanPhotos.map((imgUrl, idx) => (
                            <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 group">
                              <img
                                src={imgUrl}
                                alt="thumb"
                                onClick={() => setActivePhotoIdx(idx)}
                                className={`w-full h-full object-cover cursor-pointer ${activePhotoIdx === idx ? 'border-amber-400' : 'opacity-60'}`}
                              />
                              {isAdminEditing && (
                                <button
                                  type="button"
                                  onClick={() => handleAdminRemovePhoto(idx)}
                                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center text-[8px] font-black cursor-pointer shadow"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Video Thumbnails */}
                    {activeMediaTab === 'videos' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-slate-400 font-bold">Attached Videos</span>
                          {isAdminEditing && (
                            <button
                              type="button"
                              onClick={() => adminVideoInputRef.current?.click()}
                              className="text-cyan-300 font-black underline cursor-pointer"
                            >
                              + Add Video
                            </button>
                          )}
                          <input type="file" ref={adminVideoInputRef} accept="video/*" onChange={handleAdminAddVideo} className="hidden" />
                        </div>

                        {videos.length > 0 && (
                          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                            {videos.map((vid, idx) => (
                              <div key={idx} className="relative shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setActiveVideoIdx(idx)}
                                  className={`py-1.5 px-3 rounded-xl text-[10px] font-black transition cursor-pointer ${
                                    activeVideoIdx === idx
                                      ? 'bg-cyan-400 text-slate-950 shadow-md'
                                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                                  }`}
                                >
                                  🎬 Video {idx + 1}
                                </button>
                                {isAdminEditing && (
                                  <button
                                    type="button"
                                    onClick={() => handleAdminRemoveVideo(idx)}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center text-[8px] font-black cursor-pointer shadow"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ✏️ ADMIN EDITING & CORRECTION FIELDS */}
              {isAdminEditing ? (
                <div className="space-y-3 bg-slate-950 p-3.5 rounded-2xl border border-amber-400/40 text-[10.5px]">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                    <span className="text-[9.5px] font-black text-amber-300 uppercase">
                      ✏️ Edit Listing Details & Media as Admin
                    </span>
                    <span className="text-[8.5px] text-slate-400">Merchant will get notified</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8.5px] font-bold text-slate-400 block mb-1">Sector *</label>
                      <select
                        value={editFormData.category}
                        onChange={(e) => {
                          const newCat = e.target.value;
                          const catObj = getCategoryById(newCat);
                          setEditFormData((prev) => ({
                            ...prev,
                            category: newCat,
                            subCategory: catObj?.subCategories?.[0]?.id || 'all',
                          }));
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-slate-100 text-[10px] font-bold"
                      >
                        {Object.keys(TAXONOMY_REGISTRY).map((catKey) => {
                          const cat = TAXONOMY_REGISTRY[catKey];
                          return <option key={cat.id} value={cat.id}>{cat.name.split('(')[0]}</option>;
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="text-[8.5px] font-bold text-slate-400 block mb-1">Subcategory *</label>
                      <select
                        value={editFormData.subCategory}
                        onChange={(e) => setEditFormData({ ...editFormData, subCategory: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-slate-100 text-[10px] font-bold"
                      >
                        <option value="all">🌟 All / General</option>
                        {(getCategoryById(editFormData.category)?.subCategories || []).map((sub) => (
                          <option key={sub.id} value={sub.id}>{sub.name.split('(')[0]}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[8.5px] font-bold text-slate-400 block mb-1">Listing Title *</label>
                    <input
                      type="text"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8.5px] font-bold text-slate-400 block mb-1">Price Rate *</label>
                      <input
                        type="text"
                        value={editFormData.price}
                        onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-emerald-400 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[8.5px] font-bold text-slate-400 block mb-1">Stock / Units</label>
                      <input
                        type="text"
                        value={editFormData.capacity}
                        onChange={(e) => setEditFormData({ ...editFormData, capacity: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-cyan-300 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8.5px] font-bold text-slate-400 block mb-1">Active Hours</label>
                      <input
                        type="text"
                        value={editFormData.timing}
                        onChange={(e) => setEditFormData({ ...editFormData, timing: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-200 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[8.5px] font-bold text-slate-400 block mb-1">Location</label>
                      <input
                        type="text"
                        value={editFormData.location}
                        onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-200 font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[8.5px] font-bold text-slate-400 block">4 Key Highlights</label>
                    {[0, 1, 2, 3].map((idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={editFormData.descPoints[idx]}
                        onChange={(e) => {
                          const next = [...editFormData.descPoints];
                          next[idx] = e.target.value;
                          setEditFormData({ ...editFormData, descPoints: next });
                        }}
                        placeholder={`Point ${idx + 1}...`}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-slate-200 text-[10px]"
                      />
                    ))}
                  </div>
                </div>
              ) : (
                (() => {
                  const changes = inspectingItem.pending_changes || {};
                  const sellerPhone = changes.phone || inspectingItem.phone;
                  const sellerName = changes.sellerName || inspectingItem.sellerName;

                  return (
                    <div className="space-y-2.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-[10.5px]">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                        <div>
                          <span className="text-[8.5px] text-slate-400 uppercase block">Merchant Contact</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSeller({ phone: sellerPhone, name: sellerName });
                              setSellerPortfolioTab('all');
                            }}
                            className="text-slate-100 font-black hover:text-amber-300 text-left block cursor-pointer"
                          >
                            👤 {sellerName} <span className="text-amber-400 text-[9px] underline ml-1 font-normal">(View Portfolio ➔)</span>
                          </button>
                          <span className="text-cyan-300 font-mono block">📞 {sellerPhone}</span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <a
                            href={`https://wa.me/91${String(sellerPhone).slice(-10)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 rounded-lg font-bold text-[9.5px]"
                          >
                            💬 WhatsApp
                          </a>
                          <a
                            href={`tel:+91${String(sellerPhone).slice(-10)}`}
                            className="px-2 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-lg font-bold text-[9.5px]"
                          >
                            📞 Call
                          </a>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-b border-slate-900 pb-2">
                        <div>
                          <span className="text-[8.5px] text-slate-500 uppercase block">Price Rate</span>
                          <span className="text-emerald-400 font-black text-xs">{changes.price || inspectingItem.price}</span>
                        </div>
                        <div>
                          <span className="text-[8.5px] text-slate-500 uppercase block">Ready Stock</span>
                          <span className="text-cyan-300 font-bold">{changes.capacity || inspectingItem.capacity || 'Ready Stock'}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-b border-slate-900 pb-2">
                        <div>
                          <span className="text-[8.5px] text-slate-500 uppercase block">Active Hours</span>
                          <span className="text-slate-200 font-bold">{changes.timing || inspectingItem.timing || '09:00 AM - 09:00 PM'}</span>
                        </div>
                        <div>
                          <span className="text-[8.5px] text-slate-500 uppercase block">Location</span>
                          <span className="text-slate-300 truncate block">📍 {changes.location || inspectingItem.location || 'Alwar'}</span>
                        </div>
                      </div>

                      {(changes.description || inspectingItem.description) && (
                        <div>
                          <span className="text-[8.5px] text-slate-400 uppercase block mb-1">Key Highlights:</span>
                          <div className="text-slate-200 leading-relaxed whitespace-pre-line text-[10px]">
                            {changes.description || inspectingItem.description}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}

              {/* 📬 Merchant Reply Inspector Box */}
              {inspectingItem.seller_feedback_reply && (
                <div className="p-3 bg-cyan-950/40 rounded-2xl border border-cyan-400/50 space-y-1.5 text-[10px]">
                  <span className="font-black text-cyan-300 flex items-center space-x-1">
                    <span>💬</span>
                    <span>Merchant Response to Your Feedback:</span>
                  </span>

                  {(() => {
                    let parsed = null;
                    if (
                      typeof inspectingItem.seller_feedback_reply === 'string' &&
                      inspectingItem.seller_feedback_reply.startsWith('{')
                    ) {
                      try {
                        parsed = JSON.parse(inspectingItem.seller_feedback_reply);
                      } catch {}
                    }

                    if (parsed && parsed.audioUrl) {
                      return (
                        <div className="space-y-1">
                          <VoiceNotePlayer audioUrl={parsed.audioUrl} duration={parsed.duration} senderName="Merchant Voice Reply" />
                          {parsed.text && <p className="text-cyan-100 italic">"{parsed.text}"</p>}
                        </div>
                      );
                    }

                    return <p className="text-cyan-100">"{inspectingItem.seller_feedback_reply}"</p>;
                  })()}
                </div>
              )}

              {/* 🎙️ Admin Voice & Text Feedback to Merchant */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-amber-500/30 space-y-2.5">
                <label className="text-[10px] font-black text-amber-300 flex items-center justify-between">
                  <span>🎙️ Voice Note & Text Review to Merchant:</span>
                  <span className="text-[8.5px] text-slate-400">Merchant will listen directly</span>
                </label>

                {isRecordingVoice ? (
                  <div className="flex items-center justify-between p-2 bg-rose-950/40 border border-rose-600/50 rounded-xl animate-pulse">
                    <span className="text-xs font-black text-rose-300">
                      {isUploadingVoice ? 'Saving voice...' : `Recording: 0:${recordingSeconds < 10 ? '0' : ''}${recordingSeconds}`}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <button type="button" onClick={handleCancelAdminVoice} className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[9px] rounded-lg cursor-pointer">Cancel</button>
                      <button type="button" onClick={handleStopAdminVoice} className="px-2.5 py-0.5 bg-emerald-600 text-white font-black text-[10px] rounded-lg cursor-pointer">Done ✓</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleStartAdminVoice}
                      className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl flex items-center space-x-1 shadow-md cursor-pointer active:scale-95"
                    >
                      <span>🎙️</span>
                      <span>Record Voice Note</span>
                    </button>

                    {recordedVoiceNote && (
                      <span className="text-emerald-400 font-bold text-[10px]">
                        ✓ Voice Note Attached ({recordedVoiceNote.duration})
                      </span>
                    )}
                  </div>
                )}

                {recordedVoiceNote && (
                  <div className="p-2 bg-slate-900 rounded-xl border border-emerald-500/30">
                    <VoiceNotePlayer audioUrl={recordedVoiceNote.audioUrl} duration={recordedVoiceNote.duration} senderName="Your Admin Voice Note" />
                  </div>
                )}

                <textarea
                  rows={2}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Or type notes: e.g. Please update with a clearer front photo..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-hidden"
                />

                <button
                  type="button"
                  onClick={() => handleSendFeedbackNote(inspectingItem)}
                  disabled={isSendingFeedback || (!feedbackText.trim() && !recordedVoiceNote)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-[10px] font-black transition cursor-pointer active:scale-95 disabled:opacity-40"
                >
                  {isSendingFeedback ? 'Sending Voice Feedback...' : '📩 Send Feedback Note (Keep Pending)'}
                </button>
              </div>

            </div>

            {/* Modal Bottom Actions */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => handleApprove(inspectingItem)}
                disabled={actionInProgressId === inspectingItem.id}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs rounded-xl shadow-lg active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                {actionInProgressId === inspectingItem.id
                  ? 'Publishing Live... ⏳'
                  : isAdminEditing
                  ? '✓ Approve with Corrections & Publish'
                  : '✓ Approve & Publish Live'}
              </button>

              <button
                type="button"
                onClick={() => handleReject(inspectingItem)}
                disabled={actionInProgressId === inspectingItem.id}
                className="px-4 py-2.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-black text-xs rounded-xl active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                ✕ Reject
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📷 FULLSCREEN MEDIA LIGHTBOX                                              */}
      {/* ========================================================================= */}
      {isLightboxOpen && inspectingItem && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 animate-fade-in select-none">
          <div className="flex items-center justify-between text-white pb-2">
            <span className="text-xs font-black">
              {lightboxType === 'photos'
                ? `Photo ${lightboxIndex + 1} of ${(editFormData.images || []).length}`
                : `Walkthrough Video ${lightboxIndex + 1}`}
            </span>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            {lightboxType === 'photos' ? (
              <img
                src={
                  (editFormData.images || [])[lightboxIndex] ||
                  inspectingItem.image
                }
                alt="Fullscreen Preview"
                className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl"
              />
            ) : (
              <video
                src={
                  (editFormData.videos || [])[lightboxIndex]?.url ||
                  (editFormData.videos || [])[lightboxIndex]?.preview ||
                  (editFormData.videos || [])[lightboxIndex]
                }
                controls
                autoPlay
                playsInline
                className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl"
              />
            )}

            {lightboxType === 'photos' && (editFormData.images || []).length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setLightboxIndex((prev) => Math.max(0, prev - 1))}
                  disabled={lightboxIndex === 0}
                  className="absolute left-2 w-10 h-10 rounded-full bg-slate-900/80 text-white flex items-center justify-center text-sm font-bold disabled:opacity-30 cursor-pointer"
                >
                  ❮
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      Math.min((editFormData.images || []).length - 1, prev + 1)
                    )
                  }
                  disabled={lightboxIndex === (editFormData.images || []).length - 1}
                  className="absolute right-2 w-10 h-10 rounded-full bg-slate-900/80 text-white flex items-center justify-center text-sm font-bold disabled:opacity-30 cursor-pointer"
                >
                  ❯
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}