import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAllListingsSlice, hyperlocalStore, hydrateFromDB } from '../../store/hyperlocalStore';
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
  
  // 🌟 7-Way Unified Tab Switcher
  // 'pending' | 'approved' | 'all' | 'crm' | 'reports' | 'interactions' | 'broadcast'
  const [activeTab, setActiveTab] = useState('pending');
  
  // ── 🔍 Search, Filter & Sorter State ──────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');
  const [selectedColony, setSelectedColony] = useState('all');
  const [selectedOfferType, setSelectedOfferType] = useState('all'); // 'all' | 'combo' | 'trial' | 'token' | 'discount'
  const [selectedMediaType, setSelectedMediaType] = useState('all'); // 'all' | 'video' | 'audio' | 'photos' | 'text'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'pending_longest' | 'stars' | 'price_low' | 'price_high'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState(null);

  // ⏱️ Timeline Filter States
  const [timeFilterType, setTimeFilterType] = useState('all');
  const [timeValue, setTimeValue] = useState(1);

  // 👥 Member CRM & WhatsApp Desk State
  const [profiles, setProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [crmSearchQuery, setCrmSearchQuery] = useState('');
  const [crmFilterTier, setCrmFilterTier] = useState('all'); // 'all' | 'pending_pin' | 'resident' | 'merchant' | 'banned'
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberArea, setNewMemberArea] = useState('Ranjeet Nagar');
  const [newMemberRole, setNewMemberRole] = useState('resident');
  const [newBusinessName, setNewBusinessName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // 🚩 Disputes & Reports State
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportReasonFilter, setReportReasonFilter] = useState('all');

  // 💬 Community Audit State (Threads & Reviews)
  const [threads, setThreads] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [interactionsLoading, setInteractionsLoading] = useState(false);

  // 📢 Push Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastRole, setBroadcastRole] = useState('public'); // 'public' | 'resident' | 'merchant'
  const [broadcastTag, setBroadcastTag] = useState('TOWN_ALERT');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

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

  // ── Fetch Profiles, Reports & Interactions ────────────────────
  const fetchProfiles = useCallback(async () => {
    setProfilesLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) setProfiles(data);
    } catch (err) {
      console.error('Error fetching user profiles:', err);
    } finally {
      setProfilesLoading(false);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const { data, error } = await supabase
        .from('listing_reports')
        .select('*, listings(title, seller_name, phone, category)')
        .order('created_at', { ascending: false });

      if (!error && data) setReports(data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  const fetchInteractions = useCallback(async () => {
    setInteractionsLoading(true);
    try {
      const { data: threadData } = await supabase
        .from('listing_threads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (threadData) setThreads(threadData);

      const { data: reviewData } = await supabase
        .from('listing_reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (reviewData) setReviews(reviewData);
    } catch (err) {
      console.error('Error fetching interactions:', err);
    } finally {
      setInteractionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdminAuth) {
      hydrateFromDB();
      fetchProfiles();
      fetchReports();
      fetchInteractions();
    }
  }, [isAdminAuth, fetchProfiles, fetchReports, fetchInteractions]);

  const showNotice = (msg) => {
    setDashboardNotice(msg);
    if (msg) setTimeout(() => setDashboardNotice(''), 4500);
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
    await fetchReports();
    await fetchInteractions();
    setIsRefreshing(false);
    showNotice('Registry and Moderation queue refreshed.');
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

      const isSeller = user.is_merchant || user.verification_tier === 'merchant';
      const message = encodeURIComponent(
        `Namaste ${user.full_name} ji!\n\n` +
        `Your Aapke Kareeb Alwar ${isSeller ? 'Merchant (Seller)' : 'Member'} Verification PIN is: *${generatedPin}*\n\n` +
        `👉 Open the app, enter this 6-digit PIN, and set your 4-digit permanent Security PIN.\n\n` +
        `Welcome to Aapke Kareeb (${selectedCity})!`
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
    const unverified = profiles.filter((p) => !p.is_verified || p.status === 'pending_activation');
    if (unverified.length === 0) return;
    if (!window.confirm(`Generate activation PINs for all ${unverified.length} pending user(s)?`)) return;

    setActionLoading(true);
    let sentCount = 0;

    for (const user of unverified) {
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
  };

  // ── 📲 Manual Member Onboarding ───────────────────────────────
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

  // ── 📢 Town Push Broadcast Dispatcher ──────────────────────────
  const handleSendTownBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) {
      showNotice('⚠️ Please provide both a title and message for the broadcast.');
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
        metadata: {
          broadcastBy: 'Master Admin',
          timestamp: new Date().toISOString(),
        },
      });

      showNotice(`📢 Broadcast sent to ${broadcastRole.toUpperCase()} members across ${selectedCity}!`);
      setBroadcastTitle('');
      setBroadcastMsg('');
    } catch (err) {
      console.error('Broadcast error:', err);
      showNotice('⚠️ Failed to dispatch broadcast.');
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  // ── 📊 Export Verified Directory CSV ──────────────────────────
  const handleExportDirectoryCSV = () => {
    const merchants = profiles.filter((p) => p.is_merchant || p.verification_tier === 'merchant');
    if (merchants.length === 0) {
      showNotice('⚠️ No merchants found to export.');
      return;
    }

    const headers = 'Full Name,Phone,Business Name,Area,City,Status,Trust Score,Created At\n';
    const rows = merchants
      .map((m) =>
        `"${m.full_name}","+91 ${m.phone}","${m.business_name || ''}","${m.area_name || ''}","${m.city || ''}","${m.status || ''}","${m.trust_score || 100}","${m.created_at || ''}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AapkeKareeb_Merchants_${selectedCity}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('📥 Merchant Directory CSV downloaded successfully.');
  };

  // ── ⏱️ Time Filter Logic ──────────────────────────────────────
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

  // ── 🔍 Filter & Sort Engine ───────────────────────────────────
  const processListings = (list, isPendingFilter = null) => {
    return (list || []).filter((item) => {
      const isPending =
        item.has_pending_approval === true ||
        item.is_active === false ||
        Boolean(item.pending_changes);

      if (isPendingFilter === true && !isPending) return false;
      if (isPendingFilter === false && isPending) return false;

      const changes = item.pending_changes || {};
      const cat = changes.category || item.category;
      const sub = changes.subCategory || changes.sub_category || item.subCategory || item.sub_category;
      const loc = changes.location || item.location || item.location_name || '';
      const badge = changes.deal_badge || changes.dealBadge || item.deal_badge || item.dealBadge;

      // 1. Sector & Subcategory Filter
      if (selectedCategory !== 'all' && cat !== selectedCategory) return false;
      if (selectedSubCategory !== 'all' && sub !== selectedSubCategory) return false;

      // 2. Colony Filter
      if (selectedColony !== 'all' && !loc.toLowerCase().includes(selectedColony.toLowerCase())) return false;

      // 3. Offer Type Filter
      if (selectedOfferType === 'combo' && (!badge || !badge.includes('🍱'))) return false;
      if (selectedOfferType === 'trial' && !(changes.doorstep_trial ?? item.doorstep_trial)) return false;
      if (selectedOfferType === 'token' && !(changes.token_amount || item.token_amount)) return false;
      if (selectedOfferType === 'discount' && !(changes.original_price || item.original_price)) return false;

      // 4. Media Type Filter
      const photos = changes.images || item.images || [];
      const videos = changes.videos || item.videos || [];
      if (selectedMediaType === 'video' && videos.length === 0) return false;
      if (selectedMediaType === 'photos' && photos.length < 3) return false;

      // 5. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          (changes.title || item.title || '').toLowerCase().includes(q) ||
          (changes.sellerName || item.sellerName || item.seller_name || '').toLowerCase().includes(q) ||
          String(badge || '').toLowerCase().includes(q) ||
          String(changes.phone || item.phone || '').includes(q) ||
          loc.toLowerCase().includes(q);

        if (!matches) return false;
      }

      return applyTimeFilter(item.created_at);
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (sortBy === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      if (sortBy === 'stars') return (b.interestCount || b.interest_count || 0) - (a.interestCount || a.interest_count || 0);
      if (sortBy === 'flags') return (b.flag_count || 0) - (a.flag_count || 0);
      return 0;
    });
  };

  const pendingApprovals = useMemo(() => processListings(allListings, true), [allListings, selectedCategory, selectedSubCategory, selectedColony, selectedOfferType, selectedMediaType, searchQuery, timeFilterType, timeValue, sortBy]);
  const approvedListings = useMemo(() => processListings(allListings, false), [allListings, selectedCategory, selectedSubCategory, selectedColony, selectedOfferType, selectedMediaType, searchQuery, timeFilterType, timeValue, sortBy]);
  const allFilteredListings = useMemo(() => processListings(allListings, null), [allListings, selectedCategory, selectedSubCategory, selectedColony, selectedOfferType, selectedMediaType, searchQuery, timeFilterType, timeValue, sortBy]);

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

  // ── 🛑 Direct Master Actions ──────────────────────────────────
  const handleDirectDeleteListing = async (listingId, title = 'Listing') => {
    if (!window.confirm(`⚠️ PERMANENT CASCADE DELETE: Delete "${title}" and all its inquiries/reports?`)) return;
    try {
      const res = await deleteListingFromDB(listingId);
      if (res.success) {
        showNotice(`🗑️ Deleted "${title}"`);
        if (inspectingItem?.id === listingId) setInspectingItem(null);
      } else {
        showNotice(`⚠️ Error: ${res.error}`);
      }
    } catch (err) {
      console.error('Delete error:', err);
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
    if (!window.confirm(`⛔ BAN MEMBER: Suspend +91 ${cleanPhone} (${name}) and deactivate all their listings?`)) {
      return;
    }
    const res = await adminToggleBanUser(cleanPhone, true);
    if (res.success) {
      await hydrateFromDB();
      await fetchProfiles();
      showNotice(`⛔ Banned +91 ${cleanPhone}`);
    }
  };

  const handleDirectPurgeSellerAll = async (phone, name = 'Seller') => {
    if (!phone) return;
    const cleanPhone = sanitizePhone(phone);
    if (!window.confirm(`🧹 PURGE DEALS: Delete all catalog listings posted by +91 ${cleanPhone} (${name})?`)) {
      return;
    }
    const res = await adminDeleteAllSellerListings(cleanPhone);
    if (res.success) {
      await hydrateFromDB();
      showNotice(`🧹 Purged all listings of +91 ${cleanPhone}`);
      if (selectedSeller?.phone === cleanPhone) setSelectedSeller(null);
    }
  };

  const handleDirectDeleteSellerAccount = async (phone, name = 'Seller', userId = null) => {
    if (!phone && !userId) return;
    const cleanPhone = sanitizePhone(phone);
    if (!window.confirm(`🗑️ CASCADE DELETE USER: Permanently wipe +91 ${cleanPhone} (${name}) and all associated records?`)) {
      return;
    }
    const res = await adminDeleteUser(userId, cleanPhone);
    if (res.success) {
      await hydrateFromDB();
      await fetchProfiles();
      showNotice(`🗑️ Completely deleted ${name} (+91 ${cleanPhone})`);
      if (selectedSeller?.phone === cleanPhone) setSelectedSeller(null);
      if (inspectingItem && sanitizePhone(inspectingItem.phone) === cleanPhone) setInspectingItem(null);
    } else {
      showNotice(`⚠️ Delete failed: ${res.error}`);
    }
  };

  const handleDirectDemoteSeller = async (phone, name = 'Seller') => {
    if (!phone) return;
    const cleanPhone = sanitizePhone(phone);
    if (!window.confirm(`⬇️ DEMOTE: Revert ${name} (+91 ${cleanPhone}) to Basic Resident?`)) return;
    const res = await adminDemoteMerchant(cleanPhone);
    if (res.success) {
      await fetchProfiles();
      showNotice(`⬇️ Demoted ${name} to Basic Resident`);
    }
  };

  const handleAdjustTrustScore = async (phone, delta) => {
    const cleanPhone = sanitizePhone(phone);
    const target = profiles.find((p) => p.phone === cleanPhone);
    if (!target) return;

    const newScore = Math.max(0, Math.min(100, (target.trust_score || 100) + delta));
    await supabase.from('user_profiles').update({ trust_score: newScore }).eq('phone', cleanPhone);
    fetchProfiles();
    showNotice(`Updated Trust Score to ${newScore} for ${target.full_name}`);
  };

  // ── 🔍 Inspector Studio Setup ──────────────────────────────────
  const handleOpenInspector = (item) => {
    const changes = item.pending_changes || {};
    const photos = changes.images || changes.image_urls || item.images || (changes.image ? [changes.image] : [item.image]);
    const cleanPhotos = (photos || []).map((p) => (typeof p === 'string' ? p : p.url || p.preview)).filter(Boolean);
    const videos = changes.videos || changes.video_urls || item.videos || [];

    setEditFormData({
      title: changes.title || item.title || item.name || '',
      category: changes.category || item.category || 'market',
      subCategory: changes.subCategory || changes.sub_category || item.subCategory || item.sub_category || 'all',
      price: changes.price || item.price || '',
      original_price: changes.original_price || changes.originalPrice || item.original_price || item.originalPrice || '',
      deal_type: changes.deal_type || changes.dealType || item.deal_type || item.dealType || null,
      deal_badge: changes.deal_badge || changes.dealBadge || item.deal_badge || item.dealBadge || '',
      deal_details: changes.deal_details || changes.dealDetails || item.deal_details || item.dealDetails || '',
      token_amount: changes.token_amount || changes.tokenAmount || item.token_amount || item.tokenAmount || '',
      doorstep_trial: Boolean(changes.doorstep_trial ?? changes.doorstepTrial ?? item.doorstep_trial ?? item.doorstepTrial ?? false),
      capacity: changes.capacity || changes.stockCount || item.capacity || item.stockCount || 'Ready Stock',
      location: changes.location || item.location || selectedCity,
      lat: changes.lat !== undefined ? changes.lat : item.lat,
      lng: changes.lng !== undefined ? changes.lng : item.lng,
      timing: changes.timing || item.timing || item.activeHours || '09:00 AM - 09:00 PM',
      description: changes.description || item.description || '',
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

  // 🟢 Approve & Publish
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

        finalChanges = {
          ...finalChanges,
          title: editFormData.title.trim(),
          category: editFormData.category,
          subCategory: editFormData.subCategory,
          sub_category: editFormData.subCategory,
          price: editFormData.price.trim(),
          original_price: editFormData.original_price ? editFormData.original_price.trim() : null,
          deal_type: editFormData.deal_type || null,
          deal_badge: editFormData.deal_badge ? editFormData.deal_badge.trim() : null,
          deal_details: editFormData.deal_details ? editFormData.deal_details.trim() : null,
          token_amount: editFormData.token_amount ? editFormData.token_amount.trim() : null,
          doorstep_trial: Boolean(editFormData.doorstep_trial),
          capacity: editFormData.capacity.trim(),
          location: editFormData.location.trim(),
          lat: editFormData.lat !== undefined && editFormData.lat !== null ? Number(editFormData.lat) : item.lat,
          lng: editFormData.lng !== undefined && editFormData.lng !== null ? Number(editFormData.lng) : item.lng,
          timing: editFormData.timing.trim(),
          description: editFormData.description.trim(),
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
    } finally {
      setActionInProgressId(null);
    }
  };

  // 🔴 Reject Changes
  const handleReject = async (item) => {
    setActionInProgressId(item.id);
    try {
      const reason = feedbackText.trim() || 'Listing could not be approved based on town community guidelines.';
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
    } finally {
      setActionInProgressId(null);
    }
  };

  // 🎙️ Voice Feedback Recording Handlers
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
      alert('Microphone access denied.');
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
        admin_feedback: recordedVoiceNote ? JSON.stringify(feedbackPayload) : feedbackText.trim(),
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

        {/* Top Operational Metrics */}
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <div className="bg-slate-900 border border-amber-500/40 p-2 rounded-2xl shadow-xs">
            <span className="block text-sm font-black text-amber-300">{pendingApprovals.length}</span>
            <span className="text-[8px] text-amber-300/80 font-bold uppercase">Pending</span>
          </div>
          <div className="bg-slate-900 border border-emerald-500/40 p-2 rounded-2xl shadow-xs">
            <span className="block text-sm font-black text-emerald-400">{approvedListings.length}</span>
            <span className="text-[8px] text-emerald-300/80 font-bold uppercase">Live</span>
          </div>
          <div className="bg-slate-900 border border-cyan-500/40 p-2 rounded-2xl shadow-xs">
            <span className="block text-sm font-black text-cyan-300">{profiles.length}</span>
            <span className="text-[8px] text-cyan-300/80 font-bold uppercase">Members</span>
          </div>
          <div className="bg-slate-900 border border-rose-500/40 p-2 rounded-2xl shadow-xs">
            <span className="block text-sm font-black text-rose-400">{reports.length}</span>
            <span className="text-[8px] text-rose-300/80 font-bold uppercase">Reports</span>
          </div>
        </div>

        {/* 🌟 7-Way Unified Tab Switcher */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none bg-slate-900 p-1 rounded-2xl border border-slate-800 text-[9.5px]">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-xl font-black whitespace-nowrap transition cursor-pointer ${
              activeTab === 'pending' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Deals ({pendingApprovals.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded-xl font-black whitespace-nowrap transition cursor-pointer ${
              activeTab === 'approved' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            🟢 Live ({approvedListings.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('crm')}
            className={`px-3 py-1.5 rounded-xl font-black whitespace-nowrap transition cursor-pointer ${
              activeTab === 'crm' ? 'bg-purple-500 text-white shadow-md' : 'text-slate-400 hover:text-purple-300'
            }`}
          >
            👥 Member CRM
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-xl font-black whitespace-nowrap transition cursor-pointer ${
              activeTab === 'reports' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            🚩 Disputes ({reports.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('interactions')}
            className={`px-3 py-1.5 rounded-xl font-black whitespace-nowrap transition cursor-pointer ${
              activeTab === 'interactions' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            💬 Q&A & Reviews
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('broadcast')}
            className={`px-3 py-1.5 rounded-xl font-black whitespace-nowrap transition cursor-pointer ${
              activeTab === 'broadcast' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            📢 Broadcast & Coverage
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl font-black whitespace-nowrap transition cursor-pointer ${
              activeTab === 'all' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({allFilteredListings.length})
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            TAB 1, 2, 7: LISTINGS MODERATION TABS ('pending', 'approved', 'all')
           ═══════════════════════════════════════════════════════════ */}
        {(activeTab === 'pending' || activeTab === 'approved' || activeTab === 'all') && (
          <div className="space-y-3">
            {/* 🔍 Multi-Dimensional Search & Filter Bar */}
            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <input
                type="text"
                placeholder="Search title, seller, mobile, locality, offer badge..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />

              <div className="grid grid-cols-3 gap-1.5">
                {/* Sector Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubCategory('all');
                  }}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-[10px] text-amber-300 font-bold focus:outline-none"
                >
                  <option value="all">All Sectors</option>
                  {Object.keys(TAXONOMY_REGISTRY).map((catKey) => {
                    const cat = TAXONOMY_REGISTRY[catKey];
                    return <option key={cat.id} value={cat.id}>{cat.name.split('(')[0]}</option>;
                  })}
                </select>

                {/* Subcategory Filter */}
                <select
                  value={selectedSubCategory}
                  onChange={(e) => setSelectedSubCategory(e.target.value)}
                  disabled={selectedCategory === 'all'}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-[10px] text-slate-200 font-bold focus:outline-none disabled:opacity-40"
                >
                  <option value="all">All Subcategories</option>
                  {(getCategoryById(selectedCategory)?.subCategories || []).map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name.split('(')[0]}</option>
                  ))}
                </select>

                {/* Colony Filter */}
                <select
                  value={selectedColony}
                  onChange={(e) => setSelectedColony(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-[10px] text-slate-200 font-bold focus:outline-none"
                >
                  <option value="all">All Colonies</option>
                  {Object.keys(CITY_ZONES).map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>

              {/* Offer Type & Sorters Filter Strip */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[9px] font-bold">
                <span className="text-slate-500 uppercase tracking-wider">Deals:</span>
                {['all', 'combo', 'trial', 'token', 'discount'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedOfferType(type)}
                    className={`px-2.5 py-1 rounded-lg border transition ${
                      selectedOfferType === type ? 'bg-amber-400 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {type === 'all' ? 'All' : type === 'combo' ? '🍱 Combos' : type === 'trial' ? '🚚 Trial' : type === 'token' ? '🏷️ Token' : '🔥 % Off'}
                  </button>
                ))}

                <span className="text-slate-500 uppercase tracking-wider ml-2">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-slate-300 text-[9px]"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="stars">Most Starred ⭐</option>
                  <option value="flags">Most Flagged 🚩</option>
                </select>
              </div>
            </div>

            {/* Render List */}
            {(() => {
              const currentList = activeTab === 'pending' ? pendingApprovals : activeTab === 'approved' ? approvedListings : allFilteredListings;

              if (currentList.length === 0) {
                return (
                  <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-1.5">
                    <span className="text-2xl block">{activeTab === 'pending' ? '✅' : '📦'}</span>
                    <h4 className="text-xs font-black text-slate-200">No Listings Match Filter</h4>
                    <p className="text-[10px] text-slate-400">Try adjusting your search terms or colony filters.</p>
                  </div>
                );
              }

              return currentList.map((item) => {
                const changes = item.pending_changes || {};
                const isProposal = Boolean(item.pending_changes);
                const sellerPhone = sanitizePhone(changes.phone || item.phone);
                const sellerName = changes.sellerName || item.sellerName || item.seller_name;
                const activeDealBadge = changes.deal_badge || changes.dealBadge || item.deal_badge || item.dealBadge;
                const activeDealDetails = changes.deal_details || changes.dealDetails || item.deal_details || item.dealDetails;
                const activeOrigPrice = changes.original_price || changes.originalPrice || item.original_price || item.originalPrice;
                const activePrice = changes.price || item.price || 'Rate on Request';
                const activeToken = changes.token_amount || changes.tokenAmount || item.token_amount || item.tokenAmount;
                const hasTrial = changes.doorstep_trial !== undefined ? changes.doorstep_trial : item.doorstep_trial;

                return (
                  <div
                    key={item.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          {isProposal && (
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
                              ✏️ PROPOSED EDIT
                            </span>
                          )}
                          {activeDealBadge && (
                            <span className="text-[8.5px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-sm">
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
                          className="mt-0.5 text-[10px] text-amber-300 hover:underline font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <span>👤 {sellerName}</span>
                          <span>•</span>
                          <span className="font-mono">📞 +91 {sellerPhone}</span>
                          <span className="text-[8px] bg-amber-400/20 px-1 rounded text-amber-300">Dossier ➔</span>
                        </button>
                      </div>

                      <span className="text-[9px] text-slate-400 font-semibold bg-slate-800 px-2 py-0.5 rounded-md shrink-0">
                        {changes.category || item.category}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-[10px]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-emerald-400 font-black">{activePrice}</span>
                          {activeOrigPrice && (
                            <span className="text-slate-500 font-mono text-[9.5px] line-through">{activeOrigPrice}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          {activeToken && <span className="text-amber-300 bg-amber-950 px-1 rounded text-[8.5px]">🏷️ Token {activeToken}</span>}
                          {hasTrial && <span className="text-emerald-300 bg-emerald-950 px-1 rounded text-[8.5px]">🚚 Trial</span>}
                        </div>
                      </div>
                      {activeDealDetails && <p className="text-[9.5px] text-amber-200 italic">🎁 "{activeDealDetails}"</p>}
                    </div>

                    {/* 2x2 Action Button Grid */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenInspector(item)}
                        className="py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[10.5px] rounded-xl shadow cursor-pointer active:scale-95 transition flex items-center justify-center space-x-1"
                      >
                        <span>🔍 Inspect & Edit</span>
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
                          item.is_shadowbanned ? 'bg-purple-950 text-purple-300 border-purple-500/50' : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        <span>👻 {item.is_shadowbanned ? 'Unban' : 'Shadowban'}</span>
                      </button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TAB 3: 👥 UNIFIED MEMBER CRM & WHATSAPP DESK
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'crm' && (
          <div className="space-y-4 animate-fade-in text-xs">
            {/* Quick Manual Onboard Box */}
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

            {/* Member Directory Search & Filters */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Members Directory ({profiles.length})
                </span>
                <button
                  type="button"
                  onClick={handleBulkDispatchPins}
                  disabled={actionLoading}
                  className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[9.5px] rounded-lg shadow cursor-pointer"
                >
                  🚀 Bulk PINs
                </button>
              </div>

              <input
                type="text"
                placeholder="Search member by name, mobile, shop, colony..."
                value={crmSearchQuery}
                onChange={(e) => setCrmSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 placeholder-slate-500 focus:outline-none"
              />

              {/* CRM Filter Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-[9px] font-bold">
                {[
                  { id: 'all', label: `All (${profiles.length})` },
                  { id: 'pending_pin', label: `Pending PIN (${profiles.filter((p) => !p.is_verified).length})` },
                  { id: 'resident', label: `Residents (${profiles.filter((p) => !p.is_merchant).length})` },
                  { id: 'merchant', label: `Merchants (${profiles.filter((p) => p.is_merchant).length})` },
                  { id: 'banned', label: `Banned (${profiles.filter((p) => p.is_banned).length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCrmFilterTier(tab.id)}
                    className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition cursor-pointer ${
                      crmFilterTier === tab.id ? 'bg-purple-500 text-white border-purple-500' : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Profiles List */}
              <div className="space-y-2.5">
                {profiles
                  .filter((p) => {
                    if (crmFilterTier === 'pending_pin' && p.is_verified) return false;
                    if (crmFilterTier === 'resident' && p.is_merchant) return false;
                    if (crmFilterTier === 'merchant' && !p.is_merchant) return false;
                    if (crmFilterTier === 'banned' && !p.is_banned) return false;

                    if (crmSearchQuery) {
                      const q = crmSearchQuery.toLowerCase().trim();
                      const matches =
                        p.full_name?.toLowerCase().includes(q) ||
                        p.phone?.includes(q) ||
                        p.business_name?.toLowerCase().includes(q) ||
                        p.area_name?.toLowerCase().includes(q);
                      if (!matches) return false;
                    }
                    return true;
                  })
                  .map((user) => (
                    <div
                      key={user.id}
                      className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2.5 shadow-sm"
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
                            {user.is_banned && (
                              <span className="text-[8px] bg-rose-950 text-rose-300 px-1 py-0.2 rounded font-bold">
                                BANNED
                              </span>
                            )}
                          </div>

                          <p className="text-[10.5px] font-mono font-bold text-cyan-300 mt-0.5">
                            📞 +91 {user.phone}
                          </p>
                          <p className="text-[9.5px] text-slate-400">
                            📍 {user.area_name || 'Town Center'}
                            {user.business_name && <span className="text-amber-300 ml-1">({user.business_name})</span>}
                          </p>

                          {/* Trust Score & Badges */}
                          <div className="flex items-center space-x-2 pt-1">
                            <span className="text-[9px] font-bold text-amber-400">
                              ⭐ Trust: {user.trust_score || 100}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustTrustScore(user.phone, 10)}
                              className="text-[8.5px] bg-slate-800 hover:bg-slate-700 px-1.5 py-0.2 rounded text-slate-300"
                            >
                              +10
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjustTrustScore(user.phone, -10)}
                              className="text-[8.5px] bg-slate-800 hover:bg-slate-700 px-1.5 py-0.2 rounded text-rose-300"
                            >
                              -10
                            </button>
                          </div>
                        </div>

                        {user.admin_activation_pin && (
                          <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/30 text-amber-300 font-mono font-black text-[10px]">
                            PIN: {user.admin_activation_pin}
                          </span>
                        )}
                      </div>

                      {/* CRM Actions */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => handleGenerateAndDispatchPin(user)}
                          disabled={actionLoading}
                          className="py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9.5px] rounded-lg active:scale-95 transition"
                        >
                          📲 Send PIN
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDirectBanPoster(user.phone, user.full_name)}
                          className={`py-1.5 rounded-lg font-bold text-[9.5px] active:scale-95 transition ${
                            user.is_banned ? 'bg-slate-800 text-slate-300' : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {user.is_banned ? 'Unban User' : '⛔ Ban User'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDirectDeleteSellerAccount(user.phone, user.full_name, user.id)}
                          className="py-1.5 bg-slate-950 hover:bg-rose-900 text-slate-400 hover:text-rose-200 border border-slate-800 rounded-lg font-bold text-[9.5px] active:scale-95 transition"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TAB 4: 🚩 DISPUTES & CONTENT REPORTS
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'reports' && (
          <div className="space-y-3 animate-fade-in text-xs">
            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-rose-400 uppercase">Community Flagged Reports</h3>
                <p className="text-[9.5px] text-slate-400">Audit user-reported scam listings and abuse</p>
              </div>
              <span className="text-sm font-black text-rose-400">{reports.length}</span>
            </div>

            {reportsLoading ? (
              <div className="p-8 text-center text-slate-500 text-xs">Loading dispute reports...</div>
            ) : reports.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-1">
                <span className="text-2xl block">🛡️</span>
                <h4 className="text-xs font-black text-slate-200">No Active Reports</h4>
                <p className="text-[10px] text-slate-400">All flagged community disputes have been cleared.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {reports.map((rep) => (
                  <div key={rep.id} className="p-3.5 bg-slate-900 border border-rose-500/30 rounded-2xl space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-rose-400 bg-rose-950 px-1.5 py-0.5 rounded border border-rose-800">
                          🚩 {rep.reason || 'Flagged Listing'}
                        </span>
                        <h4 className="text-xs font-black text-slate-100 mt-1">
                          Listing: {rep.listings?.title || rep.listing_id}
                        </h4>
                        <p className="text-[9.5px] text-slate-400">
                          👤 Seller: {rep.listings?.seller_name} (📞 +91 {rep.listings?.phone})
                        </p>
                        <p className="text-[9px] text-slate-500 mt-0.5">
                          Reported by: 📞 +91 {rep.reporter_phone} • {new Date(rep.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-1 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={async () => {
                          await supabase.from('listing_reports').delete().eq('id', rep.id);
                          fetchReports();
                          showNotice('Report dismissed.');
                        }}
                        className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[9.5px] rounded-lg"
                      >
                        Dismiss Flag
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDirectDeleteListing(rep.listing_id, rep.listings?.title)}
                        className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-[9.5px] rounded-lg"
                      >
                        Delete Listing
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDirectBanPoster(rep.listings?.phone, rep.listings?.seller_name)}
                        className="px-2.5 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-[9.5px] rounded-lg"
                      >
                        ⛔ Ban Seller
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TAB 5: 💬 COMMUNITY AUDIT & REVIEWS
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'interactions' && (
          <div className="space-y-3 animate-fade-in text-xs">
            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
              <h3 className="text-xs font-black text-cyan-400 uppercase">Live Q&A & Reviews Audit</h3>
              <p className="text-[9.5px] text-slate-400">Monitor inquiries, audio voice notes, and buyer ratings</p>
            </div>

            {interactionsLoading ? (
              <div className="p-8 text-center text-slate-500">Loading interactions...</div>
            ) : threads.length === 0 && reviews.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-1">
                <span className="text-2xl block">💬</span>
                <h4 className="text-xs font-black text-slate-200">No Recent Inquiries</h4>
              </div>
            ) : (
              <div className="space-y-2.5">
                {threads.map((comm) => (
                  <div key={comm.id} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-amber-300">
                        👤 {comm.user_name} ({comm.user_area})
                      </span>
                      <span className="text-[8.5px] text-slate-500">{new Date(comm.created_at).toLocaleDateString()}</span>
                    </div>

                    {comm.audio_url ? (
                      <VoiceNotePlayer audioUrl={comm.audio_url} duration={comm.audio_duration} senderName="Voice Question" />
                    ) : (
                      <p className="text-slate-200 text-[10.5px] italic">"{comm.comment_text}"</p>
                    )}

                    {comm.seller_reply ? (
                      <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[9.5px] text-emerald-200">
                        👑 <strong>Seller Reply:</strong> {comm.seller_reply}
                      </div>
                    ) : (
                      <span className="text-[8.5px] font-bold text-rose-400 block">⏳ Awaiting Seller Reply</span>
                    )}

                    <div className="text-right pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          await supabase.from('listing_threads').delete().eq('id', comm.id);
                          fetchInteractions();
                          showNotice('Comment removed.');
                        }}
                        className="text-[9px] text-rose-400 hover:underline font-bold cursor-pointer"
                      >
                        Delete Inquiry ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TAB 6: 📢 TOWN BROADCAST & ZONE HEALTH
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'broadcast' && (
          <div className="space-y-4 animate-fade-in text-xs">
            {/* Push Announcement Box */}
            <form onSubmit={handleSendTownBroadcast} className="p-4 bg-slate-900 border border-amber-500/40 rounded-3xl space-y-3">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
                <span className="text-xl">📢</span>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-100">
                    Town-Wide Push Broadcast
                  </h3>
                  <p className="text-[9.5px] text-slate-400">Push instant notifications to member centers</p>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 mb-1">Target Audience</label>
                <div className="flex items-center space-x-3">
                  {[
                    { id: 'public', label: 'All Public' },
                    { id: 'resident', label: 'Residents' },
                    { id: 'merchant', label: 'Merchants' },
                  ].map((r) => (
                    <label key={r.id} className="flex items-center space-x-1 text-[10px] font-bold text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="broadcastRoleChoice"
                        checked={broadcastRole === r.id}
                        onChange={() => setBroadcastRole(r.id)}
                        className="accent-amber-400"
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 mb-1">Broadcast Title *</label>
                <input
                  type="text"
                  placeholder="e.g. 🪔 Diwali Special Offers Live Across Alwar!"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 mb-1">Message Content *</label>
                <textarea
                  rows={2}
                  placeholder="Type broadcast announcement message..."
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSendingBroadcast || !broadcastTitle.trim() || !broadcastMsg.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs rounded-xl shadow-md active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                {isSendingBroadcast ? 'Sending Broadcast...' : '📢 Send Town Broadcast'}
              </button>
            </form>

            {/* CSV Export & Colony Health */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-100 uppercase">Export Merchant Directory</h3>
                  <p className="text-[9.5px] text-slate-400">Download formatted CSV phone list for campaigns</p>
                </div>
                <button
                  type="button"
                  onClick={handleExportDirectoryCSV}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] rounded-xl shadow active:scale-95 transition cursor-pointer"
                >
                  📥 Export CSV
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Alwar Colony Distribution:</span>
                <div className="grid grid-cols-2 gap-1 max-h-36 overflow-y-auto pr-1">
                  {Object.keys(CITY_ZONES).map((z) => {
                    const count = profiles.filter((p) => p.area_name === z && (p.is_merchant || p.verification_tier === 'merchant')).length;
                    return (
                      <div key={z} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950 text-[9.5px]">
                        <span className="text-slate-300 truncate">{z}</span>
                        <span className={`font-mono font-bold ${count > 0 ? 'text-amber-400' : 'text-slate-600'}`}>
                          {count} shops
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 👤 1-TAP MERCHANT PORTFOLIO / DOSSIER MODAL                               */}
      {/* ========================================================================= */}
      {selectedSeller && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in select-none">
          <div className="bg-slate-900 border border-amber-500/40 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="p-4 bg-slate-950 border-b border-slate-800 shrink-0">
              <div className="flex items-center justify-between pb-2 border-b border-slate-900">
                <div>
                  <span className="text-[8.5px] font-black text-amber-400 uppercase tracking-wider block">
                    👑 MERCHANT DOSSIER & FULL CONTROL
                  </span>
                  <h3 className="text-sm font-black text-slate-100 mt-0.5">
                    👤 {selectedSeller.name}
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

              <div className="grid grid-cols-4 gap-1.5 pt-2.5">
                <button
                  type="button"
                  onClick={() => handleDirectBanPoster(selectedSeller.phone, selectedSeller.name)}
                  className="px-2 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-600/40 rounded-xl text-[9px] font-black cursor-pointer active:scale-95 transition"
                >
                  ⛔ Ban
                </button>

                <button
                  type="button"
                  onClick={() => handleDirectPurgeSellerAll(selectedSeller.phone, selectedSeller.name)}
                  className="px-2 py-1.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-600/40 rounded-xl text-[9px] font-black cursor-pointer active:scale-95 transition"
                >
                  🧹 Purge
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
                  🗑️ Wipe
                </button>
              </div>
            </div>

            <div className="p-3.5 overflow-y-auto space-y-2.5 flex-1">
              {displayedSellerListings.length === 0 ? (
                <div className="text-center p-8 text-slate-500 text-xs font-bold">No listings posted yet.</div>
              ) : (
                displayedSellerListings.map((item) => (
                  <div key={item.id} className="p-3 rounded-2xl border bg-slate-950 border-slate-800 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <h4 className="text-xs font-black text-slate-100 truncate">{item.pending_changes?.title || item.title}</h4>
                      <span className="text-emerald-400 font-bold text-[10px]">{item.pending_changes?.price || item.price}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenInspector(item)}
                      className="px-2.5 py-1 bg-amber-400 text-slate-950 font-black text-[9.5px] rounded-xl shrink-0"
                    >
                      🔍 Inspect
                    </button>
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
            
            <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="min-w-0 pr-2">
                <span className="text-[8.5px] font-black text-amber-400 uppercase tracking-wider block">
                  🔍 MODERATION INSPECTOR {isAdminEditing && '• ✏️ EDIT MODE'}
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
                    isAdminEditing ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-amber-300 border border-amber-400/40'
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

            <div className="p-4 overflow-y-auto space-y-3.5 flex-1 text-xs">
              
              {/* Media Box */}
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
                    </div>
                  </div>
                );
              })()}

              {/* ✏️ ADMIN EDITING FIELDS */}
              {isAdminEditing ? (
                <div className="space-y-3 bg-slate-950 p-3.5 rounded-2xl border border-amber-400/40 text-[10.5px]">
                  <div>
                    <label className="text-[8.5px] font-bold text-slate-400 block mb-1">Title *</label>
                    <input
                      type="text"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8.5px] font-bold text-slate-400 block mb-1">Offer Price *</label>
                      <input
                        type="text"
                        value={editFormData.price}
                        onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-emerald-400 font-black"
                      />
                    </div>
                    <div>
                      <label className="text-[8.5px] font-bold text-slate-400 block mb-1">Original Price</label>
                      <input
                        type="text"
                        value={editFormData.original_price}
                        onChange={(e) => setEditFormData({ ...editFormData, original_price: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-400 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[8.5px] font-bold text-slate-400 block mb-1">Full Description *</label>
                    <textarea
                      rows={3}
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-200 text-[10px]"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-[10.5px]">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-black text-sm">{editFormData.price || inspectingItem.price}</span>
                    {editFormData.deal_badge && (
                      <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[9px]">
                        {editFormData.deal_badge}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-line text-[10px]">
                    {editFormData.description || inspectingItem.description}
                  </p>
                </div>
              )}

              {/* Voice Feedback Tool */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-amber-500/30 space-y-2">
                <label className="text-[10px] font-black text-amber-300 flex items-center justify-between">
                  <span>🎙️ Voice Note Review to Merchant:</span>
                </label>

                {isRecordingVoice ? (
                  <div className="flex items-center justify-between p-2 bg-rose-950/40 border border-rose-600/50 rounded-xl animate-pulse">
                    <span className="text-xs font-black text-rose-300">
                      Recording: 0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <button type="button" onClick={handleCancelAdminVoice} className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[9px] rounded-lg">Cancel</button>
                      <button type="button" onClick={handleStopAdminVoice} className="px-2.5 py-0.5 bg-emerald-600 text-white font-black text-[10px] rounded-lg">Done ✓</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleStartAdminVoice}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl flex items-center space-x-1"
                    >
                      <span>🎙️ Record Voice Note</span>
                    </button>
                    {recordedVoiceNote && (
                      <span className="text-emerald-400 font-bold text-[10px]">✓ Attached ({recordedVoiceNote.duration})</span>
                    )}
                  </div>
                )}

                <textarea
                  rows={2}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Or type review note to merchant..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => handleSendFeedbackNote(inspectingItem)}
                  disabled={isSendingFeedback || (!feedbackText.trim() && !recordedVoiceNote)}
                  className="w-full py-1.5 bg-slate-800 text-amber-300 border border-amber-500/30 rounded-xl text-[10px] font-black"
                >
                  📩 Send Note to Merchant
                </button>
              </div>

            </div>

            {/* Modal Bottom Actions */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => handleApprove(inspectingItem)}
                disabled={actionInProgressId === inspectingItem.id}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs rounded-xl shadow-lg active:scale-95 transition"
              >
                {actionInProgressId === inspectingItem.id ? 'Publishing...' : '✓ Approve & Publish Live'}
              </button>

              <button
                type="button"
                onClick={() => handleReject(inspectingItem)}
                disabled={actionInProgressId === inspectingItem.id}
                className="px-4 py-2.5 bg-rose-950 text-rose-300 border border-rose-800 font-black text-xs rounded-xl"
              >
                ✕ Reject
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Fullscreen Lightbox */}
      {isLightboxOpen && inspectingItem && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 animate-fade-in select-none">
          <div className="flex items-center justify-between text-white pb-2">
            <span className="text-xs font-black">Media Preview</span>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-sm"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            <img
              src={(editFormData.images || [])[lightboxIndex] || inspectingItem.image}
              alt="Fullscreen"
              className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}

    </div>
  );
}