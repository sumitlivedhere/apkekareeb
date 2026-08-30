import React, { useState, useEffect, useMemo } from 'react';
import {
  getAllUsersForAdmin,
  markUserPinDispatched,
  adminToggleBanUser,
  adminDeleteUser,
  adminDeleteAllSellerListings,
  adminDemoteMerchant,
  sanitizePhone,
} from '../../services/authService';
import { supabase } from '../../services/supabaseClient';
import { CITY_ZONES } from '../../data/cityZones';

export default function UserManagementCRM({ selectedCity = 'Alwar' }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending_pin' | 'tier1' | 'tier2' | 'tier3' | 'banned'
  const [usersData, setUsersData] = useState({
    tier1Users: [],
    tier2Users: [],
    tier3Merchants: [],
    bannedUsers: [],
    totalCount: 0,
    allUsers: [],
  });

  // Search, Filter & Sorter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColony, setSelectedColony] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'trust_high' | 'trust_low' | 'name_asc'
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(null);
  const [actionNotice, setActionNotice] = useState('');

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getAllUsersForAdmin();
      setUsersData(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const setNotice = (msg) => {
    setActionNotice(msg);
    if (msg) {
      setTimeout(() => setActionNotice(''), 4000);
    }
  };

  // ── Multi-Parameter Search, Filter & Sort Pipeline ────────────
  const displayedUsers = useMemo(() => {
    let list = usersData.allUsers || [];

    // Tab Segmentation
    if (activeTab === 'pending_pin') {
      list = list.filter((u) => !u.is_verified || u.status === 'pending_activation');
    } else if (activeTab === 'tier1') {
      list = usersData.tier1Users || [];
    } else if (activeTab === 'tier2') {
      list = usersData.tier2Users || [];
    } else if (activeTab === 'tier3') {
      list = usersData.tier3Merchants || [];
    } else if (activeTab === 'banned') {
      list = usersData.bannedUsers || [];
    }

    // Colony / Locality Filter
    if (selectedColony !== 'all') {
      list = list.filter((u) => (u.area_name || '').toLowerCase() === selectedColony.toLowerCase());
    }

    // Search Query (Mobile, Name, PIN, Colony, Shop Name)
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (u) =>
          (u.full_name || '').toLowerCase().includes(q) ||
          String(u.phone || '').includes(q) ||
          String(u.admin_activation_pin || '').toLowerCase().includes(q) ||
          (u.area_name || '').toLowerCase().includes(q) ||
          (u.business_name || '').toLowerCase().includes(q)
      );
    }

    // Sorters
    return [...list].sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (sortBy === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      if (sortBy === 'trust_high') return (b.trust_score || 100) - (a.trust_score || 100);
      if (sortBy === 'trust_low') return (a.trust_score || 100) - (b.trust_score || 100);
      if (sortBy === 'name_asc') return (a.full_name || '').localeCompare(b.full_name || '');
      return 0;
    });
  }, [activeTab, usersData, searchQuery, selectedColony, sortBy]);

  // ── 📲 1-Click WhatsApp PIN Dispatcher ─────────────────────────
  const handleDispatchPin = async (user, roleType = 'resident') => {
    const cleanPhone = sanitizePhone(user.phone);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setNotice('⚠️ Invalid 10-digit mobile number.');
      return;
    }

    setActionLoadingId(user.id || user.phone);
    const pinCode = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await markUserPinDispatched(cleanPhone, pinCode);

      const isSeller = roleType === 'merchant' || user.is_merchant || user.verification_tier === 'merchant';
      const message = encodeURIComponent(
        `Namaste ${user.full_name || 'Member'} ji! 🙏\n\n` +
        `Welcome to Aapke Kareeb (${user.city || selectedCity})!\n\n` +
        `Your 6-Digit ${isSeller ? 'Merchant (Seller)' : 'Resident'} Activation PIN is: *${pinCode}*\n\n` +
        `👉 1. Open the Aapke Kareeb app.\n` +
        `👉 2. Enter this 6-digit PIN under 'Activate Account'.\n` +
        `👉 3. Set your personal 4-digit Security PIN to complete setup.\n\n` +
        `Dhanyawaad!`
      );

      const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${message}`;

      setNotice(`✓ PIN (${pinCode}) dispatched to +91 ${cleanPhone}. Opening WhatsApp...`);
      window.open(whatsappUrl, '_blank');
      await loadUsers();
    } catch (err) {
      console.error('Failed to dispatch PIN:', err);
      setNotice('⚠️ Error saving PIN in database.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── 🛡️ Trust Score Adjuster (+10 / -10) ─────────────────────────
  const handleAdjustTrustScore = async (user, delta) => {
    const cleanPhone = sanitizePhone(user.phone);
    const currentScore = user.trust_score !== undefined && user.trust_score !== null ? user.trust_score : 100;
    const newScore = Math.max(0, Math.min(100, currentScore + delta));

    if (supabase) {
      await supabase
        .from('user_profiles')
        .update({ trust_score: newScore })
        .eq('phone', cleanPhone);
    }
    setNotice(`Updated Trust Score to ${newScore} for ${user.full_name}`);
    loadUsers();
  };

  // ── ⛔ Ban / Unban User ───────────────────────────────────────
  const handleToggleBan = async (user) => {
    const shouldBan = !user.is_banned;
    const cleanPhone = sanitizePhone(user.phone);
    if (!window.confirm(shouldBan ? `Block & ban +91 ${cleanPhone} (${user.full_name})?` : `Unban +91 ${cleanPhone}?`)) return;

    setActionLoadingId(user.id || user.phone);
    const res = await adminToggleBanUser(cleanPhone, shouldBan);
    setActionLoadingId(null);

    if (res.success) {
      setNotice(shouldBan ? `⛔ Banned +91 ${cleanPhone}` : `✓ Unbanned +91 ${cleanPhone}`);
      loadUsers();
    } else {
      setNotice(`⚠️ Action failed: ${res.error}`);
    }
  };

  // ── 🗑️ Guaranteed Cascading User Deletion ───────────────────────
  const handleDeleteUser = async (user) => {
    const cleanPhone = sanitizePhone(user.phone);
    if (!window.confirm(`⚠️ PERMANENT CASCADE DELETE: Permanently delete ${user.full_name} (+91 ${cleanPhone}) and all their listings, inquiries, and reviews?`)) {
      return;
    }

    setActionLoadingId(user.id || user.phone);
    const res = await adminDeleteUser(user.id, cleanPhone);
    setActionLoadingId(null);

    if (res.success) {
      setNotice(`🗑️ Completely deleted ${user.full_name} (+91 ${cleanPhone})`);
      loadUsers();
    } else {
      setNotice(`⚠️ Delete failed: ${res.error}`);
    }
  };

  // ── 🧹 Purge Seller Catalog ───────────────────────────────────
  const handlePurgeSellerListings = async (user) => {
    const cleanPhone = sanitizePhone(user.phone);
    if (!window.confirm(`Delete ALL inventory listings posted by ${user.business_name || user.full_name} (+91 ${cleanPhone})?`)) return;

    setActionLoadingId(user.id || user.phone);
    const res = await adminDeleteAllSellerListings(cleanPhone);
    setActionLoadingId(null);

    if (res.success) {
      setNotice(`🧹 Purged all listings for +91 ${cleanPhone}`);
      loadUsers();
    } else {
      setNotice(`⚠️ Purge failed: ${res.error}`);
    }
  };

  // ── ⬇️ Demote Verified Merchant to Resident ───────────────────
  const handleDemoteSeller = async (user) => {
    const cleanPhone = sanitizePhone(user.phone);
    if (!window.confirm(`Demote ${user.full_name} (+91 ${cleanPhone}) from Verified Merchant to Basic Resident?`)) return;

    setActionLoadingId(user.id || user.phone);
    const res = await adminDemoteMerchant(cleanPhone);
    setActionLoadingId(null);

    if (res.success) {
      setNotice(`⬇️ Demoted ${user.full_name} to Resident`);
      loadUsers();
    } else {
      setNotice(`⚠️ Demotion failed: ${res.error}`);
    }
  };

  const handleCopyText = (text, phone) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-4 text-slate-100 shadow-xl font-sans select-none">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-base">👑</span>
            <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">
              UNIFIED MEMBER DIRECTORY & WHATSAPP DESK
            </span>
          </div>
          <h2 className="text-sm font-black text-slate-100 mt-0.5">
            Total Registered Users: {usersData.totalCount} • {selectedCity}
          </h2>
        </div>

        <button
          type="button"
          onClick={loadUsers}
          disabled={isLoading}
          className="self-start sm:self-auto px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold border border-slate-700 cursor-pointer active:scale-95 transition flex items-center space-x-1"
        >
          <span>🔄</span>
          <span>{isLoading ? 'Loading...' : 'Refresh Registry'}</span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-2.5 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-bold text-center animate-fade-in shadow-md">
          {actionNotice}
        </div>
      )}

      {/* Mode Filter Tabs */}
      <div className="space-y-2.5">
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none bg-slate-950 p-1 rounded-2xl border border-slate-800 text-[10px] font-bold">
          {[
            { id: 'all', label: `All (${usersData.totalCount})` },
            { id: 'pending_pin', label: `Pending PIN (${(usersData.allUsers || []).filter((p) => !p.is_verified || p.status === 'pending_activation').length})` },
            { id: 'tier1', label: `Tier 1 Basic (${(usersData.tier1Users || []).length})` },
            { id: 'tier2', label: `Verified Residents (${(usersData.tier2Users || []).length})` },
            { id: 'tier3', label: `Merchants (${(usersData.tier3Merchants || []).length})` },
            { id: 'banned', label: `⛔ Banned (${(usersData.bannedUsers || []).length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer text-center ${
                activeTab === tab.id
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search, Colony Dropdown & Sorter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="relative sm:col-span-1">
            <input
              type="text"
              placeholder="Search by Mobile, Name, PIN, Shop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-400 outline-none placeholder:text-slate-500 font-bold"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={selectedColony}
            onChange={(e) => setSelectedColony(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold focus:outline-none"
          >
            <option value="all">All Alwar Colonies</option>
            {Object.keys(CITY_ZONES).map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold focus:outline-none"
          >
            <option value="newest">Sort: Newest Joined First</option>
            <option value="oldest">Sort: Oldest Members First</option>
            <option value="trust_high">Sort: Highest Trust Score ⭐</option>
            <option value="trust_low">Sort: Lowest Trust Score ⚠️</option>
            <option value="name_asc">Sort: Name (A to Z)</option>
          </select>
        </div>
      </div>

      {/* User Records Feed */}
      {isLoading ? (
        <div className="py-10 text-center text-xs text-slate-400 animate-pulse">
          Loading users from registry...
        </div>
      ) : displayedUsers.length === 0 ? (
        <div className="py-10 text-center bg-slate-950/60 rounded-2xl border border-slate-800 text-xs text-slate-500">
          No user records match your filter criteria.
        </div>
      ) : (
        <div className="space-y-3 max-h-[580px] overflow-y-auto pr-0.5">
          {displayedUsers.map((user) => {
            const cleanUserPhone = sanitizePhone(user.phone);
            const isMerchant = Boolean(user.is_merchant || user.verification_tier === 'verified_merchant' || user.verification_tier === 'merchant');
            const isVerifiedResident = Boolean(user.is_verified && !isMerchant);
            const isBanned = Boolean(user.is_banned);
            const currentPin = user.admin_activation_pin ? String(user.admin_activation_pin).trim() : '';
            const isProcessing = actionLoadingId === (user.id || user.phone);

            return (
              <div
                key={user.id || user.phone}
                className={`p-3.5 rounded-2xl border transition text-xs shadow-md space-y-2.5 ${
                  isBanned
                    ? 'bg-rose-950/30 border-rose-500/40'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0 pr-2">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-black text-slate-100 text-sm truncate">
                        {user.full_name || 'Resident Member'}
                      </span>

                      <span
                        className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md ${
                          isBanned
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : isMerchant
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                            : isVerifiedResident
                            ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {isBanned
                          ? '⛔ BANNED'
                          : isMerchant
                          ? '🏪 Verified Merchant'
                          : isVerifiedResident
                          ? '⭐ Verified Resident'
                          : '👤 Tier 1 Basic'}
                      </span>

                      {!user.is_verified && !isBanned && (
                        <span className="text-[8px] font-black bg-amber-950 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded animate-pulse">
                          Awaiting PIN
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono flex-wrap">
                      <span className="text-cyan-300 font-bold">📱 +91 {cleanUserPhone}</span>
                      <span>📍 {user.area_name || 'Town Center'}, {user.city || selectedCity}</span>
                    </div>

                    {user.business_name && (
                      <div className="text-[11px] text-amber-300 font-semibold pt-0.5">
                        🏬 Shop: {user.business_name}
                      </div>
                    )}

                    {/* Active PIN Badge */}
                    {currentPin && (
                      <div className="flex items-center space-x-2 pt-1">
                        <span className="text-[10px] text-slate-400 font-semibold">Active WhatsApp PIN:</span>
                        <span className="font-mono font-black px-2 py-0.5 rounded-md border tracking-wider text-[11px] text-amber-300 bg-amber-950/90 border-amber-400/60">
                          {currentPin}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(currentPin, cleanUserPhone)}
                          className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                        >
                          {copiedPhone === cleanUserPhone ? '✓ Copied!' : 'Copy'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Trust Score Controls */}
                  <div className="flex flex-col items-end space-y-1 shrink-0">
                    <span className="text-[9.5px] font-black text-amber-400">
                      ⭐ Trust: {user.trust_score !== undefined ? user.trust_score : 100}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleAdjustTrustScore(user, 10)}
                        title="Increase trust score by 10"
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-black text-[9px] rounded"
                      >
                        +10
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustTrustScore(user, -10)}
                        title="Deduct trust score by 10"
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-rose-400 font-black text-[9px] rounded"
                      >
                        -10
                      </button>
                    </div>
                  </div>
                </div>

                {/* Context-Aware Action Toolbar */}
                <div className="flex items-center justify-between flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    {/* Dynamic PIN Dispatch Buttons */}
                    {isMerchant ? (
                      <button
                        type="button"
                        onClick={() => handleDispatchPin(user, 'merchant')}
                        disabled={isProcessing}
                        className="px-2.5 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-[10px] rounded-xl active:scale-95 transition cursor-pointer flex items-center space-x-1"
                      >
                        <span>📲</span>
                        <span>{currentPin ? 'Resend Merchant PIN' : 'Send Merchant PIN'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDispatchPin(user, 'resident')}
                        disabled={isProcessing}
                        className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] rounded-xl active:scale-95 transition cursor-pointer flex items-center space-x-1"
                      >
                        <span>📲</span>
                        <span>{currentPin ? 'Resend Resident PIN' : 'Send Resident PIN'}</span>
                      </button>
                    )}

                    {/* Merchant Specific Tool Buttons */}
                    {isMerchant && (
                      <>
                        <button
                          type="button"
                          onClick={() => handlePurgeSellerListings(user)}
                          disabled={isProcessing}
                          className="px-2 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-600/50 font-bold text-[10px] rounded-xl cursor-pointer"
                          title="Delete all listings posted by this merchant"
                        >
                          🧹 Purge Catalog
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDemoteSeller(user)}
                          disabled={isProcessing}
                          className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] rounded-xl cursor-pointer"
                          title="Demote to basic resident member"
                        >
                          ⬇️ Demote
                        </button>
                      </>
                    )}

                    {/* Resident Upgrade Option */}
                    {!isMerchant && (
                      <button
                        type="button"
                        onClick={() => handleDispatchPin(user, 'merchant')}
                        disabled={isProcessing}
                        className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-[10px] rounded-xl cursor-pointer"
                        title="Send Merchant verification PIN to upgrade this user"
                      >
                        ⭐ Invite as Seller
                      </button>
                    )}
                  </div>

                  {/* Danger Zone: Ban & Cascade Delete */}
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleBan(user)}
                      disabled={isProcessing}
                      className={`px-2.5 py-1.5 font-black text-[10px] rounded-xl border transition active:scale-95 cursor-pointer ${
                        isBanned
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                      }`}
                    >
                      {isBanned ? '✓ Unban' : '⛔ Ban'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(user)}
                      disabled={isProcessing}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 border border-slate-800 font-bold text-[10px] rounded-xl transition cursor-pointer"
                      title="Permanently cascade delete this user and all their listings/interactions"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}