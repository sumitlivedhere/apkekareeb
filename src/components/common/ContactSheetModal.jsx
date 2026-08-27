import React from 'react';

export default function ContactSheetModal({
  item,
  phone = '9876543201',
  whatsapp = '919876543210',
  instagram,
  selectedCity = 'Alwar',
  message,
  onClose,
}) {
  const cleanPhone = String(phone || whatsapp || '').replace(/\D/g, '');
  const cleanWa = String(whatsapp || phone || '').replace(/\D/g, '');
  const formattedWa = cleanWa.length === 10 ? `91${cleanWa}` : cleanWa;

  const sellerName = item?.sellerName || item?.provider_name || item?.driverName || 'Verified Merchant';
  const defaultMsg = message || `Namaste ${sellerName}, I saw your listing "${item?.title || ''}" on Aapke Kareeb (${selectedCity}). I want more details.`;

  // Resolve Instagram handle / link
  const rawInsta = instagram || item?.instagram || item?.insta || item?.instagram_handle || '';
  const cleanInsta = rawInsta.replace('@', '').trim();
  const instaUrl = cleanInsta.startsWith('http') ? cleanInsta : `https://instagram.com/${cleanInsta}`;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in select-none text-slate-100 font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-4 space-y-3.5 shadow-2xl animate-slide-up sm:animate-scale-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/30 flex items-center justify-center text-base font-black">
              📞
            </div>
            <div>
              <h3 className="text-xs font-black text-white">Contact Merchant</h3>
              <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                {sellerName} • 0% Brokerage
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center hover:bg-slate-700 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 1-Tap Action Options */}
        <div className="space-y-2">
          {/* 1. Direct WhatsApp */}
          <a
            href={`https://wa.me/${formattedWa}?text=${encodeURIComponent(defaultMsg)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center justify-between p-3 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 transition active:scale-98 cursor-pointer group"
          >
            <div className="flex items-center space-x-3">
              <span className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-lg text-white shadow-md group-hover:scale-105 transition-transform">
                💬
              </span>
              <div>
                <div className="text-xs font-black text-emerald-300">Chat on WhatsApp</div>
                <div className="text-[9.5px] text-slate-400">+91 {formattedWa.slice(-10)}</div>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-400">➔</span>
          </a>

          {/* 2. Phone Call */}
          <a
            href={`tel:${cleanPhone}`}
            onClick={onClose}
            className="flex items-center justify-between p-3 rounded-2xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 transition active:scale-98 cursor-pointer group"
          >
            <div className="flex items-center space-x-3">
              <span className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-lg text-slate-950 shadow-md group-hover:scale-105 transition-transform">
                📞
              </span>
              <div>
                <div className="text-xs font-black text-amber-300">Call Directly</div>
                <div className="text-[9.5px] text-slate-400">+91 {cleanPhone.slice(-10)}</div>
              </div>
            </div>
            <span className="text-xs font-black text-amber-400">➔</span>
          </a>

          {/* 3. Instagram Profile / Fallback */}
          {cleanInsta ? (
            <a
              href={instaUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex items-center justify-between p-3 rounded-2xl bg-pink-950/40 hover:bg-pink-900/50 border border-pink-500/40 transition active:scale-98 cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center text-lg text-white shadow-md group-hover:scale-105 transition-transform">
                  📸
                </span>
                <div>
                  <div className="text-xs font-black text-pink-300">Visit Instagram</div>
                  <div className="text-[9.5px] text-slate-400">@{cleanInsta}</div>
                </div>
              </div>
              <span className="text-xs font-black text-pink-400">➔</span>
            </a>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/50 border border-slate-800 opacity-50 select-none cursor-not-allowed">
              <div className="flex items-center space-x-3">
                <span className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-lg text-slate-500">
                  📸
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-400">No Instagram Available</div>
                  <div className="text-[9.5px] text-slate-500">Seller has not provided an Instagram profile</div>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-600">✕</span>
            </div>
          )}
        </div>

        <p className="text-[9px] text-center text-slate-500 pt-1">
          🔒 Aapke Kareeb verifies merchant phone numbers for secure local deals.
        </p>
      </div>
    </div>
  );
}