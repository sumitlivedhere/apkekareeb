import React, { useState } from 'react';
import { useStoreSlice } from '../store/hyperlocalStore';
import ListingInteractiveCard from '../components/common/ListingInteractiveCard';
import ListingDetailModal from '../components/common/ListingDetailModal';

const NEWLY_OPEN_SUBCATEGORIES = [
  {
    id: 'new-showroom-store',
    name: 'New Retail Shops & Showrooms',
    hindiName: 'नए रिटेल स्टोर, बुटीक व शोरूम',
    icon: '🛍️',
    desc: 'Clothing Stores, Electronics, Jewellery, Footwear & Supermarkets',
  },
  {
    id: 'new-food-cafe',
    name: 'New Restaurants, Cafes & Bakeries',
    hindiName: 'नए रेस्टोरेंट, कैफे, बेकरी व फूड आउटलेट',
    icon: '🍔',
    desc: 'Rooftop Cafes, Family Restaurants, Sweet Shops & Cloud Kitchens',
  },
  {
    id: 'new-salon-fitness',
    name: 'New Salons, Gyms & Studios',
    hindiName: 'नए सैलून, पार्लर, जिम व फिटनेस स्टूडियो',
    icon: '💇',
    desc: 'Unisex Salons, Bridal Studios, Gyms, Yoga & Wellness Centers',
  },
  {
    id: 'new-services-agency',
    name: 'New Clinics, Coaching & Services',
    hindiName: 'नए क्लिनिक, कोचिंग, ऑफिस व अन्य व्यापार',
    icon: '🏥',
    desc: 'Clinics, Diagnostic Labs, Coaching Institutes, Agencies & Offices',
  },
];

export default function MarketHub({
  selectedCity = 'Alwar',
  onSelectSubCategory,
  onPostClick,
  onBack,
  onNewNotification,
}) {
  const marketListings = useStoreSlice('marketListings');
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  const activeListings = (marketListings || []).filter(
    (i) => i && i.is_active !== false && !i.has_pending_approval
  );

  const getSubCount = (subId) =>
    activeListings.filter(
      (i) =>
        String(i.subCategory || i.sub_category || '').toLowerCase() ===
        subId.toLowerCase()
    ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-3.5 pt-3 pb-24 space-y-5 font-sans select-none">
      
      {/* Top Hero Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#261726] via-[#0e1720] to-[#1d192b] border border-amber-400/30 shadow-2xl space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center space-x-1.5 cursor-pointer active:scale-95 transition"
          >
            <span>←</span>
            <span>All Categories</span>
          </button>

          <span className="px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
            🎊 {selectedCity} Launchpad
          </span>
        </div>

        <div className="space-y-1 pt-1">
          <h1 className="text-lg sm:text-xl font-black text-white flex items-center space-x-2">
            <span>🎊</span>
            <span>Newly Open in {selectedCity}</span>
          </h1>
          <p className="text-xs font-bold text-amber-400">
            नए खुले व्यापार, स्टोर, शोरूम व उद्घाटन ऑफर्स
          </p>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Explore newly inaugurated shops, cafes, showrooms, clinics, and grand opening discounts across {selectedCity}.
          </p>
        </div>

        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => onSelectSubCategory && onSelectSubCategory('all')}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-400/40 font-black text-xs cursor-pointer active:scale-95 transition flex items-center justify-center space-x-1.5"
          >
            <span>🌟</span>
            <span>View All Newly Open ({activeListings.length})</span>
          </button>

          {onPostClick && (
            <button
              type="button"
              onClick={onPostClick}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-xs shadow-lg cursor-pointer active:scale-95 transition"
            >
              + Promote New Business
            </button>
          )}
        </div>
      </div>

      {/* Subcategory Cards */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Browse by Business Type (श्रेणी चुनें)
          </span>
        </div>

        {NEWLY_OPEN_SUBCATEGORIES.map((sub) => {
          const count = getSubCount(sub.id);
          return (
            <div
              key={sub.id}
              onClick={() => onSelectSubCategory && onSelectSubCategory(sub.id)}
              className="p-4 rounded-3xl bg-[#0e1720] border border-[#1d2b38] hover:border-amber-400/60 shadow-lg transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
            >
              <div className="flex items-center space-x-3.5 min-w-0 pr-2">
                <div className="w-12 h-12 rounded-2xl bg-[#14232e] border border-[#223340] group-hover:border-amber-400/40 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                  {sub.icon}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-black text-white group-hover:text-amber-200 transition truncate">
                      {sub.name}
                    </h3>
                    {count > 0 && (
                      <span className="px-2 py-0.2 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 font-mono text-[10px] font-black">
                        {count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-amber-400 truncate">
                    {sub.hindiName}
                  </p>
                  <p className="text-[10.5px] text-slate-400 line-clamp-1">
                    {sub.desc}
                  </p>
                </div>
              </div>

              <div className="w-9 h-9 rounded-2xl bg-[#14232e] group-hover:bg-amber-400 group-hover:text-slate-950 text-slate-400 border border-[#223340] flex items-center justify-center text-sm font-bold shrink-0 transition">
                ➔
              </div>
            </div>
          );
        })}
      </div>

      {/* Featured Newly Open Businesses (Clickable -> Opens Full Listing Detail Modal) */}
      {activeListings.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              🎊 Latest Grand Openings in {selectedCity} ({activeListings.length})
            </span>
            <button
              type="button"
              onClick={() => onSelectSubCategory && onSelectSubCategory('all')}
              className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer"
            >
              View All ➔
            </button>
          </div>

          <div className="space-y-4">
            {activeListings.map((item) => (
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