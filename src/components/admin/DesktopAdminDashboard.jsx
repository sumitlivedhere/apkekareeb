import React, { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import {
  approveListingChanges,
  rejectListingChanges,
  sendAdminFeedbackToSeller,
  uploadVoiceNoteToStorage,
  deleteListingFromDB,
  saveNotificationToDB,
} from '../../services/listingService';
import {
  adminToggleBanUser,
  adminDeleteUser,
  adminDeleteAllSellerListings,
  adminDemoteMerchant,
  sanitizePhone,
} from '../../services/authService';
import { TAXONOMY_REGISTRY } from '../../data/taxonomyRegistry';
import { CITY_ZONES } from '../../data/cityZones';
import { getOptimizedVoiceStream, createOptimizedMediaRecorder } from '../../utils/audioCompressor';
import VoiceNotePlayer from '../common/VoiceNotePlayer';

export default function DesktopAdminDashboard({
  allListings,
  pendingApprovals,
  approvedListings,
  allFilteredListings,
  profiles,
  reports,
  threads,
  reviews,
  filteredProfiles,
  zoneMerchantCounts,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedColony,
  setSelectedColony,
  selectedOfferType,
  setSelectedOfferType,
  sortBy,
  setSortBy,
  crmSearchQuery,
  setCrmSearchQuery,
  crmFilterTier,
  setCrmFilterTier,
  newMemberName,
  setNewMemberName,
  newMemberPhone,
  setNewMemberPhone,
  newMemberArea,
  setNewMemberArea,
  newMemberRole,
  setNewMemberRole,
  newBusinessName,
  setNewBusinessName,
  actionLoading,
  isRefreshing,
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
  const [isAdminEditing, setIsAdminEditing] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Inspector Form State
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
  });

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedVoiceNote, setRecordedVoiceNote] = useState(null);

  // Broadcast Form State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastRole, setBroadcastRole] = useState('public');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Selected item resolver
  const activeItem = useMemo(() => {
    return (
      allListings.find((i) => String(i.id) === String(selectedItemId)) ||
      pendingApprovals[0] ||
      approvedListings[0] ||
      null
    );
  }, [allListings, pendingApprovals, approvedListings, selectedItemId]);

  useEffect(() => {
    if (!activeItem) return;
    const changes = activeItem.pending_changes || {};
    const photos =
      changes.images ||
      changes.image_urls ||
      activeItem.images ||
      (changes.image ? [changes.image] : [activeItem.image]);
    const cleanPhotos = (photos || []).map((p) => (typeof p === 'string' ? p : p.url || p.preview)).filter(Boolean);

    setEditFormData({
      title: changes.title || activeItem.title || activeItem.name || '',
      category: changes.category || activeItem.category || 'market',
      subCategory:
        changes.subCategory ||
        changes.sub_category ||
        activeItem.subCategory ||
        activeItem.sub_category ||
        'all',
      price: changes.price || activeItem.price || '',
      original_price:
        changes.original_price ||
        changes.originalPrice ||
        activeItem.original_price ||
        activeItem.originalPrice ||
        '',
      deal_badge: changes.deal_badge || changes.dealBadge || activeItem.deal_badge || activeItem.dealBadge || '',
      deal_details:
        changes.deal_details || changes.dealDetails || activeItem.deal_details || activeItem.dealDetails || '',
      token_amount:
        changes.token_amount || changes.tokenAmount || activeItem.token_amount || activeItem.tokenAmount || '',
      doorstep_trial: Boolean(
        changes.doorstep_trial ??
          changes.doorstepTrial ??
          activeItem.doorstep_trial ??
          activeItem.doorstepTrial ??
          false
      ),
      location: changes.location || activeItem.location || selectedCity,
      lat: changes.lat !== undefined ? changes.lat : activeItem.lat,
      lng: changes.lng !== undefined ? changes.lng : activeItem.lng,
      timing: changes.timing || activeItem.timing || activeItem.activeHours || '09:00 AM - 09:00 PM',
      description: changes.description || activeItem.description || '',
      images: cleanPhotos,
      videos: changes.videos || changes.video_urls || activeItem.videos || [],
    });

    setIsAdminEditing(false);
    setActivePhotoIdx(0);
    setFeedbackText(activeItem.admin_feedback || '');
    setRecordedVoiceNote(null);
  }, [activeItem, selectedCity]);

  // Keyboard Shortcuts: 'A' (Approve), 'R' (Reject), 'J' (Next), 'K' (Prev), '/' (Search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      if (e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (activeTab === 'pending' || activeTab === 'approved' || activeTab === 'all') {
        const currentList =
          activeTab === 'pending'
            ? pendingApprovals
            : activeTab === 'approved'
            ? approvedListings
            : allFilteredListings;
        const currentIdx = currentList.findIndex((i) => String(i.id) === String(selectedItemId));

        if (e.key.toLowerCase() === 'j' || e.key === 'ArrowDown') {
          e.preventDefault();
          if (currentIdx < currentList.length - 1) setSelectedItemId(currentList[currentIdx + 1].id);
        } else if (e.key.toLowerCase() === 'k' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (currentIdx > 0) setSelectedItemId(currentList[currentIdx - 1].id);
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
  }, [activeTab, selectedItemId, activeItem, pendingApprovals, approvedListings, allFilteredListings]);

  const handleDesktopApprove = async (item) => {
    if (!item) return;
    setActionInProgressId(item.id);
    try {
      let finalChanges = item.pending_changes || {};
      if (isAdminEditing) {
        finalChanges = {
          ...finalChanges,
          title: editFormData.title.trim(),
          price: editFormData.price.trim(),
          original_price: editFormData.original_price ? editFormData.original_price.trim() : null,
          deal_badge: editFormData.deal_badge ? editFormData.deal_badge.trim() : null,
          deal_details: editFormData.deal_details ? editFormData.deal_details.trim() : null,
          description: editFormData.description.trim(),
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

      const remaining = pendingApprovals.filter((p) => p.id !== item.id);
      if (remaining.length > 0) setSelectedItemId(remaining[0].id);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDesktopReject = async (item) => {
    if (!item) return;
    setActionInProgressId(item.id);
    try {
      const reason = feedbackText.trim() || 'Listing could not be approved based on Alwar guidelines.';
      await rejectListingChanges(item.id, reason, sanitizePhone(item.phone));
      showNotice(`Rejected "${item.title}"`);

      const remaining = pendingApprovals.filter((p) => p.id !== item.id);
      if (remaining.length > 0) setSelectedItemId(remaining[0].id);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleBatchApproveAll = async () => {
    if (pendingApprovals.length === 0) return;
    if (!window.confirm(`⚡ BATCH APPROVE: Publish all ${pendingApprovals.length} pending listing(s)?`)) return;

    setIsBatchProcessing(true);
    let count = 0;
    for (const item of pendingApprovals) {
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
      showNotice('⚠️ Please provide title and message.');
      return;
    }
    setIsSendingBroadcast(true);
    try {
      await saveNotificationToDB({
        tag: 'ALWAR_ALERT',
        title: broadcastTitle.trim(),
        message: broadcastMsg.trim(),
        recipient_role: broadcastRole,
        recipient_phone: null,
        metadata: { broadcastBy: 'Master Admin Desktop Studio', timestamp: new Date().toISOString() },
      });
      showNotice(`📢 Broadcast sent to ${broadcastRole.toUpperCase()} members across ${selectedCity}!`);
      setBroadcastTitle('');
      setBroadcastMsg('');
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
      alert('Microphone access denied.');
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
      } finally {
        if (mr.stream) mr.stream.getTracks().forEach((t) => t.stop());
        setIsRecordingVoice(false);
      }
    };
    mr.stop();
  };

  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden antialiased">
      {/* 🌟 1. FULL-WIDTH 1080P/1920P MASTER HEADER */}
      <header className="w-full bg-slate-900/95 border-b border-slate-800 px-8 py-3.5 flex items-center justify-between shadow-2xl shrink-0 z-30">
        <div className="flex items-center space-x-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg">
            👑
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-base font-black uppercase tracking-wider text-slate-100">
                Aapke Kareeb Alwar • Master Studio
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black border border-emerald-500/40">
                ● Live Realtime
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Desktop Admin Station (Full-Resolution Workstation)
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
              placeholder="Search catalog title, merchant name, phone (+91), colony... (Press '/' to focus)"
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
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer flex items-center space-x-2 shadow-sm active:scale-95"
            title="Refresh database"
          >
            <span>{isRefreshing ? '⏳' : '🔄'}</span>
            <span>Sync Database</span>
          </button>

          <button
            type="button"
            onClick={onSwitchToMobile}
            className="px-4 py-2 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 font-bold text-xs rounded-xl border border-indigo-700 transition cursor-pointer flex items-center space-x-2 shadow-sm active:scale-95"
            title="Switch back to Phone layout"
          >
            <span>📱</span>
            <span>Mobile View</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold text-xs rounded-xl border border-rose-800 transition cursor-pointer flex items-center space-x-2 shadow-sm active:scale-95"
          >
            <span>🔒</span>
            <span>Lock Console</span>
          </button>
        </div>
      </header>

      {/* 🌟 2. FULL-SCREEN 3-PANE WORKSPACE */}
      <div className="flex-1 flex w-full h-full overflow-hidden">
        {/* PANE 1: LEFT MODULES NAVIGATION (320px) */}
        <aside className="w-80 bg-slate-900/95 border-r border-slate-800 p-5 flex flex-col justify-between shrink-0 h-full">
          <div className="space-y-2">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest px-3 block mb-2.5">
              Workspace Modules
            </span>

            {[
              { id: 'pending', label: 'Listing Approvals', icon: '⚡', count: pendingApprovals.length, badgeColor: 'bg-amber-400 text-slate-950 font-black' },
              { id: 'approved', label: 'Live Catalog Feed', icon: '🟢', count: approvedListings.length, badgeColor: 'bg-emerald-500 text-slate-950 font-black' },
              { id: 'crm', label: 'Member CRM & WhatsApp', icon: '👥', count: profiles.length, badgeColor: 'bg-purple-500 text-white font-bold' },
              { id: 'reports', label: 'Dispute Reports', icon: '🚩', count: reports.length, badgeColor: 'bg-rose-500 text-white font-bold' },
              { id: 'interactions', label: 'Inquiries & Reviews', icon: '💬', count: threads.length, badgeColor: 'bg-cyan-500 text-slate-950 font-bold' },
              { id: 'broadcast', label: 'Broadcast & Coverage', icon: '📢' },
              { id: 'all', label: 'Master Registry', icon: '📦', count: allFilteredListings.length, badgeColor: 'bg-slate-700 text-white font-bold' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-amber-400 text-slate-950 font-black shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
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

          {/* Large Keyboard Shortcuts Card */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs text-slate-300 shadow-inner">
            <span className="font-black text-amber-400 block uppercase tracking-wider text-[11px]">
              ⚡ Keyboard Shortcuts
            </span>
            <div className="flex justify-between items-center font-mono text-[11px]">
              <span>Approve Listing:</span>
              <kbd className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-white font-bold text-xs">A</kbd>
            </div>
            <div className="flex justify-between items-center font-mono text-[11px]">
              <span>Reject Listing:</span>
              <kbd className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-white font-bold text-xs">R</kbd>
            </div>
            <div className="flex justify-between items-center font-mono text-[11px]">
              <span>Next / Prev Item:</span>
              <kbd className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-white font-bold text-xs">J / K</kbd>
            </div>
            <div className="flex justify-between items-center font-mono text-[11px]">
              <span>Focus Search:</span>
              <kbd className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-white font-bold text-xs">/</kbd>
            </div>
          </div>
        </aside>

        {/* PANE 2 & 3: MAIN CANVAS */}
        <main className="flex-1 flex flex-col bg-slate-950 h-full overflow-hidden">
          {/* ========================================================================= */}
          {/* MODULE A: 3-PANE LISTINGS MODERATION CANVAS                               */}
          {/* ========================================================================= */}
          {(activeTab === 'pending' || activeTab === 'approved' || activeTab === 'all') && (
            <div className="flex-1 flex w-full h-full overflow-hidden">
              {/* PANE 2: MIDDLE QUEUE STREAM (540px - 620px) */}
              <div className="w-[500px] 2xl:w-[580px] border-r border-slate-800 flex flex-col bg-slate-950 shrink-0 h-full">
                {/* Filters Strip */}
                <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900/60 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black uppercase tracking-wider text-slate-200">
                      {activeTab === 'pending' ? `Pending Approvals (${pendingApprovals.length})` : 'Catalog Feed'}
                    </span>
                    {activeTab === 'pending' && (
                      <button
                        type="button"
                        onClick={handleBatchApproveAll}
                        disabled={isBatchProcessing || pendingApprovals.length === 0}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs rounded-xl shadow cursor-pointer disabled:opacity-40"
                      >
                        ⚡ Batch Approve All
                      </button>
                    )}
                  </div>

                  {/* Filter Dropdowns */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none"
                    >
                      <option value="all">All Sectors</option>
                      {Object.keys(TAXONOMY_REGISTRY).map((k) => (
                        <option key={k} value={k}>{TAXONOMY_REGISTRY[k].name.split('(')[0]}</option>
                      ))}
                    </select>

                    <select
                      value={selectedColony}
                      onChange={(e) => setSelectedColony(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold focus:outline-none"
                    >
                      <option value="all">All Colonies</option>
                      {Object.keys(CITY_ZONES).map((z) => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Listing Items Queue */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {(() => {
                    const list =
                      activeTab === 'pending'
                        ? pendingApprovals
                        : activeTab === 'approved'
                        ? approvedListings
                        : allFilteredListings;
                    if (list.length === 0) {
                      return (
                        <div className="p-16 text-center text-slate-500 text-sm font-bold">
                          No listings in this queue.
                        </div>
                      );
                    }

                    return list.map((item) => {
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
                            className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-950 text-amber-300 border border-slate-800">
                                {changes.category || item.category}
                              </span>
                              {changes.deal_badge && (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                                  {changes.deal_badge}
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-black text-slate-100 truncate mt-1">
                              {changes.title || item.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              👤 {changes.sellerName || item.sellerName || item.seller_name} • 📞 +91 {changes.phone || item.phone}
                            </p>
                            <span className="text-emerald-400 font-mono font-black text-xs block mt-1">
                              {changes.price || item.price}
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* PANE 3: RIGHT FULL-WIDTH LIVE INSPECTOR */}
              <div className="flex-1 flex flex-col bg-slate-900/30 overflow-y-auto p-6 2xl:p-8 h-full space-y-5">
                {activeItem ? (
                  <div className="w-full space-y-5">
                    {/* Top Action Header Banner */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center justify-between shadow-xl">
                      <div>
                        <span className="text-xs font-black uppercase tracking-widest text-amber-400 block">
                          Inspection & Moderation Panel
                        </span>
                        <h2 className="text-lg font-black text-white mt-1">
                          {activeItem.pending_changes?.title || activeItem.title}
                        </h2>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => setIsAdminEditing((p) => !p)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
                            isAdminEditing ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-slate-800 text-amber-300 border border-amber-400/40 hover:bg-slate-700'
                          }`}
                        >
                          {isAdminEditing ? '👁️ View Original' : '✏️ Inline Edit & Fix'}
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

                    {/* Dual Canvas: Photo Canvas + Spec Details */}
                    <div className="grid grid-cols-1 2xl:grid-cols-2 gap-5">
                      {/* Media Display Screen */}
                      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3.5 shadow-lg">
                        <div className="min-h-[340px] 2xl:min-h-[420px] aspect-[16/10] w-full bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
                          {editFormData.images.length > 0 ? (
                            <img
                              src={editFormData.images[activePhotoIdx] || editFormData.images[0]}
                              alt="Inspect"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-slate-500 text-sm font-bold">No Photos Attached</span>
                          )}
                        </div>

                        {editFormData.images.length > 1 && (
                          <div className="flex space-x-2.5 overflow-x-auto pb-1 scrollbar-none">
                            {editFormData.images.map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt="Thumb"
                                onClick={() => setActivePhotoIdx(idx)}
                                className={`w-16 h-16 rounded-xl object-cover cursor-pointer border ${
                                  activePhotoIdx === idx ? 'border-amber-400 ring-4 ring-amber-400/40' : 'border-slate-800 opacity-60 hover:opacity-100'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Content & Specs */}
                      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 text-xs shadow-lg">
                        {isAdminEditing ? (
                          <div className="space-y-3 font-bold text-sm">
                            <div>
                              <label className="text-xs text-slate-400 block mb-1 font-bold">Title</label>
                              <input
                                type="text"
                                value={editFormData.title}
                                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:border-amber-400 focus:outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-slate-400 block mb-1 font-bold">Price</label>
                                <input
                                  type="text"
                                  value={editFormData.price}
                                  onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-emerald-400 text-xs font-black focus:border-amber-400 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-400 block mb-1 font-bold">Original Price</label>
                                <input
                                  type="text"
                                  value={editFormData.original_price}
                                  onChange={(e) => setEditFormData({ ...editFormData, original_price: e.target.value })}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-400 text-xs focus:border-amber-400 focus:outline-none"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-slate-400 block mb-1 font-bold">Description</label>
                              <textarea
                                rows={4}
                                value={editFormData.description}
                                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:border-amber-400 focus:outline-none"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3.5">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                              <span className="text-2xl font-black text-emerald-400">{editFormData.price}</span>
                              {editFormData.deal_badge && (
                                <span className="px-3 py-1 bg-amber-400 text-slate-950 font-black rounded-xl text-xs">
                                  {editFormData.deal_badge}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-200 leading-relaxed text-xs whitespace-pre-line">
                              {editFormData.description}
                            </p>
                            <div className="text-xs text-slate-300 space-y-1.5 pt-3 border-t border-slate-800">
                              <p>📍 <strong>Locality:</strong> {editFormData.location} (Lat: {editFormData.lat}, Lng: {editFormData.lng})</p>
                              <p>⏰ <strong>Timings:</strong> {editFormData.timing}</p>
                              <p>👤 <strong>Seller:</strong> {activeItem.sellerName} (+91 {activeItem.phone})</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Direct Voice Feedback Note */}
                    <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 space-y-3 shadow-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-300">🎙️ Direct Review Feedback to Merchant:</span>
                        {isRecordingVoice ? (
                          <div className="flex items-center space-x-2.5">
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

                      <div className="flex space-x-2.5">
                        <input
                          type="text"
                          placeholder="Type specific correction requirement to merchant..."
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            sendAdminFeedbackToSeller(activeItem.id, sanitizePhone(activeItem.phone), {
                              text: feedbackText,
                              audioUrl: recordedVoiceNote?.audioUrl,
                            });
                            showNotice('Feedback note dispatched to merchant.');
                          }}
                          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-black cursor-pointer shadow"
                        >
                          Send Feedback
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500 font-bold text-base">
                    Select a listing from the queue to start inspecting.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODULE B: DENSE MEMBER CRM SPREADSHEET & DOSSIER DRAWER                   */}
          {/* ========================================================================= */}
          {activeTab === 'crm' && (
            <div className="flex-1 flex flex-col p-6 2xl:p-8 overflow-hidden space-y-4">
              {/* 4 Stat Overview Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
                  <span className="text-[11px] font-black text-slate-400 uppercase">Total Members</span>
                  <p className="text-2xl font-black text-cyan-300 mt-1">{profiles.length}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
                  <span className="text-[11px] font-black text-slate-400 uppercase">Verified Merchants</span>
                  <p className="text-2xl font-black text-pink-400 mt-1">
                    {profiles.filter((p) => p.is_merchant || p.verification_tier === 'merchant').length}
                  </p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
                  <span className="text-[11px] font-black text-slate-400 uppercase">Residents</span>
                  <p className="text-2xl font-black text-emerald-400 mt-1">
                    {profiles.filter((p) => !p.is_merchant && p.verification_tier !== 'merchant').length}
                  </p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
                  <span className="text-[11px] font-black text-slate-400 uppercase">Pending PIN Activation</span>
                  <p className="text-2xl font-black text-amber-400 mt-1">
                    {profiles.filter((p) => !p.is_verified || p.status === 'pending_activation').length}
                  </p>
                </div>
              </div>

              {/* CRM Search & Action Toolbar */}
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
                <div className="flex items-center space-x-2.5 flex-1 max-w-lg">
                  <input
                    type="text"
                    placeholder="Filter by name, mobile, shop..."
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
                    onClick={handleBulkDispatchPins}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer"
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

              {/* Data Table with Drawer Side-by-Side */}
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
                                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                    user.is_merchant ? 'bg-pink-950 text-pink-300' : 'bg-blue-950 text-blue-300'
                                  }`}
                                >
                                  {user.is_merchant ? 'Merchant' : 'Resident'}
                                </span>
                                {user.is_banned && (
                                  <span className="ml-2 bg-rose-950 text-rose-300 px-1.5 py-0.5 rounded text-[9px] font-bold">
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

                {/* Selected Member Dossier Drawer */}
                {selectedCrmUser && (
                  <div className="w-96 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-2xl shrink-0 overflow-y-auto space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                            Member Dossier
                          </span>
                          <h3 className="text-sm font-black text-white">{selectedCrmUser.full_name}</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedCrmUser(null)}
                          className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="text-xs text-slate-300 space-y-1.5">
                        <p>📞 <strong>Phone:</strong> +91 {selectedCrmUser.phone}</p>
                        <p>📍 <strong>Locality:</strong> {selectedCrmUser.area_name || 'Alwar'}</p>
                        <p>🏷️ <strong>Role:</strong> {selectedCrmUser.is_merchant ? 'Merchant' : 'Resident'}</p>
                        {selectedCrmUser.business_name && (
                          <p>🏬 <strong>Business Name:</strong> {selectedCrmUser.business_name}</p>
                        )}
                        <p>⭐ <strong>Trust Score:</strong> {selectedCrmUser.trust_score || 100}/100</p>
                        <p>🔑 <strong>Active Activation PIN:</strong> {selectedCrmUser.admin_activation_pin || 'None'}</p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleGenerateAndDispatchPin(selectedCrmUser)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow"
                      >
                        📲 Send Activation PIN on WhatsApp
                      </button>
                      {selectedCrmUser.is_merchant && (
                        <button
                          type="button"
                          onClick={() => adminDemoteMerchant(selectedCrmUser.phone)}
                          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                        >
                          ⬇️ Demote to Resident
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => adminDeleteAllSellerListings(selectedCrmUser.phone)}
                        className="w-full py-2 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 font-bold text-xs rounded-xl"
                      >
                        🧹 Purge All Listings
                      </button>
                      <button
                        type="button"
                        onClick={() => adminDeleteUser(selectedCrmUser.id, selectedCrmUser.phone)}
                        className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow"
                      >
                        🗑️ Delete User & Records
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODULE C: BROADCAST & COLONY COVERAGE                                     */}
          {/* ========================================================================= */}
          {activeTab === 'broadcast' && (
            <div className="flex-1 p-8 overflow-y-auto grid grid-cols-1 xl:grid-cols-2 gap-8">
              <form
                onSubmit={handleSendAlwarBroadcast}
                className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 space-y-4 shadow-xl"
              >
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">
                    📢 Dispatch Alwar City Notification
                  </h3>
                  <p className="text-xs text-slate-400">Push instant notification to all registered app users</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Target Audience</label>
                  <div className="flex space-x-6">
                    {['public', 'resident', 'merchant'].map((r) => (
                      <label key={r} className="flex items-center space-x-2 text-xs font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="desktopBroadcastRole"
                          checked={broadcastRole === r}
                          onChange={() => setBroadcastRole(r)}
                          className="accent-amber-400"
                        />
                        <span className="capitalize">{r}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Notification Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 🪔 Special Festival Offers Live Across Alwar!"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Notification Message *</label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Write announcement message..."
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingBroadcast}
                  className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
                >
                  {isSendingBroadcast ? 'Dispatching...' : '📢 Send Broadcast Now'}
                </button>
              </form>

              {/* Alwar Locality Coverage Grid */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">
                  📍 Colony Merchant Coverage
                </h3>
                <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                  {Object.keys(CITY_ZONES).map((z) => {
                    const count = zoneMerchantCounts[z] || 0;
                    return (
                      <div
                        key={z}
                        className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between"
                      >
                        <span className="text-xs font-bold text-slate-300">{z}</span>
                        <span
                          className={`font-mono font-bold text-xs ${
                            count > 0 ? 'text-amber-400' : 'text-slate-600'
                          }`}
                        >
                          {count} shops
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODULE D: DISPUTES & FLAGGED ITEMS                                        */}
          {/* ========================================================================= */}
          {activeTab === 'reports' && (
            <div className="flex-1 p-8 overflow-y-auto space-y-4">
              <h2 className="text-base font-black text-rose-400 uppercase">
                🚩 Community Dispute Queue ({reports.length})
              </h2>
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-5 bg-slate-900 border border-rose-500/30 rounded-3xl flex items-center justify-between shadow-xl"
                >
                  <div>
                    <span className="text-xs font-bold bg-rose-950 text-rose-300 px-2.5 py-1 rounded-md border border-rose-800">
                      Reason: {rep.reason || 'Flagged'}
                    </span>
                    <h4 className="text-sm font-black text-white mt-1.5">
                      Listing ID: {rep.listing_id} ({rep.listings?.title})
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Seller: {rep.listings?.seller_name} (+91 {rep.listings?.phone}) • Reported by: +91{' '}
                      {rep.reporter_phone}
                    </p>
                  </div>
                  <div className="flex space-x-2.5">
                    <button
                      type="button"
                      onClick={() => supabase.from('listing_reports').delete().eq('id', rep.id)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteListingFromDB(rep.listing_id)}
                      className="px-4 py-2 bg-rose-600 text-white font-black text-xs rounded-xl cursor-pointer"
                    >
                      Delete Listing
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODULE E: Q&A & REVIEWS AUDIT                                             */}
          {/* ========================================================================= */}
          {activeTab === 'interactions' && (
            <div className="flex-1 p-8 overflow-y-auto space-y-4">
              <h2 className="text-base font-black text-cyan-400 uppercase">
                💬 Live Inquiries & Reviews Audit ({threads.length})
              </h2>
              {threads.map((comm) => (
                <div key={comm.id} className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 shadow-xl">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-amber-300">👤 {comm.user_name} ({comm.user_area})</span>
                    <span className="text-slate-500">{new Date(comm.created_at).toLocaleDateString()}</span>
                  </div>
                  {comm.audio_url ? (
                    <VoiceNotePlayer audioUrl={comm.audio_url} duration={comm.audio_duration} senderName="Voice Question" />
                  ) : (
                    <p className="text-slate-200 text-xs italic">"{comm.comment_text}"</p>
                  )}
                  {comm.seller_reply && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-200">
                      👑 <strong>Seller Reply:</strong> {comm.seller_reply}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}