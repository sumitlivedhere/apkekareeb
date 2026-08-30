import React, { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import {
  approveListingChanges,
  rejectListingChanges,
  sendAdminFeedbackToSeller,
  uploadVoiceNoteToStorage,
  uploadListingImagesToStorage,
  uploadListingVideosToStorage,
  deleteListingFromDB,
  saveNotificationToDB,
} from '../../services/listingService';
import {
  adminToggleBanUser,
  adminDeleteUser,
  adminDeleteAllSellerListings,
  adminDemoteMerchant,
  adminAddNewUser,
  sanitizePhone,
} from '../../services/authService';
import { TAXONOMY_REGISTRY, getCategoryById } from '../../data/taxonomyRegistry';
import { CITY_ZONES } from '../../data/cityZones';
import { getOptimizedVoiceStream, createOptimizedMediaRecorder } from '../../utils/audioCompressor';
import VoiceNotePlayer from '../common/VoiceNotePlayer';

// ⏱️ Granular Time Presets
const TIME_PRESETS = [
  { label: 'All History', value: 'all', ms: Infinity },
  { label: 'Last 1 Hour', value: '1h', ms: 1 * 60 * 60 * 1000 },
  { label: 'Last 3 Hours', value: '3h', ms: 3 * 60 * 60 * 1000 },
  { label: 'Last 6 Hours', value: '6h', ms: 6 * 60 * 60 * 1000 },
  { label: 'Last 12 Hours', value: '12h', ms: 12 * 60 * 60 * 1000 },
  { label: 'Last 24 Hours (Today)', value: '24h', ms: 24 * 60 * 60 * 1000 },
  { label: 'Last 2 Days', value: '2d', ms: 2 * 24 * 60 * 60 * 1000 },
  { label: 'Last 3 Days', value: '3d', ms: 3 * 24 * 60 * 60 * 1000 },
  { label: 'Last 5 Days', value: '5d', ms: 5 * 24 * 60 * 60 * 1000 },
  { label: 'Last 7 Days (1 Week)', value: '7d', ms: 7 * 24 * 60 * 60 * 1000 },
  { label: 'Last 14 Days (2 Weeks)', value: '14d', ms: 14 * 24 * 60 * 60 * 1000 },
  { label: 'Last 30 Days (1 Month)', value: '30d', ms: 30 * 24 * 60 * 60 * 1000 },
  { label: 'Last 90 Days (3 Months)', value: '90d', ms: 90 * 24 * 60 * 60 * 1000 },
  { label: 'Last 180 Days (6 Months)', value: '180d', ms: 180 * 24 * 60 * 60 * 1000 },
  { label: 'Last 365 Days (1 Year)', value: '365d', ms: 365 * 24 * 60 * 60 * 1000 },
];

// 🏷️ Granular 1-Click Field-Specific Flagging Presets
const FIELD_ISSUE_PRESETS = {
  title: ['Misleading Title', 'ALL CAPS / Spammy', 'Brand Name Missing', 'Too Vague'],
  price: ['Fake Discount / High Original Price', 'Price unrealistic for Alwar', 'Advance token too high', 'Rate mismatch in description'],
  category: ['Wrong Main Sector', 'Wrong Subcategory', 'Belongs to Kaarigar/Services', 'Belongs to Re-Commerce/Old Items'],
  images: ['Blurry / Low Quality', 'Watermarked / Phone Number on Photo', 'Duplicate / Stock Photos', 'Need Real Shop/Item Photo'],
  videos: ['Irrelevant Video', 'Poor Audio/Video Quality', 'Inappropriate Content', 'Copyrighted Music'],
  description: ['Missing Combo Item Inclusions', 'Too Short (<20 words)', 'Contains Prohibited Contact info', 'Unclear Return/Warranty Policy'],
  location: ['Incorrect Locality Tag', 'GPS Pin Out of Bounds', 'Incomplete Shop Landmark'],
  trial: ['Trial terms not clearly explained', 'Advance requested for doorstep trial is high'],
};

// 🔍 Robust Category Matching
const matchCategory = (itemCategory, selectedCat) => {
  if (!selectedCat || selectedCat === 'all') return true;
  if (!itemCategory) return false;

  const cleanItemCat = String(itemCategory).toLowerCase().trim();
  const cleanSelected = String(selectedCat).toLowerCase().trim();

  if (cleanItemCat === cleanSelected) return true;

  const taxEntry =
    TAXONOMY_REGISTRY[cleanSelected] ||
    TAXONOMY_REGISTRY[selectedCat] ||
    (typeof getCategoryById === 'function' ? getCategoryById(selectedCat) : null) ||
    Object.values(TAXONOMY_REGISTRY).find(
      (c) => c.id?.toLowerCase() === cleanSelected || c.name?.toLowerCase() === cleanSelected
    );

  if (taxEntry) {
    if (taxEntry.id && String(taxEntry.id).toLowerCase() === cleanItemCat) return true;
    if (taxEntry.name && String(taxEntry.name).toLowerCase().includes(cleanItemCat)) return true;
    if (taxEntry.name && cleanItemCat.includes(String(taxEntry.name).toLowerCase().split('(')[0].trim())) return true;
  }

  const itemTaxEntry = TAXONOMY_REGISTRY[cleanItemCat] || (typeof getCategoryById === 'function' ? getCategoryById(cleanItemCat) : null);
  if (itemTaxEntry) {
    if (itemTaxEntry.id && String(itemTaxEntry.id).toLowerCase() === cleanSelected) return true;
    if (itemTaxEntry.name && String(itemTaxEntry.name).toLowerCase().includes(cleanSelected)) return true;
  }

  return false;
};

const matchSubCategory = (itemSub, selectedSub) => {
  if (!selectedSub || selectedSub === 'all') return true;
  if (!itemSub) return false;

  const cleanItemSub = String(itemSub).toLowerCase().trim();
  const cleanSelected = String(selectedSub).toLowerCase().trim();

  if (cleanItemSub === cleanSelected) return true;
  if (cleanItemSub.includes(cleanSelected) || cleanSelected.includes(cleanItemSub)) return true;

  return false;
};

export default function DesktopAdminDashboard({
  allListings = [],
  pendingApprovals = [],
  approvedListings = [],
  allFilteredListings = [],
  profiles = [],
  reports = [],
  threads = [],
  reviews = [],
  filteredProfiles = [],
  zoneMerchantCounts = {},
  searchQuery = '',
  setSearchQuery,
  selectedCategory = 'all',
  setSelectedCategory,
  selectedColony = 'all',
  setSelectedColony,
  selectedOfferType = 'all',
  setSelectedOfferType,
  sortBy = 'newest',
  setSortBy,
  timeFilterType = 'all',
  setTimeFilterType,
  crmSearchQuery = '',
  setCrmSearchQuery,
  crmFilterTier = 'all',
  setCrmFilterTier,
  newMemberName = '',
  setNewMemberName,
  newMemberPhone = '',
  setNewMemberPhone,
  newMemberArea = 'Ranjeet Nagar',
  setNewMemberArea,
  newMemberRole = 'merchant',
  setNewMemberRole,
  newBusinessName = '',
  setNewBusinessName,
  actionLoading = false,
  isRefreshing = false,
  onRefresh,
  onLogout,
  onSwitchToMobile,
  showNotice,
  handleGenerateAndDispatchPin,
  handleBulkDispatchPins,
  handleManualAddMember,
  handleAdjustTrustScore,
  handleExportDirectoryCSV,
  selectedCity = 'Alwar',
}) {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedItemId, setSelectedItemId] = useState(() => pendingApprovals[0]?.id || null);
  const [selectedCrmUser, setSelectedCrmUser] = useState(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');

  // Inspector & Edit Mode States
  const [isAdminEditing, setIsAdminEditing] = useState(false);
  const [inspectorViewMode, setInspectorViewMode] = useState('canvas'); // 'canvas' | 'preview'
  const [actionInProgressId, setActionInProgressId] = useState(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // 📷 🎬 Interactive Media State (Photos & Videos)
  const [activeMediaTab, setActiveMediaTab] = useState('photos'); // 'photos' | 'videos'
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxType, setLightboxType] = useState('photos');

  const adminPhotoInputRef = useRef(null);
  const adminVideoInputRef = useRef(null);

  // 🎯 Field-Specific Issue Flagging State
  const [fieldIssues, setFieldIssues] = useState({});
  const [activeAnnotatingField, setActiveAnnotatingField] = useState(null);

  const [editFormData, setEditFormData] = useState({
    title: '',
    category: 'market',
    subCategory: 'all',
    price: '',
    original_price: '',
    deal_badge: '',
    deal_details: '',
    token_amount: '',
    doorstep_trial: false,
    location: '',
    lat: null,
    lng: null,
    timing: '09:00 AM - 09:00 PM',
    description: '',
    images: [],
    videos: [],
    sellerName: '',
    phone: '',
    whatsapp: '',
  });

  const [feedbackText, setFeedbackText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedVoiceNote, setRecordedVoiceNote] = useState(null);

  // Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastRole, setBroadcastRole] = useState('public');
  const [broadcastTag, setBroadcastTag] = useState('ALWAR_ALERT');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Inbuilt Subcategories Resolver
  const currentCategoryObj = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'all') return null;
    return (
      TAXONOMY_REGISTRY[selectedCategory] ||
      TAXONOMY_REGISTRY[selectedCategory.toLowerCase()] ||
      (typeof getCategoryById === 'function' ? getCategoryById(selectedCategory) : null) ||
      Object.values(TAXONOMY_REGISTRY).find(
        (c) => c.id?.toLowerCase() === selectedCategory.toLowerCase() || c.name?.toLowerCase() === selectedCategory.toLowerCase()
      )
    );
  }, [selectedCategory]);

  const availableSubCategories = useMemo(() => {
    if (!currentCategoryObj) return [];
    return currentCategoryObj.subCategories || currentCategoryObj.subcategories || currentCategoryObj.subs || [];
  }, [currentCategoryObj]);

  // Dynamic Time Window & Multi-Factor Sorting
  const processedListings = useMemo(() => {
    const rawList =
      activeTab === 'pending'
        ? pendingApprovals
        : activeTab === 'approved'
        ? approvedListings
        : allFilteredListings;

    const now = Date.now();
    const activePreset = TIME_PRESETS.find((p) => p.value === timeFilterType) || TIME_PRESETS[0];

    let list = rawList.filter((item) => {
      if (activePreset.ms === Infinity) return true;
      const changes = item.pending_changes || {};
      const itemTimeStr = changes.updated_at || changes.created_at || item.updated_at || item.created_at || item.timestamp;
      const itemTime = itemTimeStr ? new Date(itemTimeStr).getTime() : 0;
      if (!itemTime) return true;
      return now - itemTime <= activePreset.ms;
    });

    list = list.filter((item) => {
      const changes = item.pending_changes || {};
      const itemCat = changes.category || item.category || '';
      const itemSub = changes.subCategory || changes.sub_category || item.subCategory || item.sub_category || changes.subcategory || item.subcategory || '';
      const loc = changes.location || item.location || item.location_name || '';

      if (!matchCategory(itemCat, selectedCategory)) return false;
      if (!matchSubCategory(itemSub, selectedSubCategory)) return false;
      if (selectedColony && selectedColony !== 'all' && !loc.toLowerCase().includes(selectedColony.toLowerCase())) return false;

      return true;
    });

    if (selectedOfferType === 'combos') {
      list = list.filter((i) => Boolean(i.pending_changes?.deal_badge || i.deal_badge));
    } else if (selectedOfferType === 'trials') {
      list = list.filter((i) => Boolean(i.pending_changes?.doorstep_trial ?? i.doorstep_trial));
    } else if (selectedOfferType === 'token') {
      list = list.filter((i) => Boolean(i.pending_changes?.token_amount || i.token_amount));
    } else if (selectedOfferType === 'discount') {
      list = list.filter((i) => Boolean(i.pending_changes?.original_price || i.original_price));
    }

    return [...list].sort((a, b) => {
      const aChanges = a.pending_changes || {};
      const bChanges = b.pending_changes || {};
      const aTime = new Date(aChanges.updated_at || aChanges.created_at || a.updated_at || a.created_at || 0).getTime();
      const bTime = new Date(bChanges.updated_at || bChanges.created_at || b.updated_at || b.created_at || 0).getTime();
      const aPrice = parseFloat(String(aChanges.price || a.price || '0').replace(/[^0-9.]/g, '')) || 0;
      const bPrice = parseFloat(String(bChanges.price || b.price || '0').replace(/[^0-9.]/g, '')) || 0;
      const aInterest = Number(a.interestCount || a.interest_count || 0);
      const bInterest = Number(b.interestCount || b.interest_count || 0);

      switch (sortBy) {
        case 'oldest':
          return aTime - bTime;
        case 'interest_desc':
          return bInterest - aInterest;
        case 'interest_asc':
          return aInterest - bInterest;
        case 'price_asc':
          return aPrice - bPrice;
        case 'price_desc':
          return bPrice - aPrice;
        case 'discount_desc': {
          const aHasDeal = aChanges.deal_badge || a.deal_badge ? 1 : 0;
          const bHasDeal = bChanges.deal_badge || b.deal_badge ? 1 : 0;
          return bHasDeal - aHasDeal;
        }
        case 'title_asc':
          return (aChanges.title || a.title || '').localeCompare(bChanges.title || b.title || '');
        case 'newest':
        default:
          return bTime - aTime;
      }
    });
  }, [
    activeTab,
    pendingApprovals,
    approvedListings,
    allFilteredListings,
    timeFilterType,
    selectedCategory,
    selectedSubCategory,
    selectedColony,
    selectedOfferType,
    sortBy,
  ]);

  const activeItem = useMemo(() => {
    return (
      processedListings.find((i) => String(i.id) === String(selectedItemId)) ||
      processedListings[0] ||
      allListings.find((i) => String(i.id) === String(selectedItemId)) ||
      null
    );
  }, [processedListings, allListings, selectedItemId]);

  // Synchronize inspection fields
  useEffect(() => {
    if (!activeItem) return;
    const changes = activeItem.pending_changes || {};
    const rawPhotos = changes.images || changes.image_urls || activeItem.images || (changes.image ? [changes.image] : [activeItem.image]);
    const cleanPhotos = (rawPhotos || []).map((p) => (typeof p === 'string' ? p : p.url || p.preview)).filter(Boolean);
    const rawVideos = changes.videos || changes.video_urls || activeItem.videos || [];

    setEditFormData({
      title: changes.title || activeItem.title || activeItem.name || '',
      category: changes.category || activeItem.category || 'market',
      subCategory: changes.subCategory || changes.sub_category || activeItem.subCategory || activeItem.sub_category || 'all',
      price: changes.price || activeItem.price || '',
      original_price: changes.original_price || changes.originalPrice || activeItem.original_price || activeItem.originalPrice || '',
      deal_badge: changes.deal_badge || changes.dealBadge || activeItem.deal_badge || activeItem.dealBadge || '',
      deal_details: changes.deal_details || changes.dealDetails || activeItem.deal_details || activeItem.dealDetails || '',
      token_amount: changes.token_amount || changes.tokenAmount || activeItem.token_amount || activeItem.tokenAmount || '',
      doorstep_trial: Boolean(changes.doorstep_trial ?? changes.doorstepTrial ?? activeItem.doorstep_trial ?? activeItem.doorstepTrial ?? false),
      location: changes.location || activeItem.location || selectedCity,
      lat: changes.lat !== undefined ? changes.lat : activeItem.lat,
      lng: changes.lng !== undefined ? changes.lng : activeItem.lng,
      timing: changes.timing || activeItem.timing || activeItem.activeHours || '09:00 AM - 09:00 PM',
      description: changes.description || activeItem.description || '',
      images: cleanPhotos,
      videos: rawVideos,
      sellerName: changes.sellerName || activeItem.sellerName || activeItem.seller_name || '',
      phone: changes.phone || activeItem.phone || '',
      whatsapp: changes.whatsapp || activeItem.whatsapp || '',
    });

    setIsAdminEditing(false);
    setActivePhotoIdx(0);
    setActiveVideoIdx(0);
    setActiveMediaTab(rawVideos.length > 0 && cleanPhotos.length === 0 ? 'videos' : 'photos');
    setFieldIssues({});
    setActiveAnnotatingField(null);
    setFeedbackText(activeItem.admin_feedback || '');
    setRecordedVoiceNote(null);
  }, [activeItem, selectedCity]);

  // 📷 🎬 Admin Media Handlers
  const handleAdminAddPhoto = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newItems = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      preview: URL.createObjectURL(file),
      isNew: true,
    }));
    setEditFormData((prev) => ({ ...prev, images: [...prev.images, ...newItems] }));
    setActiveMediaTab('photos');
    setActivePhotoIdx(editFormData.images.length);
    e.target.value = '';
    showNotice(`Attached ${files.length} photo(s).`);
  };

  const handleAdminRemovePhoto = (idx, e) => {
    if (e) e.stopPropagation();
    setEditFormData((prev) => {
      const updated = prev.images.filter((_, i) => i !== idx);
      return { ...prev, images: updated };
    });
    if (activePhotoIdx >= idx && activePhotoIdx > 0) {
      setActivePhotoIdx((p) => p - 1);
    }
  };

  const handleAdminAddVideo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const tempUrl = URL.createObjectURL(file);
    const newVideoObj = { file, url: tempUrl, name: file.name, isNew: true };
    setEditFormData((prev) => ({ ...prev, videos: [...prev.videos, newVideoObj] }));
    setActiveMediaTab('videos');
    setActiveVideoIdx(editFormData.videos.length);
    e.target.value = '';
    showNotice('Video attached.');
  };

  const handleAdminRemoveVideo = (idx, e) => {
    if (e) e.stopPropagation();
    setEditFormData((prev) => {
      const updated = prev.videos.filter((_, i) => i !== idx);
      return { ...prev, videos: updated };
    });
    if (activeVideoIdx >= idx && activeVideoIdx > 0) {
      setActiveVideoIdx((p) => p - 1);
    }
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'Escape' && isLightboxOpen) {
        setIsLightboxOpen(false);
        return;
      }

      if (e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (activeTab === 'pending' || activeTab === 'approved' || activeTab === 'all') {
        const currentIdx = processedListings.findIndex((i) => String(i.id) === String(selectedItemId));

        if (e.key.toLowerCase() === 'j' || e.key === 'ArrowDown') {
          e.preventDefault();
          if (currentIdx < processedListings.length - 1) setSelectedItemId(processedListings[currentIdx + 1].id);
        } else if (e.key.toLowerCase() === 'k' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (currentIdx > 0) setSelectedItemId(processedListings[currentIdx - 1].id);
        } else if (e.key.toLowerCase() === 'a' && activeItem) {
          e.preventDefault();
          handleDesktopApprove(activeItem);
        } else if (e.key.toLowerCase() === 'r' && activeItem) {
          e.preventDefault();
          handleDesktopReject(activeItem);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, selectedItemId, activeItem, processedListings, isLightboxOpen]);

  // 🏷️ Flag / Unflag Specific Field Helper
  const handleToggleFieldIssue = (fieldName, issueTag) => {
    setFieldIssues((prev) => {
      const existing = prev[fieldName];
      if (existing && existing.tag === issueTag) {
        const copy = { ...prev };
        delete copy[fieldName];
        return copy;
      }
      return {
        ...prev,
        [fieldName]: {
          tag: issueTag,
          note: existing?.note || '',
        },
      };
    });
  };

  const totalFlaggedIssuesCount = Object.keys(fieldIssues).length;

  // Moderation Operations
  const handleDesktopApprove = async (item) => {
    if (!item) return;
    setActionInProgressId(item.id);
    try {
      let finalChanges = item.pending_changes || {};
      let finalImages = editFormData.images;
      let finalVideos = editFormData.videos;

      if (isAdminEditing) {
        // Upload any newly selected image files
        const newImageFiles = finalImages.filter((img) => img?.file).map((img) => img.file);
        const uploadedNewImageUrls = newImageFiles.length > 0 ? await uploadListingImagesToStorage(newImageFiles) : [];
        const existingImageUrls = finalImages.filter((img) => typeof img === 'string' || (!img?.file && img?.url)).map((img) => (typeof img === 'string' ? img : img.url));
        finalImages = [...existingImageUrls, ...uploadedNewImageUrls];

        // Upload any newly selected video files
        const newVideoObjects = finalVideos.filter((v) => v?.file);
        const uploadedNewVideos = newVideoObjects.length > 0 ? await uploadListingVideosToStorage(newVideoObjects) : [];
        const existingVideos = finalVideos.filter((v) => !v?.file).map((v) => (typeof v === 'string' ? v : v.url));
        finalVideos = [...existingVideos, ...uploadedNewVideos];

        finalChanges = {
          ...finalChanges,
          title: editFormData.title.trim(),
          category: editFormData.category,
          subCategory: editFormData.subCategory,
          sub_category: editFormData.subCategory,
          price: editFormData.price.trim(),
          original_price: editFormData.original_price ? editFormData.original_price.trim() : null,
          deal_badge: editFormData.deal_badge ? editFormData.deal_badge.trim() : null,
          deal_details: editFormData.deal_details ? editFormData.deal_details.trim() : null,
          token_amount: editFormData.token_amount ? editFormData.token_amount.trim() : null,
          doorstep_trial: Boolean(editFormData.doorstep_trial),
          location: editFormData.location,
          timing: editFormData.timing,
          description: editFormData.description.trim(),
          image: finalImages[0] || item.image,
          images: finalImages,
          image_urls: finalImages,
          videos: finalVideos,
          video_urls: finalVideos,
        };
      }

      const updatedPayload = {
        ...item,
        ...finalChanges,
        is_active: true,
        has_pending_approval: false,
        pending_changes: null,
        admin_feedback: null,
        verification_badge: 'Verified Listing',
      };

      await approveListingChanges(item.id, updatedPayload);
      showNotice(`✓ Published "${finalChanges.title || item.title}"`);

      const remaining = processedListings.filter((p) => p.id !== item.id);
      if (remaining.length > 0) setSelectedItemId(remaining[0].id);
    } catch (err) {
      console.error(err);
      alert('Failed to approve listing.');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDesktopReject = async (item) => {
    if (!item) return;
    setActionInProgressId(item.id);
    try {
      const structuredFeedback = {
        summary: feedbackText.trim() || 'Listing requires corrections before it can be approved.',
        flaggedIssues: fieldIssues,
        audioUrl: recordedVoiceNote?.audioUrl || null,
        duration: recordedVoiceNote?.duration || null,
        rejectedAt: new Date().toISOString(),
      };

      const reasonString = JSON.stringify(structuredFeedback);
      await rejectListingChanges(item.id, reasonString, sanitizePhone(item.phone));
      showNotice(`Rejected "${item.title}" with ${totalFlaggedIssuesCount} flagged issue(s)`);

      const remaining = processedListings.filter((p) => p.id !== item.id);
      if (remaining.length > 0) setSelectedItemId(remaining[0].id);
    } catch (err) {
      console.error(err);
      alert('Failed to reject listing.');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDispatchGranularFeedback = async () => {
    if (!activeItem) return;
    if (totalFlaggedIssuesCount === 0 && !feedbackText.trim() && !recordedVoiceNote) {
      alert('Please flag at least one field or enter a review message / voice note.');
      return;
    }

    const feedbackPayload = {
      summary: feedbackText.trim() || 'Please correct the flagged sections in your listing.',
      flaggedIssues: fieldIssues,
      audioUrl: recordedVoiceNote?.audioUrl || null,
      duration: recordedVoiceNote?.duration || null,
      dispatchedAt: new Date().toISOString(),
    };

    try {
      await sendAdminFeedbackToSeller(activeItem.id, sanitizePhone(activeItem.phone), feedbackPayload);
      showNotice(`✓ Dispatched feedback with ${totalFlaggedIssuesCount} flagged item(s) to merchant!`);
      setFieldIssues({});
      setFeedbackText('');
      setRecordedVoiceNote(null);
    } catch (e) {
      console.error(e);
      alert('Failed to send feedback.');
    }
  };

  const handleBatchApproveAll = async () => {
    if (processedListings.length === 0) return;
    if (!window.confirm(`⚡ BATCH APPROVE: Publish all ${processedListings.length} listing(s) in this filtered queue?`)) return;

    setIsBatchProcessing(true);
    let count = 0;
    for (const item of processedListings) {
      try {
        const changes = item.pending_changes || {};
        const updatedPayload = {
          ...item,
          ...changes,
          is_active: true,
          has_pending_approval: false,
          pending_changes: null,
          admin_feedback: null,
          verification_badge: 'Verified Listing',
        };
        await approveListingChanges(item.id, updatedPayload);
        count++;
      } catch (e) {
        console.error(e);
      }
    }
    setIsBatchProcessing(false);
    showNotice(`🎉 Approved & published ${count} listings!`);
  };

  const handleSendAlwarBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) {
      showNotice('⚠️ Please enter broadcast title and message.');
      return;
    }
    setIsSendingBroadcast(true);
    try {
      await saveNotificationToDB({
        tag: broadcastTag,
        title: broadcastTitle.trim(),
        message: broadcastMsg.trim(),
        recipient_role: broadcastRole,
        recipient_phone: null,
        metadata: { broadcastBy: 'Master Admin Studio', timestamp: new Date().toISOString() },
      });
      showNotice(`📢 Broadcast dispatched to ${broadcastRole.toUpperCase()} members!`);
      setBroadcastTitle('');
      setBroadcastMsg('');
    } catch (err) {
      console.error(err);
      alert('Failed to dispatch broadcast.');
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleStartVoice = async () => {
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
      timerRef.current = setInterval(() => setRecordingSeconds((p) => p + 1), 1000);
    } catch {
      alert('Microphone access denied. Please grant permissions.');
    }
  };

  const handleStopVoice = () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    mr.onstop = async () => {
      clearInterval(timerRef.current);
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: mr.mimeType || 'audio/webm' });
        const publicAudioUrl = await uploadVoiceNoteToStorage(audioBlob);
        setRecordedVoiceNote({
          audioUrl: publicAudioUrl,
          duration: `0:${recordingSeconds < 10 ? '0' : ''}${recordingSeconds}`,
        });
      } catch (err) {
        console.error('Audio upload failed:', err);
      } finally {
        if (mr.stream) mr.stream.getTracks().forEach((t) => t.stop());
        setIsRecordingVoice(false);
      }
    };
    mr.stop();
  };

  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden antialiased text-sm">
      
      {/* Hidden File Inputs for Admin Photo & Video Uploads */}
      <input type="file" ref={adminPhotoInputRef} onChange={handleAdminAddPhoto} multiple accept="image/*" className="hidden" />
      <input type="file" ref={adminVideoInputRef} onChange={handleAdminAddVideo} accept="video/*" className="hidden" />

      {/* 🌟 1. MASTER HEADER */}
      <header className="w-full bg-slate-900 border-b border-slate-800 px-8 py-3.5 flex items-center justify-between shadow-2xl shrink-0 z-30">
        <div className="flex items-center space-x-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg">
            👑
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-base font-black uppercase tracking-wider text-slate-100">
                Aapke Kareeb • Master Studio
              </h1>
              <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black border border-emerald-500/40">
                ● Live {selectedCity}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-semibold">
              Desktop Command Center & Granular Moderation Suite
            </p>
          </div>
        </div>

        {/* Global Desktop Search Input */}
        <div className="flex-1 max-w-2xl mx-12">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base">🔍</span>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search catalog, merchant, phone (+91), colony... (Press '/' to focus)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-11 pr-14 py-2.5 text-sm font-bold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition shadow-inner"
            />
            <kbd className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-md text-xs font-mono font-bold">
              /
            </kbd>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-2xl border border-slate-700 transition cursor-pointer flex items-center space-x-2 shadow-sm active:scale-95"
            title="Refresh database"
          >
            <span>{isRefreshing ? '⏳' : '🔄'}</span>
            <span>Sync DB</span>
          </button>

          <button
            type="button"
            onClick={onSwitchToMobile}
            className="px-4 py-2 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 font-bold text-xs rounded-2xl border border-indigo-700 transition cursor-pointer flex items-center space-x-2 shadow-sm active:scale-95"
          >
            <span>📱</span>
            <span>Mobile View</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold text-xs rounded-2xl border border-rose-800 transition cursor-pointer flex items-center space-x-2 shadow-sm active:scale-95"
          >
            <span>🔒</span>
            <span>Lock</span>
          </button>
        </div>
      </header>

      {/* 🌟 2. REAL-TIME STATS TICKER BAR */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-8 py-2.5 grid grid-cols-5 gap-6 text-sm shrink-0 font-bold shadow-inner">
        <div className="flex items-center space-x-3">
          <span className="text-amber-400 font-bold">⚡ Pending Approvals:</span>
          <span className="font-mono text-white bg-amber-950 px-3 py-0.5 rounded-lg border border-amber-500/40 text-sm font-black">
            {pendingApprovals.length}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-emerald-400 font-bold">📦 Live Catalog:</span>
          <span className="font-mono text-white bg-slate-950 px-3 py-0.5 rounded-lg border border-slate-800 text-sm font-black">
            {approvedListings.length}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-pink-400 font-bold">🏬 Merchants:</span>
          <span className="font-mono text-white bg-slate-950 px-3 py-0.5 rounded-lg border border-slate-800 text-sm font-black">
            {profiles.filter((p) => p.is_merchant || p.verification_tier === 'merchant').length}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-cyan-400 font-bold">💬 Inquiries:</span>
          <span className="font-mono text-white bg-slate-950 px-3 py-0.5 rounded-lg border border-slate-800 text-sm font-black">
            {threads.length}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-rose-400 font-bold">🚩 Disputes:</span>
          <span className="font-mono text-white bg-rose-950 px-3 py-0.5 rounded-lg border border-rose-500/40 text-sm font-black">
            {reports.length}
          </span>
        </div>
      </div>

      {/* 🌟 3. FULL-SCREEN 3-PANE WORKSPACE */}
      <div className="flex-1 flex w-full h-full overflow-hidden">
        
        {/* PANE 1: LEFT MODULES (320px) */}
        <aside className="w-80 bg-slate-900/95 border-r border-slate-800 p-5 flex flex-col justify-between shrink-0 h-full">
          <div className="space-y-2.5">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest px-3 block mb-2">
              Workspace Modules
            </span>

            {[
              { id: 'pending', label: 'Listing Approvals', icon: '⚡', count: pendingApprovals.length, badgeColor: 'bg-amber-400 text-slate-950 font-black' },
              { id: 'approved', label: 'Live Catalog Feed', icon: '🟢', count: approvedListings.length, badgeColor: 'bg-emerald-500 text-slate-950 font-black' },
              { id: 'all', label: 'Master Registry', icon: '📦', count: allFilteredListings.length, badgeColor: 'bg-slate-700 text-white font-bold' },
              { id: 'crm', label: 'Member CRM & WhatsApp', icon: '👥', count: profiles.length, badgeColor: 'bg-purple-500 text-white font-bold' },
              { id: 'reports', label: 'Dispute Reports', icon: '🚩', count: reports.length, badgeColor: 'bg-rose-500 text-white font-bold' },
              { id: 'interactions', label: 'Inquiries & Reviews', icon: '💬', count: threads.length, badgeColor: 'bg-cyan-500 text-slate-950 font-bold' },
              { id: 'broadcast', label: 'Broadcast & Coverage', icon: '📢' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xl'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
                {tab.count !== undefined && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono ${tab.badgeColor}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Keyboard Shortcuts Card */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs text-slate-300 shadow-inner">
            <span className="font-black text-amber-400 block uppercase tracking-wider text-[11px]">
              ⚡ Keyboard Shortcuts
            </span>
            <div className="flex justify-between items-center font-mono text-xs">
              <span>Approve Listing:</span>
              <kbd className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-white font-bold">A</kbd>
            </div>
            <div className="flex justify-between items-center font-mono text-xs">
              <span>Reject Listing:</span>
              <kbd className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-white font-bold">R</kbd>
            </div>
            <div className="flex justify-between items-center font-mono text-xs">
              <span>Next / Prev Item:</span>
              <kbd className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-white font-bold">J / K</kbd>
            </div>
            <div className="flex justify-between items-center font-mono text-xs">
              <span>Focus Search:</span>
              <kbd className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-white font-bold">/</kbd>
            </div>
          </div>
        </aside>

        {/* PANE 2 & 3: MAIN VIEW CANVAS */}
        <main className="flex-1 flex flex-col bg-slate-950 h-full overflow-hidden">
          
          {/* ========================================================================= */}
          {/* MODULE A: 3-PANE LISTINGS MODERATION CANVAS                               */}
          {/* ========================================================================= */}
          {(activeTab === 'pending' || activeTab === 'approved' || activeTab === 'all') && (
            <div className="flex-1 flex w-full h-full overflow-hidden">
              
              {/* PANE 2: MIDDLE QUEUE STREAM (480px - 560px) */}
              <div className="w-[480px] 2xl:w-[560px] border-r border-slate-800 flex flex-col bg-slate-950 shrink-0 h-full">
                
                {/* Advanced Multi-Factor Filters Strip */}
                <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900/80 shrink-0 text-xs shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                      {activeTab === 'pending'
                        ? `Pending Queue (${processedListings.length})`
                        : activeTab === 'approved'
                        ? `Live Directory (${processedListings.length})`
                        : `Master Catalog (${processedListings.length})`}
                    </span>
                    {activeTab === 'pending' && (
                      <button
                        type="button"
                        onClick={handleBatchApproveAll}
                        disabled={isBatchProcessing || processedListings.length === 0}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs rounded-xl shadow cursor-pointer disabled:opacity-40"
                      >
                        ⚡ Batch Approve ({processedListings.length})
                      </button>
                    )}
                  </div>

                  {/* Sector & Colony Dropdowns */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setSelectedSubCategory('all');
                      }}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none"
                    >
                      <option value="all">Sector: All Categories</option>
                      {Object.keys(TAXONOMY_REGISTRY).map((k) => (
                        <option key={k} value={k}>{TAXONOMY_REGISTRY[k].name.split('(')[0]}</option>
                      ))}
                    </select>

                    <select
                      value={selectedColony}
                      onChange={(e) => setSelectedColony(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold focus:outline-none"
                    >
                      <option value="all">Colony: All Localities</option>
                      {Object.keys(CITY_ZONES).map((z) => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subcategories Quick-Tap Pills */}
                  {selectedCategory !== 'all' && availableSubCategories.length > 0 && (
                    <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px] font-bold">
                      <span className="text-amber-400 shrink-0 uppercase">Subs:</span>
                      <button
                        type="button"
                        onClick={() => setSelectedSubCategory('all')}
                        className={`px-2.5 py-0.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
                          selectedSubCategory === 'all'
                            ? 'bg-amber-400 text-slate-950 font-black shadow'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                      >
                        All ({availableSubCategories.length})
                      </button>
                      {availableSubCategories.map((sub) => {
                        const subId = sub.id || sub.key || sub.name || sub;
                        const subLabel = typeof sub === 'string' ? sub : (sub.name || sub.title || sub.id || '').split('(')[0].trim();
                        const isSelected = String(selectedSubCategory).toLowerCase() === String(subId).toLowerCase();
                        return (
                          <button
                            key={subId}
                            type="button"
                            onClick={() => setSelectedSubCategory(subId)}
                            className={`px-2.5 py-0.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950 font-black shadow'
                                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                            }`}
                          >
                            {subLabel}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* ⏱️ Granular Time Window Selector & Multi-Factor Sort */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <select
                        value={timeFilterType}
                        onChange={(e) => setTimeFilterType(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-cyan-300 font-bold focus:outline-none"
                      >
                        {TIME_PRESETS.map((preset) => (
                          <option key={preset.value} value={preset.value}>
                            {preset.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-bold focus:outline-none"
                      >
                        <option value="newest">🕒 Newest First</option>
                        <option value="oldest">⏳ Oldest Pending First</option>
                        <option value="interest_desc">⭐ Citizen Interest High</option>
                        <option value="price_asc">₹ Price: Low to High</option>
                        <option value="price_desc">₹ Price: High to Low</option>
                        <option value="discount_desc">🎁 Discounts First</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Queue Stream */}
                <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                  {processedListings.length === 0 ? (
                    <div className="p-16 text-center text-slate-500 text-xs font-bold space-y-2">
                      <span className="text-3xl block">📭</span>
                      <p>No listings match the selected filters.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setTimeFilterType('all');
                          setSelectedCategory('all');
                          setSelectedSubCategory('all');
                          setSelectedColony('all');
                        }}
                        className="text-amber-400 underline text-xs font-bold cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    processedListings.map((item) => {
                      const isSelected = activeItem && String(activeItem.id) === String(item.id);
                      const changes = item.pending_changes || {};
                      const thumb = (changes.images || item.images || [])[0] || item.image;

                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedItemId(item.id)}
                          className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center space-x-3.5 ${
                            isSelected
                              ? 'bg-amber-400/10 border-amber-400 shadow-xl ring-2 ring-amber-400/30'
                              : 'bg-slate-900 hover:bg-slate-850 border-slate-800 shadow-sm'
                          }`}
                        >
                          <img
                            src={
                              typeof thumb === 'string'
                                ? thumb
                                : thumb?.url || thumb?.preview || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=300'
                            }
                            alt="Thumb"
                            className="w-18 h-18 rounded-xl object-cover border border-slate-700 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-1.5 flex-wrap gap-y-0.5">
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-950 text-amber-300 border border-slate-800">
                                {changes.category || item.category}
                              </span>
                              {changes.deal_badge && (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                                  {changes.deal_badge}
                                </span>
                              )}
                              {item.seller_feedback_reply && (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/40 animate-pulse">
                                  💬 Merchant Replied
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-black text-slate-100 truncate mt-1">
                              {changes.title || item.title || item.name}
                            </h4>
                            <p className="text-[10.5px] text-slate-400 truncate mt-0.5">
                              👤 {changes.sellerName || item.sellerName || item.seller_name} • 📞 +91 {changes.phone || item.phone}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-emerald-400 font-mono font-black text-xs">
                                {changes.price || item.price || 'Rate on Request'}
                              </span>
                              <span className="text-[10px] font-bold text-amber-300/80">
                                ⭐ {item.interestCount || item.interest_count || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* PANE 3: RIGHT FULL-WIDTH LIVE INSPECTION STUDIO */}
              <div className="flex-1 flex flex-col bg-slate-900/40 overflow-y-auto p-6 2xl:p-8 h-full space-y-5">
                {activeItem ? (
                  <div className="w-full space-y-5">
                    
                    {/* Top Action Header Bar */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center justify-between shadow-2xl">
                      <div>
                        <div className="flex items-center space-x-2.5">
                          <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                            Listing Moderation & Issue Annotation Studio
                          </span>
                          <span className="text-xs bg-slate-950 text-slate-300 px-2.5 py-0.5 rounded-lg border border-slate-800 font-mono font-bold">
                            ID: {activeItem.id}
                          </span>
                        </div>
                        <h2 className="text-lg font-black text-white mt-1">
                          {activeItem.pending_changes?.title || activeItem.title}
                        </h2>
                      </div>

                      {/* Studio Action Suite */}
                      <div className="flex items-center space-x-2.5">
                        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold mr-2">
                          <button
                            type="button"
                            onClick={() => setInspectorViewMode('canvas')}
                            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                              inspectorViewMode === 'canvas' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            🛠️ Studio Canvas
                          </button>
                          <button
                            type="button"
                            onClick={() => setInspectorViewMode('preview')}
                            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                              inspectorViewMode === 'preview' ? 'bg-cyan-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            👁️ Citizen Feed Card
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsAdminEditing((p) => !p)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                            isAdminEditing ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-slate-800 text-amber-300 border border-amber-400/40 hover:bg-slate-700'
                          }`}
                        >
                          {isAdminEditing ? '👁️ View Original' : '✏️ Direct Fix & Edit'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDesktopApprove(activeItem)}
                          disabled={actionInProgressId === activeItem.id}
                          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs rounded-xl shadow-lg active:scale-95 transition cursor-pointer flex items-center space-x-1.5"
                        >
                          <span>✓</span>
                          <span>Approve [A]</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDesktopReject(activeItem)}
                          disabled={actionInProgressId === activeItem.id}
                          className="px-5 py-2.5 bg-rose-950 hover:bg-rose-900 text-rose-300 font-black text-xs rounded-xl border border-rose-800 shadow-md transition cursor-pointer flex items-center space-x-1.5"
                        >
                          <span>✕</span>
                          <span>Reject [R]</span>
                        </button>
                      </div>
                    </div>

                    {/* CITIZEN FEED CARD PREVIEW */}
                    {inspectorViewMode === 'preview' && (
                      <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-8 flex flex-col items-center justify-center space-y-4 shadow-2xl">
                        <span className="text-xs font-black uppercase text-cyan-300 tracking-widest">
                          📱 Citizen Feed Card Simulation
                        </span>
                        
                        <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-3 p-4">
                          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-900">
                            {editFormData.videos.length > 0 && activeMediaTab === 'videos' ? (
                              <video src={editFormData.videos[0]?.url || editFormData.videos[0]} controls className="w-full h-full object-cover" />
                            ) : (
                              <img
                                src={editFormData.images[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400'}
                                alt="Feed Preview"
                                className="w-full h-full object-cover"
                              />
                            )}
                            {editFormData.deal_badge && (
                              <span className="absolute top-2 left-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full shadow-md">
                                {editFormData.deal_badge}
                              </span>
                            )}
                          </div>

                          <div>
                            <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                              {editFormData.category}
                            </span>
                            <h3 className="text-sm font-black text-white mt-1">{editFormData.title}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-emerald-400 font-black text-base">{editFormData.price}</span>
                              {editFormData.original_price && (
                                <span className="text-slate-500 text-xs font-mono line-through">{editFormData.original_price}</span>
                              )}
                            </div>
                          </div>

                          {editFormData.deal_details && (
                            <div className="p-2.5 bg-amber-950/40 border border-amber-500/30 rounded-xl text-xs text-amber-200">
                              🎁 {editFormData.deal_details}
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                            <span>📍 {editFormData.location}</span>
                            <span className="font-bold text-amber-300">👤 {activeItem.sellerName}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* INTERACTIVE STUDIO CANVAS (PHOTOS, VIDEOS, AND ANNOTATIONS) */}
                    {inspectorViewMode === 'canvas' && (
                      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-5">
                        
                        {/* LEFT COLUMN: INTERACTIVE MEDIA CANVAS */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
                          <div className="flex items-center justify-between">
                            
                            {/* Segmented Photos / Videos Switcher */}
                            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                              <button
                                type="button"
                                onClick={() => setActiveMediaTab('photos')}
                                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
                                  activeMediaTab === 'photos'
                                    ? 'bg-amber-400 text-slate-950 font-black shadow'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                <span>📷 Photos</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 text-slate-200">
                                  {editFormData.images.length}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setActiveMediaTab('videos')}
                                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
                                  activeMediaTab === 'videos'
                                    ? 'bg-cyan-400 text-slate-950 font-black shadow'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                <span>🎬 Videos / Reels</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 text-slate-200">
                                  {editFormData.videos.length}
                                </span>
                              </button>
                            </div>

                            {/* Media Action Suite (Upload & Flagging) */}
                            <div className="flex items-center space-x-2">
                              {isAdminEditing && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (activeMediaTab === 'photos') adminPhotoInputRef.current?.click();
                                    else adminVideoInputRef.current?.click();
                                  }}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                                >
                                  + Upload {activeMediaTab === 'photos' ? 'Photo' : 'Video'}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setActiveAnnotatingField(activeAnnotatingField === activeMediaTab ? null : activeMediaTab)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  fieldIssues[activeMediaTab] ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                                }`}
                              >
                                🚩 Flag {activeMediaTab === 'photos' ? 'Photo' : 'Video'}
                              </button>
                            </div>
                          </div>

                          {/* Quick Tag Selector for Active Media if Flagging */}
                          {activeAnnotatingField === activeMediaTab && (
                            <div className="p-3 bg-slate-950 rounded-2xl border border-rose-500/40 space-y-2 animate-fade-in">
                              <span className="text-xs font-bold text-rose-300 block">
                                Select {activeMediaTab === 'photos' ? 'Photo' : 'Video'} Issue Preset:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {(FIELD_ISSUE_PRESETS[activeMediaTab] || FIELD_ISSUE_PRESETS.images).map((issue) => (
                                  <button
                                    key={issue}
                                    type="button"
                                    onClick={() => handleToggleFieldIssue(activeMediaTab, issue)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                      fieldIssues[activeMediaTab]?.tag === issue
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-rose-500/50'
                                    }`}
                                  >
                                    {issue}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Media Display Stage */}
                          <div className="min-h-[340px] 2xl:min-h-[400px] aspect-[16/10] w-full bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner relative group">
                            {activeMediaTab === 'photos' ? (
                              editFormData.images.length > 0 ? (
                                <img
                                  src={
                                    typeof editFormData.images[activePhotoIdx] === 'string'
                                      ? editFormData.images[activePhotoIdx]
                                      : editFormData.images[activePhotoIdx]?.url || editFormData.images[activePhotoIdx]?.preview
                                  }
                                  alt="Inspect"
                                  onClick={() => {
                                    setLightboxIndex(activePhotoIdx);
                                    setLightboxType('photos');
                                    setIsLightboxOpen(true);
                                  }}
                                  className="w-full h-full object-contain cursor-zoom-in"
                                  title="Click to zoom in high-resolution lightbox"
                                />
                              ) : (
                                <div className="text-center space-y-2">
                                  <span className="text-3xl block">📷</span>
                                  <span className="text-slate-500 text-xs font-bold">No Photos Attached</span>
                                </div>
                              )
                            ) : (
                              editFormData.videos.length > 0 ? (
                                <video
                                  key={
                                    typeof editFormData.videos[activeVideoIdx] === 'string'
                                      ? editFormData.videos[activeVideoIdx]
                                      : editFormData.videos[activeVideoIdx]?.url || editFormData.videos[activeVideoIdx]?.preview
                                  }
                                  src={
                                    typeof editFormData.videos[activeVideoIdx] === 'string'
                                      ? editFormData.videos[activeVideoIdx]
                                      : editFormData.videos[activeVideoIdx]?.url || editFormData.videos[activeVideoIdx]?.preview
                                  }
                                  controls
                                  autoPlay
                                  playsInline
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <div className="text-center space-y-2">
                                  <span className="text-3xl block">🎬</span>
                                  <span className="text-slate-500 text-xs font-bold">No Video Clips Attached for this Listing</span>
                                </div>
                              )
                            )}

                            {/* Click to Zoom Hint Overlay */}
                            {activeMediaTab === 'photos' && editFormData.images.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setLightboxIndex(activePhotoIdx);
                                  setLightboxType('photos');
                                  setIsLightboxOpen(true);
                                }}
                                className="absolute bottom-3 right-3 px-3 py-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-xl text-xs font-bold text-slate-200 hover:text-white shadow-lg opacity-80 hover:opacity-100 transition"
                              >
                                🔍 Fullscreen Zoom
                              </button>
                            )}
                          </div>

                          {/* Photos Thumbnail Carousel */}
                          {activeMediaTab === 'photos' && editFormData.images.length > 0 && (
                            <div className="flex space-x-2.5 overflow-x-auto pb-1 scrollbar-none">
                              {editFormData.images.map((img, idx) => {
                                const imgSrc = typeof img === 'string' ? img : img?.url || img?.preview;
                                return (
                                  <div
                                    key={idx}
                                    onClick={() => setActivePhotoIdx(idx)}
                                    className={`relative w-20 h-20 rounded-xl overflow-hidden cursor-pointer border shrink-0 transition ${
                                      activePhotoIdx === idx ? 'border-amber-400 ring-4 ring-amber-400/40' : 'border-slate-800 opacity-60 hover:opacity-100'
                                    }`}
                                  >
                                    <img src={imgSrc} alt="Thumb" className="w-full h-full object-cover" />
                                    {isAdminEditing && (
                                      <button
                                        type="button"
                                        onClick={(e) => handleAdminRemovePhoto(idx, e)}
                                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-black cursor-pointer shadow hover:bg-rose-500"
                                        title="Delete photo"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Videos Thumbnail Carousel */}
                          {activeMediaTab === 'videos' && editFormData.videos.length > 0 && (
                            <div className="flex space-x-2.5 overflow-x-auto pb-1 scrollbar-none">
                              {editFormData.videos.map((vid, idx) => {
                                return (
                                  <div
                                    key={idx}
                                    onClick={() => setActiveVideoIdx(idx)}
                                    className={`relative px-4 py-3 rounded-xl cursor-pointer border shrink-0 bg-slate-950 flex items-center space-x-2 transition ${
                                      activeVideoIdx === idx ? 'border-cyan-400 ring-2 ring-cyan-400/40' : 'border-slate-800 opacity-60 hover:opacity-100'
                                    }`}
                                  >
                                    <span className="text-lg">🎬</span>
                                    <span className="text-xs font-bold text-slate-200 truncate max-w-[120px]">
                                      Video #{idx + 1}
                                    </span>
                                    {isAdminEditing && (
                                      <button
                                        type="button"
                                        onClick={(e) => handleAdminRemoveVideo(idx, e)}
                                        className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-black cursor-pointer hover:bg-rose-500"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* RIGHT COLUMN: GRANULAR FIELD-BY-FIELD AUDIT CARDS */}
                        <div className="space-y-3.5">
                          
                          {/* 1. TITLE AUDIT CARD */}
                          <div className={`p-4 rounded-2xl border transition ${
                            fieldIssues.title ? 'bg-rose-950/20 border-rose-500/50' : 'bg-slate-900 border-slate-800'
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-[11px] font-black uppercase text-slate-400">1. Listing Title</label>
                              <button
                                type="button"
                                onClick={() => setActiveAnnotatingField(activeAnnotatingField === 'title' ? null : 'title')}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                                  fieldIssues.title ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                                }`}
                              >
                                {fieldIssues.title ? `🚩 Flagged: ${fieldIssues.title.tag}` : '🚩 Flag Title'}
                              </button>
                            </div>

                            {activeAnnotatingField === 'title' && (
                              <div className="p-2.5 mb-2 bg-slate-950 rounded-xl border border-rose-500/30 space-y-1.5">
                                <div className="flex flex-wrap gap-1">
                                  {FIELD_ISSUE_PRESETS.title.map((issue) => (
                                    <button
                                      key={issue}
                                      type="button"
                                      onClick={() => handleToggleFieldIssue('title', issue)}
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                        fieldIssues.title?.tag === issue ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
                                      }`}
                                    >
                                      {issue}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {isAdminEditing ? (
                              <input
                                type="text"
                                value={editFormData.title}
                                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs"
                              />
                            ) : (
                              <p className="text-xs font-bold text-white">{editFormData.title}</p>
                            )}
                          </div>

                          {/* 2. PRICE & OFFER MATH AUDIT CARD */}
                          <div className={`p-4 rounded-2xl border transition ${
                            fieldIssues.price ? 'bg-rose-950/20 border-rose-500/50' : 'bg-slate-900 border-slate-800'
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-[11px] font-black uppercase text-slate-400">2. Pricing, Discount & Token Math</label>
                              <button
                                type="button"
                                onClick={() => setActiveAnnotatingField(activeAnnotatingField === 'price' ? null : 'price')}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                                  fieldIssues.price ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                                }`}
                              >
                                {fieldIssues.price ? `🚩 Flagged: ${fieldIssues.price.tag}` : '🚩 Flag Price'}
                              </button>
                            </div>

                            {activeAnnotatingField === 'price' && (
                              <div className="p-2.5 mb-2 bg-slate-950 rounded-xl border border-rose-500/30 space-y-1.5">
                                <div className="flex flex-wrap gap-1">
                                  {FIELD_ISSUE_PRESETS.price.map((issue) => (
                                    <button
                                      key={issue}
                                      type="button"
                                      onClick={() => handleToggleFieldIssue('price', issue)}
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                        fieldIssues.price?.tag === issue ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
                                      }`}
                                    >
                                      {issue}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {isAdminEditing ? (
                              <div className="grid grid-cols-3 gap-2">
                                <input
                                  type="text"
                                  placeholder="Offer Price"
                                  value={editFormData.price}
                                  onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                                  className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-emerald-400 font-bold text-xs"
                                />
                                <input
                                  type="text"
                                  placeholder="Original Price"
                                  value={editFormData.original_price}
                                  onChange={(e) => setEditFormData({ ...editFormData, original_price: e.target.value })}
                                  className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-400 font-mono text-xs"
                                />
                                <input
                                  type="text"
                                  placeholder="Deal Badge"
                                  value={editFormData.deal_badge}
                                  onChange={(e) => setEditFormData({ ...editFormData, deal_badge: e.target.value })}
                                  className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-amber-300 font-bold text-xs"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center space-x-3 text-xs">
                                <span className="text-emerald-400 font-black text-sm">{editFormData.price}</span>
                                {editFormData.original_price && (
                                  <span className="text-slate-500 font-mono line-through">{editFormData.original_price}</span>
                                )}
                                {editFormData.deal_badge && (
                                  <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black rounded-md text-[10px]">
                                    {editFormData.deal_badge}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* 3. DESCRIPTION & INCLUSIONS AUDIT CARD */}
                          <div className={`p-4 rounded-2xl border transition ${
                            fieldIssues.description ? 'bg-rose-950/20 border-rose-500/50' : 'bg-slate-900 border-slate-800'
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-[11px] font-black uppercase text-slate-400">3. Description & Inclusions</label>
                              <button
                                type="button"
                                onClick={() => setActiveAnnotatingField(activeAnnotatingField === 'description' ? null : 'description')}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                                  fieldIssues.description ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                                }`}
                              >
                                {fieldIssues.description ? `🚩 Flagged: ${fieldIssues.description.tag}` : '🚩 Flag Description'}
                              </button>
                            </div>

                            {activeAnnotatingField === 'description' && (
                              <div className="p-2.5 mb-2 bg-slate-950 rounded-xl border border-rose-500/30 space-y-1.5">
                                <div className="flex flex-wrap gap-1">
                                  {FIELD_ISSUE_PRESETS.description.map((issue) => (
                                    <button
                                      key={issue}
                                      type="button"
                                      onClick={() => handleToggleFieldIssue('description', issue)}
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                        fieldIssues.description?.tag === issue ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
                                      }`}
                                    >
                                      {issue}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {isAdminEditing ? (
                              <textarea
                                rows={3}
                                value={editFormData.description}
                                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 text-xs"
                              />
                            ) : (
                              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                                {editFormData.description}
                              </p>
                            )}
                          </div>

                          {/* 4. CATEGORY & LOCALITY AUDIT CARD */}
                          <div className={`p-4 rounded-2xl border transition ${
                            fieldIssues.category ? 'bg-rose-950/20 border-rose-500/50' : 'bg-slate-900 border-slate-800'
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-[11px] font-black uppercase text-slate-400">4. Sector, Subcategory & Colony</label>
                              <button
                                type="button"
                                onClick={() => setActiveAnnotatingField(activeAnnotatingField === 'category' ? null : 'category')}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                                  fieldIssues.category ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                                }`}
                              >
                                {fieldIssues.category ? `🚩 Flagged: ${fieldIssues.category.tag}` : '🚩 Flag Category'}
                              </button>
                            </div>

                            {activeAnnotatingField === 'category' && (
                              <div className="p-2.5 mb-2 bg-slate-950 rounded-xl border border-rose-500/30 space-y-1.5">
                                <div className="flex flex-wrap gap-1">
                                  {FIELD_ISSUE_PRESETS.category.map((issue) => (
                                    <button
                                      key={issue}
                                      type="button"
                                      onClick={() => handleToggleFieldIssue('category', issue)}
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                        fieldIssues.category?.tag === issue ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
                                      }`}
                                    >
                                      {issue}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {isAdminEditing ? (
                              <div className="grid grid-cols-3 gap-2">
                                <select
                                  value={editFormData.category}
                                  onChange={(e) => {
                                    const newCat = e.target.value;
                                    const newCatObj = TAXONOMY_REGISTRY[newCat] || getCategoryById(newCat);
                                    const firstSub = (newCatObj?.subCategories || [])[0]?.id || 'all';
                                    setEditFormData({ ...editFormData, category: newCat, subCategory: firstSub });
                                  }}
                                  className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                                >
                                  {Object.keys(TAXONOMY_REGISTRY).map((k) => (
                                    <option key={k} value={k}>{TAXONOMY_REGISTRY[k].name.split('(')[0]}</option>
                                  ))}
                                </select>

                                <select
                                  value={editFormData.subCategory}
                                  onChange={(e) => setEditFormData({ ...editFormData, subCategory: e.target.value })}
                                  className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                                >
                                  <option value="all">All Subs</option>
                                  {((TAXONOMY_REGISTRY[editFormData.category] || getCategoryById(editFormData.category))?.subCategories || []).map((sub) => (
                                    <option key={sub.id} value={sub.id}>{sub.name.split('(')[0]}</option>
                                  ))}
                                </select>

                                <select
                                  value={editFormData.location}
                                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                                  className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                                >
                                  {Object.keys(CITY_ZONES).map((z) => (
                                    <option key={z} value={z}>{z}</option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-300 space-y-0.5">
                                <p>🏷️ <strong>Category:</strong> {editFormData.category} / {editFormData.subCategory}</p>
                                <p>📍 <strong>Colony:</strong> {editFormData.location} {editFormData.lat && `(Coords: ${editFormData.lat}, ${editFormData.lng})`}</p>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    )}

                    {/* 👑 Seller's Feedback Reply Inspector */}
                    {activeItem.seller_feedback_reply && (
                      <div className="p-5 bg-cyan-950/40 border border-cyan-500/40 rounded-3xl text-sm text-cyan-200 space-y-2 shadow-2xl">
                        <div className="flex items-center space-x-2 font-black text-cyan-300">
                          <span>💬</span>
                          <span>Merchant Response to Admin Review (दुकानदार का उत्तर):</span>
                        </div>
                        {(() => {
                          let parsed = null;
                          if (typeof activeItem.seller_feedback_reply === 'string' && activeItem.seller_feedback_reply.startsWith('{')) {
                            try {
                              parsed = JSON.parse(activeItem.seller_feedback_reply);
                            } catch {}
                          }

                          if (parsed && parsed.audioUrl) {
                            return (
                              <div className="space-y-1.5">
                                <VoiceNotePlayer audioUrl={parsed.audioUrl} duration={parsed.duration} senderName="Merchant Voice Reply" />
                                {parsed.text && <p className="italic text-cyan-100 text-sm">"{parsed.text}"</p>}
                              </div>
                            );
                          }
                          return <p className="text-cyan-100 italic text-sm">"{activeItem.seller_feedback_reply}"</p>;
                        })()}
                      </div>
                    )}

                    {/* 🎯 STRUCTURED MULTI-ISSUE FEEDBACK & VOICE DISPATCHER */}
                    <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-black text-amber-300 block">
                            🎙️ Dispatch Granular Review Feedback ({totalFlaggedIssuesCount} Flagged Item(s)):
                          </span>
                          <p className="text-xs text-slate-400">
                            Merchant will receive these itemized issue highlights directly on their portal.
                          </p>
                        </div>

                        {isRecordingVoice ? (
                          <div className="flex items-center space-x-3">
                            <span className="text-rose-400 font-mono font-bold animate-pulse text-xs">
                              Recording 0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}
                            </span>
                            <button type="button" onClick={handleStopVoice} className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer">
                              Done ✓
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleStartVoice}
                            className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl cursor-pointer"
                          >
                            🎙️ Record Voice Note
                          </button>
                        )}
                      </div>

                      {/* Display Active Flagged Issues Chips */}
                      {totalFlaggedIssuesCount > 0 && (
                        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                          <span className="text-slate-400 font-bold shrink-0">Active Flags:</span>
                          {Object.keys(fieldIssues).map((k) => (
                            <span
                              key={k}
                              className="px-2.5 py-1 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 text-xs font-bold flex items-center space-x-1 shrink-0"
                            >
                              <span>{k.toUpperCase()}:</span>
                              <span>{fieldIssues[k].tag}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const copy = { ...fieldIssues };
                                  delete copy[k];
                                  setFieldIssues(copy);
                                }}
                                className="ml-1 text-rose-400 hover:text-white cursor-pointer"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex space-x-3">
                        <input
                          type="text"
                          placeholder="Type custom note or overall instruction for the merchant..."
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleDispatchGranularFeedback}
                          className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 text-slate-950 rounded-2xl text-xs font-black cursor-pointer shadow-md active:scale-95 transition"
                        >
                          Send Structured Feedback ➔
                        </button>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500 font-bold text-sm">
                    Select a listing from the queue to start inspecting.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODULE B: CRM */}
          {activeTab === 'crm' && (
            <div className="flex-1 flex flex-col p-6 overflow-hidden space-y-4">
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
                <div className="flex items-center space-x-3 flex-1 max-w-xl">
                  <input
                    type="text"
                    placeholder="Search member by name, mobile, shop..."
                    value={crmSearchQuery}
                    onChange={(e) => setCrmSearchQuery(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                    {['all', 'pending_pin', 'merchant', 'resident', 'banned'].map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setCrmFilterTier(tier)}
                        className={`px-3 py-1 rounded-lg capitalize transition cursor-pointer ${
                          crmFilterTier === tier ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400'
                        }`}
                      >
                        {tier === 'pending_pin' ? 'Pending PIN' : tier}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddMemberModalOpen(true)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer"
                  >
                    + Add New Member
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkDispatchPins}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow cursor-pointer"
                  >
                    🚀 Bulk WhatsApp PINs
                  </button>
                  <button
                    type="button"
                    onClick={handleExportDirectoryCSV}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow cursor-pointer"
                  >
                    📥 Export CSV
                  </button>
                </div>
              </div>

              <div className="flex-1 flex space-x-4 overflow-hidden">
                <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-xl">
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase font-black tracking-wider border-b border-slate-800 sticky top-0">
                        <tr>
                          <th className="p-3.5">Member Name</th>
                          <th className="p-3.5">Phone</th>
                          <th className="p-3.5">Account Role</th>
                          <th className="p-3.5">Colony</th>
                          <th className="p-3.5">Trust Score</th>
                          <th className="p-3.5">Activation PIN</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-semibold text-slate-200">
                        {filteredProfiles.map((user) => {
                          const isSelected = selectedCrmUser?.id === user.id;
                          return (
                            <tr
                              key={user.id}
                              onClick={() => setSelectedCrmUser(user)}
                              className={`cursor-pointer transition ${
                                isSelected ? 'bg-amber-400/10' : 'hover:bg-slate-800/50'
                              }`}
                            >
                              <td className="p-3.5 font-bold text-white">
                                {user.full_name}
                                {user.business_name && (
                                  <span className="text-amber-400 block text-[10px]">🏬 {user.business_name}</span>
                                )}
                              </td>
                              <td className="p-3.5 font-mono text-cyan-300 font-bold">+91 {user.phone}</td>
                              <td className="p-3.5">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                    user.is_merchant ? 'bg-pink-950 text-pink-300' : 'bg-blue-950 text-blue-300'
                                  }`}
                                >
                                  {user.is_merchant ? 'Merchant' : 'Resident'}
                                </span>
                                {user.is_banned && (
                                  <span className="ml-1.5 bg-rose-950 text-rose-300 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                    BANNED
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5">{user.area_name || 'Alwar'}</td>
                              <td className="p-3.5">
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-bold text-amber-400">{user.trust_score || 100}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAdjustTrustScore(user.phone, 10);
                                    }}
                                    className="px-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-[10px]"
                                  >
                                    +
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAdjustTrustScore(user.phone, -10);
                                    }}
                                    className="px-1.5 bg-slate-800 hover:bg-slate-700 rounded text-rose-300 text-[10px]"
                                  >
                                    -
                                  </button>
                                </div>
                              </td>
                              <td className="p-3.5 font-mono text-amber-300 font-bold">
                                {user.admin_activation_pin || 'Verified ✓'}
                              </td>
                              <td className="p-3.5 text-right space-x-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGenerateAndDispatchPin(user);
                                  }}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10.5px] rounded-lg cursor-pointer"
                                >
                                  📲 WhatsApp PIN
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    adminToggleBanUser(user.phone, !user.is_banned);
                                  }}
                                  className={`px-3 py-1 rounded-lg font-bold text-[10.5px] cursor-pointer ${
                                    user.is_banned
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                                  }`}
                                >
                                  {user.is_banned ? 'Unban' : 'Ban'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedCrmUser && (
                  <div className="w-96 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-2xl shrink-0 overflow-y-auto space-y-3">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <div>
                          <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                            Member Dossier & Auditing
                          </span>
                          <h3 className="text-xs font-black text-white">{selectedCrmUser.full_name}</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedCrmUser(null)}
                          className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="text-xs text-slate-300 space-y-1">
                        <p>📞 <strong>Phone:</strong> +91 {selectedCrmUser.phone}</p>
                        <p>📍 <strong>Locality:</strong> {selectedCrmUser.area_name || 'Alwar'}</p>
                        <p>🏷️ <strong>Role:</strong> {selectedCrmUser.is_merchant ? 'Merchant' : 'Resident'}</p>
                        {selectedCrmUser.business_name && (
                          <p>🏬 <strong>Business Name:</strong> {selectedCrmUser.business_name}</p>
                        )}
                        <p>⭐ <strong>Trust Score:</strong> {selectedCrmUser.trust_score || 100}/100</p>
                        <p>🔑 <strong>Admin Activation PIN:</strong> {selectedCrmUser.admin_activation_pin || 'Verified ✓'}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-800 space-y-1.5">
                        <span className="text-[10px] font-black text-amber-300 uppercase block">
                          Owned Listings:
                        </span>
                        {(() => {
                          const owned = allListings.filter(
                            (l) => sanitizePhone(l.phone) === sanitizePhone(selectedCrmUser.phone)
                          );
                          if (owned.length === 0) return <p className="text-[10px] text-slate-500">No listings posted yet.</p>;

                          return (
                            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                              {owned.map((ol) => (
                                <div
                                  key={ol.id}
                                  onClick={() => {
                                    setSelectedItemId(ol.id);
                                    setActiveTab('all');
                                  }}
                                  className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-[10px] cursor-pointer hover:border-amber-400"
                                >
                                  <span className="text-slate-200 truncate max-w-[160px]">{ol.title}</span>
                                  <span className="text-emerald-400 font-mono font-bold">{ol.price}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleGenerateAndDispatchPin(selectedCrmUser)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                      >
                        📲 Dispatch PIN on WhatsApp
                      </button>
                      {selectedCrmUser.is_merchant && (
                        <button
                          type="button"
                          onClick={() => adminDemoteMerchant(selectedCrmUser.phone)}
                          className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          ⬇️ Demote to Resident
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => adminDeleteAllSellerListings(selectedCrmUser.phone)}
                        className="w-full py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        🧹 Purge All Listings
                      </button>
                      <button
                        type="button"
                        onClick={() => adminDeleteUser(selectedCrmUser.id, selectedCrmUser.phone)}
                        className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow cursor-pointer"
                      >
                        🗑️ Delete User & Records
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODULE C: BROADCAST & COVERAGE */}
          {activeTab === 'broadcast' && (
            <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 xl:grid-cols-2 gap-6">
              <form
                onSubmit={handleSendAlwarBroadcast}
                className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 space-y-3.5 shadow-xl"
              >
                <div className="border-b border-slate-800 pb-2.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-100">
                    📢 Dispatch Alwar City Notification Broadcast
                  </h3>
                  <p className="text-[11px] text-slate-400">Push instantaneous alerts to all citizens and store owners</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10.5px] font-bold text-slate-400 block mb-1">Target Audience</label>
                    <select
                      value={broadcastRole}
                      onChange={(e) => setBroadcastRole(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="public">Public (All App Users)</option>
                      <option value="resident">Verified Residents</option>
                      <option value="merchant">Registered Merchants</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10.5px] font-bold text-slate-400 block mb-1">Notification Tag</label>
                    <select
                      value={broadcastTag}
                      onChange={(e) => setBroadcastTag(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-bold"
                    >
                      <option value="ALWAR_ALERT">🚨 ALWAR_ALERT</option>
                      <option value="FESTIVAL_OFFER">🪔 FESTIVAL_OFFER</option>
                      <option value="IMPORTANT_UPDATE">📢 IMPORTANT_UPDATE</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10.5px] font-bold text-slate-400 block mb-1">Notification Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 🪔 Special Festival Combos Live Across Alwar!"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[10.5px] font-bold text-slate-400 block mb-1">Notification Message Body *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Write detailed broadcast message..."
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingBroadcast}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
                >
                  {isSendingBroadcast ? 'Dispatching Broadcast...' : '📢 Send Broadcast Now'}
                </button>
              </form>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-100">
                  📍 Colony Merchant Coverage & Density ({Object.keys(CITY_ZONES).length} Localities)
                </h3>
                <div className="grid grid-cols-2 gap-2 max-h-[460px] overflow-y-auto pr-1">
                  {Object.keys(CITY_ZONES).map((z) => {
                    const count = zoneMerchantCounts[z] || 0;
                    return (
                      <div
                        key={z}
                        className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between"
                      >
                        <span className="text-xs font-bold text-slate-300">{z}</span>
                        <span
                          className={`font-mono font-bold text-xs ${
                            count > 0 ? 'text-amber-400' : 'text-slate-600'
                          }`}
                        >
                          {count} stores
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* MODULE D: DISPUTES */}
          {activeTab === 'reports' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-3">
              <h2 className="text-xs font-black text-rose-400 uppercase tracking-wider">
                🚩 Community Dispute Queue ({reports.length} Open Reports)
              </h2>
              {reports.length === 0 ? (
                <div className="p-16 text-center text-slate-500 text-xs font-bold bg-slate-900/60 rounded-2xl border border-slate-800">
                  ✓ No open disputes or flagged listings.
                </div>
              ) : (
                reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-4 bg-slate-900 border border-rose-500/30 rounded-2xl flex items-center justify-between shadow-xl"
                  >
                    <div>
                      <span className="text-[9.5px] font-bold bg-rose-950 text-rose-300 px-2 py-0.5 rounded-md border border-rose-800">
                        Reason: {rep.reason || 'Flagged by citizen'}
                      </span>
                      <h4 className="text-xs font-black text-white mt-1">
                        Listing ID: {rep.listing_id} ({rep.listings?.title})
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Seller: {rep.listings?.seller_name} (+91 {rep.listings?.phone}) • Reported by: +91{' '}
                        {rep.reporter_phone}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => supabase.from('listing_reports').delete().eq('id', rep.id)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete reported listing ${rep.listing_id}?`)) {
                            deleteListingFromDB(rep.listing_id);
                            showNotice('Listing removed and dispute resolved.');
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl cursor-pointer shadow"
                      >
                        Delete Listing
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* MODULE E: Q&A AUDIT */}
          {activeTab === 'interactions' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-3">
              <h2 className="text-xs font-black text-cyan-400 uppercase tracking-wider">
                💬 Live Customer Inquiries & Audio Q&A Audit ({threads.length})
              </h2>
              {threads.length === 0 ? (
                <div className="p-16 text-center text-slate-500 text-xs font-bold bg-slate-900/60 rounded-2xl border border-slate-800">
                  No questions recorded yet.
                </div>
              ) : (
                threads.map((comm) => (
                  <div key={comm.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-xl">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-amber-300">👤 {comm.user_name} ({comm.user_area})</span>
                      <span className="text-slate-500 text-[10px]">{new Date(comm.created_at).toLocaleDateString()}</span>
                    </div>
                    {comm.audio_url ? (
                      <VoiceNotePlayer audioUrl={comm.audio_url} duration={comm.audio_duration} senderName="Voice Question" />
                    ) : (
                      <p className="text-slate-200 text-xs italic">"{comm.comment_text}"</p>
                    )}
                    {comm.seller_reply && (
                      <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-200">
                        👑 <strong>Seller Reply:</strong> {comm.seller_reply}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      {/* 🌟 4. MANUAL ADD MEMBER MODAL */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-amber-300 uppercase">
                + Register New Member / Merchant
              </h3>
              <button
                type="button"
                onClick={() => setIsAddMemberModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                handleManualAddMember(e);
                setIsAddMemberModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Saini"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Mobile Number (+91) *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="9876543210"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Account Role</label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white font-bold"
                  >
                    <option value="merchant">Merchant (Store)</option>
                    <option value="resident">Resident (Citizen)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Colony / Locality</label>
                  <select
                    value={newMemberArea}
                    onChange={(e) => setNewMemberArea(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white font-bold"
                  >
                    {Object.keys(CITY_ZONES).map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>
              </div>

              {newMemberRole === 'merchant' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Shop / Business Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Alwar Auto Spares"
                    value={newBusinessName}
                    onChange={(e) => setNewBusinessName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
              >
                {actionLoading ? 'Saving...' : '✓ Create Member & Issue PIN'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🌟 5. FULLSCREEN HIGH-RESOLUTION LIGHTBOX */}
      {isLightboxOpen && inspectingItem && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-6 animate-fade-in select-none">
          <div className="flex items-center justify-between text-white pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-black uppercase text-amber-400">High-Resolution Inspection</span>
              <h3 className="text-sm font-bold">{editFormData.title}</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-base cursor-pointer hover:bg-slate-700"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center relative overflow-hidden my-4">
            <img
              src={
                typeof editFormData.images[lightboxIndex] === 'string'
                  ? editFormData.images[lightboxIndex]
                  : editFormData.images[lightboxIndex]?.url || editFormData.images[lightboxIndex]?.preview || inspectingItem.image
              }
              alt="Fullscreen Zoom"
              className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />
          </div>

          {editFormData.images.length > 1 && (
            <div className="flex items-center justify-center space-x-3 pt-3 border-t border-slate-800">
              {editFormData.images.map((img, idx) => (
                <img
                  key={idx}
                  src={typeof img === 'string' ? img : img?.url || img?.preview}
                  alt="Thumb"
                  onClick={() => setLightboxIndex(idx)}
                  className={`w-14 h-14 rounded-xl object-cover cursor-pointer border ${
                    lightboxIndex === idx ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-slate-800 opacity-60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}