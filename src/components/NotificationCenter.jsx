import React, { useMemo } from 'react';

export default function NotificationCenter({
  notifications = [],
  currentUser = null,
  currentScreen = 'home',
  isAdminMode = false,
  onClose,
  onMarkAllRead,
  onSelectNotification,
}) {
  // 1. Determine Current Active Persona & Clean Phone Number
  const userPhone = currentUser?.phone
    ? String(currentUser.phone).replace(/\D/g, '').slice(-10)
    : null;

  const isSellerOnBusinessHub =
    currentScreen === 'provider-dashboard' ||
    Boolean(currentUser?.is_merchant || currentUser?.verification_tier === 'verified_merchant');

  // Determine active viewing role
  const activeRole = isAdminMode || currentScreen === 'admin-dashboard'
    ? 'admin'
    : isSellerOnBusinessHub
    ? 'seller'
    : currentUser
    ? 'user'
    : 'public';

  // 2. Filter alerts strictly for the active persona
  const personaAlerts = useMemo(() => {
    return notifications.filter((notif) => {
      const role = notif.recipient_role || notif.role || 'public';
      const targetPhone = notif.recipient_phone
        ? String(notif.recipient_phone).replace(/\D/g, '').slice(-10)
        : null;

      // 👑 Admin only sees admin tasks
      if (activeRole === 'admin') {
        return role === 'admin';
      }

      // 🏪 Seller only sees notifications sent to their phone
      if (activeRole === 'seller') {
        return role === 'seller' && (!targetPhone || targetPhone === userPhone);
      }

      // 👤 Resident user only sees replies to their phone + public alerts
      if (activeRole === 'user') {
        return (role === 'user' && targetPhone === userPhone) || role === 'public';
      }

      // 📢 Guest / Public
      return role === 'public';
    });
  }, [notifications, activeRole, userPhone]);

  const unreadCount = personaAlerts.filter((n) => !n.is_read && !n.read).length;

  const getTagBadge = (tag) => {
    switch (tag) {
      case 'PENDING_APPROVAL':
      case 'EDIT_PROPOSAL':
        return { label: '👑 Approval Needed', bg: 'bg-amber-400/20 text-amber-300 border-amber-400/30' };
      case 'NEW_USER_PIN':
        return { label: '💬 Send WhatsApp PIN', bg: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30' };
      case 'FLAGGED_REPORT':
        return { label: '🚨 Flagged Report', bg: 'bg-rose-400/20 text-rose-300 border-rose-400/30' };
      case 'USER_COMMENT':
      case 'VOICE_INQUIRY':
        return { label: '💬 Customer Inquiry', bg: 'bg-indigo-400/20 text-indigo-300 border-indigo-400/30' };
      case 'SELLER_REPLY':
        return { label: '🏪 Shopkeeper Replied', bg: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30' };
      case 'LISTING_APPROVED':
        return { label: '🟢 Verified Live', bg: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30' };
      case 'LISTING_REJECTED':
      case 'ADMIN_FEEDBACK':
        return { label: '⚠️ Action Needed', bg: 'bg-rose-400/20 text-rose-300 border-rose-400/30' };
      case 'INTEREST_ALERT':
        return { label: '⭐ Buyer Saved Item', bg: 'bg-amber-400/20 text-amber-300 border-amber-400/30' };
      case 'DEAL_UPDATE':
      case 'TRENDING_OFFER':
        return { label: '🏷️ Deal Alert', bg: 'bg-purple-400/20 text-purple-300 border-purple-400/30' };
      default:
        return { label: '📢 Alwar Alert', bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-fade-in text-slate-100 font-sans">
      <div className="bg-[#111b21] border border-[#222e35] rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden pb-4">
        
        {/* Modal Top Header with Dynamic Persona Label */}
        <div className="p-4 border-b border-[#222e35] flex items-center justify-between shrink-0 bg-[#0b141a]">
          <div className="flex items-center space-x-2.5">
            <span className="w-9 h-9 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-lg font-black shadow-md">
              🔔
            </span>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="text-sm font-black text-white">Activity & Alerts</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-rose-600 text-white font-mono">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              <p className="text-[10px] text-amber-300 font-bold">
                {activeRole === 'admin'
                  ? '👑 Master Admin Mode'
                  : activeRole === 'seller'
                  ? `🏪 Business Hub (+91 ${userPhone || ''})`
                  : activeRole === 'user'
                  ? `👤 Resident Mode (${currentUser?.full_name || 'User'})`
                  : '📢Alwar  Hub Public Feed'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-[10px] text-amber-300 hover:text-amber-200 font-bold underline cursor-pointer"
              >
                Mark read
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 bg-[#202c33] hover:bg-[#2a3942] text-slate-300 rounded-full flex items-center justify-center text-xs font-black cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Alerts Stream */}
        <div className="p-3.5 overflow-y-auto space-y-2.5 flex-1 scrollbar-none">
          {personaAlerts.length === 0 ? (
            <div className="py-14 text-center space-y-2 text-slate-500">
              <span className="text-3xl block">🔕</span>
              <p className="text-xs font-bold text-slate-400">No new alerts right now</p>
              <p className="text-[10px] text-slate-500 max-w-[240px] mx-auto leading-relaxed">
                {activeRole === 'admin'
                  ? 'All pending listings and WhatsApp activations are clear.'
                  : activeRole === 'seller'
                  ? 'Customer inquiries, saves, and admin approval notes will ring here.'
                  : 'Replies to your comments and tracked discount updates will ring here.'}
              </p>
            </div>
          ) : (
            personaAlerts.map((notif) => {
              const badge = getTagBadge(notif.tag);
              const isUnread = !notif.is_read && !notif.read;

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (onSelectNotification) onSelectNotification(notif);
                  }}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-2 ${
                    isUnread
                      ? 'bg-[#182229] border-amber-400/50 shadow-md hover:border-amber-400'
                      : 'bg-[#202c33]/70 border-[#2a3942] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {new Date(notif.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-slate-100 leading-snug">
                      {notif.title}
                    </h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>

                  <div className="pt-1 flex items-center justify-between border-t border-[#2a3942]/60 text-[10px]">
                    <span className="text-slate-400">
                      {activeRole === 'admin'
                        ? 'Tap to Inspect in Admin Studio ➔'
                        : activeRole === 'seller'
                        ? 'Tap to View in Business Hub ➔'
                        : 'Tap to View Details ➔'}
                    </span>
                    <span className="text-amber-300 font-bold">Open</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}