import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAllListingsSlice, hyperlocalStore, hydrateFromDB } from '../../store/hyperlocalStore';
import UserManagementCRM from './UserManagementCRM';
import { supabase } from '../../services/supabaseClient';
import {
  approveListingChanges,
  rejectListingChanges,
  sendAdminFeedbackToSeller,
  uploadVoiceNoteToStorage,
  uploadListingImagesToStorage,
  uploadListingVideosToStorage,
  deleteListingFromDB,
} from '../../services/listingService';
import {
  logoutAdmin,
  isAdminAuthorized,
  adminToggleBanUser,
  adminDeleteUser,
  adminDeleteAllSellerListings,
  adminDemoteMerchant,
  sanitizePhone,
} from '../../services/authService';
import { TAXONOMY_REGISTRY, getCategoryById } from '../../data/taxonomyRegistry';
import { CITY_ZONES } from '../../data/cityZones';
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
  const [dashboardNotice, setDashboardNotice] = useState('');
  const [isWidescreen, setIsWidescreen] = useState(false);

  const allListings = useAllListingsSlice();
  
  // 🌟 5-Way Tab Switcher: 'whatsapp' | 'pending' | 'approved' | 'all' | 'users'
  const [activeTab, setActiveTab] = useState('whatsapp');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState(null);

  // 📲 WhatsApp Desk State
  const [profiles, setProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberArea, setNewMemberArea] = useState('Ranjeet Nagar');
  const [newMemberRole, setNewMemberRole] = useState('resident');
  const [newBusinessName, setNewBusinessName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // ⏱️ Timeline Filter States
  const [timeFilterType, setTimeFilterType] = useState('all');
  const [timeValue, setTimeValue] = useState(1);

  // 👤 Seller Dossier Modal State
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [sellerPortfolioTab, setSellerPortfolioTab] = useState('all');

  // 🔍 Review Studio & Full Correction State
  const [inspectingItem, setInspectingItem] = useState(null);
  const [isAdminEditing, setIsAdminEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    category: 'market',
    subCategory: 'all',
    price: '',
    original_price: '',
    deal_type: '',
    deal_badge: '',
    deal_details: '',
    token_amount: '',
    doorstep_trial: false,
    capacity: '',
    location: '',
    lat: null,
    lng: null,
    timing: '09:00 AM - 09:00 PM',
    description: '',
    descPoints: ['', '', '', ''],
    images: [],
    videos: [],
  });

  const [activeMediaTab, setActiveMediaTab] = useState('photos');
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);

  const adminPhotoInputRef = useRef(null);
  const adminVideoInputRef = useRef(null);

  // 📷 Fullscreen Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxType, setLightboxType] = useState('photos');

  // 🎙️ Voice Feedback Recording State
  const [feedbackText, setFeedbackText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [recordedVoiceNote, setRecordedVoiceNote] = useState(null);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // ── Fetch Profiles for WhatsApp Desk ──────────────────────────
  const fetchProfiles = useCallback(async () => {
    setProfilesLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProfiles(data);
      }
    } catch (err) {
      console.error('Error fetching user profiles:', err);
    } finally {
      setProfilesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdminAuth) {
      hydrateFromDB();
      fetchProfiles();
    }
  }, [isAdminAuth, fetchProfiles]);

  const showNotice = (msg) => {
    setDashboardNotice(msg);
    if (msg) setTimeout(() => setDashboardNotice(''), 4000);
  };

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
    await fetchProfiles();
    setIsRefreshing(false);
    showNotice('Registry and WhatsApp queue refreshed.');
  };

  // ── 📲 1-Click WhatsApp PIN Dispatcher ─────────────────────────
  const handleGenerateAndDispatchPin = async (user) => {
    setActionLoading(true);
    const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          admin_activation_pin: generatedPin,
          status: 'pending_activation',
        })
        .eq('phone', user.phone);

      if (error) throw error;

      showNotice(`⚡ PIN ${generatedPin} created for ${user.full_name}. Opening WhatsApp...`);
      fetchProfiles();

      const isSeller = user.is_merchant;
      const message = encodeURIComponent(
        `Namaste ${user.full_name} ji!\n\n` +
        `Your Aapke Kareeb Alwar ${isSeller ? 'Merchant (Seller)' : 'Member'} Verification PIN is: *${generatedPin}*\n\n` +
        `👉 Open the Aapke Kareeb app, select 'Activate Account', enter this 6-digit PIN, and set your 4-digit permanent Security PIN.\n\n` +
        `Welcome to Aapke Kareeb Alwar!`
      );

      window.open(`https://wa.me/91${user.phone}?text=${message}`, '_blank');
    } catch (err) {
      console.error('PIN dispatch error:', err);
      showNotice('⚠️ Failed to generate PIN in database.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── 📲 Bulk WhatsApp PIN Dispatcher ────────────────────────────
  const handleBulkDispatchPins = async () => {
    if (pendingWhatsAppRequests.length === 0) return;
    if (!window.confirm(`Generate and dispatch activation PINs for all ${pendingWhatsAppRequests.length} pending user(s)?`)) return;

    setActionLoading(true);
    let sentCount = 0;

    for (const user of pendingWhatsAppRequests) {
      const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
      try {
        await supabase
          .from('user_profiles')
          .update({
            admin_activation_pin: generatedPin,
            status: 'pending_activation',
          })
          .eq('phone', user.phone);

        sentCount++;
      } catch (e) {
        console.error('Bulk dispatch item error:', e);
      }
    }

    showNotice(`✓ Generated PINs for ${sentCount} user(s).`);
    fetchProfiles();
    setActionLoading(false);

    if (pendingWhatsAppRequests[0]) {
      handleGenerateAndDispatchPin(pendingWhatsAppRequests[0]);
    }
  };

  // ── 📲 Manual Member Onboarding via Admin ─────────────────────
  const handleManualAddMember = async (e) => {
    e.preventDefault();
    const cleanPhone = sanitizePhone(newMemberPhone);
    if (cleanPhone.length !== 10) {
      showNotice('⚠️ Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!newMemberName.trim()) {
      showNotice('⚠️ Please enter the full name.');
      return;
    }

    setActionLoading(true);
    const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
    const isSeller = newMemberRole === 'merchant';

    try {
      const payload = {
        phone: cleanPhone,
        full_name: newMemberName.trim(),
        area_name: newMemberArea,
        city: selectedCity,
        is_merchant: isSeller,
        business_name: isSeller ? (newBusinessName || newMemberName).trim() : null,
        verification_tier: isSeller ? 'merchant' : 'resident',
        is_verified: false,
        status: 'pending_activation',
        admin_activation_pin: generatedPin,
      };

      const { error } = await supabase
        .from('user_profiles')
        .upsert([payload], { onConflict: 'phone' });

      if (error) throw error;

      showNotice(`✓ Registered ${newMemberName}! PIN: ${generatedPin}`);
      setNewMemberPhone('');
      setNewMemberName('');
      setNewBusinessName('');
      fetchProfiles();

      const message = encodeURIComponent(
        `Namaste ${newMemberName.trim()} ji!\n\n` +
        `Your Aapke Kareeb Alwar ${isSeller ? 'Merchant' : 'Member'} Activation PIN is: *${generatedPin}*\n\n` +
        `👉 Open the app, enter this PIN, and set your 4-digit permanent login code.`
      );
      window.open(`https://wa.me/91${cleanPhone}?text=${message}`, '_blank');
    } catch (err) {
      console.error('Manual onboarding error:', err);
      showNotice('⚠️ Failed to create profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const applyTimeFilter = (timestamp) => {
    if (timeFilterType === 'all') return true;
    if (!timestamp) return true;

    const itemTime = new Date(timestamp).getTime();
    const now = Date.now();

    if (timeFilterType === 'hours') return now - itemTime <= timeValue * 60 * 60 * 1000;
    if (timeFilterType === 'days') return now - itemTime <= timeValue * 24 * 60 * 60 * 1000;
    if (timeFilterType === 'last_week') return now - itemTime <= 7 * 24 * 60 * 60 * 1000;
    if (timeFilterType === 'last_month') return now - itemTime <= 30 * 24 * 60 * 60 * 1000;
    if (timeFilterType === 'this_year') {
      return new Date(itemTime).getFullYear() === new Date().getFullYear();
    }
    return true;
  };

  // 1. Pending Approvals Queue
  const pendingApprovals = useMemo(() => {
    return allListings.filter((item) => {
      const isPending =
        item.has_pending_approval === true ||
        item.is_active === false ||
        Boolean(item.pending_changes);

      const changes = item.pending_changes || {};
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory || changes.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        (changes.title || item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (changes.sellerName || item.sellerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (changes.deal_badge || item.deal_badge || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(changes.phone || item.phone || '').includes(searchQuery);

      return isPending && matchesCat && matchesSearch && applyTimeFilter(item.created_at);
    });
  }, [allListings, selectedCategory, searchQuery, timeFilterType, timeValue]);

  // 2. Approved Live Listings
  const approvedListings = useMemo(() => {
    return allListings.filter((item) => {
      const isApproved = item.is_active === true && !item.has_pending_approval;
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sellerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(item.deal_badge || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phone?.includes(searchQuery);

      return isApproved && matchesCat && matchesSearch && applyTimeFilter(item.created_at);
    });
  }, [allListings, selectedCategory, searchQuery, timeFilterType, timeValue]);

  // 3. All Listings
  const allFilteredListings = useMemo(() => {
    return allListings.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sellerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(item.deal_badge || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phone?.includes(searchQuery);

      return matchesCat && matchesSearch && applyTimeFilter(item.created_at);
    });
  }, [allListings, selectedCategory, searchQuery, timeFilterType, timeValue]);

  // 👤 Selected Seller Listings
  const sellerListings = useMemo(() => {
    if (!selectedSeller?.phone) return [];
    const cleanTargetPhone = sanitizePhone(selectedSeller.phone);

    return allListings.filter((item) => {
      const p1 = sanitizePhone(item.phone);
      const p2 = sanitizePhone(item.pending_changes?.phone);
      return p1 === cleanTargetPhone || p2 === cleanTargetPhone;
    });
  }, [allListings, selectedSeller]);

  const sellerApproved = useMemo(() => sellerListings.filter((i) => i.is_active === true && !i.has_pending_approval), [sellerListings]);
  const sellerPending = useMemo(() => sellerListings.filter((i) => (i.has_pending_approval || !i.is_active || Boolean(i.pending_changes)) && !i.admin_feedback && !i.seller_feedback_reply), [sellerListings]);
  const sellerFeedbackActive = useMemo(() => sellerListings.filter((i) => (i.has_pending_approval || !i.is_active || Boolean(i.pending_changes)) && (Boolean(i.admin_feedback) || Boolean(i.seller_feedback_reply))), [sellerListings]);

  const displayedSellerListings = useMemo(() => {
    if (sellerPortfolioTab === 'approved') return sellerApproved;
    if (sellerPortfolioTab === 'pending') return sellerPending;
    if (sellerPortfolioTab === 'feedback') return sellerFeedbackActive;
    return sellerListings;
  }, [sellerPortfolioTab, sellerListings, sellerApproved, sellerPending, sellerFeedbackActive]);

  // Smart Detection: Anyone pending activation OR who hasn't set their permanent PIN
  const pendingWhatsAppRequests = useMemo(() => {
    return profiles.filter((p) => {
      const hasSetPin = Boolean(p.secret_pin_hash || p.resident_pin_hash || p.business_pin_hash);
      const isUnverified = !p.is_verified || p.status === 'temporary' || p.status === 'pending_activation';
      return isUnverified || !hasSetPin || Boolean(p.admin_activation_pin);
    });
  }, [profiles]);

  // 🛑 Direct Admin Actions
  const handleDirectDeleteListing = async (listingId, title = 'Listing') => {
    if (!window.confirm(`⚠️ PERMANENT DELETE: Are you sure you want to delete "${title}"?`)) return;
    try {
      await deleteListingFromDB(listingId);
      hyperlocalStore.removeListing(listingId);
      showNotice(`🗑️ Deleted "${title}"`);
      if (inspectingItem?.id === listingId) setInspectingItem(null);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete listing.');
    }
  };

  const handleToggleShadowban = async (item) => {
    const nextVal = !item.is_shadowbanned;
    if (supabase) {
      await supabase.from('listings').update({ is_shadowbanned: nextVal }).eq('id', item.id);
    }
    const updated = { ...item, is_shadowbanned: nextVal };
    hyperlocalStore.insertListing(item.category, updated);
    showNotice(nextVal ? `👻 Shadowbanned "${item.title}"` : `✓ Removed shadowban from "${item.title}"`);
  };

  const handleDirectBanPoster = async (phone, name = 'User') => {
    if (!phone) return;
    const cleanPhone = sanitizePhone(phone);
    if (!window.confirm(`⛔ BLOCK & BAN: Block phone number +91 ${cleanPhone} (${name}) and deactivate all their listings?`)) {
      return;
    }
    await adminToggleBanUser(cleanPhone, true);
    await hydrateFromDB();
    await fetchProfiles();
    showNotice(`⛔ Blocked and banned +91 ${cleanPhone}`);
  };

  const handleDirectPurgeSellerAll = async (phone, name = 'Seller') => {
    if (!phone) return;
    const cleanPhone = sanitizePhone(phone);
    if (!window.confirm(`🧹 PURGE ALL: Delete ALL listings and trade offers posted by ${name} (+91 ${cleanPhone})?`)) {
      return;
    }
    await adminDeleteAllSellerListings(cleanPhone);
    await hydrateFromDB();
    showNotice(`🧹 Purged all listings of +91 ${cleanPhone}`);
    if (selectedSeller?.phone === cleanPhone) setSelectedSeller(null);
    if (inspectingItem && sanitizePhone(inspectingItem.phone) === cleanPhone) {
      setInspectingItem(null);
    }
  };

  const handleDirectDeleteSellerAccount = async (phone, name = 'Seller') => {
    if (!phone) return;
    const cleanPhone = sanitizePhone(phone);
    if (!window.confirm(`🗑️ DELETE ACCOUNT: Permanently delete profile +91 ${cleanPhone} (${name}) and purge listings?`)) {
      return;
    }
    await adminDeleteAllSellerListings(cleanPhone);
    await adminDeleteUser(null, cleanPhone);
    await hydrateFromDB();
    await fetchProfiles();
    showNotice(`🗑️ Completely deleted ${name} (+91 ${cleanPhone})`);
    if (selectedSeller?.phone === cleanPhone) setSelectedSeller(null);
    if (inspectingItem && sanitizePhone(inspectingItem.phone) === cleanPhone) {
      setInspectingItem(null);
    }
  };

  const handleDirectDemoteSeller = async (phone, name = 'Seller') => {
    if (!phone) return;
    const cleanPhone = sanitizePhone(phone);
    if (!window.confirm(`⬇️ DEMOTE: Revert ${name} (+91 ${cleanPhone}) from Verified Merchant back to Basic Resident?`)) {
      return;
    }
    await adminDemoteMerchant(cleanPhone);
    await fetchProfiles();
    showNotice(`⬇️ Demoted ${name} to Basic Resident`);
  };

  // Populate Admin Correction Form & Media State
  const handleOpenInspector = (item) => {
    const changes = item.pending_changes || {};
    const effectiveTitle = changes.title || item.title || item.name || '';
    const effectivePrice = changes.price || item.price || item.rates || '';
    const effectiveOrigPrice = changes.original_price || changes.originalPrice || item.original_price || item.originalPrice || '';
    const effectiveDealType = changes.deal_type || changes.dealType || item.deal_type || item.dealType || null;
    const effectiveDealBadge = changes.deal_badge || changes.dealBadge || item.deal_badge || item.dealBadge || '';
    const effectiveDealDetails = changes.deal_details || changes.dealDetails || item.deal_details || item.dealDetails || '';
    const effectiveToken = changes.token_amount || changes.tokenAmount || item.token_amount || item.tokenAmount || '';
    const effectiveTrial = Boolean(changes.doorstep_trial ?? changes.doorstepTrial ?? item.doorstep_trial ?? item.doorstepTrial ?? false);

    const effectiveCap = changes.capacity || changes.stockCount || item.capacity || item.stockCount || 'Ready Stock';
    const effectiveLocation = changes.location || item.location || selectedCity;
    const effectiveTiming = changes.timing || item.timing || item.activeHours || '09:00 AM - 09:00 PM';
    const effectiveCat = changes.category || item.category || 'market';
    const effectiveSubCat = changes.subCategory || changes.sub_category || item.subCategory || item.sub_category || 'all';
    const effectiveDesc = changes.description || item.description || '';
    const effectiveLat = changes.lat !== undefined ? changes.lat : item.lat;
    const effectiveLng = changes.lng !== undefined ? changes.lng : item.lng;

    const photos = changes.images || changes.image_urls || item.images || (changes.image ? [changes.image] : [item.image]);
    const cleanPhotos = (photos || []).map((p) => (typeof p === 'string' ? p : p.url || p.preview)).filter(Boolean);
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
      original_price: effectiveOrigPrice,
      deal_type: effectiveDealType,
      deal_badge: effectiveDealBadge,
      deal_details: effectiveDealDetails,
      token_amount: effectiveToken,
      doorstep_trial: effectiveTrial,
      capacity: effectiveCap,
      location: effectiveLocation,
      lat: effectiveLat,
      lng: effectiveLng,
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

  // 📷 Admin Photo Handler
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

  // 🎥 Admin Video Handler
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
          original_price: editFormData.original_price ? editFormData.original_price.trim() : null,
          deal_type: editFormData.deal_type || null,
          deal_badge: editFormData.deal_badge ? editFormData.deal_badge.trim() : null,
          deal_details: editFormData.deal_details ? editFormData.deal_details.trim() : null,
          token_amount: editFormData.token_amount ? editFormData.token_amount.trim() : null,
          doorstep_trial: Boolean(editFormData.doorstep_trial),
          capacity: editFormData.capacity.trim(),
          stockCount: editFormData.capacity.trim(),
          location: editFormData.location.trim(),
          lat: editFormData.lat !== undefined && editFormData.lat !== null ? Number(editFormData.lat) : item.lat,
          lng: editFormData.lng !== undefined && editFormData.lng !== null ? Number(editFormData.lng) : item.lng,
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
        verification_badge: 'Verified Listing',
      };

      await approveListingChanges(item.id, updatedPayload);
      hyperlocalStore.insertListing(updatedPayload.category || item.category, updatedPayload);

      showNotice(`✓ Published "${finalChanges.title || item.title}"`);
      if (inspectingItem?.id === item.id) {
        setInspectingItem(null);
        setIsAdminEditing(false);
      }
    } catch (err) {
      console.error('Approve error:', err);
      alert('Failed to approve listing. Please check network.');
    } finally {
      setActionInProgressId(null);
    }
  };

  // 🔴 Reject Changes Handler
  const handleReject = async (item) => {
    setActionInProgressId(item.id);
    try {
      const reason = feedbackText.trim() || 'Listing could not be approved based on community guidelines.';
      await rejectListingChanges(item.id, reason, sanitizePhone(item.phone));
      const cleanedPayload = {
        ...item,
        has_pending_approval: false,
        pending_changes: null,
        admin_feedback: reason,
      };
      hyperlocalStore.insertListing(item.category, cleanedPayload);

      showNotice(`Rejected changes for "${item.title}"`);
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

  // 🎙️ Admin Voice Handlers
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
      alert('Microphone access denied. Please allow permissions.');
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
      const sellerPhone = sanitizePhone(item.pending_changes?.phone || item.phone);
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

      showNotice(`Feedback sent to ${sellerPhone}`);
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
              Enter Master Secret Key to access moderation and control systems.
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
              Unlock Moderation Console ➔
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
      
      {/* Hidden File Inputs */}
      <input type="file" ref={adminPhotoInputRef} onChange={handleAdminAddPhoto} multiple accept="image/*" className="hidden" />
      <input type="file" ref={adminVideoInputRef} onChange={handleAdminAddVideo} accept="video/*" className="hidden" />

      {/* Sticky Top Header */}
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
              Content & Member Moderation Console
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Desktop/Mobile Layout Toggle */}
          <button
            type="button"
            onClick={() => setIsWidescreen((prev) => !prev)}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold cursor-pointer"
            title="Toggle Desktop/Mobile layout width"
          >
            {isWidescreen ? '📱 Mobile' : '🖥️ Desktop'}
          </button>

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
            <span>Lock</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className={`mx-auto p-3.5 space-y-3.5 ${isWidescreen ? 'max-w-5xl' : 'max-w-md'}`}>
        
        {dashboardNotice && (
          <div className="p-2.5 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-bold text-center animate-fade-in shadow-md">
            {dashboardNotice}
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-900 border border-amber-500/40 p-2.5 rounded-2xl text-center shadow-xs">
            <span className="block text-base font-black text-amber-300">{pendingApprovals.length}</span>
            <span className="text-[8.5px] text-amber-300/80 font-bold uppercase tracking-wider">Deals Pending</span>
          </div>
          <div className="bg-slate-900 border border-emerald-500/40 p-2.5 rounded-2xl text-center shadow-xs">
            <span className="block text-base font-black text-emerald-400">{approvedListings.length}</span>
            <span className="text-[8.5px] text-emerald-300/80 font-bold uppercase tracking-wider">Live Approved</span>
          </div>
          <div className="bg-slate-900 border border-cyan-500/40 p-2.5 rounded-2xl text-center shadow-xs">
            <span className="block text-base font-black text-cyan-300">{pendingWhatsAppRequests.length}</span>
            <span className="text-[8.5px] text-cyan-300/80 font-bold uppercase tracking-wider">PIN Requests</span>
          </div>
        </div>

        {/* 🌟 5-Way Tab Switcher */}
        <div className="grid grid-cols-5 gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-[9px]">
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`py-2 text-center rounded-xl font-black transition cursor-pointer flex items-center justify-center space-x-0.5 ${
              activeTab === 'whatsapp'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <span>📲 PINs ({pendingWhatsAppRequests.length})</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`py-2 text-center rounded-xl font-black transition cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Deals ({pendingApprovals.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`py-2 text-center rounded-xl font-black transition cursor-pointer ${
              activeTab === 'approved'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live ({approvedListings.length})
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
            <span>👥 CRM</span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            TAB 1: 📲 WHATSAPP ACTIVATION DESK
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-4 animate-fade-in text-xs">
            {/* Quick Manual Onboarding Form */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-emerald-500/40 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
                <span className="text-xl">⚡</span>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-100">
                    Add Member & Send WhatsApp PIN
                  </h3>
                  <p className="text-[9.5px] text-slate-400">1-Click Manual Registration</p>
                </div>
              </div>

              <form onSubmit={handleManualAddMember} className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 mb-1">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Saini"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 px-3 py-2 text-xs font-bold bg-slate-950 text-slate-100 focus:outline-none focus:border-emerald-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 mb-1">WhatsApp Phone *</label>
                    <div className="flex items-center rounded-xl border border-slate-800 px-2.5 py-1.5 bg-slate-950">
                      <span className="text-xs font-bold text-slate-500 mr-1.5">+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="9876543210"
                        value={newMemberPhone}
                        onChange={(e) => setNewMemberPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-transparent text-xs font-bold text-slate-100 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 mb-1">Colony / Locality</label>
                    <select
                      value={newMemberArea}
                      onChange={(e) => setNewMemberArea(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 px-2.5 py-2 text-xs font-bold bg-slate-950 text-slate-100 focus:outline-none"
                    >
                      {Object.keys(CITY_ZONES).map((z) => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-3 px-1 pt-3">
                    <label className="flex items-center space-x-1 text-[10.5px] font-bold text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="adminNewRole"
                        checked={newMemberRole === 'resident'}
                        onChange={() => setNewMemberRole('resident')}
                        className="accent-emerald-500"
                      />
                      <span>Resident</span>
                    </label>
                    <label className="flex items-center space-x-1 text-[10.5px] font-bold text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="adminNewRole"
                        checked={newMemberRole === 'merchant'}
                        onChange={() => setNewMemberRole('merchant')}
                        className="accent-emerald-500"
                      />
                      <span>Merchant</span>
                    </label>
                  </div>
                </div>

                {newMemberRole === 'merchant' && (
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 mb-1">Shop / Firm Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Alwar Auto Spares"
                      value={newBusinessName}
                      onChange={(e) => setNewBusinessName(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 px-3 py-2 text-xs font-bold bg-slate-950 text-slate-100 focus:outline-none focus:border-emerald-400"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={actionLoading || newMemberPhone.length !== 10 || !newMemberName.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md active:scale-95 transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>⚡</span>
                  <span>Generate & Send PIN via WhatsApp</span>
                </button>
              </form>
            </div>

            {/* Pending Requests Queue */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Pending Verification Requests ({pendingWhatsAppRequests.length})
                </span>
                {pendingWhatsAppRequests.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkDispatchPins}
                    disabled={actionLoading}
                    className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] rounded-lg shadow active:scale-95 transition cursor-pointer"
                  >
                    🚀 Dispatch All
                  </button>
                )}
              </div>

              {profilesLoading ? (
                <div className="p-6 text-center text-xs text-slate-500">Loading requests...</div>
              ) : pendingWhatsAppRequests.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
                  <span className="text-2xl block">🎉</span>
                  <h4 className="text-xs font-black text-slate-200">No Pending Activations</h4>
                  <p className="text-[10px] text-slate-400">All member registration requests are active.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pendingWhatsAppRequests
                    .filter((p) => {
                      const q = memberSearchQuery.toLowerCase().trim();
                      return !q || p.full_name?.toLowerCase().includes(q) || p.phone?.includes(q);
                    })
                    .map((user) => (
                      <div
                        key={user.id}
                        className="p-3 bg-slate-900 border border-emerald-500/30 rounded-2xl space-y-2.5 shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs">{user.is_merchant ? '🏪' : '👤'}</span>
                              <h4 className="text-xs font-black text-slate-100 truncate">{user.full_name}</h4>
                              <span
                                className={`text-[8.5px] font-black px-1.5 py-0.2 rounded-md uppercase ${
                                  user.is_merchant ? 'bg-pink-950 text-pink-300' : 'bg-blue-950 text-blue-300'
                                }`}
                              >
                                {user.is_merchant ? 'Merchant' : 'Resident'}
                              </span>
                            </div>

                            <p className="text-[10.5px] font-mono font-bold text-cyan-300 mt-0.5">
                              📞 +91 {user.phone}
                            </p>
                            <p className="text-[9.5px] text-slate-400">
                              📍 {user.area_name || 'Town Center'}
                              {user.business_name && <span className="text-amber-300 ml-1">({user.business_name})</span>}
                            </p>
                          </div>

                          {user.admin_activation_pin && (
                            <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/30 text-amber-300 font-mono font-black text-[10px]">
                              PIN: {user.admin_activation_pin}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleGenerateAndDispatchPin(user)}
                          disabled={actionLoading}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10.5px] rounded-xl active:scale-95 transition flex items-center justify-center space-x-1 cursor-pointer shadow-md"
                        >
                          <span>📲</span>
                          <span>{user.admin_activation_pin ? 'Resend WhatsApp PIN' : 'Send 6-Digit PIN on WhatsApp ➔'}</span>
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TAB 2: USER MANAGEMENT CRM
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <div className="animate-fade-in">
            <UserManagementCRM selectedCity={selectedCity} />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            LISTINGS MODERATION TABS ('pending', 'approved', 'all')
           ═══════════════════════════════════════════════════════════ */}
        {activeTab !== 'users' && activeTab !== 'whatsapp' && (
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
                placeholder="Search by title, phone, or offer badge..."
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
                    const sellerPhone = sanitizePhone(changes.phone || item.phone);
                    const sellerName = changes.sellerName || item.sellerName;
                    const activeDealBadge = changes.deal_badge || changes.dealBadge || item.deal_badge || item.dealBadge;
                    const activeDealDetails = changes.deal_details || changes.dealDetails || item.deal_details || item.dealDetails;
                    const activeOrigPrice = changes.original_price || changes.originalPrice || item.original_price || item.originalPrice;
                    const activePrice = changes.price || item.price || 'Contact for Price';
                    const activeToken = changes.token_amount || changes.tokenAmount || item.token_amount || item.tokenAmount;
                    const hasTrial = changes.doorstep_trial !== undefined ? changes.doorstep_trial : item.doorstep_trial;

                    return (
                      <div
                        key={item.id}
                        className="bg-slate-900 border border-amber-500/40 rounded-2xl p-3.5 space-y-3 shadow-md relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                              <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider inline-block">
                                {isProposal ? '✏️ PROPOSED EDIT' : '🆕 NEW ENLISTMENT'}
                              </span>
                              {activeDealBadge && (
                                <span className="text-[8.5px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-sm animate-pulse border border-amber-500/40">
                                  {activeDealBadge}
                                </span>
                              )}
                            </div>

                            <h4 className="text-xs font-black text-slate-100 mt-1 truncate">
                              {changes.title || item.title}
                            </h4>

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
                                Dossier ➔
                              </span>
                            </button>
                          </div>

                          <span className="text-[9px] text-slate-400 font-semibold bg-slate-800 px-2 py-0.5 rounded-md shrink-0">
                            {changes.category || item.category}
                          </span>
                        </div>

                        {/* Price & Deal Inclusions Row */}
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-[10px]">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-slate-400 block text-[8.5px]">Price & Stock</span>
                              <div className="flex items-center space-x-1.5">
                                <span className="text-emerald-400 font-black">{activePrice}</span>
                                {activeOrigPrice && (
                                  <span className="text-slate-500 font-mono text-[9.5px] line-through">
                                    {activeOrigPrice}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-1.5">
                              {activeToken && (
                                <span className="bg-amber-950/80 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded text-[8.5px] font-bold">
                                  🏷️ Token: {activeToken}
                                </span>
                              )}
                              {hasTrial && (
                                <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[8.5px] font-bold">
                                  🚚 Trial
                                </span>
                              )}
                            </div>
                          </div>

                          {activeDealDetails && (
                            <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-500/30 text-[9.5px] text-amber-200 italic">
                              🎁 <strong>Offer Inclusions:</strong> "{activeDealDetails}"
                            </div>
                          )}
                        </div>

                        {/* Organized 2x2 Action Button Grid (No overlap) */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenInspector(item)}
                            className="py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[10.5px] rounded-xl shadow cursor-pointer active:scale-95 transition flex items-center justify-center space-x-1"
                          >
                            <span>🔍 Inspect</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApprove(item)}
                            disabled={actionInProgressId === item.id}
                            className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10.5px] rounded-xl shadow cursor-pointer active:scale-95 transition disabled:opacity-50 flex items-center justify-center space-x-1"
                          >
                            <span>✓ {actionInProgressId === item.id ? '...' : 'Approve'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReject(item)}
                            disabled={actionInProgressId === item.id}
                            className="py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-[10px] rounded-xl cursor-pointer active:scale-95 transition disabled:opacity-50 flex items-center justify-center space-x-1"
                          >
                            <span>✕ Reject</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleShadowban(item)}
                            className={`py-2 rounded-xl text-[10px] font-bold border transition cursor-pointer flex items-center justify-center space-x-1 ${
                              item.is_shadowbanned
                                ? 'bg-purple-950 text-purple-300 border-purple-500/50'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-purple-300'
                            }`}
                          >
                            <span>👻 {item.is_shadowbanned ? 'Unban' : 'Shadowban'}</span>
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
                {approvedListings.map((item) => {
                  const dealBadge = item.deal_badge || item.dealBadge;
                  const origPrice = item.original_price || item.originalPrice;

                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-900 border border-emerald-500/30 rounded-2xl flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <span className="text-[8px] font-black text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded-md border border-emerald-500/30">
                            LIVE
                          </span>
                          {dealBadge && (
                            <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
                              {dealBadge}
                            </span>
                          )}
                          <h4 className="text-xs font-black text-slate-100 truncate">{item.title}</h4>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSeller({ phone: item.phone, name: item.sellerName });
                            setSellerPortfolioTab('all');
                          }}
                          className="text-[9.5px] text-amber-300 hover:text-amber-200 mt-0.5 block text-left cursor-pointer"
                        >
                          👤 {item.sellerName} • 📞 {item.phone} • <span className="text-emerald-400 font-bold">{item.price}</span>
                          {origPrice && <span className="text-slate-500 font-mono text-[9px] line-through ml-1">{origPrice}</span>}
                        </button>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleShadowban(item)}
                          className={`p-1.5 rounded-lg text-[9px] font-black border transition cursor-pointer ${
                            item.is_shadowbanned
                              ? 'bg-purple-950 text-purple-300 border-purple-500/50'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-purple-300'
                          }`}
                          title={item.is_shadowbanned ? 'Remove Shadowban' : 'Shadowban listing'}
                        >
                          👻
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenInspector(item)}
                          className="px-2 py-1 bg-slate-800 text-slate-300 font-bold text-[9px] rounded-lg border border-slate-700 hover:text-white cursor-pointer"
                        >
                          Inspect ➔
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDirectDeleteListing(item.id, item.title)}
                          className="p-1 bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 border border-slate-700 rounded-lg text-[9px] cursor-pointer"
                          title="Delete Listing"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
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
                      <div className="flex items-center space-x-1.5">
                        <h4 className="text-xs font-black text-slate-100 truncate">{item.title}</h4>
                        {item.deal_badge && (
                          <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
                            {item.deal_badge}
                          </span>
                        )}
                        {item.is_shadowbanned && (
                          <span className="text-[8px] font-black px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/40">
                            👻 SHADOWBANNED
                          </span>
                        )}
                      </div>
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

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDirectDeleteListing(item.id, item.title)}
                        className="p-1 bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 border border-slate-700 rounded-lg text-[9px] cursor-pointer"
                        title="Delete Listing"
                      >
                        🗑️
                      </button>

                      <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 uppercase">
                        {item.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 👤 1-TAP MERCHANT PORTFOLIO / DOSSIER MODAL WITH FULL CONTROLS            */}
      {/* ========================================================================= */}
      {selectedSeller && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in select-none">
          <div className="bg-slate-900 border border-amber-500/40 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Dossier Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 shrink-0">
              <div className="flex items-center justify-between pb-2 border-b border-slate-900">
                <div>
                  <span className="text-[8.5px] font-black text-amber-400 uppercase tracking-wider block">
                    👑 MERCHANT DOSSIER & FULL CONTROL
                  </span>
                  <h3 className="text-sm font-black text-slate-100 flex items-center space-x-1.5 mt-0.5">
                    <span>👤 {selectedSeller.name}</span>
                  </h3>
                  <span className="text-cyan-300 font-mono text-[11px] block">📞 +91 {selectedSeller.phone}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSeller(null)}
                  className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Master Admin Controls for Seller */}
              <div className="grid grid-cols-4 gap-1.5 pt-2.5">
                <button
                  type="button"
                  onClick={() => handleDirectBanPoster(selectedSeller.phone, selectedSeller.name)}
                  className="px-2 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-600/40 rounded-xl text-[9px] font-black cursor-pointer active:scale-95 transition"
                >
                  ⛔ Ban Number
                </button>

                <button
                  type="button"
                  onClick={() => handleDirectPurgeSellerAll(selectedSeller.phone, selectedSeller.name)}
                  className="px-2 py-1.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-600/40 rounded-xl text-[9px] font-black cursor-pointer active:scale-95 transition"
                >
                  🧹 Purge Deals
                </button>

                <button
                  type="button"
                  onClick={() => handleDirectDemoteSeller(selectedSeller.phone, selectedSeller.name)}
                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[9px] font-black cursor-pointer active:scale-95 transition"
                >
                  ⬇️ Demote
                </button>

                <button
                  type="button"
                  onClick={() => handleDirectDeleteSellerAccount(selectedSeller.phone, selectedSeller.name)}
                  className="px-2 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[9px] font-black cursor-pointer active:scale-95 transition"
                >
                  🗑️ Delete User
                </button>
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
                💬 Notes ({sellerFeedbackActive.length})
              </button>
            </div>

            {/* Portfolio Listings Scroll Area */}
            <div className="p-3.5 overflow-y-auto space-y-2.5 flex-1">
              {displayedSellerListings.length === 0 ? (
                <div className="text-center p-8 text-slate-500 text-xs font-bold">
                  No listings in this category.
                </div>
              ) : (
                displayedSellerListings.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl border bg-slate-950 border-slate-800 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 pr-2">
                        <h4 className="text-xs font-black text-slate-100 truncate">
                          {item.pending_changes?.title || item.title}
                        </h4>
                        <span className="text-emerald-400 font-bold text-[10px]">
                          {item.pending_changes?.price || item.price}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenInspector(item)}
                          className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[9.5px] rounded-xl shadow cursor-pointer shrink-0"
                        >
                          🔍 Inspect
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDirectDeleteListing(item.id, item.title)}
                          className="p-1 bg-slate-900 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 border border-slate-800 rounded-lg text-[9px] cursor-pointer"
                          title="Delete Listing"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔍 FULL INTERACTIVE REVIEW STUDIO & MODERATION MODAL                      */}
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
              
              {/* Proposal Diff Banner */}
              {inspectingItem.pending_changes && (
                <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-2xl text-[10px] text-amber-200 space-y-1">
                  <span className="font-black text-amber-300 block">⚡ Proposal Diff:</span>
                  <p>Merchant has submitted revised pricing, promotional offer badges, or catalog media for verification.</p>
                </div>
              )}

              {/* Media Player & Gallery Box */}
              {(() => {
                const photos = editFormData.images || [];
                const cleanPhotos = photos.map((p) => (typeof p === 'string' ? p : p.url || p.preview)).filter(Boolean);
                const videos = editFormData.videos || [];

                return (
                  <div className="space-y-2">
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
                        🔍 Fullscreen
                      </button>
                    </div>

                    {/* Admin Media Correction Strip in Edit Mode */}
                    {isAdminEditing && (
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9.5px] font-bold text-slate-300">
                            {activeMediaTab === 'photos' ? 'Manage Attached Photos:' : 'Manage Attached Videos:'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (activeMediaTab === 'photos') adminPhotoInputRef.current?.click();
                              else adminVideoInputRef.current?.click();
                            }}
                            className="px-2 py-1 bg-amber-400 text-slate-950 font-black text-[9px] rounded-lg cursor-pointer active:scale-95 transition"
                          >
                            + Add {activeMediaTab === 'photos' ? 'Photo' : 'Video'}
                          </button>
                        </div>

                        {activeMediaTab === 'photos' ? (
                          <div className="flex items-center space-x-2 overflow-x-auto py-1">
                            {cleanPhotos.map((url, idx) => (
                              <div key={idx} className="relative w-12 h-12 rounded-lg border border-slate-700 shrink-0 overflow-hidden group">
                                <img src={url} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => handleAdminRemovePhoto(idx)}
                                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] font-black cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 overflow-x-auto py-1">
                            {videos.map((vid, idx) => (
                              <div key={idx} className="relative w-14 h-12 rounded-lg bg-slate-900 border border-slate-700 shrink-0 p-1 flex items-center justify-center">
                                <span className="text-[9px] text-cyan-300 font-mono truncate">Vid #{idx + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => handleAdminRemoveVideo(idx)}
                                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] font-black cursor-pointer"
                                >
                                  ✕
                                </button>
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
                      ✏️ Edit Listing Details & Offers
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

                  {/* Promotional Offer Fields */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-amber-500/40 space-y-2">
                    <span className="text-[9.5px] font-black text-amber-300 block">🎁 Promotional Offer Terms (ऑफर संपादन):</span>
                    
                    <div>
                      <label className="text-[8.5px] font-bold text-slate-400 block mb-0.5">Promotional Badge Tag</label>
                      <input
                        type="text"
                        placeholder="e.g. 🍱 6-in-1 Groom Kit @ ₹4,999"
                        value={editFormData.deal_badge}
                        onChange={(e) => setEditFormData({ ...editFormData, deal_badge: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-amber-300 font-black text-[10px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8.5px] font-bold text-slate-400 block mb-0.5">Offer Price *</label>
                        <input
                          type="text"
                          value={editFormData.price}
                          onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-emerald-400 font-black text-[10px]"
                        />
                      </div>
                      <div>
                        <label className="text-[8.5px] font-bold text-slate-400 block mb-0.5">Original Strike Price</label>
                        <input
                          type="text"
                          placeholder="e.g. ₹7,500"
                          value={editFormData.original_price}
                          onChange={(e) => setEditFormData({ ...editFormData, original_price: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-400 font-mono text-[10px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[8.5px] font-bold text-slate-400 block mb-0.5">Combo Inclusions & Details</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Includes Safa, Mojari, Mala & Alterations..."
                        value={editFormData.deal_details}
                        onChange={(e) => setEditFormData({ ...editFormData, deal_details: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 text-[10px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8.5px] font-bold text-slate-400 block mb-0.5">Token Amount</label>
                        <input
                          type="text"
                          placeholder="e.g. ₹500"
                          value={editFormData.token_amount}
                          onChange={(e) => setEditFormData({ ...editFormData, token_amount: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1 text-amber-200 text-[10px]"
                        />
                      </div>
                      <div className="flex items-center justify-between p-1.5 bg-slate-950 rounded-xl border border-slate-800 mt-2">
                        <span className="text-[9px] font-bold text-slate-300">Ghar Par Trial</span>
                        <input
                          type="checkbox"
                          checked={editFormData.doorstep_trial}
                          onChange={(e) => setEditFormData({ ...editFormData, doorstep_trial: e.target.checked })}
                          className="w-3.5 h-3.5 accent-amber-400 rounded"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bullet Highlights Inputs */}
                  <div className="space-y-1.5">
                    <label className="text-[8.5px] font-bold text-slate-400 block">4 Key Highlights (मुख्य विशेषताएं):</label>
                    {[0, 1, 2, 3].map((idx) => (
                      <input
                        key={idx}
                        type="text"
                        placeholder={`Point ${idx + 1}`}
                        value={editFormData.descPoints[idx] || ''}
                        onChange={(e) => {
                          const pts = [...editFormData.descPoints];
                          pts[idx] = e.target.value;
                          setEditFormData({ ...editFormData, descPoints: pts });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-slate-200 text-[10px]"
                      />
                    ))}
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
                </div>
              ) : (
                (() => {
                  const changes = inspectingItem.pending_changes || {};
                  const sellerPhone = sanitizePhone(changes.phone || inspectingItem.phone);
                  const sellerName = changes.sellerName || inspectingItem.sellerName;
                  const dealBadge = changes.deal_badge || changes.dealBadge || inspectingItem.deal_badge || inspectingItem.dealBadge;
                  const dealDetails = changes.deal_details || changes.dealDetails || inspectingItem.deal_details || inspectingItem.dealDetails;
                  const origPrice = changes.original_price || changes.originalPrice || inspectingItem.original_price || inspectingItem.originalPrice;
                  const currentPrice = changes.price || inspectingItem.price;
                  const tokenAmt = changes.token_amount || changes.tokenAmount || inspectingItem.token_amount || inspectingItem.tokenAmount;
                  const hasTrial = changes.doorstep_trial !== undefined ? changes.doorstep_trial : inspectingItem.doorstep_trial;

                  return (
                    <div className="space-y-2.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-[10.5px]">
                      
                      {/* Merchant Contact Bar & Actions */}
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
                          <span className="text-cyan-300 font-mono block">📞 +91 {sellerPhone}</span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleShadowban(inspectingItem)}
                            className={`px-2 py-1 rounded-lg text-[9px] font-black border transition cursor-pointer ${
                              inspectingItem.is_shadowbanned
                                ? 'bg-purple-950 text-purple-300 border-purple-500/50'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-purple-300'
                            }`}
                            title={inspectingItem.is_shadowbanned ? 'Remove Shadowban' : 'Shadowban listing'}
                          >
                            👻 Shadowban
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDirectDeleteListing(inspectingItem.id, changes.title || inspectingItem.title)}
                            className="px-2 py-1 bg-slate-900 hover:bg-rose-900 text-rose-300 border border-slate-800 rounded-lg text-[9px] font-bold cursor-pointer"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>

                      {/* Promotional Offer Inspector Section */}
                      {dealBadge && (
                        <div className="p-3 rounded-2xl bg-amber-950/50 border border-amber-400/60 space-y-1.5 shadow-inner">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider block">
                              🎁 PROMOTIONAL OFFER & COMBO TERMS
                            </span>
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-sm animate-pulse">
                              {dealBadge}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 pt-0.5">
                            <span className="text-emerald-400 font-black text-xs">{currentPrice}</span>
                            {origPrice && (
                              <span className="text-slate-500 font-mono text-[10px] line-through">
                                {origPrice}
                              </span>
                            )}
                            {tokenAmt && (
                              <span className="text-amber-300 text-[9px] font-bold bg-amber-950 px-1.5 py-0.5 rounded border border-amber-500/30">
                                🏷️ Token: {tokenAmt}
                              </span>
                            )}
                            {hasTrial && (
                              <span className="text-emerald-300 text-[9px] font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                🚚 Ghar Par Trial
                              </span>
                            )}
                          </div>

                          {dealDetails && (
                            <p className="text-[10px] text-amber-200 font-medium italic pt-1 leading-relaxed">
                              "{dealDetails}"
                            </p>
                          )}
                        </div>
                      )}

                      {/* Regular Price & Capacity */}
                      <div className="grid grid-cols-2 gap-2 border-b border-slate-900 pb-2">
                        <div>
                          <span className="text-[8.5px] text-slate-500 uppercase block">Price Rate</span>
                          <span className="text-emerald-400 font-black text-xs">{currentPrice}</span>
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
                          <span className="text-slate-300 truncate block">📍 {changes.location || inspectingItem.location || selectedCity}</span>
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

              {/* 📬 Merchant Reply Box */}
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

              {/* 🎙️ Admin Voice & Text Feedback Note */}
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
                  placeholder="Or type notes: e.g. Please update with a clearer photo..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-hidden"
                />

                <button
                  type="button"
                  onClick={() => handleSendFeedbackNote(inspectingItem)}
                  disabled={isSendingFeedback || (!feedbackText.trim() && !recordedVoiceNote)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-[10px] font-black transition cursor-pointer active:scale-95 disabled:opacity-40"
                >
                  {isSendingFeedback ? 'Sending Feedback...' : '📩 Send Feedback Note'}
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