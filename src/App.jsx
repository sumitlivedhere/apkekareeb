import React, { useState, useMemo, useRef, useEffect, lazy, Suspense } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import {
  useRoleFilteredNotifications,
  useCartCount,
  hyperlocalStore,
  hydrateFromDB,
  initRealtimeSubscriptions,
} from './store/hyperlocalStore';
import { useUserLocation } from './hooks/useUserLocation';
import { getCurrentUserProfile } from './services/authService';
import { useTheme } from './context/ThemeContext';

// Instant Critical Screens & Modals
import HyperlocalHomeFeed from './HyperlocalHomeFeed';
import TownHubView from './categories/TownHubView';
import NotificationCenter from './components/NotificationCenter';
import AuthModal from './components/common/AuthModal';
import AdminKeyModal from './components/common/AdminKeyModal';
import PWAInstallBanner from './components/common/PWAInstallBanner';
import CartDrawer from './components/common/CartDrawer';

// 1. Lazy Loaded User Auth & Profile Station
const UserAuthDashboard = lazy(() => import('./components/common/UserAuthDashboard'));

// Lazy Loaded Modals & Admin Dashboard
const ContextualListingModal = lazy(() => import('./components/ContextualListingModal'));
const ListingDetailModal = lazy(() => import('./components/common/ListingDetailModal'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));

// Code-Split Lazy Loaded Category Hubs
const ProviderDashboard = lazy(() => import('./ProviderDashboard'));
const MedicalHub = lazy(() => import('./categories/MedicalHub'));
const PropertyHub = lazy(() => import('./categories/PropertyHub'));
const VehicleHub = lazy(() => import('./categories/VehicleHub'));
const FestivalHub = lazy(() => import('./categories/FestivalHub'));
const ElectronicsHub = lazy(() => import('./categories/ElectronicsHub'));
const FashionHub = lazy(() => import('./categories/FashionHub'));
const FurnitureHub = lazy(() => import('./categories/FurnitureHub'));
const KaarigarHub = lazy(() => import('./categories/KaarigarHub'));
const TransporterHub = lazy(() => import('./categories/TransporterHub'));
const WhiteCollarHub = lazy(() => import('./categories/WhiteCollarHub'));
const EducationHub = lazy(() => import('./categories/EducationHub'));
const RestaurantsHub = lazy(() => import('./categories/RestaurantsHub'));
const MallsHub = lazy(() => import('./categories/MallsHub'));
const ShaadiHub = lazy(() => import('./categories/ShaadiHub'));
const ConstructionHub = lazy(() => import('./categories/ConstructionHub'));
const AdvertisingHub = lazy(() => import('./categories/AdvertisingHub'));
const CommunityHub = lazy(() => import('./categories/CommunityHub'));
const MarketHub = lazy(() => import('./categories/MarketHub'));
const ReCommerceHub = lazy(() => import('./categories/ReCommerceHub'));
const FitnessHub = lazy(() => import('./categories/FitnessHub'));
const CreatorsHub = lazy(() => import('./categories/CreatorsHub'));

// Code-Split Lazy Loaded Category Feeds
const ListingsFeed = lazy(() => import('./components/ListingsFeed'));
const PropertyFeed = lazy(() => import('./components/PropertyFeed'));
const MedicalFeed = lazy(() => import('./components/MedicalFeed'));
const KaarigarWorkerList = lazy(() => import('./components/KaarigarWorkerList'));
const TransporterFeed = lazy(() => import('./components/TransporterFeed'));
const WhiteCollarFeed = lazy(() => import('./components/WhiteCollarFeed'));
const EducationFeed = lazy(() => import('./components/EducationFeed'));
const RestaurantsFeed = lazy(() => import('./components/RestaurantsFeed'));
const MallsFeed = lazy(() => import('./components/MallsFeed'));
const ShaadiFeed = lazy(() => import('./components/ShaadiFeed'));
const FestivalFeed = lazy(() => import('./components/FestivalFeed'));
const ConstructionFeed = lazy(() => import('./components/ConstructionFeed'));
const AdvertisingFeed = lazy(() => import('./components/AdvertisingFeed'));
const CommunityFeed = lazy(() => import('./components/CommunityFeed'));
const MarketFeed = lazy(() => import('./components/MarketFeed'));
const ReCommerceFeed = lazy(() => import('./components/recommerce/ReCommerceFeed'));
const FitnessFeed = lazy(() => import('./components/FitnessFeed'));
const CreatorsFeed = lazy(() => import('./components/CreatorsFeed'));

function ScreenSkeleton() {
  return (
    <div className="p-4 space-y-3 animate-pulse">
      <div className="h-20 bg-slate-900/80 rounded-2xl"></div>
      <div className="h-44 bg-slate-900/60 rounded-2xl"></div>
      <div className="h-44 bg-slate-900/60 rounded-2xl"></div>
    </div>
  );
}

const INITIAL_NAV_STATE = {
  screen: 'home',
  category: 'property',
  subCategory: 'all',
  searchQuery: '',
};

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const [history, setHistory] = useState([INITIAL_NAV_STATE]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // 📍 GPS Locality & Town Hook
  const { location: userLocation, isLocating, detectLocation } = useUserLocation();
  const selectedCity = userLocation?.city || 'Alwar';

  // 🛡️ Authentication & Master Admin Key State
  const [currentUser, setCurrentUser] = useState(() => getCurrentUserProfile());
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(
    () => localStorage.getItem('townhub_admin_unlocked') === 'true'
  );
  const [isAdminKeyModalOpen, setIsAdminKeyModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authActionTitle, setAuthActionTitle] = useState('Verify Phone to Continue');

  // 🏪 Prompt State for Non-Sellers Attempting to Post
  const [isBusinessPromptOpen, setIsBusinessPromptOpen] = useState(false);

  // 🛒 Universal Cart & Notification Overlay State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartCount = useCartCount();

  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [deepLinkedItem, setDeepLinkedItem] = useState(null);

  // Swipe Gesture Tracking Refs
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);

  // 🕵️ Stealth Master Admin Access (5 Quick Taps on Logo)
  const adminTapCountRef = useRef(0);
  const adminTapTimerRef = useRef(null);

  const handleSecretAdminTap = () => {
    adminTapCountRef.current += 1;
    if (adminTapTimerRef.current) clearTimeout(adminTapTimerRef.current);

    if (adminTapCountRef.current >= 5) {
      adminTapCountRef.current = 0;
      if (isAdminUnlocked) {
        navigateTo({ screen: 'admin-dashboard', searchQuery: '' });
      } else {
        setIsAdminKeyModalOpen(true);
      }
    } else {
      adminTapTimerRef.current = setTimeout(() => {
        adminTapCountRef.current = 0;
      }, 1500);
    }
  };

  // Track active overlay/modal for hardware back-button interception
  const activeModalCloserRef = useRef(null);
  useEffect(() => {
    if (isCartOpen) {
      activeModalCloserRef.current = () => setIsCartOpen(false);
    } else if (deepLinkedItem) {
      activeModalCloserRef.current = () => {
        setDeepLinkedItem(null);
        window.history.replaceState({}, document.title, window.location.pathname);
      };
    } else if (selectedDetailItem) {
      activeModalCloserRef.current = () => setSelectedDetailItem(null);
    } else if (isListingModalOpen) {
      activeModalCloserRef.current = () => setIsListingModalOpen(false);
    } else if (isNotificationsOpen) {
      activeModalCloserRef.current = () => setIsNotificationsOpen(false);
    } else if (isAuthModalOpen) {
      activeModalCloserRef.current = () => setIsAuthModalOpen(false);
    } else if (isAdminKeyModalOpen) {
      activeModalCloserRef.current = () => setIsAdminKeyModalOpen(false);
    } else if (isBusinessPromptOpen) {
      activeModalCloserRef.current = () => setIsBusinessPromptOpen(false);
    } else {
      activeModalCloserRef.current = null;
    }
  }, [
    isCartOpen,
    deepLinkedItem,
    selectedDetailItem,
    isListingModalOpen,
    isNotificationsOpen,
    isAuthModalOpen,
    isAdminKeyModalOpen,
    isBusinessPromptOpen,
  ]);

  // Set initial state index and hydrate store on boot
  useEffect(() => {
    if (!window.history.state || typeof window.history.state.idx !== 'number') {
      window.history.replaceState({ idx: 0 }, '');
    }
    hydrateFromDB();
    initRealtimeSubscriptions();
  }, []);

  // 🔗 1-Tap WhatsApp Link Resolver: Opens listing directly when URL has ?id=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('id') || params.get('listing');
    if (targetId) {
      const checkAndOpen = () => {
        const allItems = hyperlocalStore.getAllListings() || [];
        const matched = allItems.find((item) => String(item.id) === String(targetId));
        if (matched) {
          setDeepLinkedItem(matched);
        }
      };
      checkAndOpen();
      const timer = setTimeout(checkAndOpen, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Mobile Hardware & Gesture PopState Listener
  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state && e.state.modal) {
        return;
      }
      if (activeModalCloserRef.current) {
        activeModalCloserRef.current();
        return;
      }
      if (e.state && typeof e.state.idx === 'number') {
        setHistoryIndex(e.state.idx);
      } else {
        setHistoryIndex((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const currentNav = history[historyIndex] || INITIAL_NAV_STATE;
  const {
    screen: currentScreen,
    category: selectedCategory,
    subCategory: selectedSubCategory,
    searchQuery,
  } = currentNav;

  // 🛡️ Strict Merchant & Admin Authorization Check
  const isSeller = Boolean(
    currentUser?.is_merchant === true ||
    currentUser?.verification_tier === 'verified_merchant'
  );
  const isAuthorizedToPost = Boolean(isAdminUnlocked || isSeller);

  // 🔔 Calculate Unread Alerts exclusively for the active persona
  const roleFilteredAlerts = useRoleFilteredNotifications(
    currentUser,
    currentScreen,
    currentScreen === 'admin-dashboard'
  );

  const unreadNotifCount = useMemo(
    () => roleFilteredAlerts.filter((n) => !n.is_read && !n.read).length,
    [roleFilteredAlerts]
  );

  const navigateTo = (updates) => {
    const nextState = {
      screen: updates.screen !== undefined ? updates.screen : currentScreen,
      category: updates.category !== undefined ? updates.category : selectedCategory,
      subCategory: updates.subCategory !== undefined ? updates.subCategory : selectedSubCategory,
      searchQuery: updates.searchQuery !== undefined ? updates.searchQuery : searchQuery,
    };

    if (
      nextState.screen === currentScreen &&
      nextState.category === selectedCategory &&
      nextState.subCategory === selectedSubCategory &&
      nextState.searchQuery === searchQuery
    ) {
      return;
    }

    setHistory((prev) => {
      const branchCut = prev.slice(0, historyIndex + 1);
      const nextHistory = [...branchCut, nextState];
      let finalHistory = nextHistory;
      let nextIdx = historyIndex + 1;

      if (nextHistory.length > 6) {
        finalHistory = nextHistory.slice(nextHistory.length - 6);
        nextIdx = 5;
      }

      window.history.pushState({ idx: nextIdx }, '');
      setHistoryIndex(nextIdx);
      return finalHistory;
    });
  };

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const goBack = () => {
    if (canGoBack) window.history.back();
  };

  const goForward = () => {
    if (canGoForward) window.history.forward();
  };

  const goToHome = () => {
    navigateTo({ screen: 'home', searchQuery: '' });
  };

  const handleNewNotification = (notif) => {
    hyperlocalStore.addNotification(notif);
  };

  const handleOpenPostModal = () => {
    if (isAuthorizedToPost) {
      window.history.pushState({ modal: true }, '');
      setIsListingModalOpen(true);
    } else {
      window.history.pushState({ modal: true }, '');
      setIsBusinessPromptOpen(true);
    }
  };

  const handleOpenBusinessHub = () => {
    if (isAuthorizedToPost) {
      navigateTo({ screen: 'provider-dashboard', searchQuery: '' });
    } else {
      window.history.pushState({ modal: true }, '');
      setIsBusinessPromptOpen(true);
    }
  };

  // 🔔 Deep Link Router on Alert Tap
  const handleSelectNotification = (notif) => {
    setIsNotificationsOpen(false);

    if (
      notif.tag === 'PENDING_APPROVAL' ||
      notif.tag === 'EDIT_PROPOSAL' ||
      notif.tag === 'FLAGGED_REPORT' ||
      notif.tag === 'NEW_USER_PIN'
    ) {
      navigateTo({ screen: 'admin-dashboard', searchQuery: '' });
      return;
    }

    if (
      (notif.tag === 'USER_COMMENT' ||
        notif.tag === 'VOICE_INQUIRY' ||
        notif.tag === 'LISTING_APPROVED' ||
        notif.tag === 'LISTING_REJECTED' ||
        notif.tag === 'INTEREST_ALERT') &&
      notif.targetId
    ) {
      navigateTo({ screen: 'provider-dashboard', searchQuery: '' });
      return;
    }

    if (notif.targetId) {
      const allItems = hyperlocalStore.getAllListings();
      const matched = allItems.find((i) => String(i.id) === String(notif.targetId));
      if (matched) {
        window.history.pushState({ modal: true }, '');
        setSelectedDetailItem(matched);
        return;
      }
    }

    if (notif.category) {
      handleOpenFeed(notif.category, notif.subCategory || 'all');
    }
  };

  // 🌟 Touch Swipe Gesture Handlers
  const handleTouchStart = (e) => {
    if (
      document.querySelector('[data-modal-open="true"]') ||
      isCartOpen ||
      isListingModalOpen ||
      isNotificationsOpen ||
      selectedDetailItem ||
      deepLinkedItem ||
      isAuthModalOpen ||
      isAdminKeyModalOpen ||
      isBusinessPromptOpen
    ) return;
    touchStartX.current = e.changedTouches[0].clientX;
    touchStartY.current = e.changedTouches[0].clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e) => {
    if (
      document.querySelector('[data-modal-open="true"]') ||
      isCartOpen ||
      isListingModalOpen ||
      isNotificationsOpen ||
      selectedDetailItem ||
      deepLinkedItem ||
      isAuthModalOpen ||
      isAdminKeyModalOpen ||
      isBusinessPromptOpen
    ) return;

    const target = e.target;
    if (target.closest('.overflow-x-auto, input, textarea, select')) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;
    const deltaTime = Date.now() - touchStartTime.current;

    if (deltaTime < 450 && Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
      if (deltaX > 0) {
        if (canGoBack) goBack();
      } else {
        if (canGoForward) goForward();
      }
    }
  };

  const handleOpenCategory = (catId, sub = 'all') => {
    const hubMap = {
      property: 'property-hub',
      vehicles: 'vehicle-hub',
      electronics: 'electronics-hub',
      fashion: 'fashion-hub',
      furniture: 'furniture-hub',
      kaarigar: 'kaarigar-hub',
      medical: 'medical-hub',
      transporters: 'transporter-hub',
      'white-collar': 'white-collar-hub',
      education: 'education-hub',
      restaurants: 'restaurants-hub',
      malls: 'malls-hub',
      shaadi: 'shaadi-hub',
      festival: 'festival-hub',
      construction: 'construction-hub',
      advertising: 'advertising-hub',
      community: 'community-hub',
      market: 'market-hub',
      recommerce: 'buysell-hub',
      fitness: 'fitness-hub',
      creators: 'creators-hub',
    };

    navigateTo({
      screen: hubMap[catId] || 'town-hub',
      category: catId,
      subCategory: sub,
      searchQuery: '',
    });
  };

  const handleOpenFeed = (catId, subId = 'all') => {
    const feedMap = {
      property: 'property-feed',
      vehicles: 'listings',
      electronics: 'listings',
      fashion: 'listings',
      furniture: 'listings',
      kaarigar: 'kaarigar-feed',
      medical: 'medical-feed',
      transporters: 'transporter-feed',
      'white-collar': 'white-collar-feed',
      education: 'education-feed',
      restaurants: 'restaurants-feed',
      malls: 'malls-feed',
      shaadi: 'shaadi-feed',
      festival: 'festival-feed',
      construction: 'construction-feed',
      advertising: 'advertising-feed',
      community: 'community-feed',
      market: 'market-feed',
      recommerce: 'recommerce-feed',
      fitness: 'fitness-feed',
      creators: 'creators-feed',
    };

    navigateTo({
      screen: feedMap[catId] || 'listings',
      category: catId,
      subCategory: subId,
      searchQuery: '',
    });
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`min-h-screen flex flex-col justify-between max-w-md mx-auto relative shadow-2xl overflow-x-hidden font-sans select-none pb-24 touch-pan-y transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* 🌟 1. Sticky Header */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md px-3 py-2 border-b flex items-center justify-between shadow-md transition-colors ${
          isDark
            ? 'bg-slate-950/90 border-slate-800 text-slate-100'
            : 'bg-white/90 border-slate-200 text-slate-900'
        }`}
      >
        {/* Left: Resident Profile & Theme Switcher */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            type="button"
            onClick={() => navigateTo({ screen: 'user-auth-dashboard', searchQuery: '' })}
            className={`px-2.5 py-1.5 border rounded-xl text-[10px] font-bold cursor-pointer active:scale-95 transition flex items-center space-x-1.5 shadow-xs ${
              isDark
                ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-200'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
            }`}
            title="Open Resident Profile & Login"
          >
            <span>👤</span>
            <span className="truncate max-w-[55px]">
              {currentUser ? currentUser.full_name?.split(' ')[0] : 'Login'}
            </span>
          </button>

          {/* ☀️ / 🌙 Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-bold transition cursor-pointer active:scale-90 ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-amber-300 hover:bg-slate-800'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Center: Brand Header (5 Quick Taps unlocks Secret Admin Modal) */}
        <div
          onClick={() => {
            handleSecretAdminTap();
            navigateTo({ screen: 'home', searchQuery: '' });
          }}
          className="flex flex-col items-center justify-center cursor-pointer active:scale-95 transition mx-1 text-center select-none"
        >
          <span className="text-[11px] font-black tracking-wider text-amber-400 uppercase leading-none">
            Aapke
          </span>
          <span className="text-[11px] font-black tracking-wider text-amber-400 uppercase leading-none mt-0.5">
            Kareeb
          </span>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Post Here Button */}
          {currentScreen !== 'home' &&
            currentScreen !== 'provider-dashboard' &&
            currentScreen !== 'admin-dashboard' &&
            currentScreen !== 'user-auth-dashboard' && (
              <button
                type="button"
                onClick={handleOpenPostModal}
                className="px-2.5 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-[10px] rounded-xl shadow-md active:scale-95 transition cursor-pointer flex items-center space-x-1"
                title="Post in this Category"
              >
                <span>+</span>
                <span>Post Here</span>
              </button>
            )}

          {/* 🛒 Universal Shopping Cart Button */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition cursor-pointer active:scale-90 border ${
              cartCount > 0
                ? 'bg-amber-400/20 border-amber-400/80 text-amber-300 shadow-md'
                : isDark
                ? 'bg-slate-900/90 border-slate-800 hover:bg-slate-800 text-slate-300'
                : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700'
            }`}
            title="Open Cart & Selected Items"
          >
            <span className="text-sm">🛍️</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center">
                <span className="relative inline-flex items-center justify-center rounded-full h-3.5 w-3.5 bg-amber-400 text-[8.5px] font-black text-slate-950 shadow-xs">
                  {cartCount}
                </span>
              </span>
            )}
          </button>

          {/* 🔔 Live Alerts Button */}
          <button
            type="button"
            onClick={() => {
              window.history.pushState({ modal: true }, '');
              setIsNotificationsOpen(true);
            }}
            className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition cursor-pointer active:scale-90 border ${
              unreadNotifCount > 0
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400/70 shadow-md shadow-amber-500/20'
                : isDark
                ? 'bg-slate-900/90 border-slate-800 hover:bg-slate-800 text-slate-300'
                : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700'
            }`}
            title="Open Town Alerts"
          >
            <span className={`text-sm ${unreadNotifCount > 0 ? 'animate-bounce' : ''}`}>🔔</span>

            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex items-center justify-center rounded-full h-3 w-3 bg-rose-600 text-[8px] font-black text-white">
                  {unreadNotifCount}
                </span>
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 🌟 2. Main Active View Router */}
      <main className="flex-1">
        {currentScreen === 'home' && (
          <HyperlocalHomeFeed
            userLocation={userLocation}
            isLocating={isLocating}
            onRefreshLocation={detectLocation}
            onSelectCategory={handleOpenCategory}
            onSelectIntent={(category, subCategory) => handleOpenFeed(category, subCategory)}
            onSelectItem={(item) => {
              window.history.pushState({ modal: true }, '');
              setSelectedDetailItem(item);
            }}
            searchQuery={searchQuery}
            onSearchChange={(q) => navigateTo({ searchQuery: q })}
          />
        )}

        <Suspense fallback={<ScreenSkeleton />}>
          {currentScreen === 'user-auth-dashboard' && (
            <UserAuthDashboard
              selectedCity={selectedCity}
              onBack={goBack}
              onAuthSuccess={(profile) => {
                setCurrentUser(profile);
                goBack();
              }}
            />
          )}

          {currentScreen === 'provider-dashboard' && (
            <ProviderDashboard onBack={goBack} />
          )}

          {currentScreen === 'town-hub' && (
            <TownHubView
              category={selectedCategory}
              selectedCity={selectedCity}
              onSelectSubCategory={(sub) => handleOpenFeed(selectedCategory, sub)}
              onBack={goToHome}
            />
          )}

          {currentScreen === 'admin-dashboard' && (
            <AdminDashboard
              selectedCity={selectedCity}
              onBack={goToHome}
            />
          )}

          {currentScreen === 'medical-hub' && (
            <MedicalHub
              selectedCity={selectedCity}
              onSelectSubCategory={(sub) => handleOpenFeed('medical', sub)}
              onPostClick={handleOpenPostModal}
              onBack={goToHome}
            />
          )}

          {currentScreen === 'property-hub' && (
            <PropertyHub
              selectedCity={selectedCity}
              onSelectSubCategory={(sub) => handleOpenFeed('property', sub)}
              onPostClick={handleOpenPostModal}
              onBack={goToHome}
            />
          )}

          {currentScreen === 'vehicle-hub' && (
            <VehicleHub
              selectedCity={selectedCity}
              onSelectSubCategory={(sub) => handleOpenFeed('vehicles', sub)}
              onPostClick={handleOpenPostModal}
              onBack={goToHome}
            />
          )}

          {currentScreen === 'electronics-hub' && (
            <ElectronicsHub
              selectedCity={selectedCity}
              onSelectSubCategory={(sub) => handleOpenFeed('electronics', sub)}
              onPostClick={handleOpenPostModal}
              onBack={goToHome}
            />
          )}

          {currentScreen === 'fashion-hub' && (
            <FashionHub
              selectedCity={selectedCity}
              onSelectSubCategory={(sub) => handleOpenFeed('fashion', sub)}
              onPostClick={handleOpenPostModal}
              onBack={goToHome}
            />
          )}

          {currentScreen === 'furniture-hub' && (
            <FurnitureHub
              selectedCity={selectedCity}
              onSelectSubCategory={(sub) => handleOpenFeed('furniture', sub)}
              onPostClick={handleOpenPostModal}
              onBack={goToHome}
            />
          )}

          {currentScreen === 'kaarigar-hub' && (
            <KaarigarHub
              selectedCity={selectedCity}
              onSelectSubCategory={(sub) => handleOpenFeed('kaarigar', sub)}
              onPostClick={handleOpenPostModal}
              onBack={goToHome}
            />
          )}

          {currentScreen === 'transporter-hub' && (
            <TransporterHub
              selectedCity={selectedCity}
              onSelectSubCategory={(sub) => handleOpenFeed('transporters', sub)}
              onPostClick={handleOpenPostModal}
              onBack={goToHome}
            />
          )}

          {currentScreen === 'white-collar-hub' && (
            <WhiteCollarHub
              selectedCity={selectedCity}
              onSelectSubCategory={(sub) => handleOpenFeed('white-collar', sub)}
              onPostClick={handleOpenPostModal}
              onBack={goToHome}
            />
          )}

          {currentScreen === 'education-hub' && (
            <EducationHub
              selectedCity={selectedCity}
              onSelectSubCategory={(sub) => handleOpenFeed('education', sub)}
              onPostClick={handleOpenPostModal}
              onBack={goToHome}
            />
          )}

          {currentScreen === 'restaurants-hub' && (
            <RestaurantsHub
              selectedCity={selectedCity}
              onSelectSubCategory={(sub) => handleOpenFeed('restaurants', sub)}
              onPostClick={handleOpenPostModal}
              onBack={goToHome}
            />
          )}

          {currentScreen === 'malls-hub' && (
            <MallsHub
              selectedCity={selectedCity}
              onSelectSubCategory={(sub) => handleOpenFeed('malls', sub)}
              onPostClick={handleOpenPostModal}
              onBack={goToHome}
            />
          )}

          {currentScreen === 'shaadi-hub' && (
            <ShaadiHub
              selectedCity={selectedCity}
              onSelectSubCategory={(sub) => handleOpenFeed('shaadi', sub)}
              onPostClick={handleOpenPostModal}
              onBack={goToHome}
            />
          )}

          {currentScreen === 'festival-hub' && (
            <FestivalHub
              selectedCity={selectedCity}
              onSelectSubCategory={(sub) => handleOpenFeed('festival', sub)}
              onSelectFestivalCategory={(sub) => handleOpenFeed('festival', sub)}
              onPostClick={handleOpenPostModal}
              onBack={goToHome}
            />
          )}

          {currentScreen === 'construction-hub' && (
            <ConstructionHub
              selectedCity={selectedCity}
              onSelectSubCategory={(sub) => handleOpenFeed('construction', sub)}
              onPostClick={handleOpenPostModal}
              onBack={goToHome}
            />
          )}

          {currentScreen === 'advertising-hub' && (
            <AdvertisingHub
              selectedCity={selectedCity}
              onSelectSubCategory={(sub) => handleOpenFeed('advertising', sub)}
              onPostClick={handleOpenPostModal}
              onBack={goToHome}
            />
          )}

          {currentScreen === 'community-hub' && (
            <CommunityHub
              selectedCity={selectedCity}
              onSelectSubCategory={(sub) => handleOpenFeed('community', sub)}
              onPostClick={handleOpenPostModal}
              onBack={goToHome}
            />
          )}

          {currentScreen === 'market-hub' && (
            <MarketHub
              selectedCity={selectedCity}
              onSelectSubCategory={(sub) => handleOpenFeed('market', sub)}
              onPostClick={handleOpenPostModal}
              onBack={goToHome}
            />
          )}

          {currentScreen === 'buysell-hub' && (
            <ReCommerceHub
              selectedCity={selectedCity}
              onSelectSubCategory={(sub) => handleOpenFeed('recommerce', sub)}
              onPostClick={handleOpenPostModal}
              onBack={goToHome}
            />
          )}

          {currentScreen === 'fitness-hub' && (
            <FitnessHub
              selectedCity={selectedCity}
              onSelectSubCategory={(sub) => handleOpenFeed('fitness', sub)}
              onPostClick={handleOpenPostModal}
              onBack={goToHome}
            />
          )}

          {currentScreen === 'creators-hub' && (
            <CreatorsHub
              selectedCity={selectedCity}
              onSelectSubCategory={(sub) => handleOpenFeed('creators', sub)}
              onPostClick={handleOpenPostModal}
              onBack={goToHome}
            />
          )}

          {/* Feeds */}
          {currentScreen === 'listings' && (
            <ListingsFeed
              selectedCategory={selectedCategory}
              selectedSubCategory={selectedSubCategory}
              selectedCity={selectedCity}
              searchQuery={searchQuery}
              onBack={goBack}
              onNewNotification={handleNewNotification}
            />
          )}
          {currentScreen === 'property-feed' && (
            <PropertyFeed
              selectedSubCategory={selectedSubCategory}
              selectedCity={selectedCity}
              searchQuery={searchQuery}
              onBack={goBack}
              onNewNotification={handleNewNotification}
            />
          )}
          {currentScreen === 'medical-feed' && (
            <MedicalFeed
              selectedSubCategory={selectedSubCategory}
              selectedCity={selectedCity}
              searchQuery={searchQuery}
              onBack={goBack}
              onNewNotification={handleNewNotification}
            />
          )}
          {currentScreen === 'kaarigar-feed' && (
            <KaarigarWorkerList
              selectedSubCategory={selectedSubCategory}
              selectedCity={selectedCity}
              searchQuery={searchQuery}
              onBack={goBack}
              onNewNotification={handleNewNotification}
            />
          )}
          {currentScreen === 'transporter-feed' && (
            <TransporterFeed
              selectedSubCategory={selectedSubCategory}
              selectedCity={selectedCity}
              searchQuery={searchQuery}
              onBack={goBack}
              onNewNotification={handleNewNotification}
            />
          )}
          {currentScreen === 'white-collar-feed' && (
            <WhiteCollarFeed
              selectedSubCategory={selectedSubCategory}
              selectedCity={selectedCity}
              searchQuery={searchQuery}
              onBack={goBack}
              onNewNotification={handleNewNotification}
            />
          )}
          {currentScreen === 'education-feed' && (
            <EducationFeed
              selectedSubCategory={selectedSubCategory}
              selectedCity={selectedCity}
              searchQuery={searchQuery}
              onBack={goBack}
              onNewNotification={handleNewNotification}
            />
          )}
          {currentScreen === 'restaurants-feed' && (
            <RestaurantsFeed
              selectedSubCategory={selectedSubCategory}
              selectedCity={selectedCity}
              searchQuery={searchQuery}
              onBack={goBack}
              onNewNotification={handleNewNotification}
            />
          )}
          {currentScreen === 'malls-feed' && (
            <MallsFeed
              selectedSubCategory={selectedSubCategory}
              selectedCity={selectedCity}
              searchQuery={searchQuery}
              onBack={goBack}
              onNewNotification={handleNewNotification}
            />
          )}
          {currentScreen === 'shaadi-feed' && (
            <ShaadiFeed
              selectedSubCategory={selectedSubCategory}
              selectedCity={selectedCity}
              searchQuery={searchQuery}
              onBack={goBack}
              onNewNotification={handleNewNotification}
            />
          )}
          {currentScreen === 'festival-feed' && (
            <FestivalFeed
              selectedCategory={selectedCategory}
              selectedSubCategory={selectedSubCategory}
              selectedCity={selectedCity}
              searchQuery={searchQuery}
              onBack={goBack}
              onNewNotification={handleNewNotification}
            />
          )}
          {currentScreen === 'construction-feed' && (
            <ConstructionFeed
              selectedSubCategory={selectedSubCategory}
              selectedCity={selectedCity}
              searchQuery={searchQuery}
              onBack={goBack}
              onNewNotification={handleNewNotification}
            />
          )}
          {currentScreen === 'advertising-feed' && (
            <AdvertisingFeed
              selectedSubCategory={selectedSubCategory}
              selectedCity={selectedCity}
              searchQuery={searchQuery}
              onBack={goBack}
              onNewNotification={handleNewNotification}
            />
          )}
          {currentScreen === 'community-feed' && (
            <CommunityFeed
              selectedSubCategory={selectedSubCategory}
              selectedCity={selectedCity}
              searchQuery={searchQuery}
              onBack={goBack}
              onNewNotification={handleNewNotification}
            />
          )}
          {currentScreen === 'market-feed' && (
            <MarketFeed
              selectedSubCategory={selectedSubCategory}
              selectedCity={selectedCity}
              searchQuery={searchQuery}
              onBack={goBack}
              onNewNotification={handleNewNotification}
            />
          )}
          {currentScreen === 'recommerce-feed' && (
            <ReCommerceFeed
              selectedSubCategory={selectedSubCategory}
              selectedCity={selectedCity}
              searchQuery={searchQuery}
              onBack={goBack}
              onNewNotification={handleNewNotification}
            />
          )}
          {currentScreen === 'fitness-feed' && (
            <FitnessFeed
              selectedSubCategory={selectedSubCategory}
              selectedCity={selectedCity}
              searchQuery={searchQuery}
              onBack={goBack}
              onNewNotification={handleNewNotification}
            />
          )}
          {currentScreen === 'creators-feed' && (
            <CreatorsFeed
              selectedSubCategory={selectedSubCategory}
              selectedCity={selectedCity}
              searchQuery={searchQuery}
              onBack={goBack}
              onNewNotification={handleNewNotification}
            />
          )}
        </Suspense>
      </main>

      {/* 🌟 3. Bottom Navigation Bar */}
      <footer
        className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto backdrop-blur-md border-t px-6 py-2 z-30 flex items-center justify-around shadow-2xl transition-colors ${
          isDark
            ? 'bg-slate-950/95 border-slate-800'
            : 'bg-white/95 border-slate-200'
        }`}
      >
        <button
          type="button"
          onClick={() => navigateTo({ screen: 'home', searchQuery: '' })}
          className={`flex flex-col items-center cursor-pointer transition active:scale-90 ${
            currentScreen === 'home'
              ? 'text-amber-500 font-black'
              : isDark
              ? 'text-slate-400 hover:text-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="text-lg">🏛️</span>
          <span className="text-[10px] font-bold">Town Hub</span>
        </button>

        {/* Floating Post Button */}
        <button
          type="button"
          onClick={handleOpenPostModal}
          className={`w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-xl font-black shadow-lg active:scale-95 hover:scale-105 transition -mt-5 ring-4 cursor-pointer ${
            isDark ? 'ring-slate-950' : 'ring-white'
          }`}
          title={isAuthorizedToPost ? 'Post Listing / Business' : 'Open for Business side'}
        >
          +
        </button>

        {/* Business Hub Button */}
        <button
          type="button"
          onClick={handleOpenBusinessHub}
          className={`flex flex-col items-center cursor-pointer transition active:scale-90 ${
            currentScreen === 'provider-dashboard'
              ? 'text-amber-500 font-black'
              : isDark
              ? 'text-slate-400 hover:text-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="text-lg">📊</span>
          <span className="text-[10px] font-bold">My Business</span>
        </button>
      </footer>

      {/* 🌟 4. Modals & Drawers */}
      <Suspense fallback={null}>
        {/* 🔗 1-Tap Deep-Linked Item (Direct WhatsApp Link Opener) */}
        {deepLinkedItem && (
          <ListingDetailModal
            item={deepLinkedItem}
            selectedCity={selectedCity}
            onClose={() => {
              setDeepLinkedItem(null);
              window.history.replaceState({}, document.title, window.location.pathname);
            }}
            onNewNotification={handleNewNotification}
          />
        )}

        {isListingModalOpen && isAuthorizedToPost && (
          <ContextualListingModal
            currentScreen={currentScreen}
            selectedCategory={selectedCategory}
            selectedSubCategory={selectedSubCategory}
            selectedCity={selectedCity}
            onClose={() => {
              if (activeModalCloserRef.current) activeModalCloserRef.current();
            }}
          />
        )}

        {selectedDetailItem && (
          <ListingDetailModal
            item={selectedDetailItem}
            selectedCity={selectedCity}
            onClose={() => {
              if (activeModalCloserRef.current) activeModalCloserRef.current();
            }}
            onNewNotification={handleNewNotification}
          />
        )}
      </Suspense>

      {/* 🛒 Universal Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOpenAuth={() => {
          setIsCartOpen(false);
          setIsAuthModalOpen(true);
        }}
      />

      {/* 🏪 Business Side Onboarding Prompt for Non-Seller Residents */}
      {isBusinessPromptOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fade-in text-slate-100 font-sans">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 text-2xl flex items-center justify-center mx-auto shadow-lg">
              🏪
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-slate-100 leading-snug">
                Become a Seller to Post Listings & Offers
              </h3>
              <p className="text-xs text-amber-300 font-bold">
                यह सुविधा केवल विक्रेताओं के लिए है — क्या आप विक्रेता बनकर जुड़ना चाहते हैं?
              </p>
              <p className="text-[10.5px] text-slate-400 leading-relaxed pt-1">
                Complete the KYC process (Login ➔ Profile ➔ 6-Digit WhatsApp PIN ➔ ₹1 UPI KYC) to list inventory across {selectedCity}.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsBusinessPromptOpen(false);
                  navigateTo({ screen: 'user-auth-dashboard', searchQuery: '' });
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>🏪</span>
                <span>Become a Seller / Complete KYC ➔</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBusinessPromptOpen(false)}
                className="w-full py-2 text-slate-400 hover:text-slate-200 text-[10px] font-bold cursor-pointer"
              >
                रद्द करें / Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 👑 Admin Key Modal */}
      <AdminKeyModal
        isOpen={isAdminKeyModalOpen}
        onClose={() => setIsAdminKeyModalOpen(false)}
        onSuccess={() => {
          setIsAdminUnlocked(true);
          setIsAdminKeyModalOpen(false);
          setIsListingModalOpen(true);
        }}
      />

      {/* Role-Filtered Notification Center Drawer */}
      {isNotificationsOpen && (
        <NotificationCenter
          notifications={roleFilteredAlerts}
          currentUser={currentUser}
          currentScreen={currentScreen}
          isAdminMode={currentScreen === 'admin-dashboard'}
          onClose={() => setIsNotificationsOpen(false)}
          onMarkAllRead={() => hyperlocalStore.markAllNotificationsRead()}
          onSelectNotification={handleSelectNotification}
        />
      )}

      {/* Resident Staged Onboarding & Seller KYC Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        selectedCity={selectedCity}
        actionTitle={authActionTitle}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(profile) => {
          setCurrentUser(profile);
          setIsAuthModalOpen(false);
          const upgradedSeller = Boolean(
            profile?.is_merchant === true ||
            profile?.verification_tier === 'verified_merchant'
          );
          if (upgradedSeller) {
            setIsListingModalOpen(true);
          } else if (authActionTitle.includes('Business')) {
            navigateTo({ screen: 'provider-dashboard', searchQuery: '' });
          }
        }}
      />

      {/* 📲 1-Tap Home Screen Install Prompt */}
      <PWAInstallBanner />

      {/* 📈 Performance & Web Analytics Metrics */}
      <SpeedInsights />
      <Analytics />
    </div>
  );
}