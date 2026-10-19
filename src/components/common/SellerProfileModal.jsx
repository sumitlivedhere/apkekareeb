import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSellerProfileSlice, hyperlocalStore } from '../../store/hyperlocalStore';
import {
  fetchSellerProfileFromDB,
  fetchSellerListingsFromDB,
  getCategoryFallback,
} from '../../services/listingService';
import { getCurrentUserProfile } from '../../services/authService';

export default function SellerProfileModal({
  isOpen: propIsOpen,
  seller: propSeller,
  onClose: propOnClose,
  onSelectListing,
  selectedCity = 'Alwar',
}) {
  // 1. Reactive Store Hook (Fallback for global use)
  const storeSlice = useSellerProfileSlice();

  const isModalOpen = propIsOpen !== undefined ? propIsOpen : storeSlice.isSellerProfileOpen;
  const targetSeller = propSeller || storeSlice.selectedSeller;
  const handleClose = propOnClose || storeSlice.closeSellerProfile;

  // 2. Component State
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryTab, setActiveCategoryTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedToast, setCopiedToast] = useState(false);

  // 3. Data Fetching Pipeline (Database + Instant Local Memory Fallback)
  useEffect(() => {
    if (!isModalOpen || !targetSeller) {
      setProfile(null);
      setListings([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    // Initial instant hydrate from memory to prevent white flashes
    const instantLocalItems = hyperlocalStore.getListingsBySeller(targetSeller);
    if (instantLocalItems.length > 0) {
      setListings(instantLocalItems);
    }

    Promise.allSettled([
      fetchSellerProfileFromDB(targetSeller),
      fetchSellerListingsFromDB(targetSeller),
    ]).then(([profileRes, listingsRes]) => {
      if (!isMounted) return;

      if (profileRes.status === 'fulfilled' && profileRes.value) {
        setProfile(profileRes.value);
      }

      if (listingsRes.status === 'fulfilled' && Array.isArray(listingsRes.value)) {
        if (listingsRes.value.length > 0) {
          setListings(listingsRes.value);
        } else if (instantLocalItems.length > 0) {
          setListings(instantLocalItems);
        }
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isModalOpen, targetSeller]);

  // 4. Keyboard Navigation (Escape Key)
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, handleClose]);

  // 5. Computed Attributes
  const businessName =
    profile?.businessName ||
    targetSeller?.sellerName ||
    targetSeller?.businessName ||
    'Verified Local Business';

  const initial = businessName.charAt(0).toUpperCase();

  const rawPhone = profile?.phone || targetSeller?.phone || targetSeller?.whatsapp || '';
  const cleanPhone = String(rawPhone).replace(/\D/g, '').slice(-10);
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const locationDisplay =
    profile?.areaName ||
    targetSeller?.locationName ||
    targetSeller?.location ||
    selectedCity;

  // Dynamic Category Tabs
  const availableCategories = useMemo(() => {
    const set = new Set((listings || []).map((l) => l.category).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [listings]);

  // Search & Tab Filter Pipeline
  const filteredListings = useMemo(() => {
    return (listings || []).filter((item) => {
      const matchesCat = activeCategoryTab === 'all' || item.category === activeCategoryTab;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.subCategory && item.subCategory.toLowerCase().includes(q));

      return matchesCat && matchesSearch;
    });
  }, [listings, activeCategoryTab, searchQuery]);

  // 6. Plan Lookup & Direct User Actions
  const activeSellerPlan = useMemo(() => {
    return hyperlocalStore.getSellerPlan(cleanPhone || profile || targetSeller);
  }, [cleanPhone, profile, targetSeller]);

  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
    `Namaste ${businessName}! 🙏 Maine Aapke Kareeb par aapka store (${locationDisplay}) dekha. Mujhe aapke products/services ke baare mein jankari chahiye.`
  )}`;

  const primaryStoreListing = listings[0] || targetSeller || profile;

  const handleWhatsAppClick = () => {
    if (primaryStoreListing) {
      hyperlocalStore.recordLeadAction(primaryStoreListing, 'whatsapp');
    }
  };

  const handleCallClick = () => {
    if (primaryStoreListing) {
      hyperlocalStore.recordLeadAction(primaryStoreListing, 'call');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${businessName} on Aapke Kareeb`,
      text: `View all listings & services by ${businessName} in ${locationDisplay} on Aapke Kareeb!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2200);
    }
  };

  const handleAddToCart = (e, item) => {
    e.stopPropagation();
    const currentUser = getCurrentUserProfile();
    if (!currentUser) {
      alert('Please sign in to add items to your personal cart.');
      return;
    }

    const res = hyperlocalStore.addToCart(item, 1, currentUser.phone);
    if (res.isSelfListing) {
      alert(res.message);
    } else if (res.success) {
      if ('vibrate' in navigator) navigator.vibrate(35);
    }
  };

  const handleItemSelect = (item) => {
    if (onSelectListing) {
      onSelectListing(item);
    }
    handleClose();
  };

  if (!isModalOpen || !targetSeller) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="seller-storefront-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans select-none animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-slate-950 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Sticky App Bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3.5 bg-slate-950/95 border-b border-slate-800/90 backdrop-blur-md">
          <button
            type="button"
            onClick={handleClose}
            className="flex items-center space-x-1.5 text-xs font-black text-slate-200 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-800 transition active:scale-95 cursor-pointer"
          >
            <span>←</span>
            <span>Back</span>
          </button>

          <span className="text-xs font-black uppercase tracking-wider text-amber-400">
            Business Storefront
          </span>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold border border-slate-800 transition active:scale-90 cursor-pointer"
          >
            ✕
          </button>
        </header>

        {/* Scrollable Catalog Body */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-12">
          
          {/* Merchant Hero Showcase */}
          <div className="p-4 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-900/50 rounded-2xl border border-slate-800 shadow-xl space-y-3.5">
            <div className="flex items-start space-x-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shrink-0">
                {initial}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                  <h1
                    id="seller-storefront-title"
                    className="font-black text-white text-base leading-tight truncate"
                  >
                    {businessName}
                  </h1>
                  <span className="text-[9px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold shrink-0">
                    ✓ Verified
                  </span>
                  {activeSellerPlan?.badge && (
                    <span className="text-[8.5px] font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                      👑 {activeSellerPlan.badge}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mt-1 truncate">
                  📍 {locationDisplay}, {selectedCity}
                </p>

                <div className="flex items-center space-x-2 mt-1.5 text-[10px] text-slate-400 font-medium">
                  <span className="text-amber-400 font-bold">★ 5.0 Rating</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">
                    Trust {profile?.trustScore ?? 100}
                  </span>
                  <span>•</span>
                  <span className="text-cyan-300 font-bold">
                    {listings.length} Offerings
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Contact & Share Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWhatsAppClick}
                className="py-2.5 px-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl flex items-center justify-center space-x-1.5 text-xs font-black transition active:scale-95 shadow-xs"
              >
                <span>💬</span>
                <span className="truncate">WhatsApp</span>
              </a>

              <a
                href={`tel:${cleanPhone}`}
                onClick={handleCallClick}
                className="py-2.5 px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 rounded-xl flex items-center justify-center space-x-1.5 text-xs font-black transition active:scale-95 shadow-xs"
              >
                <span>📞</span>
                <span className="truncate">Call</span>
              </a>

              <button
                type="button"
                onClick={handleShare}
                className="py-2.5 px-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 rounded-xl flex items-center justify-center space-x-1.5 text-xs font-black transition active:scale-95 shadow-xs cursor-pointer"
              >
                <span>🔗</span>
                <span className="truncate">{copiedToast ? 'Copied!' : 'Share'}</span>
              </button>
            </div>
          </div>

          {/* In-Store Search Bar */}
          {listings.length > 3 && (
            <div className="relative">
              <input
                type="text"
                placeholder={`Search in ${businessName}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/80 transition"
              />
              <span className="absolute left-3 top-2.5 text-xs text-slate-500">
                🔍
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Category Tabs (if multi-vertical seller) */}
          {availableCategories.length > 2 && (
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategoryTab(cat)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer active:scale-95 ${
                    activeCategoryTab === cat
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat === 'all'
                    ? `All Offerings (${listings.length})`
                    : String(cat).toUpperCase()}
                </button>
              ))}
            </div>
          )}

          {/* Listings Catalog */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-slate-300 uppercase tracking-wider">
                Offerings & Services ({filteredListings.length})
              </h2>
              <span className="text-[10px] text-slate-500 font-medium">
                Tap to view details
              </span>
            </div>

            {loading && listings.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs font-medium">
                Loading business catalog...
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-slate-400 text-xs space-y-1">
                <p className="font-bold">No items found</p>
                <p className="text-[11px] text-slate-500">
                  {searchQuery
                    ? `No listings match "${searchQuery}"`
                    : 'This seller has no active listings in this category.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredListings.map((item) => {
                  const thumb =
                    item.image ||
                    item.image_url ||
                    (Array.isArray(item.images) && item.images[0]) ||
                    (Array.isArray(item.image_urls) && item.image_urls[0]) ||
                    getCategoryFallback(item.category);

                  const priceLabel =
                    item.price ||
                    item.rent ||
                    item.rates ||
                    item.startingPackage ||
                    'Contact for Price';

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemSelect(item)}
                      className="p-3 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-400/40 rounded-2xl transition cursor-pointer flex items-center space-x-3.5 shadow-sm active:scale-[0.99] group"
                    >
                      <img
                        src={thumb}
                        alt={item.title || item.name}
                        className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-950 border border-slate-800 group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.currentTarget.src = getCategoryFallback(item.category);
                        }}
                      />

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[9px] font-black uppercase text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded-md">
                            {item.subCategory || item.category}
                          </span>
                          {item.capacity && (
                            <span className="text-[9px] font-medium text-cyan-300 bg-cyan-950/60 px-1.5 py-0.2 rounded-md truncate max-w-[120px]">
                              {item.capacity}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-xs text-white truncate leading-tight group-hover:text-amber-300 transition-colors">
                          {item.title || item.name}
                        </h3>

                        <div className="flex items-center justify-between pt-0.5">
                          <span className="text-xs font-black text-amber-400">
                            {priceLabel}
                          </span>

                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={(e) => handleAddToCart(e, item)}
                              className="px-2 py-1 bg-amber-400/15 hover:bg-amber-400 text-amber-300 hover:text-slate-950 text-[10px] font-black rounded-lg border border-amber-400/30 transition active:scale-90"
                              title="Add to Personal Cart"
                            >
                              + 🛒
                            </button>
                            <span className="text-[10px] text-cyan-400 font-bold group-hover:translate-x-0.5 transition-transform">
                              View ➔
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}