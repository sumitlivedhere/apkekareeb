import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAllListingsSlice } from './store/hyperlocalStore';
import {
  performUnifiedSearch,
  TRENDING_SEARCH_CHIPS,
  CATEGORY_SYNONYMS,
} from './utils/searchEngine';
import {
  calculateDistanceKm,
  resolveListingCoordinates,
} from './hooks/useUserLocation';
import { CITY_ZONES } from './data/cityZones';

// 🏛️ Master 22 Local Alwar Categories Specification
export const MASTER_CATEGORIES = [
  {
    id: 'kaarigar',
    name: 'Kaarigar & Mistri',
    hindiName: 'कारीगर व मिस्त्री सेवा',
    icon: '🛠️',
    hub: 'Verified Hub',
  },
  {
    id: 'property',
    name: 'Property & Real Estate',
    hindiName: 'प्रॉपर्टी व रियल एस्टेट',
    icon: '🏢',
    hub: 'Verified Hub',
  },
  {
    id: 'transporters',
    name: 'Transporters / Loading',
    hindiName: 'ट्रांसपोर्ट व माल ढुलाई',
    icon: '🚚',
    hub: 'Verified Hub',
  },
  {
    id: 'market',
    name: 'Newly Open',
    hindiName: 'नए खुले व्यापार व स्टोर (प्रचार)',
    icon: '🎊',
    hub: 'Business Spotlight',
  },
  {
    id: 'travel',
    name: 'Fun & Travel',
    hindiName: 'घूमना-फिरना, मनोरंजन व पर्यटन',
    icon: '🎡',
    hub: 'Tourism & Fun Hub',
  },
  {
    id: 'malls',
    name: 'Malls & Showrooms',
    hindiName: 'मॉल्स व रिटेल शोरूम',
    icon: '🛍️',
    hub: 'Verified Hub',
  },
  {
    id: 'restaurants',
    name: 'Restaurants & Food',
    hindiName: 'रेस्टोरेंट व खान-पान',
    icon: '🍽️',
    hub: 'Verified Hub',
  },
  {
    id: 'medical',
    name: 'Doctors & Healthcare',
    hindiName: 'चिकित्सा व डॉक्टर सेवा',
    icon: '🏥',
    hub: 'Verified Hub',
  },
  {
    id: 'fitness',
    name: 'Gym & Fitness',
    hindiName: 'जिम व फिटनेस सेंटर',
    icon: '🏋️',
    hub: 'Verified Hub',
  },
  {
    id: 'education',
    name: 'Coaching & Schools',
    hindiName: 'कोचिंग व शिक्षण संस्थान',
    icon: '📚',
    hub: 'Verified Hub',
  },
  {
    id: 'shaadi',
    name: 'Shaadi & Events',
    hindiName: 'शादी व इवेंट्स',
    icon: '💍',
    hub: 'Verified Hub',
  },
  {
    id: 'vehicles',
    name: 'Cars & Two-Wheelers',
    hindiName: 'गाड़ी व बाइक बाज़ार',
    icon: '🚗',
    hub: 'Verified Hub',
  },
  {
    id: 'creators',
    name: 'Artists & Creators',
    hindiName: 'स्थानीय कलाकार व रचनाकार',
    icon: '🎨',
    hub: 'Verified Hub',
  },
  {
    id: 'advertising',
    name: 'Flex, Hoardings & Ads',
    hindiName: 'प्रचार व विज्ञापन',
    icon: '📢',
    hub: 'Verified Hub',
  },
  {
    id: 'construction',
    name: 'Building & Construction',
    hindiName: 'भवन निर्माण सामग्री',
    icon: '🏗️',
    hub: 'Verified Hub',
  },
  {
    id: 'recommerce',
    name: 'Purana Bazaar / 2nd Hand',
    hindiName: 'पुराना सामान खरीद-बिक्री',
    icon: '♻️',
    hub: 'Verified Hub',
  },
  {
    id: 'festival',
    name: 'Festival Offers & Melas',
    hindiName: 'त्योहार व मेला ऑफर्स',
    icon: '🪔',
    hub: 'Verified Hub',
  },
  {
    id: 'community',
    name: 'Community Drives',
    hindiName: 'सामाजिक पहल व जनसेवा',
    icon: '🤝',
    hub: 'Verified Hub',
  },
  {
    id: 'white-collar',
    name: 'Jobs & Consultants',
    hindiName: 'रोजगार व पेशेवर सलाहकार',
    icon: '💼',
    hub: 'Verified Hub',
  },
  {
    id: 'electronics',
    name: 'Electronics & Mobile',
    hindiName: 'इलेक्ट्रॉनिक्स व मोबाइल',
    icon: '📱',
    hub: 'Verified Hub',
  },
  {
    id: 'fashion',
    name: 'Clothes & Boutique',
    hindiName: 'कपड़े व फैशन बुटीक',
    icon: '👗',
    hub: 'Verified Hub',
  },
  {
    id: 'furniture',
    name: 'Furniture & Decor',
    hindiName: 'फर्नीचर व सजावट',
    icon: '🪑',
    hub: 'Verified Hub',
  },
];

const RADIUS_OPTIONS = [
  { label: 'Within 2 km', value: 2 },
  { label: 'Within 5 km', value: 5 },
  { label: 'Within 10 km', value: 10 },
  { label: 'All Alwar', value: Infinity },
];

const cleanPhoneNum = (p) => (p ? String(p).replace(/\D/g, '').slice(-10) : '');

export default function HyperlocalHomeFeed({
  userLocation,
  isLocating: parentIsLocating = false,
  onRefreshLocation,
  onSelectCategory,
  onSelectIntent,
  onSelectItem,
  onSelectListing,
  searchQuery: externalSearchQuery = '',
  onSearchChange,
  selectedCity = 'Alwar',
}) {
  const allListings = useAllListingsSlice();
  const searchInputRef = useRef(null);

  // Search States
  const [localQuery, setLocalQuery] = useState(externalSearchQuery || '');
  const [selectedSearchCategory, setSelectedSearchCategory] = useState('all');
  const [selectedSearchZone, setSelectedSearchZone] = useState('all');
  const [searchSortBy, setSearchSortBy] = useState('relevance');
  const [isListeningVoice, setIsListeningVoice] = useState(false);

  // 📡 Direct GPS Nearby Mode States (No Colony Guessing)
  const [gpsCoords, setGpsCoords] = useState(() =>
    userLocation?.lat && userLocation?.lng
      ? { lat: userLocation.lat, lng: userLocation.lng, accuracy: userLocation.accuracy }
      : null
  );
  const [isNearbyViewOpen, setIsNearbyViewOpen] = useState(false);
  const [nearbyRadiusKm, setNearbyRadiusKm] = useState(5);
  const [nearbyCategoryFilter, setNearbyCategoryFilter] = useState('all');
  const [localLocating, setLocalLocating] = useState(false);
  const [speakingCatId, setSpeakingCatId] = useState(null);

  // Sync coordinates if updated from parent hook
  useEffect(() => {
    if (userLocation?.lat && userLocation?.lng) {
      setGpsCoords({
        lat: userLocation.lat,
        lng: userLocation.lng,
        accuracy: userLocation.accuracy || null,
      });
    }
  }, [userLocation?.lat, userLocation?.lng, userLocation?.accuracy]);

  useEffect(() => {
    if (externalSearchQuery !== undefined && externalSearchQuery !== localQuery) {
      setLocalQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  // Keyboard shortcut `/` or `⌘K` focuses the home search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        if (e.key === 'Escape') {
          document.activeElement.blur();
        }
        return;
      }
      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const updateQuery = (val) => {
    setLocalQuery(val);
    if (typeof onSearchChange === 'function') {
      onSearchChange(val);
    }
  };

  // 📡 Trigger Live GPS for Nearby Discovery (Never guesses a colony name)
  const handleToggleNearbyGPS = (e) => {
    if (e) e.stopPropagation();

    // If Nearby mode is already open, toggling closes it back to categories
    if (isNearbyViewOpen && gpsCoords) {
      setIsNearbyViewOpen(false);
      return;
    }

    // If we already have fresh GPS coords, open Nearby view immediately and refresh in background
    if (gpsCoords?.lat && gpsCoords?.lng) {
      setIsNearbyViewOpen(true);
      setSearchSortBy('nearest');
    }

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLocalLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy || 0),
        };
        setGpsCoords(coords);
        setLocalLocating(false);
        setIsNearbyViewOpen(true);
        setSearchSortBy('nearest');

        if (typeof onRefreshLocation === 'function') {
          onRefreshLocation();
        }
      },
      () => {
        setLocalLocating(false);
        alert('Please allow GPS location access in your browser to see services & shops near you.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // 🎤 Bilingual Voice Search (Hindi & English Speech-to-Text)
  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice search is not supported in this browser. Please type your search.');
      searchInputRef.current?.focus();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListeningVoice(true);

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          updateQuery(transcript.trim());
        }
        setIsListeningVoice(false);
      };

      recognition.onerror = () => setIsListeningVoice(false);
      recognition.onend = () => setIsListeningVoice(false);

      recognition.start();
    } catch {
      setIsListeningVoice(false);
    }
  };

  // 🔊 Audio Pronunciation for Category Accessibility
  const handleSpeakCategory = (e, cat) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    setSpeakingCatId(cat.id);

    const textToSpeak = `${cat.hindiName || cat.name}, आपके करीब ${selectedCity}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.95;

    utterance.onend = () => setSpeakingCatId(null);
    utterance.onerror = () => setSpeakingCatId(null);

    window.speechSynthesis.speak(utterance);
  };

  const isLocating = parentIsLocating || localLocating;
  const isSearching = Boolean(localQuery && localQuery.trim().length > 0);

  // 📐 Attach live distance (`liveDistanceKm`) to any listing when GPS is active
  const getListingDistanceKm = (item) => {
    if (!gpsCoords?.lat || !gpsCoords?.lng) return null;
    const itemCoords = resolveListingCoordinates(item);
    if (!itemCoords) return null;
    return calculateDistanceKm(gpsCoords.lat, gpsCoords.lng, itemCoords.lat, itemCoords.lng);
  };

  // 📡 Compute Nearby Listings Sorted by Live GPS Distance
  const nearbyListings = useMemo(() => {
    if (!gpsCoords?.lat || !gpsCoords?.lng) return [];

    const withDist = [];
    for (const item of allListings) {
      if (!item || item.is_active === false || item.has_pending_approval) continue;

      if (nearbyCategoryFilter !== 'all') {
        if (String(item.category || '').toLowerCase() !== nearbyCategoryFilter.toLowerCase()) {
          continue;
        }
      }

      const distKm = getListingDistanceKm(item);
      if (distKm !== null && distKm <= nearbyRadiusKm) {
        withDist.push({ ...item, liveDistanceKm: distKm });
      }
    }

    return withDist.sort((a, b) => a.liveDistanceKm - b.liveDistanceKm);
  }, [allListings, gpsCoords, nearbyRadiusKm, nearbyCategoryFilter]);

  // 🔍 Run Real-Time Unified Search Engine (+ Live GPS Distance Sorting)
  const searchResults = useMemo(() => {
    if (!isSearching) {
      return { intents: [], listings: [], totalCount: 0, constraints: {} };
    }
    const base = performUnifiedSearch(allListings, localQuery, {
      categoryFilter: selectedSearchCategory,
      localityFilter: selectedSearchZone,
      sortBy: searchSortBy === 'nearest' ? 'relevance' : searchSortBy,
      limit: 60,
    });

    const enriched = base.listings.map((item) => ({
      ...item,
      liveDistanceKm: getListingDistanceKm(item),
    }));

    if (searchSortBy === 'nearest' && gpsCoords) {
      enriched.sort((a, b) => {
        const dA = a.liveDistanceKm ?? Infinity;
        const dB = b.liveDistanceKm ?? Infinity;
        return dA - dB;
      });
    }

    return {
      ...base,
      listings: enriched,
    };
  }, [allListings, localQuery, isSearching, selectedSearchCategory, selectedSearchZone, searchSortBy, gpsCoords]);

  // Distinct categories present in current search results
  const matchedCategoriesInResults = useMemo(() => {
    if (!isSearching) return [];
    const resCats = new Map();
    searchResults.listings.forEach((item) => {
      const cat = String(item.category || '').toLowerCase();
      resCats.set(cat, (resCats.get(cat) || 0) + 1);
    });
    return Array.from(resCats.entries()).map(([catId, count]) => ({
      id: catId,
      name: CATEGORY_SYNONYMS[catId]?.title || catId,
      icon: CATEGORY_SYNONYMS[catId]?.icon || '📦',
      count,
    }));
  }, [isSearching, searchResults.listings]);

  const handleOpenListingDetail = (item) => {
    if (typeof onSelectItem === 'function') {
      onSelectItem(item);
    } else if (typeof onSelectListing === 'function') {
      onSelectListing(item);
    }
  };

  const handleOpenIntent = (intent) => {
    if (intent.subCategory?.id && typeof onSelectIntent === 'function') {
      onSelectIntent(intent.categoryId, intent.subCategory.id);
    } else if (typeof onSelectCategory === 'function') {
      onSelectCategory(intent.categoryId, intent.subCategory?.id || 'all');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-5 space-y-5 select-none font-sans text-slate-100">
      
      {/* 📍 1. TOP HYPERLOCAL HEADER & LIVE SEARCH CARD (NO GUESSED COLONY) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0e1720] border border-[#1d2b38] shadow-2xl space-y-3.5">
        
        {/* City Title & Direct GPS Nearby Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-xs shadow-emerald-400 animate-pulse" />
              <span className="text-[10.5px] font-black uppercase text-amber-400 tracking-wider">
                AAPKE KAREEB • आपके करीब
              </span>
            </div>
            <div className="flex items-center space-x-1.5 pt-0.5">
              <span className="text-rose-500 text-sm">📍</span>
              <h2 className="text-sm sm:text-base font-black text-white truncate">
                {selectedCity}, Rajasthan
              </h2>
              {gpsCoords && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[9.5px] font-black">
                  📡 GPS Ready
                </span>
              )}
            </div>
          </div>

          {/* Direct Nearby Me Button (Uses raw GPS coordinates for distance sorting) */}
          <button
            type="button"
            onClick={handleToggleNearbyGPS}
            disabled={isLocating}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 cursor-pointer shadow-md active:scale-95 transition shrink-0 border ${
              isNearbyViewOpen
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 border-amber-300'
                : gpsCoords
                ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-500/50'
                : 'bg-[#142634] hover:bg-[#1a3246] border-cyan-500/40 text-cyan-300'
            }`}
          >
            <span>{isLocating ? '⏳' : '📡'}</span>
            <span>
              {isLocating
                ? 'Locating...'
                : isNearbyViewOpen
                ? 'Nearby Active ✓'
                : 'Nearby Me (आस-पास)'}
            </span>
          </button>
        </div>

        {/* 🔍 Interactive Search Input + Voice Search Button */}
        <div className="relative flex items-center w-full bg-[#080e14] border-2 border-[#223340] focus-within:border-amber-400 rounded-2xl px-3.5 py-2.5 transition shadow-inner">
          <span className="text-amber-400 text-sm mr-2.5 shrink-0">🔍</span>

          <input
            ref={searchInputRef}
            type="text"
            value={localQuery}
            onChange={(e) => {
              setSelectedSearchCategory('all');
              updateQuery(e.target.value);
            }}
            placeholder="Search Plumber, 2 BHK Flat, Sariska, Doctor, Cafe..."
            className="w-full bg-transparent text-xs sm:text-sm font-bold text-white placeholder-slate-400 focus:outline-none"
          />

          {/* Clear Search Button */}
          {isSearching && (
            <button
              type="button"
              onClick={() => {
                updateQuery('');
                setSelectedSearchCategory('all');
                setSelectedSearchZone('all');
                searchInputRef.current?.focus();
              }}
              className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-xs font-black mr-1.5 shrink-0 cursor-pointer"
              title="Clear search"
            >
              ✕
            </button>
          )}

          {/* 🎤 Voice Search Button */}
          <button
            type="button"
            onClick={handleVoiceSearch}
            title="Voice Search (बोलकर खोजें)"
            className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 transition cursor-pointer border ${
              isListeningVoice
                ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-lg'
                : 'bg-[#14232e] hover:bg-[#1c3140] text-amber-300 border-[#223340]'
            }`}
          >
            🎤
          </button>
        </div>

        {/* 🔥 Quick-Tap Trending Search Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 scrollbar-none pt-0.5">
          <span className="text-[10px] font-black uppercase text-slate-400 shrink-0 mr-1">
            Popular:
          </span>
          {TRENDING_SEARCH_CHIPS.map((chip) => {
            const isChipActive = localQuery.toLowerCase() === chip.query.toLowerCase();
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  if (isChipActive) {
                    updateQuery('');
                  } else {
                    setSelectedSearchCategory('all');
                    updateQuery(chip.query);
                  }
                }}
                className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold whitespace-nowrap transition cursor-pointer flex items-center space-x-1 shrink-0 border ${
                  isChipActive
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow'
                    : 'bg-[#111c26] hover:bg-[#172634] text-slate-300 border-[#1f303f]'
                }`}
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 🎯 2. LIVE SEARCH RESULTS PANEL (SHOWN WHEN USER TYPES OR SPEAKS)     */}
      {/* ===================================================================== */}
      {isSearching ? (
        <div className="space-y-4 animate-fade-in">
          
          {/* Search Status & Filter Bar */}
          <div className="p-3.5 rounded-2xl bg-[#0e1720] border border-[#1d2b38] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-amber-400 text-sm">⚡</span>
                <span className="text-xs font-black text-white">
                  Search Results for "{localQuery}"
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 font-mono text-[10px] font-black">
                  {searchResults.totalCount} found
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  updateQuery('');
                  setSelectedSearchCategory('all');
                  setSelectedSearchZone('all');
                }}
                className="text-[11px] font-bold text-cyan-400 hover:underline cursor-pointer"
              >
                ← Back to All Categories
              </button>
            </div>

            {/* Category Filter Pills inside Search Results */}
            {matchedCategoriesInResults.length > 1 && (
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedSearchCategory('all')}
                  className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold whitespace-nowrap cursor-pointer transition ${
                    selectedSearchCategory === 'all'
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  All Sectors ({searchResults.totalCount})
                </button>
                {matchedCategoriesInResults.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setSelectedSearchCategory(selectedSearchCategory === cat.id ? 'all' : cat.id)
                    }
                    className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold whitespace-nowrap cursor-pointer transition flex items-center space-x-1 ${
                      selectedSearchCategory === cat.id
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'bg-slate-950 text-slate-300 border border-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                    <span className="opacity-75">({cat.count})</span>
                  </button>
                ))}
              </div>
            )}

            {/* Locality & Sort Selectors */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedSearchZone}
                onChange={(e) => setSelectedSearchZone(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-200 font-bold outline-none"
              >
                <option value="all">📍 All {selectedCity} Localities</option>
                {Object.keys(CITY_ZONES || {}).map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>

              <select
                value={searchSortBy}
                onChange={(e) => setSearchSortBy(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-amber-300 font-bold outline-none"
              >
                <option value="relevance">🎯 Best Match First</option>
                {gpsCoords && <option value="nearest">📡 Nearest to My GPS</option>}
                <option value="popular">⭐ Most Popular</option>
                <option value="price_asc">₹ Price: Low to High</option>
                <option value="price_desc">₹ Price: High to Low</option>
                <option value="rating">🏆 Highest Rated</option>
              </select>
            </div>
          </div>

          {/* 🏛️ A. Smart Category & Subcategory Intent Shortcuts */}
          {searchResults.intents.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-amber-400 px-1 block">
                🏛️ Matching Categories & Hubs (सीधे श्रेणी खोलें)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {searchResults.intents.map((intent) => (
                  <div
                    key={`${intent.categoryId}_${intent.subCategory?.id || 'root'}`}
                    onClick={() => handleOpenIntent(intent)}
                    className="p-3 rounded-2xl bg-gradient-to-r from-[#13202e] to-[#0e1720] border border-amber-400/40 hover:border-amber-400 cursor-pointer flex items-center justify-between transition group shadow-md"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-xl shrink-0">
                        {intent.icon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-white group-hover:text-amber-300 truncate">
                          {intent.subCategory ? `${intent.subCategory.name}` : intent.title}
                        </h4>
                        <p className="text-[10px] text-amber-400 font-bold truncate">
                          {intent.subCategory ? `in ${intent.title}` : intent.hindi}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-[10px] shrink-0 ml-2">
                      Open ➔
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 📦 B. Matching Listings Feed */}
          <div className="space-y-2.5">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 px-1 block">
              📦 Matching Listings & Businesses ({searchResults.listings.length})
            </span>

            {searchResults.listings.length === 0 ? (
              <div className="p-10 text-center rounded-3xl bg-[#0e1720] border border-slate-800 space-y-2.5">
                <span className="text-3xl block">🔍</span>
                <h4 className="text-sm font-black text-white">
                  No Exact Listings Found for "{localQuery}"
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Try searching with a simpler keyword (e.g. "Plumber", "Flat", "Doctor", "Resort") or tap a category above.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    updateQuery('');
                    setSelectedSearchCategory('all');
                    setSelectedSearchZone('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
                >
                  Browse All 22 Categories
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.listings.map((item) => {
                  const coverImg =
                    item.image ||
                    item.image_url ||
                    (Array.isArray(item.images) && item.images[0]) ||
                    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500';
                  const phone = cleanPhoneNum(item.phone || item.whatsapp);
                  const catMeta = CATEGORY_SYNONYMS[item.category] || {
                    title: item.category,
                    icon: '📦',
                  };
                  const isPromo = Boolean(item.is_promoted || item.deal_type === 'PAID_PROMO');

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleOpenListingDetail(item)}
                      className={`p-3.5 rounded-3xl bg-[#0e1720] border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-lg hover:shadow-xl ${
                        isPromo
                          ? 'border-amber-400/60 ring-1 ring-amber-400/30'
                          : 'border-[#1b2b38] hover:border-amber-400/50'
                      }`}
                    >
                      <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                          <img
                            src={coverImg}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          {isPromo && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[8px] uppercase">
                              👑 Ad
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                            <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-amber-300 text-[9.5px] font-black uppercase">
                              {catMeta.icon} {catMeta.title}
                            </span>
                            {item.liveDistanceKm !== null && item.liveDistanceKm !== undefined && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[9.5px] font-mono font-bold">
                                📡 {item.liveDistanceKm} km away
                              </span>
                            )}
                            {item.deal_badge && (
                              <span className="px-2 py-0.5 rounded-md bg-rose-600/90 text-white text-[9px] font-black">
                                {item.deal_badge}
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-black text-white truncate">
                            {item.title || item.name}
                          </h4>

                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono font-black text-emerald-400">
                              {item.price || item.rates || 'Contact for Price'}
                            </span>
                            {item.original_price && (
                              <span className="text-[10px] font-mono text-slate-500 line-through">
                                {item.original_price}
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400 truncate">
                            🏬 {item.sellerName || item.seller_name} • 📍 {item.location || selectedCity}
                          </p>
                        </div>
                      </div>

                      {/* Direct Call & WhatsApp Buttons */}
                      <div
                        className="flex sm:flex-col items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a
                          href={`tel:+91${phone}`}
                          className="flex-1 sm:w-28 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] text-center transition"
                        >
                          📞 Call
                        </a>
                        <a
                          href={`https://wa.me/91${phone}?text=${encodeURIComponent(
                            `Namaste! I found your listing "${item.title}" on Aapke Kareeb (${selectedCity}).`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 sm:w-28 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] text-center transition"
                        >
                          💬 WhatsApp
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : isNearbyViewOpen && gpsCoords ? (
        /* ===================================================================== */
        /* 📡 3. DIRECT GPS NEARBY FEED (SORTED BY REAL-TIME DISTANCE)           */
        /* ===================================================================== */
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-3xl bg-gradient-to-br from-[#102329] via-[#0e1720] to-[#141d29] border border-emerald-500/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-300">
                  📡 Nearby Around Your GPS ({nearbyListings.length})
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsNearbyViewOpen(false)}
                className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer"
              >
                ← Back to Categories
              </button>
            </div>

            <p className="text-[11px] text-slate-300">
              Showing services, shops, and listings sorted by shortest distance from your live GPS signal.
            </p>

            {/* Radius Selector Pills + Category Filter */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                {RADIUS_OPTIONS.map((rad) => (
                  <button
                    key={rad.label}
                    type="button"
                    onClick={() => setNearbyRadiusKm(rad.value)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap cursor-pointer transition ${
                      nearbyRadiusKm === rad.value
                        ? 'bg-emerald-400 text-slate-950 font-black shadow'
                        : 'bg-slate-950 text-slate-300 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {rad.label}
                  </button>
                ))}
              </div>

              <select
                value={nearbyCategoryFilter}
                onChange={(e) => setNearbyCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-amber-300 font-bold outline-none"
              >
                <option value="all">All 22 Categories</option>
                {MASTER_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {nearbyListings.length === 0 ? (
            <div className="p-10 text-center rounded-3xl bg-[#0e1720] border border-slate-800 space-y-2.5">
              <span className="text-3xl block">📡</span>
              <h4 className="text-sm font-black text-white">
                No Listings Within {nearbyRadiusKm} km
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Expand your radius to view more listings across {selectedCity}.
              </p>
              <button
                type="button"
                onClick={() => setNearbyRadiusKm(Infinity)}
                className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
              >
                Show All Nearest in {selectedCity}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {nearbyListings.slice(0, 50).map((item) => {
                const coverImg =
                  item.image ||
                  item.image_url ||
                  (Array.isArray(item.images) && item.images[0]) ||
                  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500';
                const phone = cleanPhoneNum(item.phone || item.whatsapp);
                const catMeta = CATEGORY_SYNONYMS[item.category] || {
                  title: item.category,
                  icon: '📦',
                };

                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenListingDetail(item)}
                    className="p-3.5 rounded-3xl bg-[#0e1720] border border-[#1b2b38] hover:border-emerald-400/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-lg"
                  >
                    <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                      <img
                        src={coverImg}
                        alt={item.title}
                        className="w-20 h-20 rounded-2xl object-cover bg-slate-950 border border-slate-800 shrink-0"
                      />

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-black">
                            📡 {item.liveDistanceKm} km away
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-amber-300 text-[9.5px] font-black uppercase">
                            {catMeta.icon} {catMeta.title}
                          </span>
                        </div>

                        <h4 className="text-sm font-black text-white truncate">
                          {item.title || item.name}
                        </h4>

                        <p className="text-xs font-mono font-black text-emerald-400">
                          {item.price || item.rates || 'Contact for Price'}
                        </p>

                        <p className="text-[11px] text-slate-400 truncate">
                          🏬 {item.sellerName || item.seller_name} • 📍 {item.location || selectedCity}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex sm:flex-col items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href={`tel:+91${phone}`}
                        className="flex-1 sm:w-28 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] text-center transition"
                      >
                        📞 Call
                      </a>
                      <a
                        href={`https://wa.me/91${phone}?text=${encodeURIComponent(
                          `Namaste! I saw your nearby listing "${item.title}" on Aapke Kareeb.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 sm:w-28 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] text-center transition"
                      >
                        💬 WhatsApp
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ===================================================================== */
        /* 🏛️ 4. DEFAULT ORGANIC FEED: ALL 22 ALWAR CATEGORIES                  */
        /* ===================================================================== */
        <div className="space-y-3.5 animate-fade-in">
          <div className="flex items-center justify-between px-1 pt-1">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🏛️</span>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-100">
                ALL {selectedCity.toUpperCase()} CATEGORIES (सभी श्रेणियां)
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#14232e] border border-amber-400/40 text-amber-300 text-xs font-bold shadow-xs">
              {MASTER_CATEGORIES.length} Categories
            </span>
          </div>

          <div className="space-y-2.5">
            {MASTER_CATEGORIES.map((cat) => {
              const isSpeaking = speakingCatId === cat.id;

              return (
                <div
                  key={cat.id}
                  onClick={() => onSelectCategory && onSelectCategory(cat.id)}
                  className="p-3.5 sm:p-4 rounded-3xl bg-[#0e1720] border border-[#1b2b38] hover:border-amber-400/60 shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#14232e] border border-[#223340] group-hover:border-amber-400/40 flex items-center justify-center text-xl shrink-0 shadow-inner transition">
                      {cat.icon}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <h4 className="text-sm font-black text-white group-hover:text-amber-200 transition truncate">
                        {cat.name}
                      </h4>
                      <p className="text-xs font-bold text-amber-400 truncate">
                        {cat.hindiName}
                      </p>
                      <div className="flex items-center space-x-1 text-[10px] text-slate-400 pt-0.5">
                        <span className="text-rose-500">📍</span>
                        <span>{selectedCity} • {cat.hub}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleSpeakCategory(e, cat)}
                      title="उच्चारण सुनें"
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs transition cursor-pointer border ${
                        isSpeaking
                          ? 'bg-amber-400 text-slate-950 border-amber-300 animate-bounce shadow-md'
                          : 'bg-[#14232e] hover:bg-[#1a2d3c] text-slate-300 border-[#223340]'
                      }`}
                    >
                      {isSpeaking ? '🔊' : '🔈'}
                    </button>

                    <button
                      type="button"
                      className="w-9 h-9 rounded-2xl bg-[#14232e] group-hover:bg-amber-400 group-hover:text-slate-950 text-slate-400 border border-[#223340] group-hover:border-amber-300 flex items-center justify-center text-sm font-bold transition shadow-xs group-hover:translate-x-0.5"
                    >
                      ➔
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}