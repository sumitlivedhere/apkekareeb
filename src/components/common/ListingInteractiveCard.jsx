import React, { useState } from 'react';
import ActionButtons from './ActionButtons';
import ListingDiscussionThread from './ListingDiscussionThread';
import { useCartSlice, hyperlocalStore } from '../../store/hyperlocalStore';

export default function ListingInteractiveCard({
  item,
  selectedCity = 'Alwar',
  badgeCategory = 'LISTING',
  onNewNotification,
  onClick,
}) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // 🛒 Cart integration
  const cart = useCartSlice();
  const cartItem = (cart || []).find((i) => String(i.id) === String(item.id));
  const cartQty = cartItem ? cartItem.quantity : 0;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    hyperlocalStore.addToCart(item, 1);
  };

  // Gallery array resolution
  const galleryImages =
    item.images && item.images.length > 0
      ? item.images
      : item.image
      ? [item.image]
      : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=700'];

  const totalImages = galleryImages.length;
  const currentImg = galleryImages[activeImgIndex] || galleryImages[0];

  const handleNextImg = (e) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev + 1) % totalImages);
  };

  const handlePrevImg = (e) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const mapUrl =
    item.mapUrl ||
    (item.lat && item.lng
      ? `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`
      : null);

  // Promotional Offer & Combo Metadata Resolution
  const dealBadge = item.deal_badge || item.dealBadge;
  const dealDetails = item.deal_details || item.dealDetails;
  const origPrice = item.original_price || item.originalPrice;
  const tokenAmt = item.token_amount || item.tokenAmount;
  const hasTrial = item.doorstep_trial ?? item.doorstepTrial;

  const descText = item.description || '';
  const isLongDescription = descText.length > 110;

  // Custom pre-filled WhatsApp message including the promotional deal
  const whatsAppMessage = dealBadge
    ? `Namaste ${item.sellerName || ''}! I saw your "${item.title || item.name}" offer "${dealBadge}" on TownHub (${item.location || selectedCity}). ${dealDetails ? `Inclusions: ${dealDetails}. ` : ''}Is this deal available for me?`
    : `Namaste ${item.sellerName || ''}, I found your listing "${item.title || item.name}" on TownHub (${item.location || selectedCity}). Is this still available?`;

  return (
    <article
      onClick={() => onClick && onClick(item)}
      className={`bg-white rounded-3xl overflow-hidden shadow-xs border transition p-3.5 space-y-3 relative select-none font-sans ${
        dealBadge
          ? 'border-amber-400/80 ring-2 ring-amber-400/20 shadow-md'
          : item.isNew
          ? 'border-amber-400 ring-2 ring-amber-400/20'
          : 'border-slate-200 hover:shadow-md'
      }`}
    >
      {/* 🖼️ INTERACTIVE PHOTO CAROUSEL */}
      <div className="relative h-52 w-full bg-slate-100 rounded-2xl overflow-hidden shadow-inner group select-none">
        <img
          src={currentImg}
          alt={item.title || item.name}
          loading="lazy"
          className="w-full h-full object-cover transition duration-300"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=700';
          }}
        />

        {/* Top Badges: Category & Active Deal Pill */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 flex-wrap">
          {totalImages > 1 ? (
            <div className="px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-xs text-white text-[9px] font-black flex items-center space-x-1 border border-white/10 shadow-sm">
              <span>📷</span>
              <span>{activeImgIndex + 1}/{totalImages}</span>
            </div>
          ) : (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-amber-300 uppercase border border-white/10">
              {String(item.category || badgeCategory).toUpperCase()}
            </span>
          )}

          {dealBadge && (
            <span className="text-[9.5px] font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 shadow-md animate-pulse border border-amber-500/40">
              {dealBadge}
            </span>
          )}
        </div>

        {/* Price & Strike-Through Pricing Banner */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center space-x-1.5 bg-slate-950/85 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-xl text-white">
          <span className="text-xs font-black text-amber-300">
            {item.price || item.rent || item.rates || 'Contact for Price'}
          </span>
          {origPrice && (
            <span className="text-[10px] text-slate-400 font-mono line-through">
              {origPrice}
            </span>
          )}
        </div>

        {/* Multi-Photo Navigation Arrows */}
        {totalImages > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevImg}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center text-xs font-bold transition active:scale-90 cursor-pointer shadow-md backdrop-blur-xs"
            >
              ❮
            </button>
            <button
              type="button"
              onClick={handleNextImg}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center text-xs font-bold transition active:scale-90 cursor-pointer shadow-md backdrop-blur-xs"
            >
              ❯
            </button>

            {/* Dots */}
            <div className="absolute bottom-2.5 right-2.5 flex items-center space-x-1 bg-slate-950/60 backdrop-blur-xs px-2 py-1 rounded-full">
              {galleryImages.map((_, idx) => (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImgIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    activeImgIndex === idx ? 'w-4 bg-amber-400' : 'w-1.5 bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Discussion Thread Icon & Interest Action */}
        <ListingDiscussionThread
          listingId={item.id}
          listingTitle={item.title || item.name}
          sellerName={item.sellerName || item.driverName || 'Verified Member'}
          sellerPhone={item.phone || item.whatsapp}
          interestCount={item.interestCount || item.interest_count || 0}
          onNewNotification={onNewNotification}
        />
      </div>

      {/* 📄 LISTING BODY & PROMOTIONAL DETAILS */}
      <div className="pt-0.5 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-sm">{item.title || item.name}</h3>
            {(item.sellerName || item.driverName) && (
              <p className="text-[10px] text-blue-700 font-bold mt-0.5">
                By: {item.sellerName || item.driverName}
              </p>
            )}
          </div>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md shrink-0 ml-2">
            {String(item.subCategory || badgeCategory).toUpperCase()}
          </span>
        </div>

        {/* 🎁 Active Promotional Inclusions Capsule */}
        {dealDetails && (
          <div className="p-2 rounded-xl bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border border-amber-300/80 text-[10.5px] text-amber-950 space-y-0.5">
            <div className="flex items-center space-x-1 font-black text-amber-800 text-[10px] uppercase tracking-wide">
              <span>🎁</span>
              <span>Combo / Special Offer Inclusions:</span>
            </div>
            <p className="font-medium leading-relaxed italic">
              {dealDetails}
            </p>
          </div>
        )}

        {/* Special Feature Micro-Pills */}
        {(tokenAmt || hasTrial) && (
          <div className="flex items-center space-x-1.5 text-[9.5px] font-bold flex-wrap gap-y-1">
            {tokenAmt && (
              <span className="bg-amber-100/80 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                🏷️ Token Lock: {tokenAmt}
              </span>
            )}
            {hasTrial && (
              <span className="bg-emerald-100/80 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-md">
                🚚 Ghar Par Trial Available
              </span>
            )}
          </div>
        )}

        {/* Expandable Rich Description Section */}
        {descText && (
          <div className="space-y-0.5">
            <p className={`text-[11px] text-slate-600 leading-relaxed ${isDescExpanded ? 'whitespace-pre-line' : 'line-clamp-2'}`}>
              {descText}
            </p>
            {isLongDescription && (
              <button
                type="button"
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="text-[10px] font-black text-blue-600 hover:text-blue-800 cursor-pointer pt-0.5"
              >
                {isDescExpanded ? 'Show Less ▴' : 'Read More ▾'}
              </button>
            )}
          </div>
        )}

        {/* Verified Location & One-Tap Map Navigation */}
        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-1 text-slate-700 font-semibold truncate max-w-[220px]">
            <span>📍</span>
            <span className="truncate">{item.location || selectedCity}</span>
          </div>

          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-lg text-[10px] font-black flex items-center space-x-1 shrink-0 transition cursor-pointer"
            >
              <span>🗺️</span>
              <span>View Map</span>
            </a>
          )}
        </div>
      </div>

      {/* 🛒 SEPARATE DIRECT ADD TO CART BUTTON ON THE CARD */}
      <div className="pt-1">
        {cartQty > 0 ? (
          <div className="w-full py-2 px-3 bg-slate-900 border border-amber-400 rounded-2xl flex items-center justify-between text-white shadow-xs">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                hyperlocalStore.updateCartQuantity(item.id, cartQty - 1);
              }}
              className="w-7 h-7 flex items-center justify-center font-black text-base text-slate-300 hover:text-amber-400 cursor-pointer active:scale-90"
            >
              -
            </button>
            <div className="text-center">
              <span className="text-[9px] text-amber-400 font-bold block leading-none">In Cart</span>
              <span className="font-mono font-black text-xs">{cartQty} Qty</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                hyperlocalStore.updateCartQuantity(item.id, cartQty + 1);
              }}
              className="w-7 h-7 flex items-center justify-center font-black text-base text-slate-300 hover:text-amber-400 cursor-pointer active:scale-90"
            >
              +
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-xs rounded-2xl shadow-sm active:scale-98 transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <span>+ 🛒</span>
            <span>Add to Cart</span>
          </button>
        )}
      </div>

      {/* Action Buttons with Deal Context Pre-filled */}
      <ActionButtons
        phone={item.phone || '9876543201'}
        whatsapp={item.whatsapp || item.phone || '919876543210'}
        message={whatsAppMessage}
      />
    </article>
  );
}