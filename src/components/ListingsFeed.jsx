import React, { useState, useMemo } from 'react';
import { useStoreSlice } from '../store/hyperlocalStore';
import { getCategoryById } from '../data/taxonomyRegistry';
import ListingInteractiveCard from './common/ListingInteractiveCard';

export default function ListingsFeed({
  selectedCategory = 'vehicles',
  selectedSubCategory = 'all',
  selectedCity = 'Alwar',
  searchQuery = '',
  onBack,
  onNewNotification,
}) {
  const storeListings = useStoreSlice('listings') || [];
  const categoryConfig = getCategoryById(selectedCategory) || { subCategories: [] };
  const subCategories = categoryConfig.subCategories || [];

  // Filter Chips State: 'all' | 'deals' | 'exchange' | 'trial'
  const [dealFilter, setDealFilter] = useState('all');

  const filteredListings = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    const city = (selectedCity || '').toLowerCase().trim();
    const sub = (selectedSubCategory || 'all').toLowerCase().trim();

    return storeListings.filter((item) => {
      if (!item) return false;

      // 1. Category Check
      const itemCat = String(item.category || '').toLowerCase().trim();
      if (itemCat && itemCat !== selectedCategory.toLowerCase()) return false;

      // 2. City Check
      const loc = (item.location || item.city || '').toLowerCase();
      const matchesCity = !city || loc.includes(city) || city.includes(loc) || !loc;
      if (!matchesCity) return false;

      // 3. Subcategory Check
      if (sub !== 'all') {
        const itemSub = String(item.subCategory || '').toLowerCase().trim();
        const matchesSub = itemSub === sub || itemSub.includes(sub) || sub.includes(itemSub);
        if (!matchesSub) return false;
      }

      // 4. Promotional Deal Filter
      const dealBadge = item.deal_badge || item.dealBadge;
      const dealType = item.deal_type || item.dealType;
      const hasTrial = item.doorstep_trial ?? item.doorstepTrial;

      if (dealFilter === 'deals' && !dealBadge) return false;
      if (
        dealFilter === 'exchange' &&
        dealType !== 'exchange' &&
        !String(dealBadge || '').toLowerCase().includes('exchange') &&
        !String(dealBadge || '').toLowerCase().includes('badlo') &&
        !String(dealBadge || '').toLowerCase().includes('scrap')
      ) {
        return false;
      }
      if (dealFilter === 'trial' && !hasTrial) return false;

      // 5. Search Query Check
      if (!q) return true;
      return (
        item.title?.toLowerCase().includes(q) ||
        item.name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q) ||
        dealBadge?.toLowerCase().includes(q)
      );
    });
  }, [storeListings, selectedCategory, selectedSubCategory, selectedCity, searchQuery, dealFilter]);

  const getSubCategoryTitle = () => {
    if (selectedSubCategory === 'all') return categoryConfig.name || 'All Listings';
    const matched = subCategories.find((s) => s.id === selectedSubCategory);
    return matched ? matched.name : selectedSubCategory.toUpperCase();
  };

  const activeDealsCount = useMemo(() => {
    return storeListings.filter(
      (i) =>
        String(i.category || '').toLowerCase() === selectedCategory.toLowerCase() &&
        Boolean(i.deal_badge || i.dealBadge)
    ).length;
  }, [storeListings, selectedCategory]);

  return (
    <main className="p-3.5 space-y-3.5 relative z-10 animate-fade-in text-slate-800 pb-20">
      {/* Feed Top Header */}
      <div className="bg-white/90 backdrop-blur-md p-3.5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-900 capitalize">
            {getSubCategoryTitle().split('(')[0]}
          </h2>
          <p className="text-[10px] text-slate-500 font-semibold">
            {filteredListings.length} verified listings in {selectedCity}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl font-bold active:scale-95 transition cursor-pointer"
        >
          ← Categories
        </button>
      </div>

      {/* 🌟 1-Tap Promotional Deal Filter Chips */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px] font-bold">
        <button
          type="button"
          onClick={() => setDealFilter('all')}
          className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
            dealFilter === 'all'
              ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          🌟 All Items ({filteredListings.length})
        </button>

        <button
          type="button"
          onClick={() => setDealFilter('deals')}
          className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
            dealFilter === 'deals'
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black shadow-sm'
              : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-50'
          }`}
        >
          <span>🔥</span>
          <span>Offers & Combos Only {activeDealsCount > 0 && `(${activeDealsCount})`}</span>
        </button>

        <button
          type="button"
          onClick={() => setDealFilter('exchange')}
          className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
            dealFilter === 'exchange'
              ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          🔄 Exchange Available
        </button>

        <button
          type="button"
          onClick={() => setDealFilter('trial')}
          className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
            dealFilter === 'trial'
              ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          🚚 Ghar Par Trial
        </button>
      </div>

      {/* Feed Cards Stream */}
      {filteredListings.length === 0 ? (
        <div className="bg-white/80 rounded-3xl p-8 text-center border border-slate-200 space-y-1.5 shadow-xs">
          <span className="text-3xl block">{categoryConfig.icon || '🏪'}</span>
          <p className="text-slate-800 font-bold text-xs">
            No listings found under this filter in {selectedCity}.
          </p>
          {dealFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setDealFilter('all')}
              className="text-[10.5px] font-bold text-amber-700 underline cursor-pointer mt-1"
            >
              Reset to All Listings
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredListings.map((item) => (
            <ListingInteractiveCard
              key={item.id}
              item={item}
              selectedCity={selectedCity}
              badgeCategory={item.subCategory || selectedSubCategory}
              onNewNotification={onNewNotification}
            />
          ))}
        </div>
      )}
    </main>
  );
}