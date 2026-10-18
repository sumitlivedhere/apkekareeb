import React, { useState, useMemo } from 'react';
import { useStoreSlice } from '../store/hyperlocalStore';
import ListingInteractiveCard from '../components/common/ListingInteractiveCard';
import ListingDetailModal from '../components/common/ListingDetailModal';

export const FESTIVAL_SUBCATEGORIES = [
  {
    id: 'mela-exhibitions',
    name: 'City Melas, Fairs & Exhibitions',
    hindiName: 'शहर के मेले, प्रदर्शनी, झूले व स्टॉल्स',
    icon: '🎡',
    desc: 'Dussehra Mela, Matsya Utsav, Handloom Exhibitions, Amusement Rides & Stall Bookings',
    aliases: ['mela-exhibitions', 'melas-fairs', 'mela', 'fairs', 'exhibition', 'events'],
  },
  {
    id: 'sweets-gifting',
    name: 'Festive Sweets, Dry Fruits & Gift Hampers',
    hindiName: 'त्योहारी मिठाई, कलाकंद, ड्राई फ्रूट्स व गिफ्ट हैंपर्स',
    icon: '🎁',
    desc: 'Alwar Kalakand Boxes, Kaju Katli, Corporate Gift Hampers & Festive Bakery Packs',
    aliases: ['sweets-gifting', 'festive-sweets', 'gift-hampers', 'sweets', 'gifts', 'mithai'],
  },
  {
    id: 'decor-lights',
    name: 'Lights, Home Decor & Puja Samagri',
    hindiName: 'सजावट, एलईडी लाइटिंग, दीये व पूजा सामग्री',
    icon: '🪔',
    desc: 'LED String Lights, Clay Diyas, Torans,Rangoli, Flowers & Complete Puja Kits',
    aliases: ['decor-lights', 'decor-lighting', 'puja-samagri', 'lights', 'decor', 'diwali-decor'],
  },
  {
    id: 'fashion-bazaar',
    name: 'Festive Fashion, Electronics & Bumper Sales',
    hindiName: 'त्योहारी कपड़े, इलेक्ट्रॉनिक्स व महा-बचत ऑफर्स',
    icon: '🛍️',
    desc: 'Ethnic Wear Clearance, Jewellery Offers, Appliance Exchange Melas & Combo Deals',
    aliases: ['fashion-bazaar', 'sale-offers', 'diwali-offers', 'holi-special', 'bumper-sale', 'offers'],
  },
];

// Helper to match a listing to a canonical Festival subcategory ID
export function matchesFestivalSubCategory(item, targetSubId) {
  if (!item || !targetSubId || targetSubId === 'all') return true;
  const rawSub = String(
    item.subCategory || item.sub_category || item.festivalType || item.type || ''
  )
    .toLowerCase()
    .trim();

  const targetLower = String(targetSubId).toLowerCase().trim();
  if (rawSub === targetLower) return true;

  const subDef = FESTIVAL_SUBCATEGORIES.find((s) => s.id === targetLower);
  if (subDef && subDef.aliases.includes(rawSub)) return true;

  // Keyword fallback for legacy or untagged festival items
  const haystack = `${item.title || ''} ${item.description || ''} ${rawSub}`.toLowerCase();
  if (targetLower === 'mela-exhibitions') {
    return /mela|fair|exhibition|utsav|stall|ride|प्रदर्शनी|मेला/.test(haystack);
  }
  if (targetLower === 'sweets-gifting') {
    return /sweet|mithai|kalakand|dry fruit|hamper|gift|chocolate|मिठाई|गिफ्ट/.test(haystack);
  }
  if (targetLower === 'decor-lights') {
    return /light|decor|diya|toran|puja|pooja|flower|candle|लाइट|सजावट|पूजा/.test(haystack);
  }
  if (targetLower === 'fashion-bazaar') {
    return /sale|discount|saree|ethnic|kurta|electronic|exchange|appliance|bazaar|सेल|ऑफर/.test(haystack);
  }

  return false;
}

export default function FestivalHub({
  selectedCity = 'Alwar',
  onSelectSubCategory,
  onSelectSub,
  onOpenFeed,
  onPostClick,
  onBack,
  onNewNotification,
}) {
  const festivalListings = useStoreSlice('festivalListings');
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [inlineSubFilter, setInlineSubFilter] = useState('all');

  const activeListings = useMemo(
    () =>
      (festivalListings || []).filter(
        (i) => i && i.is_active !== false && !i.has_pending_approval
      ),
    [festivalListings]
  );

  const getSubCount = (subId) =>
    activeListings.filter((item) => matchesFestivalSubCategory(item, subId)).length;

  // Unified handler that calls parent router AND updates local preview filter
  const handleSubCategoryClick = (subId) => {
    setInlineSubFilter(subId);
    const navFn = onSelectSubCategory || onSelectSub || onOpenFeed;
    if (typeof navFn === 'function') {
      navFn(subId);
    }
  };

  const displayedListings = useMemo(() => {
    if (inlineSubFilter === 'all') return activeListings;
    return activeListings.filter((item) =>
      matchesFestivalSubCategory(item, inlineSubFilter)
    );
  }, [activeListings, inlineSubFilter]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-3.5 pt-3 pb-24 space-y-5 font-sans select-none">
      
      {/* 🪔 Top Hero Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#2a1810] via-[#0e1720] to-[#241326] border border-amber-400/40 shadow-2xl space-y-3">
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
            🪔 {selectedCity} Utsav & Mela Hub
          </span>
        </div>

        <div className="space-y-1 pt-1">
          <h1 className="text-lg sm:text-xl font-black text-white flex items-center space-x-2">
            <span>🪔</span>
            <span>Festival Offers & Melas in {selectedCity}</span>
          </h1>
          <p className="text-xs font-bold text-amber-400">
            त्योहार ऑफर्स, शहर के मेले, मिठाई हैंपर्स व सजावट बाज़ार
          </p>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Explore live city melas, exhibitions, festive sweet hampers, lighting decorators, and bumper festival sales across {selectedCity}.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => handleSubCategoryClick('all')}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-400/40 font-black text-xs cursor-pointer active:scale-95 transition flex items-center justify-center space-x-1.5"
          >
            <span>🎪</span>
            <span>Explore All ({activeListings.length})</span>
          </button>

          {onPostClick && (
            <button
              type="button"
              onClick={onPostClick}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-xs shadow-lg cursor-pointer active:scale-95 transition"
            >
              + Post Festive Offer / Stall
            </button>
          )}
        </div>
      </div>

      {/* 🏛️ Subcategory Cards */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Browse Festival & Mela Categories (श्रेणी चुनें)
          </span>
          {inlineSubFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setInlineSubFilter('all')}
              className="text-[11px] font-bold text-amber-400 hover:underline cursor-pointer"
            >
              Show All ({activeListings.length})
            </button>
          )}
        </div>

        {FESTIVAL_SUBCATEGORIES.map((sub) => {
          const count = getSubCount(sub.id);
          const isSelected = inlineSubFilter === sub.id;

          return (
            <div
              key={sub.id}
              onClick={() => handleSubCategoryClick(sub.id)}
              className={`p-4 rounded-3xl bg-[#0e1720] border shadow-lg transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99] ${
                isSelected
                  ? 'border-amber-400 ring-1 ring-amber-400/30'
                  : 'border-[#1d2b38] hover:border-amber-400/60'
              }`}
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
                    <span className="px-2 py-0.2 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 font-mono text-[10px] font-black">
                      {count}
                    </span>
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

      {/* 🌟 Live Festival & Mela Listings Stream on Hub (Clickable -> Opens Full Detail Modal) */}
      {displayedListings.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              🪔 Live Melas & Festive Deals ({displayedListings.length})
            </span>
            <button
              type="button"
              onClick={() => handleSubCategoryClick('all')}
              className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer"
            >
              Open Full Feed ➔
            </button>
          </div>

          <div className="space-y-4">
            {displayedListings.map((item) => (
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