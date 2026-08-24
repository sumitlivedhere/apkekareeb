import React, { useState, useMemo } from 'react';
import { useAllListingsSlice, hyperlocalStore } from '../../store/hyperlocalStore';
import { approveListingChanges, rejectListingChanges } from '../../services/listingService';

export default function AdminDashboard({ onBack, selectedCity = 'Alwar' }) {
  const allListings = useAllListingsSlice();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'all' | 'categories'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filter listings with pending seller edits
  const pendingApprovals = useMemo(() => {
    return allListings.filter(
      (item) => item.has_pending_approval || item.pending_changes || item.isNew
    );
  }, [allListings]);

  // Filter all listings with search and category filters
  const filteredListings = useMemo(() => {
    return allListings.filter((item) => {
      const matchesCat =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sellerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phone?.includes(searchQuery);
      return matchesCat && matchesSearch;
    });
  }, [allListings, selectedCategory, searchQuery]);

  const handleApprove = async (item) => {
    const updatedPayload = item.pending_changes
      ? { ...item, ...item.pending_changes, has_pending_approval: false, pending_changes: null }
      : { ...item, has_pending_approval: false, isNew: false, badge: '🟢 Verified Listing' };

    await approveListingChanges(item.id, updatedPayload);
    hyperlocalStore.insertListing(item.category, updatedPayload);

    hyperlocalStore.addNotification({
      tag: 'APPROVED',
      title: `Listing Approved: "${item.title}"`,
      message: `Changes for ${item.sellerName} are now live across ${selectedCity}.`,
      time: 'Just now',
    });
  };

  const handleReject = async (item) => {
    await rejectListingChanges(item.id);
    const cleanedPayload = {
      ...item,
      has_pending_approval: false,
      pending_changes: null,
    };
    hyperlocalStore.insertListing(item.category, cleanedPayload);

    hyperlocalStore.addNotification({
      tag: 'REJECTED',
      title: `Changes Rejected: "${item.title}"`,
      message: `Proposed changes by ${item.sellerName} were discarded.`,
      time: 'Just now',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 select-none">
      
      {/* Admin Top Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-lg">
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
              TownHub Content & Seller Moderation
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold border border-amber-500/30 transition cursor-pointer"
        >
          Exit Admin
        </button>
      </div>

      <div className="max-w-md mx-auto p-3.5 space-y-3.5">
        
        {/* Metric Overview Strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl text-center shadow-xs">
            <span className="block text-base font-black text-amber-400">
              {allListings.length}
            </span>
            <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider">
              Total Listings
            </span>
          </div>
          <div className="bg-slate-900 border border-amber-500/30 p-2.5 rounded-2xl text-center shadow-xs">
            <span className="block text-base font-black text-amber-300">
              {pendingApprovals.length}
            </span>
            <span className="text-[8.5px] text-amber-300/80 font-bold uppercase tracking-wider">
              Pending Reviews
            </span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl text-center shadow-xs">
            <span className="block text-base font-black text-emerald-400">
              100%
            </span>
            <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider">
              Direct Access
            </span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-2 text-center rounded-xl text-[10.5px] font-black transition cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pending Reviews ({pendingApprovals.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 text-center rounded-xl text-[10.5px] font-black transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Listings ({allListings.length})
          </button>
        </div>

        {/* 1. Pending Approvals Queue */}
        {activeTab === 'pending' && (
          <div className="space-y-3">
            {pendingApprovals.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-1.5">
                <span className="text-2xl block">✅</span>
                <h4 className="text-xs font-black text-slate-200">No Pending Approvals</h4>
                <p className="text-[10px] text-slate-400">
                  All seller updates and new submissions have been approved.
                </p>
              </div>
            ) : (
              pendingApprovals.map((item) => {
                const changes = item.pending_changes || {};
                const hasDiff = Boolean(item.pending_changes);

                return (
                  <div
                    key={item.id}
                    className="bg-slate-900 border border-amber-500/40 rounded-2xl p-3.5 space-y-3 shadow-md relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                          {hasDiff ? '✏️ PROPOSED EDIT' : '🆕 NEW LISTING'}
                        </span>
                        <h4 className="text-xs font-black text-slate-100 mt-1">
                          {changes.title || item.title}
                        </h4>
                        <p className="text-[10px] text-amber-300 font-bold">
                          👤 {changes.sellerName || item.sellerName} • 📞 {item.phone}
                        </p>
                      </div>
                      <span className="text-[9px] text-slate-400 font-semibold bg-slate-800 px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                    </div>

                    {/* Diff / Changes Box */}
                    {hasDiff ? (
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-[10px]">
                        <span className="text-[9px] font-bold text-amber-400 block mb-1">
                          Proposed Changes by Seller:
                        </span>
                        {changes.price && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Price:</span>
                            <span className="text-emerald-400 font-bold">{changes.price}</span>
                          </div>
                        )}
                        {changes.description && (
                          <div className="pt-1 text-slate-300 line-clamp-2">
                            {changes.description}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 line-clamp-2">
                        {item.description || 'No description provided.'}
                      </p>
                    )}

                    {/* Action Controls */}
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleApprove(item)}
                        className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-[10px] rounded-xl shadow-md active:scale-95 transition cursor-pointer"
                      >
                        ✓ Approve & Publish
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(item)}
                        className="px-3 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-black text-[10px] rounded-xl active:scale-95 transition cursor-pointer"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 2. All Listings Manager */}
        {activeTab === 'all' && (
          <div className="space-y-3">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search by title, seller name, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
            />

            <div className="space-y-2">
              {filteredListings.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="text-xs font-black text-slate-100 truncate">
                      {item.title}
                    </h4>
                    <p className="text-[9.5px] text-slate-400">
                      {item.sellerName} • {item.phone} • <span className="text-amber-400">{item.price}</span>
                    </p>
                  </div>
                  <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 shrink-0">
                    {item.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}