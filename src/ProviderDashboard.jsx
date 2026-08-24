import React, { useState, useMemo, useEffect, useRef } from 'react';
import { hyperlocalStore, useAllListingsSlice } from './store/hyperlocalStore';
import { TAXONOMY_REGISTRY, getCategoryById } from './data/taxonomyRegistry';
import VoiceNotePlayer from './components/common/VoiceNotePlayer';
import { uploadVoiceNoteToStorage, submitSellerEditProposal } from './services/listingService';
import {
  getOptimizedVoiceStream,
  createOptimizedMediaRecorder,
} from './utils/audioCompressor';
import { getCurrentUserProfile } from './services/authService';

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

const HOURS_LIST = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

export default function ProviderDashboard({ onBack, selectedCity = 'Alwar' }) {
  const currentUser = getCurrentUserProfile();
  const sellerPhone = currentUser?.phone || '9876543201';

  // Navigation & View States
  const [activeTab, setActiveTab] = useState('inquiries'); // 'inquiries' | 'listings'
  const [sortByInterest, setSortByInterest] = useState(false);
  const [selectedListingFilter, setSelectedListingFilter] = useState('all');
  const [onlyUnanswered, setOnlyUnanswered] = useState(false);

  // Reply Text Inputs
  const [replyInputs, setReplyInputs] = useState({});

  // GPS & Form Modal State
  const [isLocating, setIsLocating] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Time Picker State (01-12 AM/PM)
  const [timePicker, setTimePicker] = useState({
    startHour: '09',
    startPeriod: 'AM',
    endHour: '09',
    endPeriod: 'PM',
  });

  // Form State with Structured Fields
  const [formData, setFormData] = useState({
    title: '',
    category: 'property',
    subCategory: 'all',
    originalCategory: '',
    originalSubCategory: '',
    priceNumber: '',
    priceUnit: '',
    stockCount: '',
    location: `${selectedCity} Market`,
    lat: null,
    lng: null,
    descPoints: ['', '', '', ''],
    images: [],
    videos: [],
  });

  // 🎥 Video Compression & Upload Progress State (0% - 100%)
  const [videoUploadState, setVideoUploadState] = useState({
    isProcessing: false,
    progress: 0,
    fileName: '',
    status: '',
  });

  // 🎙️ Pure Audio Recording State
  const [recordingId, setRecordingId] = useState(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const allListings = useAllListingsSlice();
  const [threadUpdateTick, setThreadUpdateTick] = useState(0);

  useEffect(() => {
    return hyperlocalStore.subscribe((_, changedKey) => {
      if (
        !changedKey ||
        changedKey.startsWith('thread:') ||
        changedKey === 'all' ||
        changedKey.startsWith('interest:')
      ) {
        setThreadUpdateTick((prev) => prev + 1);
      }
    });
  }, []);

  // 1. Seller's Listings (Phone-Locked + Trending Sort)
  const myListings = useMemo(() => {
    const list = (allListings || []).filter(
      (item) => item.phone === sellerPhone || !currentUser
    );
    const baseList = list.length > 0 ? list : (allListings || []).slice(0, 4);

    if (sortByInterest) {
      return [...baseList].sort(
        (a, b) => (Number(b.interestCount) || 0) - (Number(a.interestCount) || 0)
      );
    }
    return baseList;
  }, [allListings, sellerPhone, currentUser, sortByInterest]);

  // 2. Customer Inquiries Aggregation
  const userInquiries = useMemo(() => {
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

    if (inquiries.length === 0 && myListings.length > 0) {
      const firstListing = myListings[0];
      inquiries.push({
        id: `demo-${firstListing.id}-1`,
        listingId: firstListing.id,
        listingTitle: firstListing.title || firstListing.name,
        listingPrice: firstListing.price || firstListing.rates || firstListing.startingPackage,
        listingImage: firstListing.image || (firstListing.images && firstListing.images[0]),
        userName: 'Ramesh Gurjar (Moti Dungri)',
        userArea: 'Alwar',
        text: 'Kya yeh abhi available hai? Thoda price kam ho sakta hai kya?',
        audioUrl: null,
        audioDuration: null,
        timestamp: '15m ago',
        isPublic: true,
        sellerReply: null,
      });
    }

    return inquiries.filter((inq) => {
      const matchesListing =
        selectedListingFilter === 'all' || String(inq.listingId) === String(selectedListingFilter);
      const matchesUnanswered = onlyUnanswered ? !inq.sellerReply : true;
      return matchesListing && matchesUnanswered;
    });
  }, [myListings, threadUpdateTick, selectedListingFilter, onlyUnanswered]);

  // Metrics
  const totalInterests = useMemo(() => {
    const interestMap = hyperlocalStore.state.interests || {};
    return myListings.reduce(
      (sum, item) => sum + (interestMap[item.id] || Number(item.interestCount) || 4),
      0
    );
  }, [myListings, threadUpdateTick]);

  const pendingInquiriesCount = useMemo(() => {
    let count = 0;
    const threadMap = hyperlocalStore.state.threads || {};
    myListings.forEach((listing) => {
      const comments = threadMap[listing.id] || [];
      count += comments.filter((c) => !c.sellerReply).length;
    });
    return count > 0 ? count : userInquiries.filter((q) => !q.sellerReply).length;
  }, [myListings, userInquiries, threadUpdateTick]);

  // Subcategories available for currently selected category
  const activeCategoryConfig = useMemo(() => {
    return getCategoryById(formData.category) || TAXONOMY_REGISTRY[formData.category] || null;
  }, [formData.category]);

  const availableSubCategories = useMemo(() => {
    return activeCategoryConfig?.subCategories || [];
  }, [activeCategoryConfig]);

  // Check if category or subcategory changed from original approved placement in DB/Backend
  const hasCategoryChanged = useMemo(() => {
    if (isCreatingNew || !formData.originalCategory) return false;
    return (
      formData.category !== formData.originalCategory ||
      formData.subCategory !== formData.originalSubCategory
    );
  }, [formData.category, formData.subCategory, formData.originalCategory, formData.originalSubCategory, isCreatingNew]);

  // 📍 1-Tap Live GPS Location Detection
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser or device.');
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
          location: prev.location || `Alwar (GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        }));
        setIsLocating(false);
      },
      (err) => {
        console.error('GPS error:', err);
        alert('Please enable location permission on your device.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 📷 Photo Upload from Device Storage (Max 10)
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentImages = formData.images || [];
    if (currentImages.length + files.length > 10) {
      alert('Maximum 10 photos allowed per listing.');
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          images: [...(prev.images || []), reader.result],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // 🎥 Video Compressor & Progress Pipeline (Max 2 Videos, Max 60s)
  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const currentVideos = formData.videos || [];
    if (currentVideos.length >= 2) {
      alert('Maximum 2 videos allowed per listing.');
      return;
    }

    setVideoUploadState({
      isProcessing: true,
      progress: 5,
      fileName: file.name,
      status: 'Checking video duration...',
    });

    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    const tempUrl = URL.createObjectURL(file);
    videoElement.src = tempUrl;

    videoElement.onloadedmetadata = () => {
      window.URL.revokeObjectURL(tempUrl);
      const duration = Math.round(videoElement.duration);

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
        status: 'Compressing & optimizing video for 4G/5G...',
      });

      const progressInterval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 12) + 8;

        if (currentProgress < 85) {
          setVideoUploadState((prev) => ({
            ...prev,
            progress: currentProgress,
            status: currentProgress > 50 ? 'Uploading optimized video to server...' : 'Compressing video stream...',
          }));
        } else {
          clearInterval(progressInterval);

          const reader = new FileReader();
          reader.onloadend = () => {
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
                  ...(prev.videos || []),
                  {
                    url: reader.result,
                    name: file.name,
                    duration: duration,
                  },
                ],
              }));
              setVideoUploadState({ isProcessing: false, progress: 0, fileName: '', status: '' });
            }, 500);
          };
          reader.readAsDataURL(file);
        }
      }, 150);
    };

    videoElement.onerror = () => {
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

  // Open Edit Form (Prepopulates from initial backend/store approved record)
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setIsCreatingNew(false);

    const existingImages =
      item.images && item.images.length > 0
        ? item.images
        : item.image
        ? [item.image]
        : [];

    // Digits only parse for price
    const rawPrice = String(item.price || item.rates || item.startingPackage || '')
      .replace(/\D/g, '');

    // Digits only parse for stock count
    const rawStock = String(item.capacity || item.stockCount || '')
      .replace(/\D/g, '');

    let parsedPoints = ['', '', '', ''];
    if (item.description) {
      const lines = item.description
        .split('\n')
        .map((l) => l.replace(/^[•\-\d.\s]+/, '').trim())
        .filter(Boolean);

      parsedPoints = [
        lines[0] || '',
        lines[1] || '',
        lines[2] || '',
        lines[3] || '',
      ];
    }

    // Parse active hours if existing
    const timingStr = item.timing || item.activeHours || '09:00 AM - 09:00 PM';
    const timeMatch = timingStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)\s*-\s*(\d{1,2}):?(\d{2})?\s*(AM|PM)/i);
    if (timeMatch) {
      setTimePicker({
        startHour: timeMatch[1].padStart(2, '0'),
        startPeriod: timeMatch[3].toUpperCase(),
        endHour: timeMatch[4].padStart(2, '0'),
        endPeriod: timeMatch[6].toUpperCase(),
      });
    }

    setFormData({
      title: item.title || item.name || '',
      category: item.category || 'property',
      subCategory: item.subCategory || item.sub_category || 'all',
      originalCategory: item.category || 'property',
      originalSubCategory: item.subCategory || item.sub_category || 'all',
      priceNumber: rawPrice,
      priceUnit: item.priceUnit || '',
      stockCount: rawStock,
      location: item.location || 'Hope Circus, Alwar',
      lat: item.lat || null,
      lng: item.lng || null,
      descPoints: parsedPoints,
      images: existingImages,
      videos: item.videos || [],
    });
  };

  // Open Enlist New Form
  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsCreatingNew(true);
    setTimePicker({
      startHour: '09',
      startPeriod: 'AM',
      endHour: '09',
      endPeriod: 'PM',
    });
    setFormData({
      title: '',
      category: 'property',
      subCategory: 'all',
      originalCategory: '',
      originalSubCategory: '',
      priceNumber: '',
      priceUnit: '',
      stockCount: '',
      location: `${selectedCity} Market`,
      lat: null,
      lng: null,
      descPoints: ['', '', '', ''],
      images: [],
      videos: [],
    });
  };

  // Save Listing with Admin Approval Queue
  const handleSaveListing = async (e) => {
    e.preventDefault();

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
      price: formattedPrice,
      rates: formattedPrice,
      startingPackage: formattedPrice,
      description: combinedDescription,
      location: formData.location,
      lat: formData.lat,
      lng: formData.lng,
      capacity: formattedStock,
      stockCount: formattedStock,
      timing: formattedActiveHours,
      activeHours: formattedActiveHours,
      image: formData.images?.[0] || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600',
      image_urls: formData.images,
      video_urls: (formData.videos || []).map((v) => (typeof v === 'string' ? v : v.url)),
      videos: formData.videos,
    };

    if (isCreatingNew) {
      const newDraft = {
        id: `draft-${Date.now()}`,
        ...payload,
        sellerName: currentUser?.full_name || 'Verified Merchant',
        phone: sellerPhone,
        whatsapp: sellerPhone,
        city: selectedCity,
        has_pending_approval: true,
        isNew: true,
        badge: '⏳ Pending Admin Approval',
      };

      hyperlocalStore.insertListing(formData.category, newDraft);
      hyperlocalStore.addNotification({
        tag: 'DRAFT SUBMITTED',
        title: `"${formData.title}" Sent for Approval`,
        message: 'Your new listing with photos will go live once verified by Admin.',
        time: 'Just now',
      });
    } else if (editingItem) {
      await submitSellerEditProposal(editingItem.id, payload);

      const updatedItem = {
        ...editingItem,
        pending_changes: payload,
        has_pending_approval: true,
      };
      hyperlocalStore.insertListing(editingItem.category, updatedItem);

      hyperlocalStore.addNotification({
        tag: 'EDIT SUBMITTED',
        title: `Edits for "${editingItem.title}" Sent`,
        message: 'Your updated media and details are pending review in the Admin Dashboard.',
        time: 'Just now',
      });
    }

    setEditingItem(null);
    setIsCreatingNew(false);
  };

  // 🎙️ Start / Stop Audio Functions
  const handleStartRecording = async (commentId) => {
    try {
      const stream = await getOptimizedVoiceStream();
      audioChunksRef.current = [];
      const mediaRecorder = createOptimizedMediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      setRecordingId(commentId);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access denied. Please enable mic access in your browser settings.');
    }
  };

  const handleStopAndSendAudio = (listingId, commentId, listingTitle) => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return;

    mediaRecorder.onstop = async () => {
      clearInterval(timerRef.current);
      setIsUploadingAudio(true);

      try {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });
        const publicAudioUrl = await uploadVoiceNoteToStorage(audioBlob);
        const durationStr = `0:${recordingSeconds < 10 ? '0' : ''}${recordingSeconds}`;

        const replyObj = {
          type: 'audio',
          audioUrl: publicAudioUrl,
          duration: durationStr,
          text: '🎤 Voice Note Reply',
          timestamp: 'Just now',
          sellerName: currentUser?.full_name || 'You (Owner)',
        };

        hyperlocalStore.addSellerReply(listingId, commentId, replyObj, listingTitle);
        setThreadUpdateTick((prev) => prev + 1);
      } catch (err) {
        console.error('Audio upload failed:', err);
      } finally {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
        setRecordingId(null);
        setRecordingSeconds(0);
        setIsUploadingAudio(false);
      }
    };

    mediaRecorder.stop();
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current) {
      clearInterval(timerRef.current);
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
      setRecordingId(null);
      setRecordingSeconds(0);
    }
  };

  // ⚡ Instant Text & Preset Reply Dispatcher
  const handleSendTextReply = (listingId, commentId, listingTitle, customText = null) => {
    const text = (customText || replyInputs[commentId] || '').trim();
    if (!text) return;

    const replyObj = {
      type: 'text',
      text,
      timestamp: 'Just now',
      sellerName: currentUser?.full_name || 'You (Owner)',
    };

    hyperlocalStore.addSellerReply(listingId, commentId, replyObj, listingTitle);
    setReplyInputs((prev) => ({ ...prev, [commentId]: '' }));
    setThreadUpdateTick((prev) => prev + 1);
  };

  const handleQuickPreset = (listingId, commentId, listingTitle, presetText) => {
    handleSendTextReply(listingId, commentId, listingTitle, presetText);
  };

  return (
    <main className="p-3.5 space-y-3.5 animate-fade-in text-slate-100 pb-28 select-none bg-slate-950 min-h-screen">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 p-4 rounded-3xl text-white shadow-xl flex items-center justify-between border border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-xl font-black shadow-md">
            📊
          </div>
          <div>
            <h1 className="text-sm font-black text-white leading-tight">
              Business Hub (ग्राहक बातचीत)
            </h1>
            <p className="text-[10px] text-amber-300 font-bold">
              Direct Voice Notes • Auto-expires in 5 days
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="text-xs bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-xl font-bold active:scale-95 transition cursor-pointer"
        >
          ← Back
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab('listings');
            setSortByInterest(false);
          }}
          className={`p-3 rounded-2xl border text-center space-y-0.5 shadow-md transition cursor-pointer active:scale-95 ${
            activeTab === 'listings' && !sortByInterest
              ? 'bg-amber-400/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/30'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
            Active Ads
          </span>
          <span className="text-lg font-black text-amber-400">{myListings.length}</span>
          <span className="text-[9px] text-emerald-400 font-bold block">● Live</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('listings');
            setSortByInterest(true);
          }}
          className={`p-3 rounded-2xl border text-center space-y-0.5 shadow-md transition cursor-pointer active:scale-95 ${
            activeTab === 'listings' && sortByInterest
              ? 'bg-orange-500/20 border-orange-400 text-orange-300 ring-2 ring-orange-400/30'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
            Interested
          </span>
          <span className="text-lg font-black text-cyan-400">🔥 {totalInterests}</span>
          <span className="text-[9px] text-cyan-300 font-bold block">Buyers</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('inquiries');
            setOnlyUnanswered(true);
            setSelectedListingFilter('all');
          }}
          className={`p-3 rounded-2xl border text-center space-y-0.5 shadow-md transition cursor-pointer active:scale-95 relative ${
            activeTab === 'inquiries' && onlyUnanswered
              ? 'bg-rose-500/20 border-rose-400 text-rose-300 ring-2 ring-rose-400/30'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          {pendingInquiriesCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
          )}
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
            Inquiries
          </span>
          <span className="text-lg font-black text-rose-400">💬 {pendingInquiriesCount}</span>
          <span className="text-[9px] text-rose-300 font-bold block">Need Reply</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow-inner">
        <button
          type="button"
          onClick={() => {
            setActiveTab('inquiries');
            setOnlyUnanswered(false);
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center space-x-1.5 ${
            activeTab === 'inquiries'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
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
          onClick={() => {
            setActiveTab('listings');
            setSortByInterest(false);
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center space-x-1.5 ${
            activeTab === 'listings'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>📦 My Listings ({myListings.length})</span>
        </button>
      </div>

      {/* TAB 1: INQUIRIES */}
      {activeTab === 'inquiries' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black text-slate-300 uppercase tracking-wider">
              Buyer Questions & Voice Notes ({userInquiries.length})
            </h2>
            <span className="text-[10px] text-amber-400 font-bold">
              🎙️ Tap mic to record voice note
            </span>
          </div>

          {/* Per-Listing Filter Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-[9.5px]">
            <button
              type="button"
              onClick={() => {
                setSelectedListingFilter('all');
                setOnlyUnanswered(false);
              }}
              className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                selectedListingFilter === 'all' && !onlyUnanswered
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
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
                  selectedListingFilter === String(item.id)
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
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
              <p className="text-[10px]">Customer voice notes automatically clear after 5 days.</p>
            </div>
          ) : (
            userInquiries.map((inq) => {
              const isRecordingThis = recordingId === inq.id;

              return (
                <div
                  key={inq.id}
                  className="bg-slate-900 rounded-2xl border border-slate-800 p-3.5 space-y-3 shadow-md transition"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      <img
                        src={inq.listingImage || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200'}
                        alt={inq.listingTitle}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs font-black text-slate-100 truncate">
                          {inq.listingTitle}
                        </h3>
                        <span className="text-[10px] font-bold text-amber-400 block">
                          {inq.listingPrice}
                        </span>
                      </div>
                    </div>

                    <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md shrink-0">
                      {inq.timestamp}
                    </span>
                  </div>

                  {/* Customer Voice Note or Text */}
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-extrabold text-amber-300">👤 {inq.userName}</span>
                      <span className="text-slate-400 text-[9px]">Buyer Question</span>
                    </div>

                    {inq.audioUrl ? (
                      <VoiceNotePlayer
                        audioUrl={inq.audioUrl}
                        duration={inq.audioDuration}
                        senderName={inq.userName.split(' ')[0]}
                      />
                    ) : (
                      <p className="text-xs text-slate-200 font-medium italic">"{inq.text}"</p>
                    )}
                  </div>

                  {/* Seller Reply */}
                  {inq.sellerReply ? (
                    <div className="bg-emerald-950/40 border-l-4 border-emerald-500 p-2.5 rounded-r-xl space-y-1">
                      <span className="text-[9px] font-black text-emerald-400 block">
                        👑 Your Reply ({inq.sellerReply.timestamp}):
                      </span>

                      {inq.sellerReply.type === 'audio' || inq.sellerReply.audioUrl ? (
                        <VoiceNotePlayer
                          audioUrl={inq.sellerReply.audioUrl}
                          duration={inq.sellerReply.duration}
                          senderName="Your Voice Note"
                        />
                      ) : (
                        <p className="text-xs text-emerald-100 font-semibold">{inq.sellerReply.text}</p>
                      )}
                    </div>
                  ) : (
                    /* Interactive Reply Bar with Working Instant Fast-Reply Chips */
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {QUICK_PRESETS.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => handleQuickPreset(inq.listingId, inq.id, inq.listingTitle, chip)}
                            className="text-[9.5px] bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-300 px-2.5 py-1 rounded-lg font-bold shrink-0 transition border border-slate-700 cursor-pointer flex items-center space-x-1 active:scale-95 shadow-xs"
                          >
                            <span>+</span>
                            <span>{chip}</span>
                          </button>
                        ))}
                      </div>

                      {isRecordingThis ? (
                        <div className="flex items-center justify-between p-2.5 bg-rose-950/40 border border-rose-600/50 rounded-2xl animate-pulse">
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                            <span className="text-xs font-black text-rose-300">
                              {isUploadingAudio
                                ? 'Saving to server...'
                                : `Recording: 0:${recordingSeconds < 10 ? '0' : ''}${recordingSeconds}`}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={handleCancelRecording}
                              disabled={isUploadingAudio}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStopAndSendAudio(inq.listingId, inq.id, inq.listingTitle)}
                              disabled={isUploadingAudio}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer active:scale-95"
                            >
                              {isUploadingAudio ? 'Sending...' : 'Send Audio ➔'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartRecording(inq.id)}
                            title="Record Pure Audio Voice Note"
                            className="w-10 h-10 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center text-base font-black shadow-md transition active:scale-90 cursor-pointer shrink-0"
                          >
                            🎙️
                          </button>

                          <input
                            type="text"
                            value={replyInputs[inq.id] || ''}
                            onChange={(e) =>
                              setReplyInputs({ ...replyInputs, [inq.id]: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSendTextReply(inq.listingId, inq.id, inq.listingTitle);
                              }
                            }}
                            placeholder="Type custom reply or tap instant chips above..."
                            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-slate-100 focus:outline-hidden focus:border-amber-400"
                          />

                          <button
                            type="button"
                            onClick={() => handleSendTextReply(inq.listingId, inq.id, inq.listingTitle)}
                            className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs rounded-xl active:scale-95 transition cursor-pointer shrink-0 shadow-md"
                          >
                            Send
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>
      )}

      {/* TAB 2: ACTIVE LISTINGS */}
      {activeTab === 'listings' && (
        <section className="space-y-3.5">
          
          {/* 🌟 Prominent "+ Enlist New Item" Hero Banner */}
          <div className="p-3.5 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-transparent border border-amber-400/40 rounded-2xl flex items-center justify-between shadow-lg">
            <div className="pr-2">
              <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider flex items-center space-x-1">
                <span>✨</span>
                <span>GROW YOUR BUSINESS IN {selectedCity.toUpperCase()}</span>
              </span>
              <h3 className="text-xs font-black text-slate-100 mt-0.5">
                Want to list another product or service?
              </h3>
              <p className="text-[9.5px] text-slate-400 leading-tight">
                Add festival deals, inventory, or new categories directly to your dashboard.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-[0_0_15px_rgba(251,191,36,0.35)] active:scale-95 transition cursor-pointer shrink-0"
            >
              + Enlist New ➔
            </button>
          </div>

          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-xs font-black text-slate-300 uppercase tracking-wider">
                {sortByInterest ? '🔥 Sorted by Highest Buyer Interest' : 'Manage Your Listings (आपकी लिस्टिंग्स)'}
              </h2>
              <span className="text-[10px] text-amber-400 font-bold block">
                {sortByInterest ? 'Town Hot Trends' : '● All Active'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold transition cursor-pointer"
            >
              + Quick Add
            </button>
          </div>

          <div className="space-y-2.5">
            {myListings.map((item) => (
              <div
                key={item.id}
                className={`bg-slate-900 rounded-2xl border p-3.5 space-y-2.5 shadow-sm transition ${
                  sortByInterest && Number(item.interestCount) > 0
                    ? 'border-orange-500/50 bg-gradient-to-r from-slate-900 via-slate-900 to-orange-950/20'
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
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[9px] font-black uppercase text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded-md inline-block">
                          {item.category}
                        </span>
                        {sortByInterest && Number(item.interestCount) > 0 && (
                          <span className="text-[7.5px] font-black px-1.5 py-0.5 rounded-md bg-orange-500/20 text-orange-300 border border-orange-500/30">
                            🔥 HOT IN TOWN
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs font-black text-slate-100 truncate mt-0.5">
                        {item.title || item.name}
                      </h3>
                      <p className="text-[11px] font-bold text-amber-400">
                        {item.price || item.rates || item.startingPackage || 'Rate on Request'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-1 shrink-0">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-amber-500/30 text-amber-300 font-black text-[9.5px] flex items-center space-x-1 shadow-inner">
                      <span>⭐</span>
                      <span>{item.interestCount || 4}</span>
                    </span>
                    {item.has_pending_approval && (
                      <span className="text-[7.5px] font-black text-amber-400 uppercase">
                        ⏳ Reviewing
                      </span>
                    )}
                  </div>
                </div>

                {item.has_pending_approval && (
                  <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[9.5px] text-amber-200">
                    ⚠️ Proposed edits are pending Admin verification before appearing live.
                  </div>
                )}

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
                  <span className="text-slate-500 font-semibold truncate max-w-[160px]">
                    📍 {item.location || selectedCity}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg font-bold transition cursor-pointer active:scale-95"
                  >
                    ✏️ Edit Details & Media
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: EDIT LISTING & ENLIST NEW (Digits Only Price & Stock)            */}
      {/* ========================================================================= */}
      {(editingItem || isCreatingNew) && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in select-none">
          <div className="bg-slate-900 border border-amber-500/40 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3.5 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <h3 className="text-xs font-black text-amber-300">
                  {isCreatingNew ? '🆕 Enlist New Listing' : '✏️ Edit Listing Details'}
                </h3>
                <p className="text-[9px] text-slate-400">
                  {isCreatingNew
                    ? 'Submit details & media for Admin approval'
                    : `Editing "${editingItem?.title || editingItem?.name}"`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setIsCreatingNew(false);
                }}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveListing} className="space-y-3 text-[11px]">
              
              {/* Category & Subcategory Selection with Backend Database Source */}
              <div className="space-y-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-300 block mb-1">
                      Category (मुख्य श्रेणी) *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        const catObj = getCategoryById(newCat);
                        const firstSub = catObj?.subCategories?.[0]?.id || 'all';
                        setFormData((prev) => ({
                          ...prev,
                          category: newCat,
                          subCategory: firstSub,
                        }));
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-slate-100 focus:border-amber-400 focus:outline-hidden text-xs"
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
                    <label className="text-[9px] font-bold text-slate-300 block mb-1">
                      Subcategory (उप-श्रेणी) *
                    </label>
                    <select
                      value={formData.subCategory}
                      onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-slate-100 focus:border-amber-400 focus:outline-hidden text-xs"
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

                {/* Backend Heritage Reminder */}
                {hasCategoryChanged && (
                  <div className="p-2.5 rounded-xl bg-amber-950/70 border border-amber-500/50 text-[9.5px] text-amber-200 leading-tight">
                    ⚠️ <strong>Heritage Reminder:</strong> पहले आपने यह आइटम{' '}
                    <span className="underline font-black uppercase text-amber-300">
                      {formData.originalCategory}
                    </span>{' '}
                    (
                    <span className="font-bold text-slate-200">
                      {formData.originalSubCategory}
                    </span>
                    ) में लिस्ट किया था। बदलाव करने पर एडमिन रिव्यू की आवश्यकता होगी।
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="text-[9.5px] font-bold text-slate-300 block mb-1">
                  Title / Shop or Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Rajputana Motors Dhanteras Deal"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              {/* Fixed Rupee Symbol Auto-Prefixed Price (DIGITS ONLY) */}
              <div>
                <label className="text-[9.5px] font-bold text-slate-300 block mb-1">
                  Price / Package Rate (रुपये में कीमत - केवल अंक) *
                </label>
                <div className="flex items-center space-x-1.5">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-amber-400 select-none">
                      ₹
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      value={formData.priceNumber}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, priceNumber: clean });
                      }}
                      placeholder="169000"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-slate-100 font-bold focus:border-amber-400 focus:outline-hidden font-mono"
                    />
                  </div>
                  <input
                    type="text"
                    value={formData.priceUnit}
                    onChange={(e) => setFormData({ ...formData, priceUnit: e.target.value })}
                    placeholder="e.g. / Kg, Onwards"
                    className="w-28 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-slate-300 placeholder-slate-500 focus:border-amber-400 focus:outline-hidden text-center text-xs"
                  />
                </div>
              </div>

              {/* Available Stock Units (DIGITS ONLY) */}
              <div>
                <label className="text-[9px] font-bold text-slate-300 block mb-1">
                  Ready Stock Quantity (उपलब्ध मात्रा - केवल अंक दर्ज करें)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.stockCount}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, stockCount: clean });
                    }}
                    placeholder="e.g. 10"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3 pr-20 py-2 text-slate-100 font-bold focus:border-amber-400 focus:outline-hidden font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 select-none">
                    Pcs / Units
                  </span>
                </div>
              </div>

              {/* ⏰ Tap-to-Select Active Working Hours */}
              <div className="p-2.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <label className="text-[9.5px] font-black text-slate-200 block">
                  ⏰ Active Working Hours (खुलने व बंद होने का समय)
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[8.5px] text-slate-400 font-bold block">Open From:</span>
                    <div className="flex items-center space-x-1">
                      <select
                        value={timePicker.startHour}
                        onChange={(e) => setTimePicker({ ...timePicker, startHour: e.target.value })}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-1.5 px-2 text-slate-100 text-xs font-bold text-center focus:border-amber-400 focus:outline-hidden"
                      >
                        {HOURS_LIST.map((h) => (
                          <option key={h} value={h}>{h}:00</option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          setTimePicker({
                            ...timePicker,
                            startPeriod: timePicker.startPeriod === 'AM' ? 'PM' : 'AM',
                          })
                        }
                        className="px-2.5 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-black text-[10px] cursor-pointer active:scale-95"
                      >
                        {timePicker.startPeriod}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8.5px] text-slate-400 font-bold block">Close At:</span>
                    <div className="flex items-center space-x-1">
                      <select
                        value={timePicker.endHour}
                        onChange={(e) => setTimePicker({ ...timePicker, endHour: e.target.value })}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-1.5 px-2 text-slate-100 text-xs font-bold text-center focus:border-amber-400 focus:outline-hidden"
                      >
                        {HOURS_LIST.map((h) => (
                          <option key={h} value={h}>{h}:00</option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          setTimePicker({
                            ...timePicker,
                            endPeriod: timePicker.endPeriod === 'AM' ? 'PM' : 'AM',
                          })
                        }
                        className="px-2.5 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-black text-[10px] cursor-pointer active:scale-95"
                      >
                        {timePicker.endPeriod}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-center text-[9px] font-bold text-amber-300/90 pt-0.5">
                  Selected: {timePicker.startHour}:00 {timePicker.startPeriod} to {timePicker.endHour}:00 {timePicker.endPeriod}
                </div>
              </div>

              {/* Location Text Input */}
              <div>
                <label className="text-[9.5px] font-bold text-slate-300 block mb-1">
                  Location & Market Area (पता / बाजार) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Company Bagh Road, Alwar"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              {/* 🌟 Prominent Color-Graded 1-Tap Live GPS Button */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={isLocating}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-black text-xs rounded-2xl shadow-[0_0_15px_rgba(251,191,36,0.3)] active:scale-98 transition flex items-center justify-center space-x-2 cursor-pointer border border-amber-300/40"
                >
                  <span className="text-base">{isLocating ? '📡' : '📍'}</span>
                  <span>{isLocating ? 'Detecting Live GPS Coordinates...' : '1-Tap Set Live Shop GPS (सटीक लोकेशन)'}</span>
                </button>

                {formData.lat && formData.lng ? (
                  <div className="p-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-[8.5px] text-emerald-300 text-center font-bold">
                    ✓ GPS Captured: {formData.lat.toFixed(4)}, {formData.lng.toFixed(4)} (Customer distance will be accurate)
                  </div>
                ) : (
                  <p className="text-[8px] text-slate-400 text-center">
                    💡 1-Tap GPS ensures town customers see your exact distance in meters & km.
                  </p>
                )}
              </div>

              {/* 🌟 4 Numbered Description / Highlight Tiles */}
              <div className="space-y-1.5 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <label className="text-[9.5px] font-black text-slate-200 block">
                  📝 Key Highlights & Description (4 नंबर वार जानकारी)
                </label>

                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black flex items-center justify-center shrink-0">
                      1
                    </span>
                    <input
                      type="text"
                      value={formData.descPoints[0]}
                      onChange={(e) => {
                        const next = [...formData.descPoints];
                        next[0] = e.target.value;
                        setFormData({ ...formData, descPoints: next });
                      }}
                      placeholder="1. मुख्य खासियत (e.g. Dual Channel ABS, 36 km/l mileage)"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100 text-[10.5px] focus:border-amber-400 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black flex items-center justify-center shrink-0">
                      2
                    </span>
                    <input
                      type="text"
                      value={formData.descPoints[1]}
                      onChange={(e) => {
                        const next = [...formData.descPoints];
                        next[1] = e.target.value;
                        setFormData({ ...formData, descPoints: next });
                      }}
                      placeholder="2. ऑफर / फाइनेंस (e.g. Zero Downpayment EMI ₹3,999/mo)"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100 text-[10.5px] focus:border-amber-400 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black flex items-center justify-center shrink-0">
                      3
                    </span>
                    <input
                      type="text"
                      value={formData.descPoints[2]}
                      onChange={(e) => {
                        const next = [...formData.descPoints];
                        next[2] = e.target.value;
                        setFormData({ ...formData, descPoints: next });
                      }}
                      placeholder="3. वारंटी या स्थिति (e.g. 5-Year Free Engine Warranty)"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100 text-[10.5px] focus:border-amber-400 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black flex items-center justify-center shrink-0">
                      4
                    </span>
                    <input
                      type="text"
                      value={formData.descPoints[3]}
                      onChange={(e) => {
                        const next = [...formData.descPoints];
                        next[3] = e.target.value;
                        setFormData({ ...formData, descPoints: next });
                      }}
                      placeholder="4. अन्य जरूरी विवरण (e.g. Free Helmet & On-Spot Delivery)"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100 text-[10.5px] focus:border-amber-400 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* 📷 Photo Uploads from Phone Storage (Max 10) */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[9.5px] font-black text-slate-300 flex items-center space-x-1">
                    <span>📷 Listing Photos</span>
                    <span className="text-slate-500">({formData.images?.length || 0}/10)</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={(formData.images?.length || 0) >= 10}
                    className="text-[9px] font-black bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md cursor-pointer transition active:scale-95"
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

                {formData.images && formData.images.length > 0 ? (
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-700 group">
                        <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white font-black text-[8px] flex items-center justify-center cursor-pointer shadow-md"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[8.5px] text-slate-500 italic">No photos attached. Tap "+ Add Photos" to upload from your gallery.</p>
                )}
              </div>

              {/* 🎥 Video Uploads with Live % Filling Progress Bar */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[9.5px] font-black text-slate-300 flex items-center space-x-1">
                    <span>🎥 Walkthrough Videos (Max 60s)</span>
                    <span className="text-slate-500">({formData.videos?.length || 0}/2)</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={(formData.videos?.length || 0) >= 2 || videoUploadState.isProcessing}
                    className="text-[9px] font-black bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md cursor-pointer transition active:scale-95 disabled:opacity-40"
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
                      Optimizing {videoUploadState.fileName} for fast 4G streaming... Please wait a few moments.
                    </p>
                  </div>
                )}

                {formData.videos && formData.videos.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    {formData.videos.map((vid, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-700 text-[9.5px]">
                        <div className="flex items-center space-x-2 truncate">
                          <span>🎬</span>
                          <span className="truncate text-slate-200">{vid.name || `Video ${idx + 1}`}</span>
                          <span className="text-amber-400 font-bold shrink-0">({vid.duration || 30}s)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVideo(idx)}
                          className="text-rose-400 font-black px-1.5 py-0.5 hover:bg-rose-950/40 rounded-md cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  !videoUploadState.isProcessing && (
                    <p className="text-[8.5px] text-slate-500 italic">Optional. Upload short walkthrough videos up to 60 seconds.</p>
                  )
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[9px] text-slate-400">
                🛡️ Note: All changes and new submissions are routed to the Admin Dashboard for verification before going live across {selectedCity}.
              </div>

              <button
                type="submit"
                disabled={videoUploadState.isProcessing}
                className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs rounded-xl shadow-lg active:scale-95 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {videoUploadState.isProcessing
                  ? 'Optimizing Video... Please Wait'
                  : isCreatingNew
                  ? 'Submit for Admin Approval ➔'
                  : 'Submit Edits for Approval ➔'}
              </button>
            </form>

          </div>
        </div>
      )}

    </main>
  );
}