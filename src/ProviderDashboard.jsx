import React, { useState, useMemo, useEffect, useRef } from 'react';
import { hyperlocalStore, useAllListingsSlice } from './store/hyperlocalStore';
import { TAXONOMY_REGISTRY, getCategoryById } from './data/taxonomyRegistry';
import VoiceNotePlayer from './components/common/VoiceNotePlayer';
import {
  uploadListingImagesToStorage,
  uploadListingVideosToStorage,
  uploadVoiceNoteToStorage,
  submitSellerEditProposal,
  sendSellerReplyToAdmin,
  createListingInDB,
  saveNotificationToDB,
} from './services/listingService';
import {
  getOptimizedVoiceStream,
  createOptimizedMediaRecorder,
} from './utils/audioCompressor';
import {
  getCurrentUserProfile,
  isBusinessAuthorized,
  loginResidentWithPin,
  logoutUser,
} from './services/authService';

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
  const [currentUser, setCurrentUser] = useState(() => getCurrentUserProfile());
  const [isAuthorized, setIsAuthorized] = useState(() => isBusinessAuthorized());

  // 🔒 Login Gate State
  const [loginPhone, setLoginPhone] = useState(currentUser?.phone || '');
  const [loginPin, setLoginPin] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Active Merchant Phone
  const sellerPhone = currentUser?.phone || loginPhone;

  // Navigation & Filter States
  const [activeTab, setActiveTab] = useState('inquiries'); // 'inquiries' | 'listings'
  const [sortByInterest, setSortByInterest] = useState(false);
  const [selectedListingFilter, setSelectedListingFilter] = useState('all');
  const [onlyUnanswered, setOnlyUnanswered] = useState(false);

  // Form & GPS States
  const [replyInputs, setReplyInputs] = useState({});
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // 📩 Seller-to-Admin Direct Response State
  const [sellerAdminReplies, setSellerAdminReplies] = useState({});
  const [recordingAdminReplyId, setRecordingAdminReplyId] = useState(null);
  const [adminRecordingSecs, setAdminRecordingSecs] = useState(0);
  const [isSendingAdminReply, setIsSendingAdminReply] = useState(false);

  // Time Picker State (01-12 AM/PM)
  const [timePicker, setTimePicker] = useState({
    startHour: '09',
    startPeriod: 'AM',
    endHour: '09',
    endPeriod: 'PM',
  });

  // Form State
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

  // 🎙️ Customer Inquiry Audio Recording State
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
        changedKey === 'threads' ||
        changedKey === 'all' ||
        changedKey.startsWith('interest:')
      ) {
        setThreadUpdateTick((prev) => prev + 1);
      }
    });
  }, []);

  // 🚪 Perform Login
  
  const handlePerformLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);

    const clean = String(loginPhone).replace(/\D/g, '').slice(-10);

    if (clean.length < 10) {
      setAuthError('कृपया 10-अंकीय मोबाइल नंबर दर्ज करें (Enter 10-digit mobile).');
      setIsAuthenticating(false);
      return;
    }

    if (String(loginPin).length < 4) {
      setAuthError('कृपया 4-अंकीय पिन दर्ज करें (Enter 4-digit PIN).');
      setIsAuthenticating(false);
      return;
    }

    try {
      const res = await loginResidentWithPin(clean, loginPin);
      if (res.success) {
        setCurrentUser(res.profile);
        setIsAuthorized(true);
        setAuthError('');
      } else {
        setAuthError(res.error || 'पिन अमान्य है (Incorrect PIN).');
      }
    } catch {
      setAuthError('Connection busy. Please try again.');
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
    }
  };

  // 1. Strictly Filtered Merchant Listings
  const myListings = useMemo(() => {
    if (!isAuthorized || !sellerPhone) return [];

    const list = (allListings || []).filter((item) => String(item.phone) === String(sellerPhone));

    if (sortByInterest) {
      return [...list].sort(
        (a, b) => (Number(b.interestCount) || 0) - (Number(a.interestCount) || 0)
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

  const totalInterests = useMemo(() => {
    const interestMap = hyperlocalStore.state.interests || {};
    return myListings.reduce(
      (sum, item) => sum + (interestMap[item.id] || Number(item.interestCount) || 0),
      0
    );
  }, [myListings, threadUpdateTick]);

  const pendingInquiriesCount = useMemo(() => {
    return userInquiries.filter((q) => !q.sellerReply).length;
  }, [userInquiries]);

  // 🎙️ 1. Start Voice Recording to Admin
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

  // 🎙️ 2. Stop and Send Voice Note to Admin
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

        alert('Voice note reply sent directly to Admin.');
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
      alert('Reply sent directly to Admin.');
    } catch {
      alert('Failed to send reply to Admin.');
    } finally {
      setIsSendingAdminReply(false);
    }
  };

  // Category Configuration
  const activeCategoryConfig = getCategoryById(formData.category) || TAXONOMY_REGISTRY[formData.category] || null;
  const availableSubCategories = activeCategoryConfig?.subCategories || [];
  const hasCategoryChanged = !isCreatingNew && formData.originalCategory && (
    formData.category !== formData.originalCategory ||
    formData.subCategory !== formData.originalSubCategory
  );

  // 📍 1-Tap Live GPS
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
          location: prev.location || `Alwar (GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
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

  // 📷 Photos Selection
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
      isExisting: false,
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

  // 🎥 Video Selection with 0-100% Progress Simulator
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
        status: 'Compressing video for fast 4G/5G streaming...',
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
                  isExisting: false,
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

  // Open Edit Form
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setIsCreatingNew(false);

    const existingImages = (item.images && item.images.length > 0 ? item.images : item.image ? [item.image] : [])
      .map((img) => (typeof img === 'string' ? { preview: img, url: img, isExisting: true } : img));

    const existingVideos = (item.videos || []).map((v) =>
      typeof v === 'string' ? { preview: v, url: v, name: 'Video', duration: 30, isExisting: true } : { ...v, preview: v.url, isExisting: true }
    );

    const rawPrice = String(item.price || item.rates || '').replace(/\D/g, '');
    const rawStock = String(item.capacity || item.stockCount || '').replace(/\D/g, '');

    let parsedPoints = ['', '', '', ''];
    if (item.description) {
      const lines = item.description.split('\n').map((l) => l.replace(/^[•\-\d.\s]+/, '').trim()).filter(Boolean);
      parsedPoints = [lines[0] || '', lines[1] || '', lines[2] || '', lines[3] || ''];
    }

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
      videos: existingVideos,
    });
  };

  // Submit Listing (Uploads to Storage First, then sends clean URLs to PostgreSQL)
  const handleSaveListing = async (e) => {
    e.preventDefault();
    setIsSubmittingForm(true);

    try {
      const rawImageFiles = formData.images.map((img) => img.file).filter(Boolean);
      const existingImageUrls = formData.images
        .map((img) => img.url || (typeof img === 'string' && img.startsWith('http') ? img : null))
        .filter(Boolean);

      const uploadedImageUrls = await uploadListingImagesToStorage(rawImageFiles);
      const finalImageUrls = [...existingImageUrls, ...uploadedImageUrls];
      const finalVideos = await uploadListingVideosToStorage(formData.videos);

      const validPoints = formData.descPoints.filter((p) => p && p.trim().length > 0);
      const combinedDescription = validPoints.length > 0 ? validPoints.map((p) => `• ${p.trim()}`).join('\n') : formData.title;
      const formattedPrice = formData.priceNumber ? `₹ ${formData.priceNumber.trim()}${formData.priceUnit ? ' ' + formData.priceUnit : ''}` : 'Contact for Price';
      const formattedStock = formData.stockCount ? `${formData.stockCount} Units Available` : 'Ready Stock';
      const formattedActiveHours = `${timePicker.startHour}:00 ${timePicker.startPeriod} - ${timePicker.endHour}:00 ${timePicker.endPeriod}`;

      const cleanPayload = {
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
        image: finalImageUrls[0] || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600',
        images: finalImageUrls,
        image_urls: finalImageUrls,
        videos: finalVideos,
        video_urls: finalVideos.map((v) => v.url),
        sellerName: currentUser?.full_name || 'Verified Merchant',
        phone: sellerPhone,
        whatsapp: sellerPhone,
      };

      if (isCreatingNew) {
        const newDraft = { ...cleanPayload, city: selectedCity, has_pending_approval: true, isNew: true, badge: '⏳ Pending Admin Approval' };
        const { data: dbData } = await createListingInDB(newDraft);
        const finalItem = dbData || { id: `draft-${Date.now()}`, ...newDraft };
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
      } else if (editingItem) {
        const { data: dbProposal } = await submitSellerEditProposal(editingItem.id, cleanPayload);
        const updatedItem = {
          ...editingItem,
          id: dbProposal?.id || editingItem.id,
          pending_changes: cleanPayload,
          has_pending_approval: true,
          admin_feedback: null,
          seller_feedback_reply: null,
        };
        hyperlocalStore.insertListing(editingItem.category, updatedItem);

        const notifObj = {
          tag: 'EDIT PROPOSAL',
          title: `Edit Request: "${editingItem.title || editingItem.name}"`,
          message: `Merchant (${sellerPhone}) submitted updates for approval.`,
          targetId: updatedItem.id,
          category: editingItem.category,
          recipient_role: 'admin',
          recipient_phone: null,
        };
        await saveNotificationToDB(notifObj);
        hyperlocalStore.addNotification(notifObj);
      }

      setEditingItem(null);
      setIsCreatingNew(false);
    } catch (err) {
      console.error('Save listing error:', err);
      alert('Could not submit changes. Please check your connection.');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // 🎙️ Customer Inquiry Voice Note Recording
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
      timerRef.current = setInterval(() => setRecordingSeconds((prev) => prev + 1), 1000);
    } catch {
      alert('Microphone access denied. Please allow mic permissions.');
    }
  };

  const handleStopAndSendAudio = (listingId, commentId, listingTitle) => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return;

    mediaRecorder.onstop = async () => {
      clearInterval(timerRef.current);
      setIsUploadingAudio(true);
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
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
        console.error('Audio upload error:', err);
      } finally {
        if (mediaRecorder.stream) mediaRecorder.stream.getTracks().forEach((t) => t.stop());
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
      if (mediaRecorderRef.current.stream) mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
      setRecordingId(null);
      setRecordingSeconds(0);
    }
  };

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

  // =========================================================================
  // 🔒 AUTH GUARD VIEW (Renders when logged out)
  // =========================================================================
  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 font-sans select-none">
        <div className="w-full max-w-sm bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 text-2xl flex items-center justify-center mx-auto shadow-md">
              🏪
            </div>
            <h2 className="text-sm font-black text-slate-100">Business Hub (सुरक्षित लॉगिन)</h2>
            <p className="text-[10px] text-slate-400">
              अपनी लिस्टिंग्स व ग्राहक पूछताछ देखने के लिए रजिस्टर्ड मोबाइल नंबर व पिन दर्ज करें।
            </p>
          </div>

          <form onSubmit={handlePerformLogin} className="space-y-3 text-xs">
            <div>
              <label className="text-[9.5px] font-bold text-slate-300 block mb-1">
                Merchant Mobile Number (मोबाइल नंबर) *
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold focus:border-amber-400 focus:outline-hidden tracking-wider"
              />
            </div>

            <div>
              <label className="text-[9.5px] font-bold text-slate-300 block mb-1">
                4-Digit Security PIN (4-अंकीय पिन) *
              </label>
              <input
                type="password"
                required
                maxLength={4}
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold text-center text-lg tracking-widest focus:border-amber-400 focus:outline-hidden"
              />
            </div>

            {authError && (
              <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-[9.5px] text-rose-300 text-center font-bold">
                ⚠️ {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs rounded-xl shadow-lg active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              {isAuthenticating ? 'Verifying PIN... ⏳' : 'Unlock Business Hub ➔'}
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
    <main className="p-3.5 space-y-3.5 animate-fade-in text-slate-100 pb-28 select-none bg-slate-950 min-h-screen">
      
      {/* 1. Header with Logout Button */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 p-4 rounded-3xl text-white shadow-xl flex items-center justify-between border border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-xl font-black shadow-md">
            📊
          </div>
          <div>
            <h1 className="text-sm font-black text-white leading-tight">Business Hub (ग्राहक बातचीत)</h1>
            <p className="text-[10px] text-amber-300 font-bold">
              👤 {currentUser?.full_name || 'Merchant'} ({sellerPhone})
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
          onClick={() => { setActiveTab('listings'); setSortByInterest(true); }}
          className={`p-3 rounded-2xl border text-center space-y-0.5 shadow-md transition cursor-pointer active:scale-95 ${
            activeTab === 'listings' && sortByInterest
              ? 'bg-orange-500/20 border-orange-400 text-orange-300 ring-2 ring-orange-400/30'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Interested</span>
          <span className="text-lg font-black text-cyan-400">🔥 {totalInterests}</span>
          <span className="text-[9px] text-cyan-300 font-bold block">Buyers</span>
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

      {/* Navigation Tabs */}
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
          <span>📦 My Listings ({myListings.length})</span>
        </button>
      </div>

      {/* TAB 1: INQUIRIES */}
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
                    <VoiceNotePlayer audioUrl={inq.audioUrl} duration={inq.audioDuration} senderName={inq.userName.split(' ')[0]} />
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

      {/* TAB 2: ACTIVE LISTINGS & DIRECT ADMIN VOICE/TEXT CHAT */}
      {activeTab === 'listings' && (
        <section className="space-y-3.5">
          <div className="p-3.5 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-transparent border border-amber-400/40 rounded-2xl flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">✨ GROW YOUR BUSINESS</span>
              <h3 className="text-xs font-black text-slate-100 mt-0.5">Want to enlist another item?</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setIsCreatingNew(true);
              }}
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
                const isPending =
                  item.has_pending_approval === true ||
                  item.is_active === false ||
                  Boolean(item.pending_changes);

                const isRecordingAdmin = recordingAdminReplyId === item.id;

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
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[9px] font-black uppercase text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded-md inline-block">
                              {item.category}
                            </span>
                            {isPending && (
                              <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40 animate-pulse">
                                ⏳ PENDING APPROVAL
                              </span>
                            )}
                          </div>
                          <h3 className="text-xs font-black text-slate-100 truncate mt-0.5">{item.title || item.name}</h3>
                          <p className="text-[11px] font-bold text-amber-400">{item.price || 'Rate on Request'}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-1 shrink-0">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-amber-500/30 text-amber-300 font-black text-[9.5px]">
                          ⭐ {item.interestCount || 0}
                        </span>
                      </div>
                    </div>

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

                        {/* 🎙️ Direct Audio / Text Reply to Admin */}
                        <div className="pt-2 border-t border-amber-500/30 space-y-1.5">
                          <span className="text-[9px] font-black text-amber-300 block">
                            Direct Reply to Admin (एडमिन को उत्तर दें):
                          </span>

                          {isRecordingAdmin ? (
                            <div className="flex items-center justify-between p-2 bg-rose-950/60 border border-rose-500/50 rounded-xl animate-pulse">
                              <span className="text-[10px] font-bold text-rose-300">
                                🎙️ Recording Voice: 0:{adminRecordingSecs < 10 ? '0' : ''}${adminRecordingSecs}
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

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
                      <span className="text-slate-500 font-semibold truncate max-w-[160px]">📍 {item.location || selectedCity}</span>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg font-bold transition cursor-pointer active:scale-95"
                      >
                        ✏️ Edit Details & Media
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* MODAL: EDIT & ENLIST NEW */}
      {(editingItem || isCreatingNew) && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in select-none">
          <div className="bg-slate-900 border border-amber-500/40 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3.5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <h3 className="text-xs font-black text-amber-300">
                  {isCreatingNew ? '🆕 Enlist New Listing' : '✏️ Edit Listing Details'}
                </h3>
                <p className="text-[9px] text-slate-400">
                  {isCreatingNew ? 'Submit for Admin approval' : `Editing "${editingItem?.title || editingItem?.name}"`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setEditingItem(null); setIsCreatingNew(false); }}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveListing} className="space-y-3 text-[11px]">
              {/* Category & Subcategory */}
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
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-slate-100 text-xs"
                    >
                      {Object.keys(TAXONOMY_REGISTRY).map((catKey) => {
                        const cat = TAXONOMY_REGISTRY[catKey];
                        return <option key={cat.id} value={cat.id}>{cat.icon} {cat.name.split('(')[0]}</option>;
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-300 block mb-1">Subcategory *</label>
                    <select
                      value={formData.subCategory}
                      onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-slate-100 text-xs"
                    >
                      <option value="all">🌟 All / General</option>
                      {availableSubCategories.map((sub) => (
                        <option key={sub.id} value={sub.id}>{sub.icon || '•'} {sub.name.split('(')[0]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {hasCategoryChanged && (
                  <div className="p-2.5 rounded-xl bg-amber-950/70 border border-amber-500/50 text-[9.5px] text-amber-200">
                    ⚠️ <strong>Heritage Reminder:</strong> Previously registered under <span className="underline font-black uppercase text-amber-300">{formData.originalCategory}</span> ({formData.originalSubCategory}).
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="text-[9.5px] font-bold text-slate-300 block mb-1">Title / Name *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Rajputana Motors Dhanteras Deal"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              {/* Price (Digits Only) */}
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
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-slate-100 font-bold font-mono"
                    />
                  </div>
                  <input
                    type="text"
                    value={formData.priceUnit}
                    onChange={(e) => setFormData({ ...formData, priceUnit: e.target.value })}
                    placeholder="e.g. / Kg"
                    className="w-24 bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-slate-300 text-center text-xs"
                  />
                </div>
              </div>

              {/* Ready Stock */}
              <div>
                <label className="text-[9px] font-bold text-slate-300 block mb-1">Ready Stock Units (केवल अंक)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.stockCount}
                  onChange={(e) => setFormData({ ...formData, stockCount: e.target.value.replace(/\D/g, '') })}
                  placeholder="e.g. 10"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono"
                />
              </div>

              {/* Working Hours */}
              <div className="p-2.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <label className="text-[9.5px] font-black text-slate-200 block">⏰ Active Hours</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-1">
                    <select
                      value={timePicker.startHour}
                      onChange={(e) => setTimePicker({ ...timePicker, startHour: e.target.value })}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-1.5 px-2 text-slate-100 text-xs font-bold"
                    >
                      {HOURS_LIST.map((h) => <option key={h} value={h}>{h}:00</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => setTimePicker({ ...timePicker, startPeriod: timePicker.startPeriod === 'AM' ? 'PM' : 'AM' })}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-black text-[10px]"
                    >
                      {timePicker.startPeriod}
                    </button>
                  </div>

                  <div className="flex items-center space-x-1">
                    <select
                      value={timePicker.endHour}
                      onChange={(e) => setTimePicker({ ...timePicker, endHour: e.target.value })}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-1.5 px-2 text-slate-100 text-xs font-bold"
                    >
                      {HOURS_LIST.map((h) => <option key={h} value={h}>{h}:00</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => setTimePicker({ ...timePicker, endPeriod: timePicker.endPeriod === 'AM' ? 'PM' : 'AM' })}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-black text-[10px]"
                    >
                      {timePicker.endPeriod}
                    </button>
                  </div>
                </div>
              </div>

              {/* Location & 1-Tap GPS */}
              <div>
                <label className="text-[9.5px] font-bold text-slate-300 block mb-1">Location *</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Company Bagh Road, Alwar"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={isLocating}
                className="w-full py-2.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 text-slate-950 font-black text-xs rounded-2xl shadow-md cursor-pointer flex items-center justify-center space-x-1.5 active:scale-98 border border-amber-300/40"
              >
                <span>📍</span>
                <span>{isLocating ? 'Detecting GPS...' : '1-Tap Set Live Shop GPS'}</span>
              </button>

              {/* 4 Highlights */}
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
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100 text-[10.5px]"
                    />
                  </div>
                ))}
              </div>

              {/* Photos */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[9.5px] font-black text-slate-300">📷 Photos ({formData.images.length}/10)</label>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={formData.images.length >= 10}
                    className="text-[9px] font-black bg-slate-800 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md cursor-pointer"
                  >
                    + Add Photos
                  </button>
                </div>

                <input type="file" ref={photoInputRef} multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-700">
                        <img src={img.preview || img} alt="Thumb" className="w-full h-full object-cover" />
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

              {/* Videos (with 0-100% Progress Bar) */}
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

                <input type="file" ref={videoInputRef} accept="video/*" onChange={handleVideoUpload} className="hidden" />

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
                      Optimizing {videoUploadState.fileName} for fast 4G streaming... Please wait.
                    </p>
                  </div>
                )}

                {formData.videos.map((vid, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-700 text-[9.5px]">
                    <span className="truncate text-slate-200">🎬 {vid.name || `Video ${idx + 1}`} ({vid.duration || 30}s)</span>
                    <button type="button" onClick={() => handleRemoveVideo(idx)} className="text-rose-400 font-black cursor-pointer">✕</button>
                  </div>
                ))}
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[9px] text-slate-400">
                🛡️ Note: All changes and new submissions are routed to the Admin Dashboard for verification before going live across {selectedCity}.
              </div>

              <button
                type="submit"
                disabled={isSubmittingForm || videoUploadState.isProcessing}
                className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs rounded-xl shadow-lg active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                {isSubmittingForm ? 'Uploading & Submitting... ⏳' : isCreatingNew ? 'Submit for Admin Approval ➔' : 'Submit Edits for Approval ➔'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}