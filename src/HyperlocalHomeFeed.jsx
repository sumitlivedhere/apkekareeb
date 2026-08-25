import React, { useState, useEffect, useMemo } from 'react';
import TownHubView from './categories/TownHubView';
import SearchOverlay from './components/common/SearchOverlay';
import PostListingModal from './components/common/PostListingModal';
import { hyperlocalStore } from './store/hyperlocalStore';
import { isBusinessAuthorized, isAdminAuthorized } from './services/authService';

export default function HyperlocalHomeFeed({
  userLocation,
  isLocating,
  onRefreshLocation,
  onSelectCategory,
  onSelectIntent,
  onSelectItem,
  searchQuery = '',
  onSearchChange,
}) {
  const currentCity = userLocation?.city || 'Alwar';
  const displayLocality = userLocation?.display || `${userLocation?.locality || 'Nearby'}, ${currentCity}`;
  const allListings = hyperlocalStore.getAllListings();
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  // Strictly check if current session is an authorized Seller or Master Admin
  const canPostListing = useMemo(() => {
    return isBusinessAuthorized() || isAdminAuthorized();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localQuery);
    }, 100);
    return () => clearTimeout(timer);
  }, [localQuery, onSearchChange]);

  return (
    <div className="p-3.5 space-y-4 animate-fade-in text-slate-800 relative">
      <style>{`
        @keyframes subtleWiggle {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-0.8deg) scale(1.008); }
          75% { transform: rotate(0.8deg) scale(1.008); }
        }
        .animate-subtle-wiggle {
          animation: subtleWiggle 3.2s ease-in-out infinite;
        }
      `}</style>

      {/* 1. AAPKE KAREEB (GPS PINNING RADAR) & SEARCH */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 p-4 rounded-3xl text-white shadow-lg border border-slate-800 space-y-3">
        
        {/* Locality, Post Here & Live GPS Refresh */}
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center space-x-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] text-amber-400 font-black uppercase tracking-widest">
                AAPKE KAREEB • आपके करीब
              </span>
            </div>

            <h2 className="text-sm font-black text-white mt-1 truncate flex items-center space-x-1">
              <span>📍</span>
              <span className="truncate">{displayLocality}</span>
            </h2>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Post Here Button - Only rendered for authorized Sellers and Admin */}
            {canPostListing && (
              <button
                type="button"
                onClick={() => setIsPostModalOpen(true)}
                title="Create a New Listing"
                className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md active:scale-95 transition cursor-pointer flex items-center space-x-1"
              >
                <span>+</span>
                <span>Post Here</span>
              </button>
            )}

            {/* GPS Pin / Refresh Trigger */}
            <button
              type="button"
              onClick={onRefreshLocation}
              disabled={isLocating}
              title="Refresh GPS Location"
              className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-amber-300 border border-slate-700 rounded-xl text-xs font-black flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <span className={isLocating ? 'animate-spin inline-block' : ''}>
                🔄
              </span>
              <span>{isLocating ? 'Locating...' : 'GPS Pin'}</span>
            </button>
          </div>
        </div>

        {/* Global Search Input */}
        <div className="relative pt-1">
          <input
            type="text"
            placeholder="Search Plumber, 2 BHK Flat, Bolero, Doctor, Cafe..."
            value={searchQuery}
            onChange={(e) => {
              setLocalQuery(e.target.value);
              onSearchChange(e.target.value);
            }}
            className="w-full pl-9 pr-8 py-2.5 bg-slate-800/80 border border-slate-700 rounded-2xl font-bold text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-400"
          />
          <span className="absolute left-3 top-3.5 text-xs text-slate-400">🔍</span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setLocalQuery('');
                onSearchChange('');
              }}
              className="absolute right-3 top-3.5 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 🌟 Real-Time In-Memory Search Overlay */}
      {searchQuery.trim().length > 0 && (
        <SearchOverlay
          query={searchQuery}
          allListings={allListings}
          selectedCity={currentCity}
          onClose={() => {
            setLocalQuery('');
            onSearchChange('');
          }}
          onSelectIntent={(category, subCategory) => {
            setLocalQuery('');
            onSearchChange('');
            if (onSelectIntent) {
              onSelectIntent(category, subCategory);
            } else {
              onSelectCategory(category, subCategory);
            }
          }}
          onSelectItem={(item) => {
            if (onSelectItem) onSelectItem(item);
          }}
        />
      )}

      {/* 2. 🌟 PROMINENT WIGGLING "SURPRISE ME" CATEGORY */}
      <div className="relative animate-subtle-wiggle">
        <div className="absolute -inset-[2px] rounded-3xl overflow-hidden pointer-events-none">
          <div className="w-[250%] h-[250%] absolute -top-[75%] -left-[75%] bg-[conic-gradient(from_0deg,transparent_0_260deg,#fbbf24_300deg,#f59e0b_330deg,#ffffff_360deg)] animate-[spin_3.5s_linear_infinite]"></div>
        </div>

        <div className="absolute -inset-[1px] rounded-3xl bg-amber-400/25 blur-xs pointer-events-none"></div>

        <button
          type="button"
          onClick={() => onSelectCategory('surprise')}
          className="relative z-10 w-full p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 hover:from-slate-900 hover:to-indigo-900 text-white rounded-3xl font-black text-xs shadow-2xl flex items-center justify-between active:scale-[0.98] transition cursor-pointer border border-amber-400/30 group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center text-2xl font-black shadow-lg group-hover:scale-110 group-hover:rotate-12 transition">
              🎲
            </div>
            <div className="text-left">
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-amber-300 text-sm tracking-tight">
                  Surprise Me! (कुछ नया देखें)
                </span>
                <span className="bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase shadow-xs">
                  Trending
                </span>
              </div>
              <span className="block text-[11px] text-slate-300 font-medium leading-tight mt-1">
                Explore handpicked deals & verified services nearby
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 text-[11px] font-black px-3 py-2 rounded-2xl shadow-md shrink-0 group-hover:translate-x-1 transition">
            <span>Open</span>
            <span>➔</span>
          </div>
        </button>
      </div>

      {/* 3. 17 TOP-LEVEL CATEGORIES DIRECTORY */}
      <TownHubView
        selectedCity={currentCity}
        onSelectCategory={onSelectCategory}
      />

      {/* Post Listing Modal - Accessible only to authorized Sellers or Admin */}
      {isPostModalOpen && canPostListing && (
        <PostListingModal
          selectedCity={currentCity}
          onClose={() => setIsPostModalOpen(false)}
        />
      )}
    </div>
  );
}