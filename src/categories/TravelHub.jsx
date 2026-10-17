import React, { useState } from 'react';
import { useStoreSlice } from '../store/hyperlocalStore';
import ListingInteractiveCard from '../components/common/ListingInteractiveCard';
import ListingDetailModal from '../components/common/ListingDetailModal';

const TRAVEL_SUBCATEGORIES = [
  {
    id: 'fun-activities',
    name: 'Fun Activities, Gaming & Sports',
    hindiName: 'मनोरंजन, बॉक्स क्रिकेट, बोटिंग व गेमिंग ज़ोन',
    icon: '🎳',
    desc: 'Box Cricket Turfs, VR/Arcade Gaming, Boating, Water Parks & Adventure',
  },
  {
    id: 'destinations',
    name: 'City Tourist Spots & Sightseeing',
    hindiName: 'पर्यटन स्थल, किले व सफारी (सरिस्का / सिलीसेढ़)',
    icon: '🏞️',
    desc: 'Sariska Safari, Bala Quila, Siliserh Lake, Garbhaji & Heritage Spots',
  },
  {
    id: 'resorts-stays',
    name: 'Resorts, Farm Stays & Day-Out',
    hindiName: 'रिसॉर्ट्स, पूल पार्टी, फार्म स्टे व कैंपिंग',
    icon: '🏖️',
    desc: 'Hillview Resorts, Pool Day-Out Passes, Farmhouses & Bonfire Camping',
  },
  {
    id: 'tour-operators',
    name: 'Tour Packages, Guides & Travel Desks',
    hindiName: 'टूर पैकेज, ट्रैवल एजेंसी व लोकल गाइड',
    icon: '🧭',
    desc: 'Local Sightseeing Cabs, Weekend Tour Packages & Certified Guides',
  },
];

export default function TravelHub({
  selectedCity = 'Alwar',
  onSelectSubCategory,
  onPostClick,
  onBack,
  onNewNotification,
}) {
  const travelListings = useStoreSlice('travelListings');
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  const activeListings = (travelListings || []).filter(
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
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#122230] via-[#0e1720] to-[#1d192b] border border-amber-400/30 shadow-2xl space-y-3">
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
            🎡 {selectedCity} Tourism & Fun
          </span>
        </div>

        <div className="space-y-1 pt-1">
          <h1 className="text-lg sm:text-xl font-black text-white flex items-center space-x-2">
            <span>🎡</span>
            <span>Fun & Travel in {selectedCity}</span>
          </h1>
          <p className="text-xs font-bold text-amber-400">
            घूमना-फिरना, मनोरंजन, रिसॉर्ट्स व पर्यटन स्थल
          </p>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Discover weekend hangout spots, sports turfs, adventure activities, heritage destinations, and resorts in & around {selectedCity}.
          </p>
        </div>

        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => onSelectSubCategory && onSelectSubCategory('all')}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-400/40 font-black text-xs cursor-pointer active:scale-95 transition flex items-center justify-center space-x-1.5"
          >
            <span>🌟</span>
            <span>Explore All ({activeListings.length})</span>
          </button>

          {onPostClick && (
            <button
              type="button"
              onClick={onPostClick}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-xs shadow-lg cursor-pointer active:scale-95 transition"
            >
              + List Activity / Spot
            </button>
          )}
        </div>
      </div>

      {/* Subcategory Cards */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Choose Experience Category (श्रेणी चुनें)
          </span>
        </div>

        {TRAVEL_SUBCATEGORIES.map((sub) => {
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

      {/* Featured Fun & Travel Listings (Clickable -> Opens Full Listing Detail Modal) */}
      {activeListings.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              🌟 Popular Experiences & Destinations ({activeListings.length})
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
                  category="travel"
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