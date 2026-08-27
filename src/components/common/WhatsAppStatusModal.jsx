import React, { useState, useEffect } from 'react';
import { generateStatusPosterBlob, shareListingToWhatsApp } from '../../utils/shareHelper';

export default function WhatsAppStatusModal({ item, selectedCity = 'Alwar', onClose }) {
  const [posterDataUrl, setPosterDataUrl] = useState(null);
  const [posterBlob, setPosterBlob] = useState(null);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    let isMounted = true;
    generateStatusPosterBlob(item, selectedCity).then(({ blob, dataUrl }) => {
      if (isMounted) {
        setPosterBlob(blob);
        setPosterDataUrl(dataUrl);
        setIsGenerating(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [item, selectedCity]);

  // 1. Native Image Share to WhatsApp Status
  const handleShareStatusDirect = async () => {
    if (!posterBlob) return;

    if (navigator.canShare && navigator.canShare({ files: [new File([posterBlob], 'status.png', { type: 'image/png' })] })) {
      try {
        const file = new File([posterBlob], `${(item.title || 'listing').slice(0, 20)}_status.png`, {
          type: 'image/png',
        });
        await navigator.share({
          files: [file],
          title: item.title,
          text: `Check this out on Aapke Kareeb: ${window.location.origin}/?id=${item.id}`,
        });
        return;
      } catch {}
    }

    // Fallback: Download & prompt open WhatsApp
    handleDownloadPoster();
    setTimeout(() => {
      window.open('https://wa.me/', '_blank');
    }, 600);
  };

  // 2. Download Pamphlet
  const handleDownloadPoster = () => {
    if (!posterDataUrl) return;
    const a = document.createElement('a');
    a.href = posterDataUrl;
    a.download = `${(item.title || 'aapke_kareeb_offer').replace(/\s+/g, '_')}_poster.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none text-slate-100"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-4 space-y-3.5 shadow-2xl flex flex-col items-center my-auto max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-1.5">
            <span className="text-lg">📲</span>
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider">
              WhatsApp Status Pamphlet
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Live Poster Preview */}
        <div className="w-full h-80 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center relative shadow-inner">
          {isGenerating ? (
            <div className="text-center space-y-2">
              <span className="text-2xl animate-spin block">🪄</span>
              <p className="text-[11px] text-amber-300 font-bold">Creating WhatsApp Pamphlet...</p>
            </div>
          ) : (
            <img
              src={posterDataUrl}
              alt="WhatsApp Status Preview"
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2">
          <button
            type="button"
            onClick={handleShareStatusDirect}
            disabled={isGenerating}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-xs rounded-xl shadow-md active:scale-95 transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>🟢</span>
            <span>Post to WhatsApp Status</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDownloadPoster}
              disabled={isGenerating}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] rounded-xl border border-slate-700 active:scale-95 transition cursor-pointer flex items-center justify-center space-x-1"
            >
              <span>📥</span>
              <span>Download Image</span>
            </button>

            <button
              type="button"
              onClick={() => {
                shareListingToWhatsApp(item, selectedCity);
                onClose();
              }}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-[11px] rounded-xl border border-slate-700 active:scale-95 transition cursor-pointer flex items-center justify-center space-x-1"
            >
              <span>💬</span>
              <span>Share Text Link</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}