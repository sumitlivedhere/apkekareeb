import React, { useMemo, useState } from 'react';
import { useStoreSlice, useInterestSlice, hyperlocalStore } from '../store/hyperlocalStore';
import { getCategoryById } from '../data/taxonomyRegistry';
import ActionButtons from './common/ActionButtons';
import ListingDetailModal from './common/ListingDetailModal';

function FestivalCardItem({ item, selectedCity, onSelect, getMessageTemplate }) {
  const interestCount = useInterestSlice(
    item.id,
    Number(item.interestCount || item.interest_count || 0)
  );

  const handleStarClick = (e) => {
    e.stopPropagation();
    hyperlocalStore.incrementInterest(
      item.id,
      interestCount,
      item.name || item.title,
      item.sellerName || item.name || 'Festival Merchant'
    );
  };

  const gallery =
    item.images && item.images.length > 0
      ? item.images
      : item.image
      ? [item.image]
      : ['https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=700'];

  const coverImg = gallery[0];

  const mapUrl =
    item.mapUrl ||
    (item.lat && item.lng
      ? `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`
      : null);

  return (
    <article
      onClick={onSelect}
      className={`bg-gradient-to-b from-[#24060d] via-[#1a0409] to-[#130206] rounded-3xl overflow-hidden shadow-[0_8px_25px_rgba(0,0,0,0.4)] border transition p-3.5 space-y-3 relative cursor-pointer hover:border-amber-400/70 hover:shadow-[0_10px_30px_rgba(128,13,30,0.35)] active:scale-[0.99] group ${
        item.isNew
          ? 'border-amber-400 ring-2 ring-amber-400/30'
          : 'border-[#5a111f]/80'
      }`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/0 group-hover:bg-amber-500/10 rounded-full blur-2xl transition-all pointer-events-none"></div>

      {/* Photo Banner */}
      <div className="relative h-48 w-full bg-[#1b0307] rounded-2xl overflow-hidden shadow-inner select-none border border-[#4d0c18]">
        <img
          src={coverImg}
          alt={item.name || item.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-103 transition duration-500"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=700';
          }}
        />

        {/* Package / Offer Tag */}
        <span className="absolute bottom-2.5 left-2.5 text-xs font-black px-3 py-1 rounded-xl text-amber-200 bg-[#160206]/90 backdrop-blur-md border border-amber-400/40 shadow-md">
          🏷️ {item.startingPackage || item.price || item.rates || 'Special Festive Deal'}
        </span>

        {/* Multi-Photo Indicator */}
        {gallery.length > 1 && (
          <span className="absolute top-2.5 left-2.5 text-[9.5px] font-black px-2 py-0.5 rounded-lg text-amber-100 bg-[#160206]/85 backdrop-blur-xs border border-amber-400/30">
            📷 {gallery.length} Photos
          </span>
        )}

        {/* Star Interest Counter */}
        <button
          type="button"
          onClick={handleStarClick}
          className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-[#22040a]/90 hover:bg-[#380811] text-amber-300 border border-amber-400/40 text-[10px] font-black flex items-center space-x-1 backdrop-blur-xs transition active:scale-90 cursor-pointer shadow-md"
        >
          <span>⭐</span>
          <span>{interestCount}</span>
        </button>
      </div>

      {/* Card Details */}
      <div className="pt-0.5 space-y-2">
        <div className="flex items-start justify-between">
          <div className="min-w-0 pr-2">
            <h3 className="font-black text-amber-50 text-sm leading-snug group-hover:text-amber-200 transition-colors truncate">
              {item.name || item.title}
            </h3>
            {(item.sellerName || item.name) && (
              <p className="text-[10.5px] text-amber-400 font-bold mt-0.5 truncate flex items-center space-x-1">
                <span>🏪</span>
                <span>{item.sellerName || item.name}</span>
              </p>
            )}
          </div>
          <span className="text-[9px] font-black text-amber-300 bg-[#380911] border border-amber-400/30 px-2 py-0.5 rounded-md shrink-0 tracking-wider shadow-xs">
            {item.badge || 'FESTIVE OFFER'}
          </span>
        </div>

        {item.description && (
          <p className="text-[11px] text-amber-100/75 line-clamp-2 leading-relaxed font-medium">
            {item.description}
          </p>
        )}

        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#470d17]/80">
          <div className="flex items-center space-x-1 text-rose-200/80 font-semibold truncate max-w-[220px]">
            <span>📍</span>
            <span className="truncate">{item.location || selectedCity}</span>
          </div>

          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-2.5 py-1 bg-[#33070f] hover:bg-[#4a0b17] text-amber-300 border border-amber-400/30 rounded-lg text-[10px] font-black flex items-center space-x-1 shrink-0 transition shadow-xs"
            >
              <span>🗺️</span>
              <span>View Map</span>
            </a>
          )}
        </div>
      </div>

      {/* 1-Click Action Buttons */}
      <div onClick={(e) => e.stopPropagation()} className="pt-1">
        <ActionButtons
          phone={item.phone || '9876543291'}
          whatsapp={item.whatsapp || item.phone || '919876543291'}
          message={getMessageTemplate(item)}
        />
      </div>
    </article>
  );
}

export default function FestivalFeed({
  vendors: propVendors,
  selectedSubCategory,
  selectedCategory,
  selectedCity = 'Alwar',
  searchQuery = '',
  onBack,
  onNewNotification,
}) {
  const storeVendors = useStoreSlice('festivalOffers') || [];
  const allVendors = propVendors && propVendors.length > 0 ? propVendors : storeVendors;

  const targetSub = (selectedSubCategory || selectedCategory || 'all').toLowerCase().trim();
  const categoryConfig = getCategoryById('festival') || { subCategories: [] };
  const subCategories = categoryConfig.subCategories || [];

  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  const filteredVendors = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    const city = (selectedCity || '').toLowerCase().trim();

    const uniqueMap = new Map();

    (allVendors || []).forEach((item) => {
      if (!item || !item.id) return;

      // 1. City Match
      const itemCity = (item.city || '').toLowerCase().trim();
      const itemLoc = (item.location || '').toLowerCase().trim();
      const matchesCity =
        !city ||
        itemCity === city ||
        itemLoc.includes(city) ||
        city.includes(itemCity);

      if (!matchesCity) return;

      // 2. Strict Subcategory Match
      const itemSub = (item.subCategory || item.vendorType || item.sub_category || '').toLowerCase().trim();
      const matchesSub = targetSub === 'all' || itemSub === targetSub;
      if (!matchesSub) return;

      // 3. Search Query Filter
      if (q) {
        const matchesQuery =
          item.name?.toLowerCase().includes(q) ||
          item.title?.toLowerCase().includes(q) ||
          item.sellerName?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.location?.toLowerCase().includes(q);
        if (!matchesQuery) return;
      }

      uniqueMap.set(String(item.id), item);
    });

    return Array.from(uniqueMap.values());
  }, [allVendors, targetSub, selectedCity, searchQuery]);

  const getSubCategoryTitle = () => {
    if (targetSub === 'all') return 'All Festive Offers & Melas';
    const matched = subCategories.find((s) => s.id === targetSub);
    return matched ? matched.name : targetSub.replace('-', ' ').toUpperCase();
  };

  const getMessageTemplate = (item) => {
    return `Namaste ${item.sellerName || item.name || ''}, I saw your festive offer "${item.name || item.title}" on TownHub Alwar. Can you confirm the deal details and availability?`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#180307] via-[#0d0103] to-[#140206] p-3.5 space-y-3.5 relative z-10 animate-fade-in text-slate-100 pb-24 select-none">
      
      {/* Decorative Top Strip */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-rose-500 to-yellow-400 shadow-[0_0_12px_rgba(251,191,36,0.7)] rounded-full"></div>

      {/* Royal Festive Category Header */}
      <div className="bg-gradient-to-r from-[#3b0811] via-[#24040a] to-[#3b0811] p-3.5 rounded-2xl border border-amber-400/40 shadow-[0_6px_20px_rgba(59,8,17,0.45)] flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-1.5 text-[9px] font-black text-amber-400 tracking-wider">
            <span>🎪 ALWAR FESTIVE DEALS</span>
            <span>•</span>
            <span className="text-rose-200/80">{selectedCity.toUpperCase()}</span>
          </div>
          <h2 className="text-xs font-black text-amber-50 capitalize leading-snug mt-0.5">
            {getSubCategoryTitle()}
          </h2>
          <p className="text-[10px] text-amber-200/75 font-medium mt-0.5">
            {filteredVendors.length} active festive offers available in {selectedCity}
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="text-[10.5px] bg-[#2a040a] hover:bg-[#420813] text-amber-300 border border-amber-400/30 px-3 py-1.5 rounded-xl font-bold active:scale-95 transition cursor-pointer shadow-sm"
        >
          ← Categories
        </button>
      </div>

      {/* Cards List */}
      {filteredVendors.length === 0 ? (
        <div className="bg-gradient-to-br from-[#24050c] via-[#170307] to-[#120205] rounded-3xl p-8 text-center border border-[#520f1c] shadow-lg space-y-2">
          <span className="text-3xl block animate-bounce">🎪</span>
          <h4 className="text-xs font-black text-amber-200">No Festive Listings Found</h4>
          <p className="text-rose-200/70 font-medium text-[10.5px]">
            No offers currently posted under {targetSub !== 'all' ? targetSub : 'this category'} in {selectedCity}.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredVendors.map((v) => (
            <FestivalCardItem
              key={v.id}
              item={v}
              selectedCity={selectedCity}
              onSelect={() => setSelectedDetailItem(v)}
              getMessageTemplate={getMessageTemplate}
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
        />
      )}
    </main>
  );
}