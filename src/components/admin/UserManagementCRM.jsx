import React, { useState, useEffect, useMemo } from 'react';
import {
  getAllUsersForAdmin,
  markUserPinDispatched,
  generateActivationPin,
  adminToggleBanUser,
  adminDeleteUser,
  adminDeleteAllSellerListings,
  adminDemoteMerchant,
} from '../../services/authService';

export default function UserManagementCRM({ selectedCity = 'Alwar' }) {
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
        (u.business_name || '').toLowerCase().includes(q)
    );
  }, [activeTab, usersData, searchQuery]);

  // 💬 Generate & Send User PIN (...U)
  const handleSendUserPin = async (user) => {
    const pinCode = generateActivationPin('user');
    await markUserPinDispatched(user.phone, pinCode);

    const message = `Namaste ${user.full_name}! 🙏\n\nWelcome to Aapke Kareeb (${user.city || selectedCity})!\n\nAapka Authorized Resident Activation PIN hai: *${pinCode}*\n\nKripya Aapke Kareeb App me apna profile kholiye aur yeh 6-digit PIN darj karke apna Verified Resident status unlock karein.\n\nDhanyawaad!`;
    const whatsappUrl = `https://wa.me/91${user.phone}?text=${encodeURIComponent(message)}`;

    setNotice(`Dispatched User PIN (${pinCode}) to +91 ${user.phone}`);
    window.open(whatsappUrl, '_blank');
    loadUsers();
  };

  // 🏪 Generate & Send Seller PIN (...S)
  const handleSendSellerPin = async (user) => {
    const pinCode = generateActivationPin('seller');
    await markUserPinDispatched(user.phone, pinCode);

    const message = `Namaste ${user.full_name}! 🙏\n\nAapke Kareeb (${user.city || selectedCity}) me aapko Seller / Merchant Onboarding ke liye invite kiya gaya hai!\n\nAapka Merchant Activation PIN hai: *${pinCode}*\n\n1. App me jakar yeh PIN darj karein.\n2. Verification ke baad apna man-pasand Permanent PIN set karein.\n\nIske baad aap apni dukan ke items aur offers post kar sakenge!\n\nDhanyawaad!`;
    const whatsappUrl = `https://wa.me/91${user.phone}?text=${encodeURIComponent(message)}`;

    setNotice(`Dispatched Seller PIN (${pinCode}) to +91 ${user.phone}`);
    window.open(whatsappUrl, '_blank');
    loadUsers();
  };

  const handleToggleBan = async (user) => {
    const shouldBan = !user.is_banned;
    if (!window.confirm(shouldBan ? `Block & ban +91 ${user.phone}?` : `Unban +91 ${user.phone}?`)) return;

    await adminToggleBanUser(user.phone, shouldBan);
    setNotice(shouldBan ? `⛔ Banned +91 ${user.phone}` : `✓ Unbanned +91 ${user.phone}`);
    loadUsers();
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Permanently delete ${user.full_name} (+91 ${user.phone})?`)) return;
    await adminDeleteUser(user.id, user.phone);
    setNotice(`🗑️ Deleted ${user.full_name}`);
    loadUsers();
  };

  const handlePurgeSellerListings = async (user) => {
    if (!window.confirm(`Delete ALL inventory listings posted by ${user.business_name || user.full_name}?`)) return;
    await adminDeleteAllSellerListings(user.phone);
    setNotice(`🧹 Purged all listings for +91 ${user.phone}`);
    loadUsers();
  };

  const handleDemoteSeller = async (user) => {
    if (!window.confirm(`Demote ${user.full_name} from Merchant to Resident?`)) return;
    await adminDemoteMerchant(user.phone);
    setNotice(`⬇️ Demoted ${user.full_name}`);
    loadUsers();
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
              PIN-BASED RESIDENT & MERCHANT REGISTRY
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

      {/* Mode Filter Tabs */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-5 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`py-1.5 rounded-xl transition cursor-pointer text-center ${
              activeTab === 'all' ? 'bg-slate-800 text-amber-300 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({usersData.totalCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tier1')}
            className={`py-1.5 rounded-xl transition cursor-pointer text-center ${
              activeTab === 'tier1' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tier 1 ({usersData.tier1Users.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tier2')}
            className={`py-1.5 rounded-xl transition cursor-pointer text-center ${
              activeTab === 'tier2' ? 'bg-emerald-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Verified ({usersData.tier2Users.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tier3')}
            className={`py-1.5 rounded-xl transition cursor-pointer text-center ${
              activeTab === 'tier3' ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sellers ({usersData.tier3Merchants.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('banned')}
            className={`py-1.5 rounded-xl transition cursor-pointer text-center ${
              activeTab === 'banned' ? 'bg-rose-500 text-white font-black' : 'text-rose-400 hover:text-rose-300'
            }`}
          >
            ⛔ ({usersData.bannedUsers.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by Mobile, Name, PIN, or Locality..."
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
        <div className="py-10 text-center text-xs text-slate-400 animate-pulse">
          Loading users from registry...
        </div>
      ) : displayedUsers.length === 0 ? (
        <div className="py-10 text-center bg-slate-950/60 rounded-2xl border border-slate-800 text-xs text-slate-500">
          No records match your selection.
        </div>
      ) : (
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-0.5">
          {displayedUsers.map((user) => {
            const isMerchant = user.is_merchant || user.verification_tier === 'verified_merchant';
            const isTier2 = user.verification_tier === 'verified_resident';
            const isBanned = user.is_banned === true;
            const currentPin = user.admin_activation_pin || '';

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
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-black text-slate-100 text-sm truncate">
                        {user.full_name || 'Resident User'}
                      </span>

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
                          ? '⛔ BANNED'
                          : isMerchant
                          ? '🏪 Merchant'
                          : isTier2
                          ? '⭐ Verified User'
                          : '👤 Tier 1 Resident'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono flex-wrap">
                      <span>📱 +91 {user.phone}</span>
                      <span>📍 {user.area_name || 'Town Center'}, {user.city || selectedCity}</span>
                    </div>

                    {user.business_name && (
                      <div className="text-[11px] text-amber-300 font-semibold pt-0.5">
                        🏪 {user.business_name}
                      </div>
                    )}

                    {/* Suffix-Differentiated PIN Badge */}
                    {currentPin && (
                      <div className="flex items-center space-x-2 pt-0.5">
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {currentPin.endsWith('S') ? 'Seller PIN:' : 'User PIN:'}
                        </span>
                        <span
                          className={`font-mono font-black px-2 py-0.5 rounded-md border tracking-wider text-[11px] ${
                            currentPin.endsWith('S')
                              ? 'text-amber-300 bg-amber-950/90 border-amber-400/60'
                              : 'text-emerald-300 bg-emerald-950/90 border-emerald-400/60'
                          }`}
                        >
                          {currentPin}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(currentPin, user.phone)}
                          className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                        >
                          {copiedPhone === user.phone ? '✓ Copied!' : 'Copy'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="flex items-center justify-between flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    {/* User PIN Button */}
                    <button
                      type="button"
                      onClick={() => handleSendUserPin(user)}
                      className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] rounded-xl active:scale-95 transition cursor-pointer flex items-center space-x-1"
                      title="Generate and send 6-digit Authorized User PIN ending with 'U'"
                    >
                      <span>👤</span>
                      <span>Send User PIN (...U)</span>
                    </button>

                    {/* Seller PIN Button */}
                    <button
                      type="button"
                      onClick={() => handleSendSellerPin(user)}
                      className="px-2.5 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-[10px] rounded-xl active:scale-95 transition cursor-pointer flex items-center space-x-1"
                      title="Generate and send 6-digit Seller PIN ending with 'S'"
                    >
                      <span>🏪</span>
                      <span>Send Seller PIN (...S)</span>
                    </button>

                    {isMerchant && (
                      <>
                        <button
                          type="button"
                          onClick={() => handlePurgeSellerListings(user)}
                          className="px-2 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-600/50 font-bold text-[10px] rounded-xl cursor-pointer"
                          title="Purge listings"
                        >
                          🧹 Purge
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDemoteSeller(user)}
                          className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] rounded-xl cursor-pointer"
                          title="Demote to Resident"
                        >
                          ⬇️ Demote
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleBan(user)}
                      className={`px-2.5 py-1.5 font-black text-[10px] rounded-xl border transition active:scale-95 cursor-pointer ${
                        isBanned
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {isBanned ? '✓ Unban' : '⛔ Ban'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(user)}
                      className="px-2 py-1.5 bg-slate-900 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 border border-slate-800 font-bold text-[10px] rounded-xl transition cursor-pointer"
                      title="Permanently delete user"
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