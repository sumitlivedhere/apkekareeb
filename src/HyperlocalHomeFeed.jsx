import React, { useState, useEffect, useMemo } from 'react';
import SearchOverlay from './components/common/SearchOverlay';
import PostListingModal from './components/common/PostListingModal';
import { hyperlocalStore } from './store/hyperlocalStore';
import { isBusinessAuthorized, isAdminAuthorized } from './services/authService';
import { useTheme } from './context/ThemeContext';
import { useLocationContext } from './context/LocationContext';
import { findNearestColony } from './data/cityZones';

const TOWN_CATEGORIES = [
  {
    id: 'kaarigar',
    name: 'Kaarigar & Mistri',
    hindi: 'कारीगर व मिस्त्री सेवा',
    icon: '🛠️',
    lightBg: 'bg-amber-50/90 border-amber-200 hover:border-amber-400',
    darkBg: 'bg-slate-900/90 border-slate-800 hover:border-amber-400/50',
    lightText: 'text-slate-900',
    lightHindi: 'text-amber-800 font-black',
    darkHindi: 'text-amber-400 font-bold',
  },
  {
    id: 'property',
    name: 'Property & Real Estate',
    hindi: 'प्रॉपर्टी व रियल एस्टेट',
    icon: '🏢',
    lightBg: 'bg-sky-50/90 border-sky-200 hover:border-sky-400',
    darkBg: 'bg-slate-900/90 border-slate-800 hover:border-sky-400/50',
    lightText: 'text-slate-900',
    lightHindi: 'text-sky-800 font-black',
    darkHindi: 'text-sky-400 font-bold',
  },
  {
    id: 'transporters',
    name: 'Transporters / Loading',
    hindi: 'ट्रांसपोर्ट व माल ढुलाई',
    icon: '🚚',
    lightBg: 'bg-yellow-50/90 border-yellow-200 hover:border-yellow-400',
    darkBg: 'bg-slate-900/90 border-slate-800 hover:border-yellow-400/50',
    lightText: 'text-slate-900',
    lightHindi: 'text-amber-900 font-black',
    darkHindi: 'text-yellow-400 font-bold',
  },
  {
    id: 'white-collar',
    name: 'Doctor / CA / Lawyer / Consultant',
    hindi: 'प्रोफेशनल्स व विशेषज्ञ',
    icon: '👔',
    lightBg: 'bg-indigo-50/90 border-indigo-200 hover:border-indigo-400',
    darkBg: 'bg-slate-900/90 border-slate-800 hover:border-indigo-400/50',
    lightText: 'text-slate-900',
    lightHindi: 'text-indigo-800 font-black',
    darkHindi: 'text-indigo-400 font-bold',
  },
  {
    id: 'restaurants',
    name: 'Restaurant / Cafe / Food',
    hindi: 'रेस्टोरेंट व कैफे',
    icon: '🍔',
    lightBg: 'bg-rose-50/90 border-rose-200 hover:border-rose-400',
    darkBg: 'bg-slate-900/90 border-slate-800 hover:border-rose-400/50',
    lightText: 'text-slate-900',
    lightHindi: 'text-rose-800 font-black',
    darkHindi: 'text-rose-400 font-bold',
  },
  {
    id: 'fashion',
    name: 'Flagship Showrooms & Boutiques',
    hindi: 'प्रीमियम शोरूम व बुटीक',
    icon: '💎',
    lightBg: 'bg-pink-50/90 border-pink-200 hover:border-pink-400',
    darkBg: 'bg-slate-900/90 border-slate-800 hover:border-pink-400/50',
    lightText: 'text-slate-900',
    lightHindi: 'text-pink-800 font-black',
    darkHindi: 'text-pink-400 font-bold',
  },
  {
    id: 'education',
    name: 'Education, Skills & Apprenticeship',
    hindi: 'शिक्षा, हुनर व ट्रेनी ट्रेनिंग',
    icon: '🎓',
    lightBg: 'bg-blue-50/90 border-blue-200 hover:border-blue-400',
    darkBg: 'bg-slate-900/90 border-slate-800 hover:border-blue-400/50',
    lightText: 'text-slate-900',
    lightHindi: 'text-blue-800 font-black',
    darkHindi: 'text-blue-400 font-bold',
  },
  {
    id: 'construction',
    name: 'Construction & Materials',
    hindi: 'निर्माण कार्य व सामग्री',
    icon: '🏗️',
    lightBg: 'bg-orange-50/90 border-orange-200 hover:border-orange-400',
    darkBg: 'bg-slate-900/90 border-slate-800 hover:border-orange-400/50',
    lightText: 'text-slate-900',
    lightHindi: 'text-orange-900 font-black',
    darkHindi: 'text-orange-400 font-bold',
  },
  {
    id: 'shaadi',
    name: 'Shaadi & Wedding 360°',
    hindi: 'विवाह सेवा व शादी की तैयारी',
    icon: '💍',
    lightBg: 'bg-rose-50/90 border-rose-200 hover:border-rose-400',
    darkBg: 'bg-slate-900/90 border-slate-800 hover:border-rose-400/50',
    lightText: 'text-slate-900',
    lightHindi: 'text-rose-800 font-black',
    darkHindi: 'text-rose-400 font-bold',
  },
  {
    id: 'festival',
    name: 'Festival Offers & Melas',
    hindi: 'त्योहारी ऑफर्स व मेले',
    icon: '🎪',
    lightBg: 'bg-purple-50/90 border-purple-200 hover:border-purple-400',
    darkBg: 'bg-slate-900/90 border-slate-800 hover:border-purple-400/50',
    lightText: 'text-slate-900',
    lightHindi: 'text-purple-800 font-black',
    darkHindi: 'text-purple-400 font-bold',
  },
  {
    id: 'recommerce',
    name: 'Re-Commerce / Second Hand',
    hindi: 'पुराना बाज़ार व थ्रिफ्ट',
    icon: '🛍️',
    lightBg: 'bg-emerald-50/90 border-emerald-200 hover:border-emerald-400',
    darkBg: 'bg-slate-900/90 border-slate-800 hover:border-emerald-400/50',
    lightText: 'text-slate-900',
    lightHindi: 'text-emerald-800 font-black',
    darkHindi: 'text-emerald-400 font-bold',
  },
  {
    id: 'vehicles',
    name: 'Automobiles & Vehicles',
    hindi: 'ऑटोमोबाइल व वाहन',
    icon: '🏎️',
    lightBg: 'bg-cyan-50/90 border-cyan-200 hover:border-cyan-400',
    darkBg: 'bg-slate-900/90 border-slate-800 hover:border-cyan-400/50',
    lightText: 'text-slate-900',
    lightHindi: 'text-cyan-800 font-black',
    darkHindi: 'text-cyan-400 font-bold',
  },
  {
    id: 'electronics',
    name: 'Electronics & Gadgets',
    hindi: 'इलेक्ट्रॉनिक्स व गैजेट्स',
    icon: '📱',
    lightBg: 'bg-sky-50/90 border-sky-200 hover:border-sky-400',
    darkBg: 'bg-slate-900/90 border-slate-800 hover:border-sky-400/50',
    lightText: 'text-slate-900',
    lightHindi: 'text-sky-800 font-black',
    darkHindi: 'text-sky-400 font-bold',
  },
  {
    id: 'fashion-lifestyle',
    name: 'Fashion & Lifestyle',
    hindi: 'फैशन व लाइफस्टाइल',
    icon: '✨',
    lightBg: 'bg-pink-50/90 border-pink-200 hover:border-pink-400',
    darkBg: 'bg-slate-900/90 border-slate-800 hover:border-pink-400/50',
    lightText: 'text-slate-900',
    lightHindi: 'text-pink-800 font-black',
    darkHindi: 'text-pink-400 font-bold',
  },
  {
    id: 'medical',
    name: 'Medical, Hospitals & Doctors',
    hindi: 'चिकित्सा, डॉक्टर व अस्पताल',
    icon: '🏥',
    lightBg: 'bg-teal-50/90 border-teal-200 hover:border-teal-400',
    darkBg: 'bg-slate-900/90 border-slate-800 hover:border-teal-400/50',
    lightText: 'text-slate-900',
    lightHindi: 'text-teal-800 font-black',
    darkHindi: 'text-teal-400 font-bold',
  },
  {
    id: 'furniture',
    name: 'Furniture & Decor',
    hindi: 'फर्नीचर व इंटीरियर',
    icon: '🛋️',
    lightBg: 'bg-amber-50/90 border-amber-200 hover:border-amber-400',
    darkBg: 'bg-slate-900/90 border-slate-800 hover:border-amber-400/50',
    lightText: 'text-slate-900',
    lightHindi: 'text-amber-900 font-black',
    darkHindi: 'text-amber-400 font-bold',
  },
  {
    id: 'market',
    name: 'Market & Retail',
    hindi: 'लोकल बाज़ार व डील्स',
    icon: '🛒',
    lightBg: 'bg-emerald-50/90 border-emerald-200 hover:border-emerald-400',
    darkBg: 'bg-slate-900/90 border-slate-800 hover:border-emerald-400/50',
    lightText: 'text-slate-900',
    lightHindi: 'text-emerald-800 font-black',
    darkHindi: 'text-emerald-400 font-bold',
  },
  {
    id: 'advertising',
    name: 'Advertising & Space Exchange',
    hindi: 'विज्ञापन व लोकल प्रोमो',
    icon: '📢',
    lightBg: 'bg-purple-50/90 border-purple-200 hover:border-purple-400',
    darkBg: 'bg-slate-900/90 border-slate-800 hover:border-purple-400/50',
    lightText: 'text-slate-900',
    lightHindi: 'text-purple-800 font-black',
    darkHindi: 'text-purple-400 font-bold',
  },
  {
    id: 'community',
    name: 'Community & Events',
    hindi: 'समाज, संस्थाएं व कार्यक्रम',
    icon: '🤝',
    lightBg: 'bg-blue-50/90 border-blue-200 hover:border-blue-400',
    darkBg: 'bg-slate-900/90 border-slate-800 hover:border-blue-400/50',
    lightText: 'text-slate-900',
    lightHindi: 'text-blue-800 font-black',
    darkHindi: 'text-blue-400 font-bold',
  },
  {
    id: 'fitness',
    name: 'Fitness, Gyms & Sports',
    hindi: 'फिटनेस, जिम व खेल',
    icon: '🏋️',
    lightBg: 'bg-red-50/90 border-red-200 hover:border-red-400',
    darkBg: 'bg-slate-900/90 border-slate-800 hover:border-red-400/50',
    lightText: 'text-slate-900',
    lightHindi: 'text-red-800 font-black',
    darkHindi: 'text-red-400 font-bold',
  },
  {
    id: 'creators',
    name: 'Local Creators & Artists',
    hindi: 'लोकल आर्टिस्ट व वीडियो',
    icon: '🎬',
    lightBg: 'bg-fuchsia-50/90 border-fuchsia-200 hover:border-fuchsia-400',
    darkBg: 'bg-slate-900/90 border-slate-800 hover:border-fuchsia-400/50',
    lightText: 'text-slate-900',
    lightHindi: 'text-fuchsia-800 font-black',
    darkHindi: 'text-fuchsia-400 font-bold',
  },
];

export default function HyperlocalHomeFeed({
  userLocation: propLocation,
  isLocating: propIsLocating,
  onRefreshLocation: propOnRefreshLocation,
  onSelectCategory,
  onSelectIntent,
  onSelectItem,
  searchQuery = '',
  onSearchChange,
}) {
  const { isDark } = useTheme();
  const context = useLocationContext();

  const [internalLocating, setInternalLocating] = useState(false);
  const [internalLocation, setInternalLocation] = useState(null);

  // Compute active locality
  const currentCity = internalLocation?.city || context?.location?.city || propLocation?.city || 'Alwar';
  const currentColony =
    internalLocation?.colony ||
    internalLocation?.locality ||
    context?.location?.colony ||
    context?.location?.locality ||
    propLocation?.colony ||
    propLocation?.locality ||
    'Budh Vihar';

  const displayLocality = `${currentColony}, ${currentCity}`;
  const isLocatingActive = internalLocating || context?.isLocating || propIsLocating;

  const allListings = hyperlocalStore.getAllListings();
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [speakingCatId, setSpeakingCatId] = useState(null);

  const canPostListing = useMemo(() => {
    return isBusinessAuthorized() || isAdminAuthorized();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearchChange) onSearchChange(localQuery);
    }, 100);
    return () => clearTimeout(timer);
  }, [localQuery, onSearchChange]);

  // Direct Hardware GPS Trigger
  const handleGpsPinClick = () => {
    setInternalLocating(true);

    if (typeof propOnRefreshLocation === 'function') {
      propOnRefreshLocation();
    }

    if (context && typeof context.detectLiveGPS === 'function') {
      context.detectLiveGPS();
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          const colony = findNearestColony(lat, lng);

          const resolved = {
            colony,
            locality: colony,
            city: currentCity,
            lat,
            lng,
          };

          setInternalLocation(resolved);
          try {
            localStorage.setItem('townhub_user_precise_location', JSON.stringify(resolved));
          } catch {}
          setInternalLocating(false);
        },
        (err) => {
          console.warn('GPS detection note:', err.message);
          setInternalLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    } else {
      setInternalLocating(false);
    }
  };

  const handleSpeakCategory = (e, cat) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    setSpeakingCatId(cat.id);

    const utterance = new SpeechSynthesisUtterance(`${cat.name}. ${cat.hindi}`);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.95;
    utterance.onend = () => setSpeakingCatId(null);
    utterance.onerror = () => setSpeakingCatId(null);

    window.speechSynthesis.speak(utterance);
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return TOWN_CATEGORIES;
    const q = searchQuery.toLowerCase().trim();
    return TOWN_CATEGORIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.hindi.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="p-3.5 space-y-3.5 animate-fade-in font-sans select-none pb-12">
      {/* 🌟 1. GPS PINNING RADAR & GLOBAL SEARCH CARD */}
      <section
        className={`p-4 rounded-3xl border transition-colors shadow-md ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center space-x-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-widest">
                AAPKE KAREEB • आपके करीब
              </span>
            </div>

            <h2 className="text-xs font-black text-slate-900 dark:text-slate-100 mt-1 truncate flex items-center space-x-1">
              <span>📍</span>
              <span className="truncate">{displayLocality}</span>
            </h2>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
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

            <button
              type="button"
              onClick={handleGpsPinClick}
              disabled={isLocatingActive}
              title="Refresh GPS Location"
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer active:scale-95 flex items-center space-x-1.5 shadow-xs disabled:opacity-50 ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-300'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              }`}
            >
              <span className={isLocatingActive ? 'animate-spin inline-block' : ''}>
                🔄
              </span>
              <span>{isLocatingActive ? 'Locating...' : 'GPS Pin'}</span>
            </button>
          </div>
        </div>

        {/* Global Search Input */}
        <div className="pt-3">
          <div
            className={`flex items-center rounded-2xl px-3.5 py-2.5 border transition-all ${
              isDark
                ? 'bg-slate-950 border-slate-800 focus-within:border-amber-400'
                : 'bg-slate-50 border-slate-300 focus-within:border-amber-500 focus-within:bg-white shadow-xs'
            }`}
          >
            <span className="text-slate-400 text-xs mr-2.5">🔍</span>
            <input
              type="text"
              placeholder="Search Plumber, 2 BHK Flat, Bolero, Doctor, Cafe..."
              value={searchQuery}
              onChange={(e) => {
                setLocalQuery(e.target.value);
                if (onSearchChange) onSearchChange(e.target.value);
              }}
              className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none font-semibold"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setLocalQuery('');
                  if (onSearchChange) onSearchChange('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 🌟 2. CATEGORIES HEADER STRIP */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div className="flex items-center space-x-1.5">
          <span className="text-base">🏛️</span>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300">
            All Town Categories (सभी श्रेणियां)
          </h3>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono border ${
            isDark
              ? 'bg-slate-900 text-amber-400 border-slate-800'
              : 'bg-slate-100 text-slate-700 border-slate-300'
          }`}
        >
          {filteredCategories.length} Categories
        </span>
      </div>

      {/* 🌟 3. HIGH-CONTRAST CATEGORY CARDS DIRECTORY */}
      <div className="space-y-2.5">
        {filteredCategories.map((cat) => {
          const isSpeaking = speakingCatId === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`p-3.5 rounded-3xl border transition-all duration-150 cursor-pointer active:scale-[0.98] shadow-sm flex items-center justify-between space-x-3 ${
                isDark ? cat.darkBg : cat.lightBg
              }`}
            >
              <div className="flex items-center space-x-3.5 min-w-0">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 shadow-md'
                      : 'bg-white border-slate-200/80 shadow-xs'
                  }`}
                >
                  {cat.icon}
                </div>

                <div className="min-w-0">
                  <h4 className="text-[13px] font-black leading-snug truncate text-slate-900 dark:text-slate-100">
                    {cat.name}
                  </h4>
                  <p
                    className={`text-[11px] leading-snug mt-0.5 truncate ${
                      isDark ? cat.darkHindi : cat.lightHindi
                    }`}
                  >
                    {cat.hindi}
                  </p>
                  <p className="text-[9.5px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                    📍 {currentCity} • Verified Hub
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleSpeakCategory(e, cat)}
                  className={`w-9 h-9 rounded-2xl border flex items-center justify-center text-sm transition cursor-pointer active:scale-90 shadow-xs ${
                    isSpeaking
                      ? 'bg-amber-400 text-slate-950 border-amber-500 animate-pulse'
                      : isDark
                      ? 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-300'
                      : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-amber-800'
                  }`}
                  title="बोलकर सुनें (Listen)"
                >
                  {isSpeaking ? '🔊' : '🔈'}
                </button>

                <span className="text-slate-400 dark:text-slate-500 text-xs font-black">
                  ➔
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🌟 4. Real-Time Search Overlay */}
      {searchQuery.trim().length > 0 && (
        <SearchOverlay
          query={searchQuery}
          allListings={allListings}
          selectedCity={currentCity}
          onClose={() => {
            setLocalQuery('');
            if (onSearchChange) onSearchChange('');
          }}
          onSelectIntent={(category, subCategory) => {
            setLocalQuery('');
            if (onSearchChange) onSearchChange('');
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

      {/* Post Listing Modal */}
      {isPostModalOpen && canPostListing && (
        <PostListingModal
          isOpen={isPostModalOpen}
          selectedCity={currentCity}
          onClose={() => setIsPostModalOpen(false)}
        />
      )}
    </div>
  );
}