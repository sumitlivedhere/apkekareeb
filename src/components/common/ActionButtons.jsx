import React, { memo, useState } from 'react';
import { shareListingToWhatsApp } from '../../utils/shareHelper';
import WhatsAppStatusModal from './WhatsAppStatusModal';

function ActionButtons({
  phone,
  whatsapp,
  callLabel = 'Call Now',
  chatLabel = 'WhatsApp',
  shareLabel = 'Status / Share',
  message,
  item,
  selectedCity = 'Alwar',
}) {
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const rawPhone = String(phone || whatsapp || '9876543201');
  const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');

  const rawWa = String(whatsapp || phone || '9876543201').replace(/[^0-9]/g, '');
  const formattedWa = rawWa.length === 10 ? `91${rawWa}` : rawWa;

  const defaultMsg = message || `Namaste, I found your listing on Aapke Kareeb (${selectedCity}). Is this available?`;
  const waUrl = `https://wa.me/${formattedWa}?text=${encodeURIComponent(defaultMsg)}`;

  const handleShareClick = (e) => {
    e.stopPropagation();
    if (item) {
      setIsStatusModalOpen(true);
    } else {
      shareListingToWhatsApp(
        {
          title: 'Aapke Kareeb Listing',
          phone: cleanPhone,
          location: selectedCity,
        },
        selectedCity
      );
    }
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
        {/* 1. Direct Call */}
        <a
          href={`tel:${cleanPhone}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center space-x-1 py-2 px-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/30 rounded-xl text-xs font-black active:scale-95 transition shadow-xs cursor-pointer"
        >
          <span>📞</span>
          <span className="truncate">{callLabel}</span>
        </a>

        {/* 2. Direct WhatsApp */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center space-x-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 py-2 px-1.5 rounded-xl text-xs font-black shadow-xs active:scale-95 transition cursor-pointer"
        >
          <span>💬</span>
          <span className="truncate">{chatLabel}</span>
        </a>

        {/* 3. 1-Tap Share / WhatsApp Status Pamphlet */}
        <button
          type="button"
          onClick={handleShareClick}
          className="flex items-center justify-center space-x-1 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 py-2 px-1.5 rounded-xl text-xs font-black shadow-xs active:scale-95 transition cursor-pointer"
        >
          <span>📲</span>
          <span className="truncate">{shareLabel}</span>
        </button>
      </div>

      {/* WhatsApp Status Pamphlet Modal */}
      {isStatusModalOpen && item && (
        <WhatsAppStatusModal
          item={item}
          selectedCity={selectedCity}
          onClose={() => setIsStatusModalOpen(false)}
        />
      )}
    </>
  );
}

export default memo(ActionButtons);