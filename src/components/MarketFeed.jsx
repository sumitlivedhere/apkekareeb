import React, { useState, useMemo } from 'react';
import { useStoreSlice } from '../store/hyperlocalStore';
import ListingInteractiveCard from './common/ListingInteractiveCard';
import ListingDetailModal from './common/ListingDetailModal';
import { CITY_ZONES } from '../data/cityZones';

export default function MarketFeed({
  selectedCity = 'Alwar',
  searchQuery = '',
  onBack,
  onPostClick,
  onNewNotification,
}) {
  const marketListings = useStoreSlice('marketProducts');
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const [selectedLocality, setSelectedLocality] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  // Filter & Sort Direct Business Listings (No Subcategories)
  const displayedBusinesses = useMemo(() => {
    let list = (marketListings || []).filter(
      (item) => item && item.is_active !== false && !item.has_pending_approval
    );

    // Colony / Locality filter
    if (selectedLocality !== 'all') {
      list = list.filter((item) =>
        String(item.location || item.location_name || '')
          .toLowerCase()
          .includes(selectedLocality.toLowerCase())
      );
    }

    // Search query filter
    const q = (localSearch || searchQuery || '').toLowerCase().trim();
    if (q) {
      list = list.filter(
        (item) =>
          String(item.title || item.name || '').toLowerCase().includes(q) ||
          String(item.sellerName || item.seller_name || '').toLowerCase().includes(q) ||
          String(item.description || '').toLowerCase().includes(q) ||
          String(item.location || item.location_name || '').toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      // Promoted / Featured businesses first
      const aPromo = a.is_promoted || a.deal_type === 'PAID_PROMO' ? 1 : 0;
      const bPromo = b.is_promoted || b.deal_type === 'PAID_PROMO' ? 1 : 0;
      if (bPromo !== aPromo) return bPromo - aPromo;

      if (sortBy === 'popular') {
        return (Number(b.interestCount || 0) - Number(a.interestCount || 0));
      }
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return bTime - aTime;
    });
  }, [marketListings, localSearch, searchQuery, selectedLocality, sortBy]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 px-3.5 pt-3 space-y-4 font-sans select-none">
      
      {/* 🎊 1. Top Navigation & Newly Open Header */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#131d28] via-[#0e1720] to-[#1a1829] border border-amber-400/30 shadow-2xl space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center space-x-1.5 cursor-pointer active:scale-95 transition"
          >
            <span>←</span>
            <span>Home</span>
          </button>

          <span className="px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
            🎊 City Business Spotlight
          </span>
        </div>

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="space-y-1">
            <h1 className="text-base sm:text-lg font-black text-white flex items-center space-x-2">
              <span>🎊</span>
              <span>Newly Open in {selectedCity}</span>
            </h1>
            <p className="text-xs font-bold text-amber-400">
              नए खुले स्टोर, शोरूम व व्यापार प्रचार • Direct Business Showcase
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Explore newly launched shops, showrooms, cafes, clinics, and city business promotions across {selectedCity}.
            </p>
          </div>
        </div>

        {/* Direct Business Marketing CTA Banner */}
        {onPostClick && (
          <div className="p-3 rounded-2xl bg-slate-950/90 border border-amber-400/40 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black text-white truncate">
                📢 Opened a New Shop or Promoting Your Business?
              </p>
              <p className="text-[10.5px] text-slate-400 truncate">
                अपने नए व्यापार या स्टोर का सीधा विज्ञापन यहाँ डालें
              </p>
            </div>
            <button
              type="button"
              onClick={onPostClick}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-xs shrink-0 shadow-md cursor-pointer active:scale-95 transition"
            >
              + List Business
            </button>
          </div>
        )}

        {/* Search & Locality Filter Bar (Zero Subcategories) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search store name, offer, locality..."
            className="sm:col-span-2 bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-bold outline-none"
          />

          <div className="grid grid-cols-2 gap-1.5">
            <select
              value={selectedLocality}
              onChange={(e) => setSelectedLocality(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-[11px] text-slate-200 font-bold outline-none"
            >
              <option value="all">All Colonies</option>
              {Object.keys(CITY_ZONES || {}).map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-[11px] text-amber-300 font-bold outline-none"
            >
              <option value="newest">🕒 Newest</option>
              <option value="popular">⭐ Popular</option>
            </select>
          </div>
        </div>
      </div>

      {/* 🏪 2. Direct Business Listings Feed */}
      {displayedBusinesses.length === 0 ? (
        <div className="p-12 text-center bg-[#0e1720] border border-slate-800/80 rounded-3xl space-y-3">
          <span className="text-4xl block">🎊</span>
          <h3 className="text-sm font-black text-white">
            No Newly Open Businesses Listed Yet
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Be the first business in {selectedCity} to showcase your grand opening, new showroom, or store launch here!
          </p>
          {onPostClick && (
            <button
              type="button"
              onClick={onPostClick}
              className="mt-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg cursor-pointer active:scale-95 transition"
            >
              + Post Newly Open Business
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayedBusinesses.map((item) => (
            <ListingInteractiveCard
              key={item.id}
              item={item}
              category="market"
              selectedCity={selectedCity}
              onSelect={() => setSelectedDetailItem(item)}
              onNewNotification={onNewNotification}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedDetailItem && (
        <ListingDetailModal
          item={selectedDetailItem}
          selectedCity={selectedCity}
          onClose={() => setSelectedDetailItem(null)}
          onNewNotification={onNewNotification}
          onSelectListing={(nextItem) => setSelectedDetailItem(nextItem)}
        />
      )}
    </div>
  );
}