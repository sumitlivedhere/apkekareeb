import React, { useState, useMemo, useEffect } from 'react';
import { useStoreSlice, parseNumericPrice } from '../store/hyperlocalStore';
import ListingInteractiveCard from './common/ListingInteractiveCard';
import ListingDetailModal from './common/ListingDetailModal';
import CategoryPromotionsBar from './common/CategoryPromotionsBar';
import { matchesFestivalSubCategory } from '../categories/FestivalHub';
import { CITY_ZONES } from '../data/cityZones';

const FESTIVAL_TABS = [
  { id: 'all', label: 'All Festival & Melas', icon: '🪔' },
  { id: 'mela-exhibitions', label: 'Melas & Fairs', icon: '🎡' },
  { id: 'sweets-gifting', label: 'Sweets & Gift Hampers', icon: '🎁' },
  { id: 'decor-lights', label: 'Lights & Decor', icon: '✨' },
  { id: 'fashion-bazaar', label: 'Festive Sales & Bazaar', icon: '🛍️' },
];

export default function FestivalFeed({
  selectedSubCategory = 'all',
  subCategory,
  initialSubCategory,
  selectedCity = 'Alwar',
  searchQuery = '',
  onBack,
  onPostClick,
  onNewNotification,
}) {
  const festivalListings = useStoreSlice('festivalListings');

  const resolvedInitialSub =
    selectedSubCategory || subCategory || initialSubCategory || 'all';

  const [activeSub, setActiveSub] = useState(resolvedInitialSub);
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const [selectedLocality, setSelectedLocality] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  // Sync tab whenever parent changes selectedSubCategory
  useEffect(() => {
    const nextSub = selectedSubCategory || subCategory || initialSubCategory;
    if (nextSub) {
      setActiveSub(nextSub);
    }
  }, [selectedSubCategory, subCategory, initialSubCategory]);

  const filteredListings = useMemo(() => {
    let list = (festivalListings || []).filter(
      (item) => item && item.is_active !== false && !item.has_pending_approval
    );

    // 1. Subcategory filter (with alias & keyword support)
    if (activeSub !== 'all') {
      list = list.filter((item) => matchesFestivalSubCategory(item, activeSub));
    }

    // 2. Locality filter
    if (selectedLocality !== 'all') {
      list = list.filter((item) =>
        String(item.location || item.location_name || '')
          .toLowerCase()
          .includes(selectedLocality.toLowerCase())
      );
    }

    // 3. Search query filter
    const q = (localSearch || searchQuery || '').toLowerCase().trim();
    if (q) {
      list = list.filter(
        (item) =>
          String(item.title || item.name || '').toLowerCase().includes(q) ||
          String(item.sellerName || item.seller_name || '').toLowerCase().includes(q) ||
          String(item.description || '').toLowerCase().includes(q) ||
          String(item.deal_badge || '').toLowerCase().includes(q) ||
          String(item.location || item.location_name || '').toLowerCase().includes(q)
      );
    }

    // 4. Sort
    return [...list].sort((a, b) => {
      const aPromo = a.is_promoted || a.deal_type === 'PAID_PROMO' ? 1 : 0;
      const bPromo = b.is_promoted || b.deal_type === 'PAID_PROMO' ? 1 : 0;
      if (bPromo !== aPromo) return bPromo - aPromo;

      if (sortBy === 'rating') {
        return Number(b.rating || 4.8) - Number(a.rating || 4.8);
      }
      if (sortBy === 'price_asc') {
        const pA = parseNumericPrice(String(a.price || '')) || 0;
        const pB = parseNumericPrice(String(b.price || '')) || 0;
        return pA - pB;
      }
      if (sortBy === 'price_desc') {
        const pA = parseNumericPrice(String(a.price || '')) || 0;
        const pB = parseNumericPrice(String(b.price || '')) || 0;
        return pB - pA;
      }
      return Number(b.interestCount || 0) - Number(a.interestCount || 0);
    });
  }, [festivalListings, activeSub, selectedLocality, localSearch, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 px-3.5 pt-3 space-y-4 font-sans select-none">
      
      {/* Top Header & Filter Controls */}
      <div className="p-4 rounded-3xl bg-[#0e1720] border border-[#1d2b38] shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center space-x-1.5 cursor-pointer active:scale-95 transition"
          >
            <span>←</span>
            <span>Back to Hub</span>
          </button>

          {onPostClick && (
            <button
              type="button"
              onClick={onPostClick}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-xs shadow cursor-pointer active:scale-95 transition"
            >
              + Post Festive Offer / Mela
            </button>
          )}
        </div>

        <div>
          <h1 className="text-base font-black text-white flex items-center space-x-2">
            <span>🪔</span>
            <span>Festival Offers & Melas • {selectedCity}</span>
          </h1>
          <p className="text-[11px] text-amber-400 font-bold">
            त्योहार व मेला ऑफर्स — Tap any card for full details, reviews, cart & map ({filteredListings.length})
          </p>
        </div>

        {/* Subcategory Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          {FESTIVAL_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSub(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                activeSub === tab.id
                  ? 'bg-amber-400 text-slate-950 font-black shadow'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search, Locality & Sort Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search Mela, Kalakand, Lights, Sale..."
            className="bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-bold outline-none"
          />

          <select
            value={selectedLocality}
            onChange={(e) => setSelectedLocality(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 font-bold outline-none"
          >
            <option value="all">📍 All {selectedCity} Locations</option>
            {Object.keys(CITY_ZONES || {}).map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-amber-300 font-bold outline-none"
          >
            <option value="popular">🔥 Most Popular First</option>
            <option value="rating">⭐ Highest Rated</option>
            <option value="price_asc">💰 Price: Low to High</option>
            <option value="price_desc">💎 Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Paid Promotions Spotlight */}
      <CategoryPromotionsBar
        category="festival"
        selectedCity={selectedCity}
        onSelectListing={(item) => setSelectedDetailItem(item)}
      />

      {/* Interactive Clickable Listings Stream */}
      {filteredListings.length === 0 ? (
        <div className="p-12 text-center bg-[#0e1720] border border-slate-800 rounded-3xl space-y-3">
          <span className="text-4xl block">🪔</span>
          <h3 className="text-sm font-black text-white">No Listings in This Subcategory Yet</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Have a festive sale, sweet shop, lighting service, or mela stall in {selectedCity}? Post it here!
          </p>
          {activeSub !== 'all' && (
            <button
              type="button"
              onClick={() => setActiveSub('all')}
              className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
            >
              Show All Festival Listings
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredListings.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedDetailItem(item)}
              className="cursor-pointer"
            >
              <ListingInteractiveCard
                item={item}
                listing={item}
                category="festival"
                selectedCity={selectedCity}
                onSelect={() => setSelectedDetailItem(item)}
                onClick={() => setSelectedDetailItem(item)}
                onCardClick={() => setSelectedDetailItem(item)}
                onSelectListing={() => setSelectedDetailItem(item)}
                onNewNotification={onNewNotification}
              />
            </div>
          ))}
        </div>
      )}

      {/* Full Listing Detail Modal */}
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