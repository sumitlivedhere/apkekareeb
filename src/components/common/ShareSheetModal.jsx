import React, { useState, useEffect } from 'react';
import { generateDynamicStatusPoster } from '../../utils/statusPosterEngine';

export default function ShareSheetModal({ item, selectedCity = 'Alwar', onClose }) {
  const [copied, setCopied] = useState(false);
  const [posterTheme, setPosterTheme] = useState('dhamaka');
  const [posterUrl, setPosterUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(true);

  const title = item?.title || item?.name || 'Local Offer';
  const price = item?.price || item?.deal_price || item?.rent || 'Best Price';
  const seller = item?.sellerName || item?.provider_name || 'Verified Merchant';
  const cleanPhone = String(item?.phone || item?.contact || '').replace(/\D/g, '').slice(-10);
  const shareUrl = `${window.location.origin}/?id=${encodeURIComponent(item?.id || '')}`;

  // Generate 4K WhatsApp Story Graphic
  useEffect(() => {
    let mounted = true;
    setIsGenerating(true);
    generateDynamicStatusPoster(item, posterTheme, selectedCity).then(({ dataUrl }) => {
      if (mounted) {
        setPosterUrl(dataUrl);
        setIsGenerating(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [item, posterTheme, selectedCity]);

  // 1. WhatsApp Chat / Group Share
  const handleWhatsAppShare = () => {
    const msg = `*${title}*\n💰 *दाम / Price:* ${price}\n📍 *लोकेशन:* ${item?.location || selectedCity}\n👤 *दुकानदार:* ${seller}\n${cleanPhone ? `📞 *संपर्क:* +91 ${cleanPhone}\n` : ''}\n⚡ *Aapke Kareeb पर पूरा विवरण देखें व सीधे बात करें:*\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // 2. Copy Direct Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // 3. Download Poster
  const handleDownloadPoster = () => {
    if (!posterUrl) return;
    const a = document.createElement('a');
    a.href = posterUrl;
    a.download = `${title.slice(0, 18).replace(/\s+/g, '_')}_poster.png`;
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
        className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-4 space-y-3.5 shadow-2xl animate-slide-up sm:animate-scale-up max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🚀</span>
            <div>
              <h3 className="text-xs font-black text-white">Share & Status Poster</h3>
              <p className="text-[10px] text-slate-400">Promote to local groups and friends</p>
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

        {/* 1-Tap Sharing Actions */}
        <div className="space-y-2">
          {/* Direct WhatsApp Share */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 transition active:scale-98 cursor-pointer group"
          >
            <div className="flex items-center space-x-3">
              <span className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-lg text-white shadow-md group-hover:scale-105 transition-transform">
                💬
              </span>
              <div className="text-left">
                <div className="text-xs font-black text-emerald-300">Share on WhatsApp</div>
                <div className="text-[9.5px] text-slate-400">Send to Friends or Colony Groups</div>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-400">➔</span>
          </button>

          {/* Copy Direct Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950 hover:bg-slate-850 border border-slate-800 transition active:scale-98 cursor-pointer group"
          >
            <div className="flex items-center space-x-3">
              <span className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-lg text-amber-400 shadow-md group-hover:scale-105 transition-transform">
                {copied ? '✓' : '📋'}
              </span>
              <div className="text-left">
                <div className="text-xs font-black text-slate-200">
                  {copied ? 'Link Copied to Clipboard!' : 'Copy Direct Link'}
                </div>
                <div className="text-[9.5px] text-slate-500 font-mono truncate max-w-[180px]">
                  {shareUrl}
                </div>
              </div>
            </div>
            <span className={`text-xs font-black ${copied ? 'text-emerald-400' : 'text-slate-400'}`}>
              {copied ? 'Copied' : 'Copy'}
            </span>
          </button>
        </div>

        {/* 4K WhatsApp Story Poster Section */}
        <div className="pt-2 border-t border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider">
              WhatsApp Story Poster:
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
                  className={`px-2 py-0.5 rounded-lg text-[9.5px] font-black transition cursor-pointer ${
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

          <div className="relative w-full h-44 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
            {isGenerating ? (
              <div className="text-center space-y-1">
                <span className="text-xl animate-spin block">🪄</span>
                <span className="text-[10px] text-amber-300 font-bold">Generating 4K Story...</span>
              </div>
            ) : (
              <img src={posterUrl} alt="Poster Preview" className="w-full h-full object-contain" />
            )}
          </div>

          <button
            type="button"
            onClick={handleDownloadPoster}
            disabled={isGenerating}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            <span>📥</span>
            <span>Download Poster for WhatsApp Status</span>
          </button>
        </div>
      </div>
    </div>
  );
}