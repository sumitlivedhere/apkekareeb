import React, { useState } from 'react';
import { getCurrentUserProfile } from '../../services/authService';
import AuthModal from './AuthModal';

export default function ActionButtons({
  listing,
  onOpenCart,
  isInCart = false,
  onToggleCart,
  selectedCity = 'Alwar',
}) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authActionTitle, setAuthActionTitle] = useState('Sign In to Contact');

  const checkMemberAuthOrPrompt = (actionTitle) => {
    const profile = getCurrentUserProfile();
    if (profile && profile.is_verified && profile.status === 'active') {
      return true;
    }
    setAuthActionTitle(actionTitle);
    setIsAuthOpen(true);
    return false;
  };

  const handleCall = (e) => {
    e.stopPropagation();
    if (!checkMemberAuthOrPrompt('Sign In to Call Seller')) return;
    const cleanPhone = String(listing.phone || '').replace(/\D/g, '').slice(-10);
    window.location.href = `tel:+91${cleanPhone}`;
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    if (!checkMemberAuthOrPrompt('Sign In to WhatsApp Seller')) return;
    const cleanPhone = String(listing.whatsapp || listing.phone || '').replace(/\D/g, '').slice(-10);
    const text = encodeURIComponent(
      `Namaste! I saw your listing "${listing.title || listing.name}" on Aapke Kareeb (${selectedCity}). I am interested to know more.`
    );
    window.open(`https://wa.me/91${cleanPhone}?text=${text}`, '_blank');
  };

  const handleCartClick = (e) => {
    e.stopPropagation();
    if (!checkMemberAuthOrPrompt('Sign In to Use Cart')) return;
    if (onToggleCart) onToggleCart(listing);
  };

  return (
    <>
      <div className="flex items-center space-x-1.5 shrink-0">
        {/* Call Button */}
        <button
          type="button"
          onClick={handleCall}
          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition active:scale-95 flex items-center space-x-1 cursor-pointer"
          title="Direct Call"
        >
          <span>📞</span>
          <span className="hidden xs:inline">Call</span>
        </button>

        {/* WhatsApp Button */}
        <button
          type="button"
          onClick={handleWhatsApp}
          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition active:scale-95 flex items-center space-x-1 cursor-pointer shadow-sm"
          title="Chat on WhatsApp"
        >
          <span>💬</span>
          <span>WhatsApp</span>
        </button>

        {/* Cart Toggle Button */}
        {onToggleCart && (
          <button
            type="button"
            onClick={handleCartClick}
            className={`p-1.5 rounded-xl border text-xs font-bold transition active:scale-95 flex items-center justify-center cursor-pointer ${
              isInCart
                ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
            }`}
            title={isInCart ? 'Remove from Cart' : 'Add to Cart'}
          >
            <span>{isInCart ? '🛒✓' : '🛒+'}</span>
          </button>
        )}
      </div>

      {isAuthOpen && (
        <AuthModal
          isOpen={isAuthOpen}
          actionTitle={authActionTitle}
          selectedCity={selectedCity}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={() => setIsAuthOpen(false)}
        />
      )}
    </>
  );
}