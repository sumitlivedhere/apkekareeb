import React, { useState, useMemo } from 'react';
import { useStoreSlice } from '../store/hyperlocalStore';
import ListingInteractiveCard from './common/ListingInteractiveCard';
import ListingDetailModal from './common/ListingDetailModal';
import CategoryPromotionsBar from './common/CategoryPromotionsBar';
import { CITY_ZONES } from '../data/cityZones';

const NEWLY_OPEN_TABS = [
  { id: 'all', label: 'All Newly Open', icon: '🎊' },
  { id: 'new-showroom-store', label: 'New Shops & Showrooms', icon: '🛍️' },
  { id: 'new-food-cafe', label: 'New Cafes & Food', icon: '🍔' },
  { id: 'new-salon-fitness', label: 'New Salons & Gyms', icon: '💇' },
  { id: 'new-services-agency', label: 'New Clinics & Services', icon: '🏥' },
];

export default function MarketFeed({
  selectedSubCategory = 'all',
  selectedCity = 'Alwar',
  searchQuery = '',
  onBack,
  onPostClick,
  onNewNotification,
}) {
  const marketListings = useStoreSlice('marketListings');
  const [activeSub, setActiveSub] = useState(selectedSubCategory || 'all');
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const [selectedLocality, setSelectedLocality] = useState('all');
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  const filteredListings = useMemo(() => {
    let list = (marketListings || []).filter(
      (item) => item && item.is_active !== false && !item.has_pending_approval
    );

    if (activeSub !== 'all') {
      list = list.filter(
        (item) =>
          String(item.subCategory || item.sub_category || '').toLowerCase() ===
          activeSub.toLowerCase()
      );
    }

    if (selectedLocality !== 'all') {
      list = list.filter((item) =>
        String(item.location || item.location_name || '')
          .toLowerCase()
          .includes(selectedLocality.toLowerCase())
      );
    }

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
      const aPromo = a.is_promoted || a.deal_type === 'PAID_PROMO' ? 1 : 0;
      const bPromo = b.is_promoted || b.deal_type === 'PAID_PROMO' ? 1 : 0;
      if (bPromo !== aPromo) return bPromo - aPromo;
      return Number(b.interestCount || 0) - Number(a.interestCount || 0);
    });
  }, [marketListings, activeSub, selectedLocality, localSearch, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 px-3.5 pt-3 space-y-4 font-sans select-none">
      
      {/* Header & Controls */}
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
              + Post Newly Open Business
            </button>
          )}
        </div>

        <div>
          <h1 className="text-base font-black text-white flex items-center space-x-2">
            <span>🎊</span>
            <span>Newly Open • {selectedCity}</span>
          </h1>
          <p className="text-[11px] text-amber-400 font-bold">
            नए खुले व्यापार, शोरूम व उद्घाटन ऑफर्स — Tap any card for full details & reviews ({filteredListings.length})
          </p>
        </div>

        {/* Subcategory Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          {NEWLY_OPEN_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSub(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 ${
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

        {/* Search & Locality Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search new cafes, showrooms, clinics, offers..."
            className="sm:col-span-2 bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-bold outline-none"
          />

          <select
            value={selectedLocality}
            onChange={(e) => setSelectedLocality(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 font-bold outline-none"
          >
            <option value="all">📍 All Locations</option>
            {Object.keys(CITY_ZONES || {}).map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Paid Promotions Bar */}
      <CategoryPromotionsBar
        category="market"
        selectedCity={selectedCity}
        onSelectListing={(item) => setSelectedDetailItem(item)}
      />

      {/* Interactive Clickable Listings Stream */}
      {filteredListings.length === 0 ? (
        <div className="p-12 text-center bg-[#0e1720] border border-slate-800 rounded-3xl space-y-3">
          <span className="text-4xl block">🎊</span>
          <h3 className="text-sm font-black text-white">No Newly Open Listings Found</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Opened a new shop, showroom, cafe, or service in {selectedCity}? Promote your launch here!
          </p>
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
                category="market"
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

      {/* Full Listing Detail Modal (Info, Ratings, Cart, Reviews, Location, Discussion) */}
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