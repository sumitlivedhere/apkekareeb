import React, { memo, useState } from 'react';
import ActionHubModal from './ActionHubModal';

function ActionButtons({
  item,
  selectedCity = 'Alwar',
}) {
  const [modalMode, setModalMode] = useState(null); // 'buyer' | 'seller' | null

  return (
    <>
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
        {/* 1. Buyer Instant Action */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setModalMode('buyer');
          }}
          className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-gradient-to-r from-amber-500/20 via-emerald-500/15 to-amber-500/20 hover:from-amber-500/30 text-amber-300 border border-amber-400/40 rounded-2xl text-xs font-black active:scale-95 transition shadow-sm cursor-pointer"
        >
          <span className="text-sm">⚡</span>
          <span>Contact & Deal</span>
        </button>

        {/* 2. Seller Viral Launchpad */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setModalMode('seller');
          }}
          className="flex items-center justify-center space-x-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 text-pink-300 border border-pink-500/40 py-2.5 px-3 rounded-2xl text-xs font-black shadow-sm active:scale-95 transition cursor-pointer"
        >
          <span className="text-sm">🚀</span>
          <span>Viral Poster & Share</span>
        </button>
      </div>

      {/* Unified Action & Viral Hub Modal */}
      {modalMode && (
        <ActionHubModal
          item={item}
          initialTab={modalMode}
          selectedCity={selectedCity}
          onClose={() => setModalMode(null)}
        />
      )}
    </>
  );
}

export default memo(ActionButtons);