import React, { useState, useEffect, useMemo } from 'react';
import {
  getAllUsersForAdmin,
  markUserPinDispatched,
  adminToggleBanUser,
  adminDeleteUser,
  adminDeleteAllSellerListings,
  adminDemoteMerchant,
} from '../../services/authService';
import { supabase } from '../../services/supabaseClient';

export default function UserManagementCRM({ selectedCity = 'Alwar' }) {
  // Tabs: 'all' | 'tier1' | 'tier2' | 'tier3' | 'banned'
  const [activeTab, setActiveTab] = useState('all');
  const [usersData, setUsersData] = useState({
    tier1Users: [],
    tier2Users: [],
    tier3Merchants: [],
    bannedUsers: [],
    totalCount: 0,
    allUsers: [],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
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

  // Filter users by active tab and search query
  const displayedUsers = useMemo(() => {
    let list = [];
    if (activeTab === 'tier1') list = usersData.tier1Users;
    else if (activeTab === 'tier2') list = usersData.tier2Users;
    else if (activeTab === 'tier3') list = usersData.tier3Merchants;
    else if (activeTab === 'banned') list = usersData.bannedUsers;
    else list = usersData.allUsers;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return list;

    return list.filter(
      (u) =>
        (u.full_name || '').toLowerCase().includes(q) ||
        (u.phone || '').includes(q) ||
        (u.admin_activation_pin || '').toLowerCase().includes(q) ||
        (u.area_name || '').toLowerCase().includes(q) ||
        (u.business_name || '').toLowerCase().includes(q) ||
        (u.upi_id || '').toLowerCase().includes(q)
    );
  }, [activeTab, usersData, searchQuery]);

  // 💬 1-Tap Generate 6-Digit WhatsApp PIN
  const handleGenerateAndSendWhatsAppPin = async (user) => {
    const randomSixDigit = Math.floor(100000 + Math.random() * 900000).toString();
    await markUserPinDispatched(user.phone, randomSixDigit);

    const message = `Namaste ${user.full_name}! 🙏\n\nWelcome to Aapke Kareeb (${user.city || selectedCity})!\n\nAapka Tier 2 Verified Resident Activation PIN hai: *${randomSixDigit}*\n\nKripya Aapke Kareeb App me jakar apna profile kholiye aur yeh 6-digit PIN darj karein taaki aapka Verified Badge unlock ho sake aur aap comments & voice queries kar sakein.\n\nDhanyawaad!`;
    const whatsappUrl = `https://wa.me/91${user.phone}?text=${encodeURIComponent(message)}`;

    setNotice(`Generated PIN ${randomSixDigit} & opened WhatsApp for ${user.full_name}`);
    window.open(whatsappUrl, '_blank');
    loadUsers();
  };

  // 👑 Admin Action: Direct Tier 3 Merchant Upgrade
  const handleDirectMerchantUpgrade = async (user) => {
    if (!window.confirm(`Directly verify ${user.full_name} (${user.business_name || 'Shop'}) as a Tier 3 Merchant?`)) {
      return;
    }

    if (supabase) {
      await supabase
        .from('user_profiles')
        .update({
          is_merchant: true,
          verification_tier: 'verified_merchant',
          merchant_verified_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }

    setNotice(`Upgraded ${user.full_name} to Tier 3 Merchant`);
    loadUsers();
  };

  // 🚫 Admin Action: Ban / Block User & Mobile Number
  const handleToggleBan = async (user) => {
    const shouldBan = !user.is_banned;
    const confirmMsg = shouldBan
      ? `Are you sure you want to BLOCK & BAN +91 ${user.phone} (${user.full_name})? They will be logged out and unable to use the app.`
      : `UNBAN and restore access for +91 ${user.phone} (${user.full_name})?`;

    if (!window.confirm(confirmMsg)) return;

    await adminToggleBanUser(user.phone, shouldBan);
    setNotice(shouldBan ? `⛔ Blocked & banned +91 ${user.phone}` : `✓ Unbanned +91 ${user.phone}`);
    loadUsers();
  };

  // 🗑️ Admin Action: Permanently Delete User Profile
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`⚠️ PERMANENT DELETE: Are you sure you want to completely delete ${user.full_name} (+91 ${user.phone}) from the database? This cannot be undone.`)) {
      return;
    }

    await adminDeleteUser(user.id, user.phone);
    setNotice(`🗑️ Permanently deleted ${user.full_name} (+91 ${user.phone})`);
    loadUsers();
  };

  // 🧹 Admin Action: Delete All Listings of Seller
  const handlePurgeSellerListings = async (user) => {
    if (!window.confirm(`Delete ALL inventory listings posted by ${user.business_name || user.full_name} (+91 ${user.phone})?`)) {
      return;
    }

    await adminDeleteAllSellerListings(user.phone);
    setNotice(`🧹 Deleted all listings for +91 ${user.phone}`);
    loadUsers();
  };

  // ⬇️ Admin Action: Demote Seller to Resident
  const handleDemoteSeller = async (user) => {
    if (!window.confirm(`Demote ${user.full_name} from Merchant back to Basic Resident?`)) {
      return;
    }

    await adminDemoteMerchant(user.phone);
    setNotice(`⬇️ Demoted ${user.full_name} to Resident`);
    loadUsers();
  };

  const handleCopyText = (text, phone) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-4 text-slate-100 shadow-xl font-sans">
      
      {/* Top Header Bar & Live Registry Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-base">👑</span>
            <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">
              MASTER ADMIN CONTROL PANEL & CRM
            </span>
          </div>
          <h2 className="text-sm font-black text-slate-100 mt-0.5">
            Total Users: {usersData.totalCount} • {selectedCity}
          </h2>
        </div>

        <button
          type="button"
          onClick={loadUsers}
          disabled={isLoading}
          className="self-start sm:self-auto px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold border border-slate-700 cursor-pointer active:scale-95 transition flex items-center space-x-1"
        >
          <span>🔄</span>
          <span>{isLoading ? 'Loading...' : 'Refresh'}</span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-2.5 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-bold text-center animate-fade-in shadow-md">
          {actionNotice}
        </div>
      )}

      {/* 5-Way Mode Filter Tabs */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-5 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('all');
              setSearchQuery('');
            }}
            className={`py-1.5 rounded-xl transition cursor-pointer text-center ${
              activeTab === 'all'
                ? 'bg-slate-800 text-amber-300 font-black shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({usersData.totalCount})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('tier1');
              setSearchQuery('');
            }}
            className={`py-1.5 rounded-xl transition cursor-pointer text-center ${
              activeTab === 'tier1'
                ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tier 1 ({usersData.tier1Users.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('tier2');
              setSearchQuery('');
            }}
            className={`py-1.5 rounded-xl transition cursor-pointer text-center ${
              activeTab === 'tier2'
                ? 'bg-emerald-400 text-slate-950 font-black shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tier 2 ({usersData.tier2Users.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('tier3');
              setSearchQuery('');
            }}
            className={`py-1.5 rounded-xl transition cursor-pointer text-center ${
              activeTab === 'tier3'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sellers ({usersData.tier3Merchants.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('banned');
              setSearchQuery('');
            }}
            className={`py-1.5 rounded-xl transition cursor-pointer text-center ${
              activeTab === 'banned'
                ? 'bg-rose-500 text-white font-black shadow-xs'
                : 'text-rose-400 hover:text-rose-300'
            }`}
          >
            ⛔ Banned ({usersData.bannedUsers.length})
          </button>
        </div>

        {/* Search Filter Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by Mobile (+91), Name, Shop, Locality, or PIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-400 outline-none placeholder:text-slate-500"
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
      </div>

      {/* User Records Feed */}
      {isLoading ? (
        <div className="py-10 text-center text-xs text-slate-400 animate-pulse space-y-1">
          <p className="text-xl">⏳</p>
          <p>Loading database records from Supabase...</p>
        </div>
      ) : displayedUsers.length === 0 ? (
        <div className="py-10 text-center bg-slate-950/60 rounded-2xl border border-slate-800 text-xs text-slate-500 space-y-1">
          <p className="text-2xl">📭</p>
          <p>No records match your selection.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[520px] overflow-y-auto scrollbar-none pr-0.5">
          {displayedUsers.map((user) => {
            const isMerchant = user.is_merchant || user.verification_tier === 'verified_merchant';
            const isTier2 = user.verification_tier === 'verified_resident';
            const isBanned = user.is_banned === true;

            return (
              <div
                key={user.id || user.phone}
                className={`p-3.5 rounded-2xl border transition text-xs shadow-md space-y-2.5 ${
                  isBanned
                    ? 'bg-rose-950/30 border-rose-500/40'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* User Header & Metadata */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-black text-slate-100 text-sm truncate">
                        {user.full_name || 'Resident User'}
                      </span>

                      {/* Tier Status Badges */}
                      <span
                        className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                          isBanned
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : isMerchant
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                            : isTier2
                            ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {isBanned
                          ? '⛔ BANNED / BLOCKED'
                          : isMerchant
                          ? '🏪 Tier 3 • Merchant'
                          : isTier2
                          ? '⭐ Tier 2 • Verified'
                          : '👤 Tier 1 • Basic'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono flex-wrap">
                      <span>📱 +91 {user.phone}</span>
                      <span>📍 {user.area_name || 'Town Center'}, {user.city || selectedCity}</span>
                    </div>

                    {/* Shop details */}
                    {user.business_name && (
                      <div className="text-[11px] text-amber-300 font-semibold flex items-center space-x-2 pt-0.5">
                        <span>🏪 {user.business_name}</span>
                        {user.upi_id && <span className="font-mono text-slate-400">({user.upi_id})</span>}
                      </div>
                    )}

                    {/* 6-Digit WhatsApp PIN Badge */}
                    {user.admin_activation_pin && (
                      <div className="flex items-center space-x-2 pt-0.5">
                        <span className="text-[10px] text-slate-400 font-semibold">WhatsApp 6-Digit PIN:</span>
                        <span className="font-mono font-black text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-400/40 tracking-wider">
                          {user.admin_activation_pin}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(user.admin_activation_pin, user.phone)}
                          className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                        >
                          {copiedPhone === user.phone ? '✓ Copied!' : 'Copy'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 👑 MASTER ADMIN ACTION TOOLBAR */}
                <div className="flex items-center justify-between flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
                  
                  {/* Left: Role Upgrades & WhatsApp Actions */}
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    {!isMerchant && (
                      <button
                        type="button"
                        onClick={() => handleGenerateAndSendWhatsAppPin(user)}
                        className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] rounded-xl active:scale-95 transition cursor-pointer flex items-center space-x-1"
                        title="Dispatch 6-Digit WhatsApp PIN"
                      >
                        <span>💬</span>
                        <span>Send WhatsApp PIN</span>
                      </button>
                    )}

                    {!isMerchant && (
                      <button
                        type="button"
                        onClick={() => handleDirectMerchantUpgrade(user)}
                        className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 font-bold text-[10px] rounded-xl active:scale-95 transition cursor-pointer"
                        title="Directly upgrade to verified merchant"
                      >
                        + Make Merchant
                      </button>
                    )}

                    {isMerchant && (
                      <>
                        <button
                          type="button"
                          onClick={() => handlePurgeSellerListings(user)}
                          className="px-2.5 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-600/50 font-bold text-[10px] rounded-xl active:scale-95 transition cursor-pointer"
                          title="Purge all listings posted by this seller"
                        >
                          🧹 Purge Listings
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDemoteSeller(user)}
                          className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] rounded-xl active:scale-95 transition cursor-pointer"
                          title="Demote back to basic resident"
                        >
                          ⬇️ Demote
                        </button>
                      </>
                    )}
                  </div>

                  {/* Right: Ban/Block & Permanent Delete Controls */}
                  <div className="flex items-center space-x-1.5">
                    {/* Ban / Unban Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleBan(user)}
                      className={`px-2.5 py-1.5 font-black text-[10px] rounded-xl border transition active:scale-95 cursor-pointer flex items-center space-x-1 ${
                        isBanned
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                      }`}
                      title={isBanned ? 'Unblock user' : 'Block & ban phone number'}
                    >
                      <span>{isBanned ? '✓ Unban' : '⛔ Ban / Block'}</span>
                    </button>

                    {/* Permanent Delete User */}
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(user)}
                      className="px-2 py-1.5 bg-slate-900 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 border border-slate-800 hover:border-rose-700 font-bold text-[10px] rounded-xl transition cursor-pointer active:scale-95"
                      title="Permanently delete user profile"
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