import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAllListingsSlice, parseNumericPrice } from './store/hyperlocalStore';
import {
  performUnifiedSearch,
  TRENDING_SEARCH_CHIPS,
  CATEGORY_SYNONYMS,
} from './utils/searchEngine';
import {
  calculateDistanceKm,
  calculateCompassDirection,
  formatTravelEstimate,
  buildGoogleMapsRouteUrl,
  resolveListingCoordinates,
} from './hooks/useUserLocation';
import { CITY_ZONES } from './data/cityZones';
import ListingInteractiveCard from './components/common/ListingInteractiveCard';
import ListingDetailModal from './components/common/ListingDetailModal';

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
  { label: '🚶 < 1 km', value: 1, desc: 'Walking Range' },
  { label: '🛵 2 km', value: 2, desc: 'Quick Hop' },
  { label: '🚗 5 km', value: 5, desc: 'Neighborhood' },
  { label: '🏙️ 10 km', value: 10, desc: 'City-Wide' },
  { label: '🏞️ 25 km', value: 25, desc: 'Outskirts & Resorts' },
  { label: '🌍 All Alwar', value: Infinity, desc: 'Entire District' },
];

const NEARBY_SORT_OPTIONS = [
  { id: 'nearest', label: '📡 Nearest First (सबसे पास)' },
  { id: 'rating', label: '⭐ Highest Rated (टॉप रेटेड)' },
  { id: 'popular', label: '🔥 Most Popular (लोकप्रिय)' },
  { id: 'price_asc', label: '💰 Price: Low to High' },
  { id: 'price_desc', label: '💎 Price: High to Low' },
];

const BUDGET_FILTER_OPTIONS = [
  { label: 'Any Budget', value: Infinity },
  { label: 'Under ₹500', value: 500 },
  { label: 'Under ₹1,500', value: 1500 },
  { label: 'Under ₹5,000', value: 5000 },
  { label: 'Under ₹15,000', value: 15000 },
];

const cleanPhoneNum = (p) => (p ? String(p).replace(/\D/g, '').slice(-10) : '');

export default function HyperlocalHomeFeed({
  userLocation,
  isLocating: parentIsLocating = false,
  onRefreshLocation,
  onSelectCategory,
  onSelectIntent,
  searchQuery: externalSearchQuery = '',
  onSearchChange,
  selectedCity = 'Alwar',
  onNewNotification,
}) {
  const allListings = useAllListingsSlice();
  const searchInputRef = useRef(null);

  // Global Home Search States
  const [localQuery, setLocalQuery] = useState(externalSearchQuery || '');
  const [selectedSearchCategory, setSelectedSearchCategory] = useState('all');
  const [selectedSearchZone, setSelectedSearchZone] = useState('all');
  const [searchSortBy, setSearchSortBy] = useState('relevance');
  const [isListeningVoice, setIsListeningVoice] = useState(false);

  // 📡 Upgraded Nearby Me Radar States
  const [gpsCoords, setGpsCoords] = useState(() =>
    userLocation?.lat && userLocation?.lng
      ? {
          lat: userLocation.lat,
          lng: userLocation.lng,
          accuracy: userLocation.accuracy,
          updatedAt: userLocation.updatedAt || Date.now(),
        }
      : null
  );
  const [isNearbyViewOpen, setIsNearbyViewOpen] = useState(false);
  const [nearbyRadiusKm, setNearbyRadiusKm] = useState(5);
  const [nearbyCategoryFilter, setNearbyCategoryFilter] = useState('all');
  const [nearbySortBy, setNearbySortBy] = useState('nearest');
  const [nearbySearchQuery, setNearbySearchQuery] = useState('');
  const [nearbyOnlyDeals, setNearbyOnlyDeals] = useState(false);
  const [nearbyOnlyVerified, setNearbyOnlyVerified] = useState(false);
  const [nearbyOnlyTopRated, setNearbyOnlyTopRated] = useState(false);
  const [nearbyMaxBudget, setNearbyMaxBudget] = useState(Infinity);
  const [nearbyViewMode, setNearbyViewMode] = useState('cards'); // 'cards' | 'zones' | 'compact'
  const [isNearbyVoiceListening, setIsNearbyVoiceListening] = useState(false);

  const [localLocating, setLocalLocating] = useState(false);
  const [speakingCatId, setSpeakingCatId] = useState(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  // Sync coordinates if updated from parent hook
  useEffect(() => {
    if (userLocation?.lat && userLocation?.lng) {
      setGpsCoords({
        lat: userLocation.lat,
        lng: userLocation.lng,
        accuracy: userLocation.accuracy || null,
        updatedAt: userLocation.updatedAt || Date.now(),
      });
    }
  }, [userLocation?.lat, userLocation?.lng, userLocation?.accuracy, userLocation?.updatedAt]);

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

  // 📡 Acquire or Refresh Live GPS Coordinates
  const acquireLiveGPS = (openView = true) => {
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
          updatedAt: Date.now(),
        };
        setGpsCoords(coords);
        setLocalLocating(false);
        if (openView) {
          setIsNearbyViewOpen(true);
        }
      },
      () => {
        setLocalLocating(false);
        alert('Please allow GPS location access in your browser to discover services & shops near you.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  };

  // Toggle Nearby View from Top Button
  const handleToggleNearbyGPS = (e) => {
    if (e) e.stopPropagation();

    if (isNearbyViewOpen && gpsCoords) {
      setIsNearbyViewOpen(false);
      return;
    }

    if (gpsCoords?.lat && gpsCoords?.lng) {
      setIsNearbyViewOpen(true);
      return;
    }

    acquireLiveGPS(true);
  };

  // 🎤 Voice Search Helper (Supports both Main Search & In-Nearby Search)
  const triggerVoiceRecognition = (target = 'main') => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice search is not supported in this browser. Please type your search.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      if (target === 'nearby') {
        setIsNearbyVoiceListening(true);
      } else {
        setIsListeningVoice(true);
      }

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          if (target === 'nearby') {
            setNearbySearchQuery(transcript.trim());
          } else {
            updateQuery(transcript.trim());
          }
        }
        setIsListeningVoice(false);
        setIsNearbyVoiceListening(false);
      };

      recognition.onerror = () => {
        setIsListeningVoice(false);
        setIsNearbyVoiceListening(false);
      };
      recognition.onend = () => {
        setIsListeningVoice(false);
        setIsNearbyVoiceListening(false);
      };

      recognition.start();
    } catch {
      setIsListeningVoice(false);
      setIsNearbyVoiceListening(false);
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

  // 📐 Enrich a listing with live distance, compass direction, travel ETA, and route URL
  const enrichItemWithTelemetry = (item) => {
    if (!gpsCoords?.lat || !gpsCoords?.lng) {
      return {
        ...item,
        liveDistanceKm: null,
        compassDir: '',
        travelEstimate: null,
        routeUrl: buildGoogleMapsRouteUrl(null, item, null),
      };
    }

    const itemCoords = resolveListingCoordinates(item);
    const distKm = itemCoords
      ? calculateDistanceKm(gpsCoords.lat, gpsCoords.lng, itemCoords.lat, itemCoords.lng)
      : null;
    const compassDir = itemCoords
      ? calculateCompassDirection(gpsCoords.lat, gpsCoords.lng, itemCoords.lat, itemCoords.lng)
      : '';
    const travelEstimate = distKm !== null ? formatTravelEstimate(distKm) : null;
    const routeUrl = buildGoogleMapsRouteUrl(gpsCoords, item, itemCoords);

    return {
      ...item,
      liveDistanceKm: distKm,
      compassDir,
      travelEstimate,
      routeUrl,
    };
  };

  // 📡 Step A: All active listings within the selected radius (before category/chip filters)
  const radiusMatchedPool = useMemo(() => {
    if (!gpsCoords?.lat || !gpsCoords?.lng) return [];

    let pool = (allListings || []).filter(
      (item) => item && item.is_active !== false && !item.has_pending_approval
    );

    // If user typed a keyword inside Nearby Search, run precision search on the pool first
    if (nearbySearchQuery.trim()) {
      pool = performUnifiedSearch(pool, nearbySearchQuery, { limit: 200 }).listings;
    }

    const withTelemetry = [];
    for (const item of pool) {
      const enriched = enrichItemWithTelemetry(item);
      if (enriched.liveDistanceKm !== null && enriched.liveDistanceKm <= nearbyRadiusKm) {
        withTelemetry.push(enriched);
      }
    }

    return withTelemetry;
  }, [allListings, gpsCoords, nearbyRadiusKm, nearbySearchQuery]);

  // 📊 Dynamic Category Counts within the current radius
  const nearbyCategoryCounts = useMemo(() => {
    const counts = new Map();
    for (const item of radiusMatchedPool) {
      const cat = String(item.category || '').toLowerCase();
      counts.set(cat, (counts.get(cat) || 0) + 1);
    }
    return MASTER_CATEGORIES.map((c) => ({
      ...c,
      count: counts.get(c.id) || 0,
    })).filter((c) => c.count > 0);
  }, [radiusMatchedPool]);

  // 📡 Step B: Apply Category, Deals, Verified, Rating, Budget & Sort Options
  const nearbyListings = useMemo(() => {
    let filtered = [...radiusMatchedPool];

    if (nearbyCategoryFilter !== 'all') {
      filtered = filtered.filter(
        (item) => String(item.category || '').toLowerCase() === nearbyCategoryFilter.toLowerCase()
      );
    }

    if (nearbyOnlyDeals) {
      filtered = filtered.filter(
        (item) => Boolean(item.deal_badge || item.original_price || item.is_promoted)
      );
    }

    if (nearbyOnlyVerified) {
      filtered = filtered.filter((item) => Boolean(item.verified));
    }

    if (nearbyOnlyTopRated) {
      filtered = filtered.filter((item) => Number(item.rating || 4.8) >= 4.8);
    }

    if (nearbyMaxBudget !== Infinity) {
      filtered = filtered.filter((item) => {
        const numPrice = parseNumericPrice(String(item.price || item.rates || ''));
        return numPrice > 0 && numPrice <= nearbyMaxBudget;
      });
    }

    filtered.sort((a, b) => {
      if (nearbySortBy === 'rating') {
        const rDiff = Number(b.rating || 4.8) - Number(a.rating || 4.8);
        if (rDiff !== 0) return rDiff;
        return (a.liveDistanceKm ?? Infinity) - (b.liveDistanceKm ?? Infinity);
      }
      if (nearbySortBy === 'popular') {
        const pDiff = Number(b.interestCount || 0) - Number(a.interestCount || 0);
        if (pDiff !== 0) return pDiff;
        return (a.liveDistanceKm ?? Infinity) - (b.liveDistanceKm ?? Infinity);
      }
      if (nearbySortBy === 'price_asc') {
        const pA = parseNumericPrice(String(a.price || a.rates || '')) || Infinity;
        const pB = parseNumericPrice(String(b.price || b.rates || '')) || Infinity;
        if (pA !== pB) return pA - pB;
        return (a.liveDistanceKm ?? Infinity) - (b.liveDistanceKm ?? Infinity);
      }
      if (nearbySortBy === 'price_desc') {
        const pA = parseNumericPrice(String(a.price || a.rates || '')) || 0;
        const pB = parseNumericPrice(String(b.price || b.rates || '')) || 0;
        if (pB !== pA) return pB - pA;
        return (a.liveDistanceKm ?? Infinity) - (b.liveDistanceKm ?? Infinity);
      }
      // Default: 'nearest'
      return (a.liveDistanceKm ?? Infinity) - (b.liveDistanceKm ?? Infinity);
    });

    return filtered;
  }, [
    radiusMatchedPool,
    nearbyCategoryFilter,
    nearbyOnlyDeals,
    nearbyOnlyVerified,
    nearbyOnlyTopRated,
    nearbyMaxBudget,
    nearbySortBy,
  ]);

  // 📊 Live Radar Telemetry Summary Stats
  const nearbyStats = useMemo(() => {
    if (nearbyListings.length === 0) {
      return { closestKm: null, under2KmCount: 0, dealsCount: 0 };
    }
    let minKm = Infinity;
    let under2 = 0;
    let deals = 0;

    for (const item of nearbyListings) {
      if (item.liveDistanceKm !== null && item.liveDistanceKm < minKm) {
        minKm = item.liveDistanceKm;
      }
      if (item.liveDistanceKm !== null && item.liveDistanceKm <= 2) {
        under2++;
      }
      if (item.deal_badge || item.original_price) {
        deals++;
      }
    }

    return {
      closestKm: minKm === Infinity ? null : minKm,
      under2KmCount: under2,
      dealsCount: deals,
    };
  }, [nearbyListings]);

  // 🧭 Grouped Distance Zones for 'zones' View Mode
  const nearbyDistanceZones = useMemo(() => {
    const walking = [];
    const shortRide = [];
    const cityWide = [];

    for (const item of nearbyListings) {
      const d = item.liveDistanceKm ?? 99;
      if (d <= 1.5) walking.push(item);
      else if (d <= 5) shortRide.push(item);
      else cityWide.push(item);
    }

    return [
      {
        id: 'walking',
        title: '🟢 Walking & Immediate Vicinity (Under 1.5 km)',
        subtitle: 'पैदल दूरी या बिल्कुल पास उपलब्ध सेवाएं',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        items: walking,
      },
      {
        id: 'short-ride',
        title: '🟡 Quick 5–10 Min Ride (1.5 km – 5 km)',
        subtitle: 'स्कूटी या बाइक से 5-10 मिनट की दूरी पर',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        items: shortRide,
      },
      {
        id: 'city-outskirts',
        title: '🔵 Across City & Outskirts (5 km+)',
        subtitle: 'शहर के अन्य क्षेत्र, रिसॉर्ट्स व पर्यटन स्थल',
        badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        items: cityWide,
      },
    ].filter((z) => z.items.length > 0);
  }, [nearbyListings]);

  const activeFilterCount =
    (nearbyCategoryFilter !== 'all' ? 1 : 0) +
    (nearbyOnlyDeals ? 1 : 0) +
    (nearbyOnlyVerified ? 1 : 0) +
    (nearbyOnlyTopRated ? 1 : 0) +
    (nearbyMaxBudget !== Infinity ? 1 : 0) +
    (nearbySearchQuery.trim() ? 1 : 0);

  const resetNearbyFilters = () => {
    setNearbyCategoryFilter('all');
    setNearbyOnlyDeals(false);
    setNearbyOnlyVerified(false);
    setNearbyOnlyTopRated(false);
    setNearbyMaxBudget(Infinity);
    setNearbySearchQuery('');
    setNearbySortBy('nearest');
  };

  // 🔍 Run Real-Time Unified Search Engine (for main Home Search bar)
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

    const enriched = base.listings.map((item) => enrichItemWithTelemetry(item));

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
    if (!item) return;
    setSelectedDetailItem(item);
  };

  const handleOpenIntent = (intent) => {
    if (intent.subCategory?.id && typeof onSelectIntent === 'function') {
      onSelectIntent(intent.categoryId, intent.subCategory.id);
    } else if (typeof onSelectCategory === 'function') {
      onSelectCategory(intent.categoryId, intent.subCategory?.id || 'all');
    }
  };

  // Helper to render a single Nearby Listing Card with Telemetry Header
  const renderNearbyFullCard = (item) => {
    const catMeta = CATEGORY_SYNONYMS[item.category] || {
      title: item.category,
      icon: '📦',
    };
    const dist = item.liveDistanceKm;
    const distColor =
      dist <= 1.5
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
        : dist <= 5
        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';

    return (
      <div
        key={item.id}
        onClick={() => handleOpenListingDetail(item)}
        className="rounded-3xl bg-[#0b131b] border border-[#1d2e3d] hover:border-emerald-400/60 transition-all overflow-hidden shadow-xl cursor-pointer"
      >
        {/* Top GPS Distance, Travel ETA & Direct Route Strip */}
        <div className="px-3.5 py-2 bg-gradient-to-r from-[#10222b] via-[#0e1922] to-[#121e2b] border-b border-[#1d2e3d] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            {dist !== null && dist !== undefined && (
              <span
                className={`px-2.5 py-0.5 rounded-full border text-[10.5px] font-mono font-black flex items-center space-x-1 ${distColor}`}
              >
                <span>📡</span>
                <span>{dist} km</span>
                {item.compassDir && <span className="opacity-80">({item.compassDir})</span>}
              </span>
            )}

            {item.travelEstimate && (
              <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-200 text-[10px] font-bold flex items-center space-x-1">
                <span>{item.travelEstimate.icon}</span>
                <span>{item.travelEstimate.label}</span>
              </span>
            )}

            <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-amber-300 text-[9.5px] font-black uppercase">
              {catMeta.icon} {catMeta.title}
            </span>
          </div>

          {/* 1-Tap Google Maps Turn-by-Turn Route Button */}
          <a
            href={item.routeUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="px-2.5 py-1 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-[10px] font-black flex items-center space-x-1 transition shrink-0"
            title="Open Turn-by-Turn Route in Google Maps"
          >
            <span>🗺️</span>
            <span>Route</span>
          </a>
        </div>

        {/* Full Interactive Card Body */}
        <ListingInteractiveCard
          item={item}
          listing={item}
          category={item.category}
          selectedCity={selectedCity}
          onSelect={() => handleOpenListingDetail(item)}
          onClick={() => handleOpenListingDetail(item)}
          onCardClick={() => handleOpenListingDetail(item)}
          onSelectListing={() => handleOpenListingDetail(item)}
          onNewNotification={onNewNotification}
        />
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-5 space-y-5 select-none font-sans text-slate-100">
      
      {/* 📍 1. TOP HYPERLOCAL HEADER & LIVE SEARCH CARD */}
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
            <div className="flex items-center space-x-1.5 pt-0.5 flex-wrap gap-y-1">
              <span className="text-rose-500 text-sm">📍</span>
              <h2 className="text-sm sm:text-base font-black text-white truncate">
                {selectedCity}, Rajasthan
              </h2>
              {gpsCoords && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[9.5px] font-black">
                  📡 Live GPS Active
                </span>
              )}
            </div>
          </div>

          {/* Direct Nearby Me Button */}
          <button
            type="button"
            onClick={handleToggleNearbyGPS}
            disabled={isLocating}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 cursor-pointer shadow-md active:scale-95 transition shrink-0 border ${
              isNearbyViewOpen
                ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 border-emerald-300 shadow-emerald-500/20 shadow-lg'
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
                ? 'Nearby Radar ON ✓'
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

          <button
            type="button"
            onClick={() => triggerVoiceRecognition('main')}
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
      {/* 🎯 2. LIVE SEARCH RESULTS PANEL (SHOWN WHEN USER TYPES IN MAIN BAR)   */}
      {/* ===================================================================== */}
      {isSearching ? (
        <div className="space-y-4 animate-fade-in">
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
                ← Back
              </button>
            </div>

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

          {/* Smart Category & Subcategory Intent Shortcuts */}
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

          {/* Matching Listings */}
          <div className="space-y-3">
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
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.listings.map((item) => renderNearbyFullCard(item))}
              </div>
            )}
          </div>
        </div>
      ) : isNearbyViewOpen && gpsCoords ? (
        /* ===================================================================== */
        /* 📡 3. UPGRADED "NEARBY ME" RADAR & MULTI-FILTER DISCOVERY HUB         */
        /* ===================================================================== */
        <div className="space-y-4 animate-fade-in">
          
          {/* A. Radar Command Center Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#0d2228] via-[#0e1720] to-[#131d2b] border border-emerald-500/40 shadow-2xl space-y-4">
            
            {/* Header Row: Title, Refresh GPS & Exit Button */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center space-x-2.5">
                <div className="relative flex items-center justify-center w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-lg">
                  <span>📡</span>
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white flex items-center space-x-2">
                    <span>Nearby Me Radar • आस-पास खोजें</span>
                  </h3>
                  <p className="text-[10.5px] text-emerald-300 font-bold">
                    Live GPS Locked {gpsCoords.accuracy ? `(±${gpsCoords.accuracy}m accuracy)` : ''} • Real-time distance & route
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => acquireLiveGPS(true)}
                  disabled={isLocating}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-[11px] font-black cursor-pointer active:scale-95 transition flex items-center space-x-1"
                  title="Re-center Live GPS"
                >
                  <span>{isLocating ? '⏳' : '🔄'}</span>
                  <span>Re-center</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsNearbyViewOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-[11px] font-black border border-slate-700 cursor-pointer active:scale-95 transition"
                >
                  ← Categories
                </button>
              </div>
            </div>

            {/* Live Telemetry Summary Stats Bar */}
            <div className="grid grid-cols-3 gap-2 pt-0.5">
              <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-center">
                <span className="text-[10px] text-slate-400 font-bold block">Matching Nearby</span>
                <span className="text-sm font-mono font-black text-emerald-400">
                  {nearbyListings.length} Spots
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-center">
                <span className="text-[10px] text-slate-400 font-bold block">Closest to You</span>
                <span className="text-sm font-mono font-black text-amber-300">
                  {nearbyStats.closestKm !== null ? `${nearbyStats.closestKm} km` : '—'}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-center">
                <span className="text-[10px] text-slate-400 font-bold block">Within 2 km</span>
                <span className="text-sm font-mono font-black text-cyan-300">
                  {nearbyStats.under2KmCount} Ready
                </span>
              </div>
            </div>

            {/* In-Nearby Keyword + Voice Search Bar */}
            <div className="flex items-center bg-slate-950 border border-slate-800 focus-within:border-emerald-400 rounded-2xl px-3 py-2">
              <span className="text-emerald-400 text-xs mr-2">🔍</span>
              <input
                type="text"
                value={nearbySearchQuery}
                onChange={(e) => setNearbySearchQuery(e.target.value)}
                placeholder="Filter nearby by keyword (e.g. Plumber, Cafe, Doctor, Turf)..."
                className="w-full bg-transparent text-xs font-bold text-white placeholder-slate-500 outline-none"
              />
              {nearbySearchQuery && (
                <button
                  type="button"
                  onClick={() => setNearbySearchQuery('')}
                  className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-black mr-1.5 cursor-pointer"
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                onClick={() => triggerVoiceRecognition('nearby')}
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs cursor-pointer ${
                  isNearbyVoiceListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-slate-900 text-emerald-300 border border-slate-800'
                }`}
                title="Voice Filter Nearby"
              >
                🎤
              </button>
            </div>

            {/* 1. Distance Radius Selector Pills */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  📏 1. Distance Radius (दूरी चुनें)
                </span>
                <span className="text-[10px] font-bold text-emerald-400">
                  {RADIUS_OPTIONS.find((r) => r.value === nearbyRadiusKm)?.desc}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                {RADIUS_OPTIONS.map((rad) => (
                  <button
                    key={rad.label}
                    type="button"
                    onClick={() => setNearbyRadiusKm(rad.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition shrink-0 ${
                      nearbyRadiusKm === rad.value
                        ? 'bg-emerald-400 text-slate-950 font-black shadow-md'
                        : 'bg-slate-950 text-slate-300 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {rad.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Dynamic Category Pills (With Live Counts in Selected Radius) */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-0.5 block">
                🏛️ 2. Filter by Category ({nearbyCategoryCounts.length} active nearby)
              </span>
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setNearbyCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition shrink-0 ${
                    nearbyCategoryFilter === 'all'
                      ? 'bg-amber-400 text-slate-950 font-black shadow'
                      : 'bg-slate-950 text-slate-300 border border-slate-800 hover:text-white'
                  }`}
                >
                  All Nearby ({radiusMatchedPool.length})
                </button>

                {nearbyCategoryCounts.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setNearbyCategoryFilter(nearbyCategoryFilter === cat.id ? 'all' : cat.id)
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition flex items-center space-x-1.5 shrink-0 ${
                      nearbyCategoryFilter === cat.id
                        ? 'bg-amber-400 text-slate-950 font-black shadow'
                        : 'bg-slate-950 text-slate-300 border border-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-900/60 text-[10px] font-mono">
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Sort By, Max Budget & View Mode Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
              {/* Sort Selector */}
              <select
                value={nearbySortBy}
                onChange={(e) => setNearbySortBy(e.target.value)}
                className="bg-slate-950 border border-slate-800 focus:border-emerald-400 rounded-xl px-3 py-2 text-xs text-emerald-300 font-black outline-none cursor-pointer"
              >
                {NEARBY_SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Max Budget Filter */}
              <select
                value={nearbyMaxBudget === Infinity ? 'all' : String(nearbyMaxBudget)}
                onChange={(e) =>
                  setNearbyMaxBudget(e.target.value === 'all' ? Infinity : Number(e.target.value))
                }
                className="bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold outline-none cursor-pointer"
              >
                {BUDGET_FILTER_OPTIONS.map((b) => (
                  <option
                    key={b.label}
                    value={b.value === Infinity ? 'all' : String(b.value)}
                  >
                    💰 {b.label}
                  </option>
                ))}
              </select>

              {/* View Mode Switcher */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setNearbyViewMode('cards')}
                  className={`flex-1 py-1 rounded-lg text-[10.5px] font-black cursor-pointer transition ${
                    nearbyViewMode === 'cards'
                      ? 'bg-emerald-400 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📋 Cards
                </button>
                <button
                  type="button"
                  onClick={() => setNearbyViewMode('zones')}
                  className={`flex-1 py-1 rounded-lg text-[10.5px] font-black cursor-pointer transition ${
                    nearbyViewMode === 'zones'
                      ? 'bg-emerald-400 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🧭 By Zone
                </button>
                <button
                  type="button"
                  onClick={() => setNearbyViewMode('compact')}
                  className={`flex-1 py-1 rounded-lg text-[10.5px] font-black cursor-pointer transition ${
                    nearbyViewMode === 'compact'
                      ? 'bg-emerald-400 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⚡ Grid
                </button>
              </div>
            </div>

            {/* 4. Quick Multi-Filter Toggle Chips */}
            <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
              <div className="flex items-center flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setNearbyOnlyDeals(!nearbyOnlyDeals)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer border transition flex items-center space-x-1 ${
                    nearbyOnlyDeals
                      ? 'bg-rose-500 text-white border-rose-400 font-black shadow'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>🏷️</span>
                  <span>Special Deals ({nearbyStats.dealsCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNearbyOnlyVerified(!nearbyOnlyVerified)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer border transition flex items-center space-x-1 ${
                    nearbyOnlyVerified
                      ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-black shadow'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>✅</span>
                  <span>Verified Only</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNearbyOnlyTopRated(!nearbyOnlyTopRated)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer border transition flex items-center space-x-1 ${
                    nearbyOnlyTopRated
                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>⭐</span>
                  <span>4.8+ Rated</span>
                </button>
              </div>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetNearbyFilters}
                  className="text-[11px] font-black text-rose-400 hover:underline cursor-pointer"
                >
                  ✕ Reset Filters ({activeFilterCount})
                </button>
              )}
            </div>
          </div>

          {/* B. Nearby Results Stream */}
          {nearbyListings.length === 0 ? (
            <div className="p-10 text-center rounded-3xl bg-[#0e1720] border border-slate-800 space-y-3">
              <span className="text-4xl block">📡</span>
              <h4 className="text-sm font-black text-white">
                No Matching Listings Within {nearbyRadiusKm === Infinity ? selectedCity : `${nearbyRadiusKm} km`}
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Try expanding your distance radius or clearing active filters to see more nearby businesses.
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                {nearbyRadiusKm !== Infinity && (
                  <button
                    type="button"
                    onClick={() => setNearbyRadiusKm(Infinity)}
                    className="px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer"
                  >
                    🌍 Expand to All {selectedCity}
                  </button>
                )}
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={resetNearbyFilters}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>
          ) : nearbyViewMode === 'zones' ? (
            /* 🧭 MODE 1: GROUPED BY DISTANCE ZONES */
            <div className="space-y-6">
              {nearbyDistanceZones.map((zone) => (
                <div key={zone.id} className="space-y-3">
                  <div className="p-3 rounded-2xl bg-[#0e1720] border border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white">{zone.title}</h4>
                      <p className="text-[10.5px] text-slate-400 font-bold">{zone.subtitle}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full border text-xs font-mono font-black ${zone.badgeClass}`}
                    >
                      {zone.items.length}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {zone.items.map((item) => renderNearbyFullCard(item))}
                  </div>
                </div>
              ))}
            </div>
          ) : nearbyViewMode === 'compact' ? (
            /* ⚡ MODE 2: COMPACT 2-COLUMN GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {nearbyListings.slice(0, 60).map((item) => {
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
                    className="p-3 rounded-3xl bg-[#0e1720] border border-[#1d2b38] hover:border-emerald-400/60 transition cursor-pointer flex flex-col justify-between gap-2.5 shadow-lg"
                  >
                    <div className="flex items-start space-x-3">
                      <img
                        src={coverImg}
                        alt={item.title}
                        className="w-16 h-16 rounded-2xl object-cover bg-slate-950 border border-slate-800 shrink-0"
                      />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center space-x-1 flex-wrap gap-y-1">
                          <span className="px-2 py-0.2 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[9.5px] font-mono font-black">
                            📡 {item.liveDistanceKm} km
                          </span>
                          {item.travelEstimate && (
                            <span className="text-[9.5px] text-slate-400 font-bold">
                              • {item.travelEstimate.icon} {item.travelEstimate.label}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-black text-white truncate">
                          {item.title || item.name}
                        </h4>
                        <p className="text-[11px] font-mono font-black text-emerald-400 truncate">
                          {item.price || item.rates || 'Ask Price'}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {catMeta.icon} {item.sellerName} • 📍 {item.location}
                        </p>
                      </div>
                    </div>

                    <div
                      className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/80"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href={`tel:+91${phone}`}
                        className="py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] text-center"
                      >
                        📞 Call
                      </a>
                      <a
                        href={`https://wa.me/91${phone}?text=${encodeURIComponent(
                          `Namaste! I saw your nearby listing "${item.title}" on Aapke Kareeb.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] text-center"
                      >
                        💬 Chat
                      </a>
                      <a
                        href={item.routeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 font-black text-[10px] text-center"
                      >
                        🗺️ Route
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* 📋 MODE 3: FULL INTERACTIVE CARDS VIEW (DEFAULT) */
            <div className="space-y-4">
              {nearbyListings.slice(0, 50).map((item) => renderNearbyFullCard(item))}
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

      {/* Full Listing Detail Modal for Search & Nearby Me Cards */}
      {selectedDetailItem && (
        <ListingDetailModal
          item={selectedDetailItem}
          listing={selectedDetailItem}
          isOpen={Boolean(selectedDetailItem)}
          selectedCity={selectedCity}
          onClose={() => setSelectedDetailItem(null)}
          onNewNotification={onNewNotification}
          onSelectListing={(nextItem) => setSelectedDetailItem(nextItem)}
        />
      )}
    </div>
  );
}