import React, { useState, useEffect, useMemo } from 'react';
import { getAllUsersForAdmin, markUserPinDispatched } from '../../services/authService';
import { supabase } from '../../services/supabaseClient';

export default function UserManagementCRM({ selectedCity = 'Alwar' }) {
  // Tabs: 'tier1' (Basic Residents) | 'tier2' (Verified Residents) | 'tier3' (Merchants)
  const [activeTab, setActiveTab] = useState('tier1');
  const [usersData, setUsersData] = useState({
    tier1Users: [],
    tier2Users: [],
    tier3Merchants: [],
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
      setTimeout(() => setActionNotice(''), 3500);
    }
  };

  // Filter users by active tab and search query
  const displayedUsers = useMemo(() => {
    let list = [];
    if (activeTab === 'tier1') list = usersData.tier1Users;
    else if (activeTab === 'tier2') list = usersData.tier2Users;
    else if (activeTab === 'tier3') list = usersData.tier3Merchants;
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

  // 💬 1-Tap Generate 6-Digit WhatsApp PIN & Open WhatsApp
  const handleGenerateAndSendWhatsAppPin = async (user) => {
    const randomSixDigit = Math.floor(100000 + Math.random() * 900000).toString();

    // Persist activation PIN to Supabase
    await markUserPinDispatched(user.phone, randomSixDigit);

    const message = `Namaste ${user.full_name}! 🙏\n\nWelcome to Aapke Kareeb (${user.city || selectedCity})!\n\nAapka Tier 2 Verified Resident Activation PIN hai: *${randomSixDigit}*\n\nKripya Aapke Kareeb App me jakar apna profile kholiye aur yeh 6-digit PIN darj karein taaki aapka Verified Badge unlock ho sake aur aap comments & voice queries kar sakein.\n\nDhanyawaad!`;
    const whatsappUrl = `https://wa.me/91${user.phone}?text=${encodeURIComponent(message)}`;

    setNotice(`Generated PIN ${randomSixDigit} & opened WhatsApp for ${user.full_name}`);
    window.open(whatsappUrl, '_blank');
    loadUsers();
  };

  // 👑 Admin Override: Direct Merchant Upgrade
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

  const handleCopyText = (text, phone) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-4 text-slate-100 shadow-xl font-sans">
      
      {/* Header Bar & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-base">👥</span>
            <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">
              3-TIER USER ONBOARDING & ACTIVATION CRM
            </span>
          </div>
          <h2 className="text-sm font-black text-slate-100 mt-0.5">
            Aapke Kareeb Resident & Merchant Registry ({selectedCity})
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
        <div className="p-2 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold text-center animate-fade-in">
          ✓ {actionNotice}
        </div>
      )}

      {/* 3-Tier Tabs Switcher */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
          
          {/* Tab 1: Tier 1 Basic Residents */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('tier1');
              setSearchQuery('');
            }}
            className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 ${
              activeTab === 'tier1'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>👤 Tier 1</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono ${
                activeTab === 'tier1' ? 'bg-slate-950 text-amber-300' : 'bg-slate-900 text-slate-400'
              }`}
            >
              {usersData.tier1Users.length}
            </span>
          </button>

          {/* Tab 2: Tier 2 Verified Residents */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('tier2');
              setSearchQuery('');
            }}
            className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 ${
              activeTab === 'tier2'
                ? 'bg-emerald-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>⭐ Tier 2</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono ${
                activeTab === 'tier2' ? 'bg-slate-950 text-emerald-300' : 'bg-slate-900 text-slate-400'
              }`}
            >
              {usersData.tier2Users.length}
            </span>
          </button>

          {/* Tab 3: Tier 3 Merchants */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('tier3');
              setSearchQuery('');
            }}
            className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 ${
              activeTab === 'tier3'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🏪 Tier 3</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono ${
                activeTab === 'tier3' ? 'bg-slate-950 text-amber-300' : 'bg-slate-900 text-slate-400'
              }`}
            >
              {usersData.tier3Merchants.length}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by Mobile, Name, Shop, Colony, or PIN..."
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
          <p>Loading Aapke Kareeb user registry...</p>
        </div>
      ) : displayedUsers.length === 0 ? (
        <div className="py-10 text-center bg-slate-950/60 rounded-2xl border border-slate-800 text-xs text-slate-500 space-y-1">
          <p className="text-2xl">📭</p>
          <p>No records found in this category.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[460px] overflow-y-auto scrollbar-none pr-0.5">
          {displayedUsers.map((user) => {
            const isMerchant = user.is_merchant || user.verification_tier === 'verified_merchant';
            const isTier2 = user.verification_tier === 'verified_resident';

            return (
              <div
                key={user.id || user.phone}
                className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md"
              >
                {/* User Details */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="font-black text-slate-100 text-sm truncate">
                      {user.full_name || 'Resident User'}
                    </span>
                    <span
                      className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                        isMerchant
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                          : isTier2
                          ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {isMerchant
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

                  {/* Merchant Shop / UPI Details */}
                  {user.business_name && (
                    <div className="text-[11px] text-amber-300 font-semibold flex items-center space-x-2 pt-0.5">
                      <span>🏪 {user.business_name}</span>
                      {user.upi_id && <span className="font-mono text-slate-400">({user.upi_id})</span>}
                    </div>
                  )}

                  {/* 6-Digit Admin WhatsApp PIN Badge */}
                  {user.admin_activation_pin && (
                    <div className="flex items-center space-x-2 pt-1">
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

                {/* Actions Cluster */}
                <div className="flex items-center space-x-2 shrink-0">
                  {/* Action 1: Send 6-Digit WhatsApp PIN (For Tier 1 & Tier 2) */}
                  {!isMerchant && (
                    <button
                      type="button"
                      onClick={() => handleGenerateAndSendWhatsAppPin(user)}
                      className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10.5px] rounded-xl shadow-md cursor-pointer flex items-center space-x-1.5 active:scale-95 transition"
                      title="Send 6-digit WhatsApp PIN to user"
                    >
                      <span>💬</span>
                      <span>{user.admin_activation_pin ? 'Re-send WhatsApp PIN' : 'Send 6-Digit PIN'}</span>
                    </button>
                  )}

                  {/* Action 2: Direct Tier 3 Upgrade */}
                  {!isMerchant && (
                    <button
                      type="button"
                      onClick={() => handleDirectMerchantUpgrade(user)}
                      className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/40 font-bold text-[10.5px] rounded-xl active:scale-95 transition cursor-pointer"
                      title="Directly upgrade to verified merchant"
                    >
                      + Merchant
                    </button>
                  )}

                  {isMerchant && (
                    <span className="px-2.5 py-1.5 bg-amber-500/10 border border-amber-400/30 text-amber-300 text-[10px] font-bold rounded-xl">
                      ✓ Active Seller
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}