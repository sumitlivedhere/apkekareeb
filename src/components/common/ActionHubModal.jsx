import React, { useState, useEffect } from 'react';
import { generateDynamicStatusPoster } from '../../utils/statusPosterEngine';

export default function ActionHubModal({
  item,
  initialTab = 'buyer',
  selectedCity = 'Alwar',
  onClose,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [posterTheme, setPosterTheme] = useState('dhamaka');
  const [posterUrl, setPosterUrl] = useState(null);
  const [posterBlob, setPosterBlob] = useState(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const title = item?.title || item?.name || 'Local Offer';
  const price = item?.price || item?.deal_price || item?.rent || 'Best Price';
  const seller = item?.sellerName || item?.provider_name || 'Verified Merchant';
  const cleanPhone = String(item?.phone || item?.contact || '9876543210').replace(/\D/g, '').slice(-10);
  const shareUrl = `${window.location.origin}/?id=${encodeURIComponent(item?.id || '')}`;

  // Generate WhatsApp Status Card on Theme Change
  useEffect(() => {
    let mounted = true;
    setIsGenerating(true);
    generateDynamicStatusPoster(item, posterTheme, selectedCity).then(({ blob, dataUrl }) => {
      if (mounted) {
        setPosterBlob(blob);
        setPosterUrl(dataUrl);
        setIsGenerating(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [item, posterTheme, selectedCity]);

  // WhatsApp Pre-Filled Chat
  const handleDirectWhatsApp = () => {
    const msg = `नमस्ते ${seller}! मैंने Aapke Kareeb पर आपका ऑफर देखा:\n\n📌 *${title}*\n💰 *दाम:* ${price}\n📍 *जगह:* ${item?.location || selectedCity}\n\nक्या यह अभी उपलब्ध है? मुझे इसे देखना/खरीदना है।`;
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Turn-by-Turn Map
  const handleOpenMap = () => {
    const query = encodeURIComponent(`${item?.location || ''} ${selectedCity}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  // Copy Direct Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  // Copy Influencer / Reel Script Kit
  const influencerScript = `🔥 *${selectedCity.toUpperCase()} SHOPPING ALERT!* 🔥\n\nअगर आप ${selectedCity} में "${title}" ढूंढ रहे हैं, तो सीधे ${seller} से संपर्क करें!\n\n🏷️ *Price:* ${price}\n📍 *Address:* ${item?.location || selectedCity}\n📞 *Call/WhatsApp:* +91 ${cleanPhone}\n\n📲 *पूरा कैटलॉग देखने के लिए Aapke Kareeb पर जाएं:*\n👉 ${shareUrl}\n\n#${selectedCity} #${selectedCity}Diaries #LocalBazaar #VocalForLocal #AapkeKareeb`;

  const handleCopyInfluencerScript = () => {
    navigator.clipboard.writeText(influencerScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2200);
  };

  // Download Poster
  const handleDownloadPoster = () => {
    if (!posterUrl) return;
    const a = document.createElement('a');
    a.href = posterUrl;
    a.download = `${title.slice(0, 15)}_poster.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in text-slate-100 font-sans select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-4 space-y-3.5 shadow-2xl animate-slide-up sm:animate-scale-up max-h-[92vh] overflow-y-auto"
      >
        {/* Top Bar Switcher */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 space-x-1">
            <button
              type="button"
              onClick={() => setActiveTab('buyer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                activeTab === 'buyer'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🛒 Buyer Actions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('seller')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                activeTab === 'seller'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🚀 Viral Launchpad
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center hover:bg-slate-700 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* ============================================================== */}
        {/* 🛒 TAB 1: BUYER ACTIONS                                        */}
        {/* ============================================================== */}
        {activeTab === 'buyer' && (
          <div className="space-y-3 animate-fade-in">
            {/* Quick Summary Pill */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <h4 className="text-xs font-black text-white truncate">{title}</h4>
                <p className="text-[10px] text-slate-400 truncate">
                  👤 {seller} • 📍 {item?.location || selectedCity}
                </p>
              </div>
              <span className="text-xs font-black text-amber-400 shrink-0">{price}</span>
            </div>

            {/* Direct WhatsApp Deal Hold */}
            <button
              type="button"
              onClick={handleDirectWhatsApp}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs rounded-2xl shadow-lg active:scale-98 transition flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <span className="text-lg">💬</span>
                <div className="text-left">
                  <div className="leading-tight">Hold Deal on WhatsApp</div>
                  <div className="text-[9.5px] text-emerald-950 font-bold opacity-80">
                    Direct chat with shop owner
                  </div>
                </div>
              </div>
              <span>➔</span>
            </button>

            {/* Call & Navigation Grid */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`tel:${cleanPhone}`}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-black text-xs rounded-2xl flex items-center justify-center space-x-2 active:scale-95 transition shadow-sm"
              >
                <span>📞</span>
                <span>Call Directly</span>
              </a>

              <button
                type="button"
                onClick={handleOpenMap}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-black text-xs rounded-2xl flex items-center justify-center space-x-2 active:scale-95 transition shadow-sm cursor-pointer"
              >
                <span>🗺️</span>
                <span>Get Directions</span>
              </button>
            </div>

            {/* Share with Friends / Family */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-2xl text-[11px] font-bold text-slate-300 flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <span>{copiedLink ? '✓' : '📋'}</span>
              <span>{copiedLink ? 'Listing Link Copied!' : 'Copy Link for Friends & Family'}</span>
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* 🚀 TAB 2: SELLER / INFLUENCER VIRAL LAUNCHPAD                 */}
        {/* ============================================================== */}
        {activeTab === 'seller' && (
          <div className="space-y-3.5 animate-fade-in">
            {/* Status Theme Switcher */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                1. Pick Story Poster Style:
              </span>
              <div className="flex space-x-1">
                {[
                  { id: 'dhamaka', label: '🔥 Deal' },
                  { id: 'royal', label: '👑 Royal' },
                  { id: 'verified', label: '🟢 Trust' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPosterTheme(t.id)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition cursor-pointer ${
                      posterTheme === t.id
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4K Poster Preview */}
            <div className="relative w-full h-56 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
              {isGenerating ? (
                <div className="text-center space-y-1">
                  <span className="text-xl animate-spin block">🪄</span>
                  <span className="text-[10px] text-amber-300 font-bold">Rendering 4K Story...</span>
                </div>
              ) : (
                <img src={posterUrl} alt="WhatsApp Story Preview" className="w-full h-full object-contain" />
              )}
            </div>

            {/* WhatsApp Story Download / Post */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadPoster}
                disabled={isGenerating}
                className="py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 text-slate-950 font-black text-xs rounded-2xl shadow-md active:scale-95 transition cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>📥</span>
                <span>Download Story</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(
                      `🔥 Check out *${title}* on Aapke Kareeb: ${shareUrl}`
                    )}`,
                    '_blank'
                  );
                }}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 font-black text-xs rounded-2xl shadow-md active:scale-95 transition cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>📲</span>
                <span>Share to Groups</span>
              </button>
            </div>

            {/* Influencer / Creator Shoutout Kit */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-purple-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-black text-purple-300 flex items-center space-x-1">
                  <span>📸</span>
                  <span>Town Influencer / Reel Caption Kit</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyInfluencerScript}
                  className="text-[9.5px] font-black px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-400/40 hover:bg-purple-500/30 cursor-pointer"
                >
                  {copiedScript ? '✓ Copied' : 'Copy Script'}
                </button>
              </div>
              <p className="text-[9.5px] text-slate-400 leading-relaxed font-mono line-clamp-2">
                {influencerScript}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}