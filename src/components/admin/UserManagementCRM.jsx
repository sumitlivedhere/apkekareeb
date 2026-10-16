import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getAllUsersForAdmin,
  markUserPinDispatched,
  adminToggleBanUser,
  adminDeleteUser,
  adminDeleteAllSellerListings,
  adminDemoteMerchant,
  sanitizePhone as authSanitizePhone,
} from '../../services/authService';
import { supabase } from '../../services/supabaseClient';
import { hyperlocalStore } from '../../store/hyperlocalStore';
import { CITY_ZONES } from '../../data/cityZones';

const sanitizePhone = (phone) => (phone ? String(phone).replace(/\D/g, '').slice(-10) : '');

const isValidUuid = (id) =>
  Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id).trim()));

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

  const setNotice = (msg) => {
    setActionNotice(msg);
    if (msg) {
      setTimeout(() => setActionNotice(''), 4500);
    }
  };

  // ── 1. Fetch & Categorize Users from Supabase ─────────────────
  const loadUsers = useCallback(async () => {
    try {
      let rawUsers = [];

      // Primary: Call authService helper
      if (typeof getAllUsersForAdmin === 'function') {
        const res = await getAllUsersForAdmin().catch(() => null);
        if (res && res.allUsers && res.allUsers.length > 0) {
          rawUsers = res.allUsers;
        }
      }

      // Resilient Direct Supabase Fallback
      if (rawUsers.length === 0 && supabase) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          rawUsers = data;
        }
      }

      // Normalize and partition into tiers
      const tier1 = [];
      const tier2 = [];
      const tier3 = [];
      const banned = [];

      rawUsers.forEach((u) => {
        const isBanned = Boolean(u.is_banned);
        const isMerchant = Boolean(
          u.role === 'merchant' ||
          u.role === 'seller' ||
          u.is_merchant ||
          u.verification_tier === 'verified_merchant' ||
          u.verification_tier === 'merchant'
        );
        const isVerifiedResident = Boolean(
          !isMerchant && (u.is_verified || u.verification_tier === 'verified_resident')
        );

        if (isBanned) {
          banned.push(u);
        } else if (isMerchant) {
          tier3.push(u);
        } else if (isVerifiedResident) {
          tier2.push(u);
        } else {
          tier1.push(u);
        }
      });

      setUsersData({
        tier1Users: tier1,
        tier2Users: tier2,
        tier3Merchants: tier3,
        bannedUsers: banned,
        totalCount: rawUsers.length,
        allUsers: rawUsers,
      });
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── 2. Real-Time Postgres Channel Subscription ────────────────
  useEffect(() => {
    loadUsers();

    if (!supabase) return;

    // Listen to real-time changes on both user_profiles and listings
    const channel = supabase
      .channel('crm-realtime-users-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles' },
        () => {
          loadUsers();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listings' },
        () => {
          loadUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadUsers]);

  // ── 3. Multi-Parameter Search, Filter & Sort Pipeline ─────────
  const displayedUsers = useMemo(() => {
    let list = usersData.allUsers || [];

    // Tab Segmentation
    if (activeTab === 'pending_pin') {
      list = list.filter(
        (u) =>
          !u.is_verified ||
          u.status === 'pending_activation' ||
          !u.admin_activation_pin ||
          u.admin_activation_pin === 'pending'
      );
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
      if (sortBy === 'trust_high') return (b.trust_score ?? 100) - (a.trust_score ?? 100);
      if (sortBy === 'trust_low') return (a.trust_score ?? 100) - (b.trust_score ?? 100);
      if (sortBy === 'name_asc') return (a.full_name || '').localeCompare(b.full_name || '');
      return 0;
    });
  }, [activeTab, usersData, searchQuery, selectedColony, sortBy]);

  // ── 4. 📲 1-Click WhatsApp PIN Dispatcher ──────────────────────
  const handleDispatchPin = async (user, roleType = 'resident') => {
    const cleanPhone = sanitizePhone(user.phone);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setNotice('⚠️ Invalid 10-digit mobile number.');
      return;
    }

    const actionKey = user.id || cleanPhone;
    setActionLoadingId(actionKey);

    const pinCode = user.admin_activation_pin && String(user.admin_activation_pin).trim() !== ''
      ? String(user.admin_activation_pin).trim()
      : Math.floor(100000 + Math.random() * 900000).toString();

    try {
      // 1. Direct Supabase update
      if (supabase) {
        let q = supabase.from('user_profiles').update({
          admin_activation_pin: pinCode,
          status: 'pin_dispatched',
          updated_at: new Date().toISOString(),
        });
        if (isValidUuid(user.id)) q = q.eq('id', user.id);
        else q = q.or(`phone.eq.${cleanPhone},phone.eq.+91${cleanPhone}`);
        await q;
      }

      // 2. Auth service synchronization
      if (typeof markUserPinDispatched === 'function') {
        await markUserPinDispatched(cleanPhone, pinCode).catch(() => null);
      }

      const isSeller =
        roleType === 'merchant' ||
        user.is_merchant ||
        user.verification_tier === 'verified_merchant' ||
        user.verification_tier === 'merchant';

      const message = encodeURIComponent(
        `Namaste ${user.full_name || 'Member'} ji! 🙏\n\n` +
        `Welcome to Aapke Kareeb (${user.city || selectedCity})!\n\n` +
        `Your 6-Digit ${isSeller ? 'Merchant (Seller)' : 'Resident'} Activation PIN is: *${pinCode}*\n\n` +
        `👉 1. Open Aapke Kareeb app.\n` +
        `👉 2. Enter this 6-digit PIN under 'Activate Account'.\n` +
        `👉 3. Set your 4-digit Security PIN to complete setup.\n\n` +
        `Dhanyawaad!`
      );

      const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${message}`;
      window.open(whatsappUrl, '_blank');
      setNotice(`✓ PIN (${pinCode}) dispatched to +91 ${cleanPhone}. Opening WhatsApp...`);
      await loadUsers();
    } catch (err) {
      console.error('Failed to dispatch PIN:', err);
      setNotice(`⚠️ Error dispatching PIN: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── 5. 🛡️ Trust Score Adjuster (+10 / -10) ──────────────────────
  const handleAdjustTrustScore = async (user, delta) => {
    const cleanPhone = sanitizePhone(user.phone);
    const currentScore = user.trust_score !== undefined && user.trust_score !== null ? Number(user.trust_score) : 100;
    const newScore = Math.max(0, Math.min(100, currentScore + delta));

    // Optimistic UI update
    setUsersData((prev) => ({
      ...prev,
      allUsers: prev.allUsers.map((u) =>
        (user.id && u.id === user.id) || sanitizePhone(u.phone) === cleanPhone
          ? { ...u, trust_score: newScore }
          : u
      ),
    }));

    if (supabase) {
      let q = supabase.from('user_profiles').update({ trust_score: newScore });
      if (isValidUuid(user.id)) q = q.eq('id', user.id);
      else q = q.or(`phone.eq.${cleanPhone},phone.eq.+91${cleanPhone}`);
      await q;
    }

    setNotice(`Updated Trust Score to ${newScore} for ${user.full_name || cleanPhone}`);
  };

  // ── 6. ⛔ Ban / Unban User ────────────────────────────────────
  const handleToggleBan = async (user) => {
    const shouldBan = !user.is_banned;
    const cleanPhone = sanitizePhone(user.phone);
    const actionWord = shouldBan ? 'Block & Ban' : 'Unban';

    if (!window.confirm(`${actionWord} +91 ${cleanPhone} (${user.full_name || 'Member'})?`)) return;

    const actionKey = user.id || cleanPhone;
    setActionLoadingId(actionKey);

    // Optimistic UI update
    setUsersData((prev) => ({
      ...prev,
      allUsers: prev.allUsers.map((u) =>
        (user.id && u.id === user.id) || sanitizePhone(u.phone) === cleanPhone
          ? { ...u, is_banned: shouldBan }
          : u
      ),
    }));

    try {
      if (supabase) {
        let q = supabase.from('user_profiles').update({
          is_banned: shouldBan,
          updated_at: new Date().toISOString(),
        });
        if (isValidUuid(user.id)) q = q.eq('id', user.id);
        else q = q.or(`phone.eq.${cleanPhone},phone.eq.+91${cleanPhone}`);
        await q;
      }

      if (typeof adminToggleBanUser === 'function') {
        await adminToggleBanUser(cleanPhone, shouldBan).catch(() => null);
      }

      setNotice(shouldBan ? `⛔ Banned +91 ${cleanPhone}` : `✓ Unbanned +91 ${cleanPhone}`);
      await loadUsers();
    } catch (err) {
      console.error('Ban action failed:', err);
      setNotice(`⚠️ Action failed: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── 7. ⬇️ Demote / ⬆️ Promote Role Toggle (Aligned with `user_profiles` schema) ──
  const handleToggleRole = async (user) => {
    const cleanPhone = sanitizePhone(user.phone);
    const isCurrentMerchant = Boolean(
      user.is_merchant ||
      user.verification_tier === 'verified_merchant' ||
      user.verification_tier === 'merchant'
    );

    const targetIsMerchant = !isCurrentMerchant;
    const targetTier = targetIsMerchant ? 'merchant' : 'resident';
    const targetVerifiedAt = targetIsMerchant ? new Date().toISOString() : null;

    const confirmMsg = isCurrentMerchant
      ? `Demote ${user.full_name || cleanPhone} to Basic Resident?`
      : `Promote ${user.full_name || cleanPhone} to Verified Merchant?`;

    if (!window.confirm(confirmMsg)) return;

    const actionKey = user.id || cleanPhone;
    setActionLoadingId(actionKey);

    const dbPatch = {
      is_merchant: targetIsMerchant,
      verification_tier: targetTier,
      merchant_verified_at: targetVerifiedAt,
      updated_at: new Date().toISOString(),
    };

    // Optimistic UI update
    setUsersData((prev) => ({
      ...prev,
      allUsers: prev.allUsers.map((u) =>
        (user.id && u.id === user.id) || sanitizePhone(u.phone) === cleanPhone
          ? { ...u, ...dbPatch }
          : u
      ),
    }));

    try {
      if (supabase) {
        let q = supabase.from('user_profiles').update(dbPatch);
        if (isValidUuid(user.id)) q = q.eq('id', user.id);
        else q = q.or(`phone.eq.${cleanPhone},phone.eq.+91${cleanPhone}`);
        const { error } = await q;
        if (error) throw error;
      }

      setNotice(
        isCurrentMerchant
          ? `⬇️ Demoted ${user.full_name || cleanPhone} to Resident`
          : `⭐ Promoted ${user.full_name || cleanPhone} to Merchant`
      );
      await loadUsers();
    } catch (err) {
      console.error('Role update failed:', err);
      setNotice(`⚠️ Role update failed: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── 8. 🧹 Purge Seller Catalog & Live Store Memory ─────────────
  const handlePurgeSellerListings = async (user) => {
    const cleanPhone = sanitizePhone(user.phone);
    const userId = user.id;

    // Identify user's listings across memory store
    const allListings = hyperlocalStore.getAllListings();
    const matchedListings = allListings.filter((l) => {
      const matchUserId = userId && (l.user_id === userId || l.userId === userId);
      const matchPhone =
        cleanPhone &&
        (sanitizePhone(l.phone) === cleanPhone || sanitizePhone(l.whatsapp) === cleanPhone);
      return matchUserId || matchPhone;
    });

    if (matchedListings.length === 0) {
      alert(`${user.full_name || cleanPhone} currently has 0 live listings posted.`);
      return;
    }

    if (
      !window.confirm(
        `⚠️ Delete all ${matchedListings.length} listing(s) posted by ${user.business_name || user.full_name || cleanPhone}? This cannot be undone.`
      )
    ) {
      return;
    }

    const actionKey = user.id || cleanPhone;
    setActionLoadingId(actionKey);

    // 1. Purge instantly from local HyperlocalStore memory (Live Feed drops immediately)
    matchedListings.forEach((l) => {
      hyperlocalStore.removeListing(l.id);
    });

    // 2. Cascade delete from Supabase
    try {
      if (supabase) {
        if (isValidUuid(userId)) {
          await supabase.from('listings').delete().eq('user_id', userId);
        }
        if (cleanPhone) {
          await supabase
            .from('listings')
            .delete()
            .or(`phone.eq.${cleanPhone},phone.eq.+91${cleanPhone},whatsapp.eq.${cleanPhone}`);
        }
      }

      if (typeof adminDeleteAllSellerListings === 'function') {
        await adminDeleteAllSellerListings(cleanPhone).catch(() => null);
      }

      setNotice(`🧹 Successfully purged ${matchedListings.length} listing(s) for +91 ${cleanPhone}`);
      await loadUsers();
    } catch (err) {
      console.error('Purge listings failed:', err);
      setNotice(`⚠️ Purge failed: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── 9. 🗑️ Guaranteed Cascading User Deletion ───────────────────
  const handleDeleteUser = async (user) => {
    const cleanPhone = sanitizePhone(user.phone);
    const userId = user.id;

    if (
      !window.confirm(
        `🚨 PERMANENT CASCADE DELETE: Permanently delete ${user.full_name || 'this member'} (+91 ${cleanPhone})?\n\nThis will remove their profile, shopping carts, notifications, reviews, and all catalog listings.`
      )
    ) {
      return;
    }

    const actionKey = user.id || cleanPhone;
    setActionLoadingId(actionKey);

    // 1. Clean from memory store
    const userListings = hyperlocalStore.getAllListings().filter((l) => {
      return (
        (userId && (l.user_id === userId || l.userId === userId)) ||
        (cleanPhone && (sanitizePhone(l.phone) === cleanPhone || sanitizePhone(l.whatsapp) === cleanPhone))
      );
    });
    userListings.forEach((l) => hyperlocalStore.removeListing(l.id));

    // 2. Cascading delete from child tables before user_profiles to satisfy foreign keys
    try {
      if (supabase) {
        if (cleanPhone) {
          await supabase.from('user_carts').delete().or(`phone.eq.${cleanPhone},phone.eq.+91${cleanPhone}`).catch(() => null);
          await supabase.from('notifications').delete().or(`recipient_phone.eq.${cleanPhone},recipient_phone.eq.+91${cleanPhone}`).catch(() => null);
          await supabase.from('listings').delete().or(`phone.eq.${cleanPhone},phone.eq.+91${cleanPhone}`).catch(() => null);
        }

        if (isValidUuid(userId)) {
          await supabase.from('notifications').delete().eq('user_id', userId).catch(() => null);
          await supabase.from('listings').delete().eq('user_id', userId).catch(() => null);
          await supabase.from('user_profiles').delete().eq('id', userId);
        } else if (cleanPhone) {
          await supabase.from('user_profiles').delete().or(`phone.eq.${cleanPhone},phone.eq.+91${cleanPhone}`);
        }
      }

      if (typeof adminDeleteUser === 'function') {
        await adminDeleteUser(userId, cleanPhone).catch(() => null);
      }

      // Optimistic removal from table
      setUsersData((prev) => ({
        ...prev,
        allUsers: prev.allUsers.filter((u) => {
          if (userId && u.id === userId) return false;
          if (cleanPhone && sanitizePhone(u.phone) === cleanPhone) return false;
          return true;
        }),
      }));

      setNotice(`🗑️ Completely deleted ${user.full_name || cleanPhone}`);
      await loadUsers();
    } catch (err) {
      console.error('Delete user failed:', err);
      setNotice(`⚠️ Delete failed: ${err.message}`);
    } finally {
      setActionLoadingId(null);
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
            Total Registered Users: {usersData.totalCount} ({selectedCity})
          </h2>
        </div>

        <button
          type="button"
          onClick={loadUsers}
          disabled={isLoading}
          className="self-start sm:self-auto px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold border border-slate-700 cursor-pointer active:scale-95 transition flex items-center space-x-1"
        >
          <span>🔄</span>
          <span>{isLoading ? 'Syncing...' : 'Refresh Registry'}</span>
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
            {
              id: 'pending_pin',
              label: `Pending PIN (${(usersData.allUsers || []).filter(
                (p) => !p.is_verified || p.status === 'pending_activation' || !p.admin_activation_pin
              ).length})`,
            },
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
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
            {Object.keys(CITY_ZONES || {}).map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
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
            const isMerchant = Boolean(
              user.is_merchant ||
              user.role === 'merchant' ||
              user.role === 'seller' ||
              user.verification_tier === 'verified_merchant' ||
              user.verification_tier === 'merchant'
            );
            const isVerifiedResident = Boolean(user.is_verified && !isMerchant);
            const isBanned = Boolean(user.is_banned);
            const currentPin = user.admin_activation_pin ? String(user.admin_activation_pin).trim() : '';
            const isProcessing = actionLoadingId === (user.id || cleanUserPhone);

            return (
              <div
                key={user.id || cleanUserPhone}
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
                      <span>
                        📍 {user.area_name || 'Town Center'}, {user.city || selectedCity}
                      </span>
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
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-black text-[9px] rounded cursor-pointer active:scale-90 transition"
                      >
                        +10
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustTrustScore(user, -10)}
                        title="Deduct trust score by 10"
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-rose-400 font-black text-[9px] rounded cursor-pointer active:scale-90 transition"
                      >
                        -10
                      </button>
                    </div>
                  </div>
                </div>

                {/* Context-Aware Action Toolbar */}
                <div className="flex items-center justify-between flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    {/* 1. Dispatch PIN */}
                    <button
                      type="button"
                      onClick={() => handleDispatchPin(user, isMerchant ? 'merchant' : 'resident')}
                      disabled={isProcessing}
                      className={`px-2.5 py-1.5 font-black text-[10px] rounded-xl active:scale-95 transition cursor-pointer flex items-center space-x-1 disabled:opacity-50 ${
                        isMerchant
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      }`}
                    >
                      <span>📲</span>
                      <span>{currentPin ? 'Resend PIN' : 'Send PIN'}</span>
                    </button>

                    {/* 2. Demote / Promote Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleRole(user)}
                      disabled={isProcessing}
                      className={`px-2.5 py-1.5 font-black text-[10px] rounded-xl border transition cursor-pointer active:scale-95 disabled:opacity-50 ${
                        isMerchant
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          : 'bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border-amber-400/40'
                      }`}
                      title={isMerchant ? 'Demote to basic resident member' : 'Promote to verified merchant'}
                    >
                      {isMerchant ? '⬇️ Demote to Resident' : '⭐ Promote to Merchant'}
                    </button>

                    {/* 3. Purge Seller Catalog */}
                    {isMerchant && (
                      <button
                        type="button"
                        onClick={() => handlePurgeSellerListings(user)}
                        disabled={isProcessing}
                        className="px-2.5 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-600/50 font-bold text-[10px] rounded-xl cursor-pointer active:scale-95 transition disabled:opacity-50"
                        title="Delete all inventory listings posted by this merchant"
                      >
                        🧹 Purge Catalog
                      </button>
                    )}
                  </div>

                  {/* 4. Danger Zone: Ban & Cascade Delete */}
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleBan(user)}
                      disabled={isProcessing}
                      className={`px-2.5 py-1.5 font-black text-[10px] rounded-xl border transition active:scale-95 cursor-pointer disabled:opacity-50 ${
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
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 border border-slate-800 font-bold text-[10px] rounded-xl transition cursor-pointer active:scale-95 disabled:opacity-50"
                      title="Permanently cascade delete this user and all their listings/interactions"
                    >
                      🗑️ Delete User
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