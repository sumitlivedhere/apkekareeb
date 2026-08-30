import React, { useMemo } from 'react';
import { useCartSlice, hyperlocalStore } from '../../store/hyperlocalStore';
import { getCurrentUserProfile } from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';

export default function CartDrawer({ isOpen, onClose, onOpenAuth }) {
  const { isDark } = useTheme();
  const rawCartItems = useCartSlice();
  const currentUser = getCurrentUserProfile();

  // Scoped strictly to the active authenticated user
  const cartItems = useMemo(() => {
    if (!currentUser) return [];
    return rawCartItems || [];
  }, [currentUser, rawCartItems]);

  const isVerifiedMember = Boolean(
    currentUser && currentUser.is_verified && currentUser.status === 'active'
  );

  // Group items strictly by Seller Phone for multi-vendor checkout
  const groupedBySeller = useMemo(() => {
    if (!currentUser) return [];
    const map = {};
    cartItems.forEach((item) => {
      const sellerPhoneKey = item.sellerPhone || item.phone || 'General_Merchant';
      if (!map[sellerPhoneKey]) {
        map[sellerPhoneKey] = {
          sellerName: item.sellerName || 'Verified Merchant',
          sellerPhone: sellerPhoneKey,
          phone: sellerPhoneKey,
          whatsapp: item.whatsapp || sellerPhoneKey,
          location: item.location || 'Town Center',
          timing: item.timing || '09:00 AM - 09:00 PM',
          items: [],
          subtotal: 0,
        };
      }
      map[sellerPhoneKey].items.push(item);
      map[sellerPhoneKey].subtotal += (item.numericPrice || 0) * (item.quantity || 1);
    });
    return Object.values(map);
  }, [cartItems, currentUser]);

  const totalCalculablePrice = useMemo(() => {
    if (!currentUser) return 0;
    return cartItems.reduce((sum, item) => sum + (item.numericPrice || 0) * (item.quantity || 1), 0);
  }, [cartItems, currentUser]);

  // Dispatch individual seller order via WhatsApp & trigger in-app notification
  const handleDispatchWhatsAppOrder = async (sellerGroup) => {
    if (!currentUser || !isVerifiedMember) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    const itemsSummary = sellerGroup.items
      .map((i, idx) => {
        let details = `${idx + 1}. *${i.title}*\n   Qty: ${i.quantity} | Rate: ${i.price}`;
        if (i.dealBadge) details += `\n   🏷️ Deal: ${i.dealBadge}`;
        if (i.tokenAmount) details += `\n   🔒 Advance Token: ${i.tokenAmount}`;
        if (i.doorstepTrial) details += `\n   🚪 Doorstep Trial Requested`;
        return details;
      })
      .join('\n\n');

    const buyerName = currentUser?.full_name || 'Resident Member';
    const buyerPhone = currentUser?.phone || '';
    const buyerLocality = currentUser?.area_name || currentUser?.city || 'Town Center';

    const message =
      `🛍️ *NEW AAPKE KAREEB ORDER & BOOKING*\n` +
      `----------------------------------------\n` +
      `Namaste *${sellerGroup.sellerName}*! 🙏\n\n` +
      `I want to place an order / booking for the following item(s):\n\n` +
      `${itemsSummary}\n\n` +
      `----------------------------------------\n` +
      (sellerGroup.subtotal > 0 ? `💰 *Estimated Total: ₹${sellerGroup.subtotal.toLocaleString('en-IN')}*\n` : '') +
      `👤 *Customer:* ${buyerName} (+91 ${buyerPhone})\n` +
      `📍 *Delivery / Locality:* ${buyerLocality}\n\n` +
      `Please confirm availability, delivery schedule (${sellerGroup.timing}), and payment details. Dhanyawaad!`;

    // 1. Dispatch In-App Alert to Seller Dashboard
    const targetPhone = String(sellerGroup.whatsapp || sellerGroup.phone || sellerGroup.sellerPhone).replace(/\D/g, '').slice(-10);
    const sellerAlert = {
      tag: 'ORDER_INTENT',
      title: `🛍️ New Order Inquiry from ${buyerName}`,
      message: `${sellerGroup.items.length} item(s) selected by ${buyerName} (+91 ${buyerPhone}) in ${buyerLocality}.`,
      time: 'Just now',
      type: 'order',
      targetId: sellerGroup.items[0]?.listingId || null,
      recipient_role: 'seller',
      recipient_phone: targetPhone,
      metadata: {
        buyerName,
        buyerPhone,
        buyerLocality,
        itemsCount: sellerGroup.items.length,
        subtotal: sellerGroup.subtotal,
      },
    };
    hyperlocalStore.addNotification(sellerAlert);

    // 2. Open WhatsApp Direct Order
    const url = `https://wa.me/91${targetPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex justify-end animate-fade-in font-sans select-none">
      <div
        className={`w-full max-w-md h-full flex flex-col justify-between shadow-2xl transition-colors duration-200 border-l ${
          isDark
            ? 'bg-slate-950 text-slate-100 border-slate-800'
            : 'bg-white text-slate-900 border-slate-200'
        }`}
      >
        {/* 🌟 1. Top Header */}
        <header
          className={`p-4 border-b flex items-center justify-between ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="text-xl">🛍️</span>
            <div>
              <h2 className="text-sm font-black tracking-tight">Your Personal Cart (कार्ट)</h2>
              {currentUser ? (
                <span className="text-[10px] text-amber-500 font-bold block">
                  📱 +91 {currentUser.phone} • {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-bold block">
                  Login Required
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {currentUser && cartItems.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Clear all selected items from your cart?')) {
                    hyperlocalStore.clearCart();
                  }
                }}
                className="text-[10px] text-rose-500 hover:text-rose-400 font-bold px-2 py-1 bg-rose-500/10 rounded-lg cursor-pointer transition active:scale-95"
              >
                Clear All
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black cursor-pointer active:scale-90 transition ${
                isDark ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-200 text-slate-700 hover:text-black'
              }`}
            >
              ✕
            </button>
          </div>
        </header>

        {/* 🌟 2. Cart Body: Auth Gate or User-Specific Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!currentUser ? (
            /* 🔒 AUTH GATE: Unauthenticated Users */
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-400/20 text-amber-500 text-3xl flex items-center justify-center mx-auto shadow-sm">
                🛒
              </div>
              <div className="space-y-1 max-w-xs mx-auto">
                <h3 className="text-sm font-black">Sign In to Access Your Cart</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Your cart is linked to your registered mobile number so you can order directly from verified local merchants across Alwar.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onOpenAuth) onOpenAuth();
                }}
                className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-xs rounded-2xl shadow-lg cursor-pointer active:scale-95 transition"
              >
                Login / Register ➔
              </button>
            </div>
          ) : (
            /* 🛍️ AUTHENTICATED USER CART */
            <>
              {!isVerifiedMember && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-[11px] text-amber-300 flex items-center justify-between">
                  <div>
                    <span className="font-black block">🔒 Account Pending WhatsApp Activation</span>
                    <p className="text-[10px] text-slate-400">
                      Verify your 6-digit WhatsApp PIN to dispatch orders to sellers.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenAuth) onOpenAuth();
                    }}
                    className="px-2.5 py-1 bg-amber-400 text-slate-950 font-black text-[10px] rounded-lg cursor-pointer"
                  >
                    Activate
                  </button>
                </div>
              )}

              {cartItems.length === 0 ? (
                <div className="text-center py-20 space-y-3">
                  <span className="text-4xl block">🛍️</span>
                  <h3 className="text-sm font-black text-slate-400">Your Cart is Empty</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Add products, rental attire, deals, or service packages from local shops across Alwar.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer active:scale-95 transition"
                  >
                    Explore Categories ➔
                  </button>
                </div>
              ) : (
                groupedBySeller.map((sellerGroup, gIdx) => (
                  <div
                    key={gIdx}
                    className={`p-3.5 rounded-3xl border space-y-3 shadow-xs ${
                      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {/* Merchant Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2">
                      <div>
                        <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider block">
                          SELLER / MERCHANT
                        </span>
                        <h4 className="text-xs font-black truncate max-w-[200px]">
                          🏪 {sellerGroup.sellerName}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          📍 {sellerGroup.location} • 📱 +91 {sellerGroup.phone}
                        </span>
                      </div>

                      <span className="text-[10px] font-bold text-slate-500 font-mono">
                        {sellerGroup.items.length} {sellerGroup.items.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    {/* Items from this seller */}
                    <div className="space-y-2.5">
                      {sellerGroup.items.map((item) => (
                        <div
                          key={item.id}
                          className={`p-2.5 rounded-2xl border flex items-center justify-between space-x-3 ${
                            isDark ? 'bg-slate-950 border-slate-800/80' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-amber-400/20 text-amber-500 font-black flex items-center justify-center text-lg shrink-0">
                                🛍️
                              </div>
                            )}

                            <div className="min-w-0">
                              <h5 className="text-[11.5px] font-black leading-snug truncate">
                                {item.title}
                              </h5>
                              <div className="flex items-center space-x-1.5 flex-wrap">
                                <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold">
                                  {item.price}
                                </span>
                                {item.dealBadge && (
                                  <span className="text-[8.5px] bg-rose-500/10 text-rose-500 font-black px-1.5 py-0.2 rounded-md">
                                    {item.dealBadge}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-1 text-[8.5px] text-slate-400 font-semibold">
                                <span className="uppercase">{item.category}</span>
                                {item.doorstepTrial && (
                                  <span className="text-amber-500 font-bold">• 🚪 Trial Avail</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quantity Controls & Delete */}
                          <div className="flex items-center space-x-2 shrink-0">
                            <div
                              className={`flex items-center space-x-1 border rounded-xl px-1 py-0.5 ${
                                isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-300'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  hyperlocalStore.updateCartQuantity(item.id, (item.quantity || 1) - 1)
                                }
                                className="w-5 h-5 flex items-center justify-center font-black text-xs text-slate-400 hover:text-amber-500 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="text-[11px] font-black font-mono w-4 text-center">
                                {item.quantity || 1}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  hyperlocalStore.updateCartQuantity(item.id, (item.quantity || 1) + 1)
                                }
                                className="w-5 h-5 flex items-center justify-center font-black text-xs text-slate-400 hover:text-amber-500 cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => hyperlocalStore.removeFromCart(item.id)}
                              className="text-slate-400 hover:text-rose-500 text-xs p-1 cursor-pointer"
                              title="Remove item"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 1-Tap Order to this Merchant via WhatsApp */}
                    <div className="pt-1 flex items-center justify-between">
                      <div className="text-[11px] font-bold">
                        {sellerGroup.subtotal > 0 && (
                          <span>Subtotal: <strong className="text-emerald-500">₹{sellerGroup.subtotal.toLocaleString('en-IN')}</strong></span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDispatchWhatsAppOrder(sellerGroup)}
                        className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-[10.5px] rounded-xl shadow-md active:scale-95 transition cursor-pointer flex items-center space-x-1"
                      >
                        <span>💬</span>
                        <span>Order from Seller ➔</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* 🌟 3. Sticky Bottom Summary (Authenticated Only) */}
        {currentUser && cartItems.length > 0 && (
          <footer
            className={`p-4 border-t space-y-2 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400">Total Items in Cart:</span>
              <span className="font-mono font-black text-sm text-slate-800 dark:text-slate-100">
                {cartItems.reduce((s, i) => s + (i.quantity || 1), 0)} Units
              </span>
            </div>

            {totalCalculablePrice > 0 && (
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400">Calculated Cart Value:</span>
                <span className="font-mono font-black text-base text-emerald-500">
                  ₹{totalCalculablePrice.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (groupedBySeller.length === 1) {
                  handleDispatchWhatsAppOrder(groupedBySeller[0]);
                } else {
                  alert('Please tap "Order from Seller ➔" on individual merchants above to send customized orders to each shop.');
                }
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-xs rounded-2xl shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>🛍️</span>
              <span>{groupedBySeller.length === 1 ? 'Dispatch Order on WhatsApp ➔' : 'Review & Dispatch Orders ➔'}</span>
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}