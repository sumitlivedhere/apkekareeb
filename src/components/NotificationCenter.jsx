import React, { useState, useMemo, useEffect } from 'react';
import {
  hyperlocalStore,
  getStoredReadNotifs,
  ADMIN_TAGS,
  SELLER_TAGS,
} from '../store/hyperlocalStore';

const sanitizePhone = (phone) => (phone ? String(phone).replace(/\D/g, '').slice(-10) : null);

export default function NotificationCenter({
  notifications = [],
  currentUser = null,
  currentScreen = 'home',
  isAdminMode = false,
  onClose,
  onMarkAllRead,
  onSelectNotification,
}) {
  const currentUserId = currentUser?.id ? String(currentUser.id) : null;
  const userPhone = sanitizePhone(currentUser?.phone);

  const isSeller = Boolean(
    currentUser?.is_merchant ||
    currentUser?.verification_tier === 'verified_merchant' ||
    currentUser?.verification_tier === 'merchant' ||
    currentUser?.role === 'seller'
  );

  const isAdmin = Boolean(
    currentScreen === 'admin-dashboard' ||
    currentUser?.role === 'admin' ||
    (isAdminMode && currentScreen === 'admin-dashboard')
  );

  const [readIds, setReadIds] = useState(() => getStoredReadNotifs());

  useEffect(() => {
    setReadIds(getStoredReadNotifs());
  }, [notifications]);

  const [activeTab, setActiveTab] = useState(() => {
    if (!currentUser) return 'all';
    if (currentScreen === 'admin-dashboard' && isAdmin) return 'admin';
    if (currentScreen === 'provider-dashboard' && isSeller) return 'seller';
    return 'all';
  });

  // 1. Strict Authorization Gate
  const authorizedAlerts = useMemo(() => {
    return (notifications || []).filter((notif) => {
      const role = String(notif.recipient_role || notif.role || 'public').toLowerCase();
      const notifUserId = notif.user_id ? String(notif.user_id) : null;
      const notifPhone = sanitizePhone(
        notif.recipient_phone ||
        notif.metadata?.sellerPhone ||
        notif.metadata?.seller_phone ||
        notif.metadata?.userPhone ||
        notif.metadata?.phone
      );

      const isAdmTag = ADMIN_TAGS.has(notif.tag);
      const isSelTag = SELLER_TAGS.has(notif.tag);

      // 🔒 GUEST VISITOR: Only true public broadcasts without recipient target
      if (!currentUser) {
        return role === 'public' && !notifUserId && !notifPhone && !isAdmTag && !isSelTag;
      }

      // 👑 ADMIN: Only visible if on admin dashboard
      if (role === 'admin' || isAdmTag) {
        return isAdmin;
      }

      // 🏪 SELLER: Must match this seller's user ID or phone
      if (role === 'seller' || isSelTag) {
        if (!isSeller) return false;
        if (notifUserId && currentUserId && notifUserId === currentUserId) return true;
        if (notifPhone && userPhone && notifPhone === userPhone) return true;
        return false;
      }

      // 👤 RESIDENT USER: Must match this user's user ID or phone
      if (role === 'user') {
        if (notifUserId && currentUserId && notifUserId === currentUserId) return true;
        if (notifPhone && userPhone && notifPhone === userPhone) return true;
        return false;
      }

      // 📢 PUBLIC
      if (role === 'public') {
        if (notifUserId && currentUserId && notifUserId !== currentUserId) return false;
        if (notifPhone && userPhone && notifPhone !== userPhone) return false;
        return !isAdmTag && !isSelTag;
      }

      return false;
    });
  }, [notifications, currentUser, currentUserId, userPhone, isSeller, isAdmin]);

  // 2. Tab Sub-filtering (Only among authorized alerts)
  const categorizedAlerts = useMemo(() => {
    return authorizedAlerts.filter((notif) => {
      const role = String(notif.recipient_role || notif.role || 'public').toLowerCase();
      const isAdm = role === 'admin' || ADMIN_TAGS.has(notif.tag);
      const isSel = role === 'seller' || SELLER_TAGS.has(notif.tag);

      if (activeTab === 'admin') return isAdm;
      if (activeTab === 'seller') return isSel;
      if (activeTab === 'resident') return !isAdm && !isSel;
      return true; // 'all'
    });
  }, [authorizedAlerts, activeTab]);

  const unreadCount = useMemo(() => {
    return categorizedAlerts.filter(
      (n) => !n.is_read && !n.read && !readIds.has(String(n.id))
    ).length;
  }, [categorizedAlerts, readIds]);

  const handleItemClick = (notif) => {
    const strId = String(notif.id);
    setReadIds((prev) => new Set([...prev, strId]));
    hyperlocalStore.markNotificationRead(strId);

    if ('vibrate' in navigator) navigator.vibrate(20);
    if (onSelectNotification) onSelectNotification(notif);
  };

  const handleMarkSingleRead = (e, notif) => {
    e.stopPropagation();
    const strId = String(notif.id);
    setReadIds((prev) => new Set([...prev, strId]));
    hyperlocalStore.markNotificationRead(strId);

    if ('vibrate' in navigator) navigator.vibrate(15);
  };

  const handleMarkAllRead = () => {
    const idsToMark = categorizedAlerts.map((n) => String(n.id));
    setReadIds((prev) => new Set([...prev, ...idsToMark]));
    hyperlocalStore.markAllNotificationsRead(idsToMark);

    if ('vibrate' in navigator) navigator.vibrate(25);
    if (onMarkAllRead) onMarkAllRead();
  };

  const getTagBadge = (rawTag = '') => {
    const tag = String(rawTag).toUpperCase().replace(/\s+/g, '_');
    switch (tag) {
      case 'PENDING_APPROVAL':
      case 'NEW_ENLISTMENT':
      case 'EDIT_PROPOSAL':
        return { label: '👑 Approval Needed', bg: 'bg-amber-400/20 text-amber-300 border-amber-400/30' };
      case 'NEW_USER_PIN':
      case 'USER_PIN_REQUEST':
      case 'SELLER_PIN_REQUEST':
        return { label: '💬 WhatsApp PIN', bg: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30' };
      case 'FLAGGED_REPORT':
      case 'REPORT':
        return { label: '🚨 Flagged Report', bg: 'bg-rose-400/20 text-rose-300 border-rose-400/30' };
      case 'USER_COMMENT':
      case 'NEW_COMMENT':
      case 'VOICE_INQUIRY':
        return { label: '💬 Inquiry', bg: 'bg-indigo-400/20 text-indigo-300 border-indigo-400/30' };
      case 'SELLER_REPLY':
      case 'SELLER_REPLIED':
      case 'SELLER_FEEDBACK_REPLY':
      case 'SELLER_VOICE_REPLY':
        return { label: '🏪 Shopkeeper Replied', bg: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30' };
      case 'LISTING_APPROVED':
      case 'APPROVED':
        return { label: '🟢 Verified Live', bg: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30' };
      case 'LISTING_REJECTED':
      case 'REJECTED':
      case 'ADMIN_FEEDBACK':
        return { label: '⚠️ Action Needed', bg: 'bg-rose-400/20 text-rose-300 border-rose-400/30' };
      case 'INTEREST_ALERT':
      case 'INTEREST_REGISTERED':
        return { label: '⭐ Buyer Saved Item', bg: 'bg-amber-400/20 text-amber-300 border-amber-400/30' };
      case 'CART_ADDITION':
        return { label: '🛒 Added to Cart', bg: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30' };
      case 'NEW_REVIEW':
        return { label: '⭐ New Rating', bg: 'bg-amber-400/20 text-amber-300 border-amber-400/30' };
      case 'DEAL_UPDATE':
      case 'TRENDING_OFFER':
        return { label: '🏷️ Deal Alert', bg: 'bg-purple-400/20 text-purple-300 border-purple-400/30' };
      default:
        return { label: `📢 ${rawTag || 'Alwar Alert'}`, bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-fade-in text-slate-100 font-sans">
      <div className="bg-[#111b21] border border-[#222e35] rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[88vh] flex flex-col shadow-2xl overflow-hidden pb-3">
        
        {/* Header */}
        <div className="p-4 border-b border-[#222e35] flex items-center justify-between shrink-0 bg-[#0b141a]">
          <div className="flex items-center space-x-2.5">
            <span className="w-9 h-9 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-lg font-black shadow-md">
              🔔
            </span>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="text-sm font-black text-white">Activity & Alerts</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-white font-mono animate-pulse">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              <p className="text-[10px] text-amber-300 font-bold truncate max-w-[200px]">
                {!currentUser
                  ? '📢 Alwar Public Announcements'
                  : isAdmin && currentScreen === 'admin-dashboard'
                  ? '👑 Master Admin Mode'
                  : isSeller
                  ? `🏪 Business (+91 ${userPhone || ''})`
                  : `👤 Resident (${currentUser?.full_name?.split(' ')[0] || 'User'})`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] text-amber-300 hover:text-amber-200 font-bold underline cursor-pointer active:scale-95 transition"
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 bg-[#202c33] hover:bg-[#2a3942] text-slate-300 rounded-full flex items-center justify-center text-xs font-black cursor-pointer active:scale-90 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Persona Tabs (Only visible when logged-in user has multiple roles) */}
        {currentUser && (isSeller || (isAdmin && currentScreen === 'admin-dashboard')) && (
          <div className="px-4 py-2 flex items-center space-x-1.5 overflow-x-auto border-b border-[#222e35] bg-[#0b141a]/60 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`py-1 px-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'bg-[#202c33] text-slate-400 hover:text-white border border-[#2a3942]'
              }`}
            >
              All Alerts
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('resident')}
              className={`py-1 px-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'resident'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'bg-[#202c33] text-slate-400 hover:text-white border border-[#2a3942]'
              }`}
            >
              👤 Personal
            </button>

            {isSeller && (
              <button
                type="button"
                onClick={() => setActiveTab('seller')}
                className={`py-1 px-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'seller'
                    ? 'bg-emerald-400 text-slate-950 shadow-xs'
                    : 'bg-[#202c33] text-slate-400 hover:text-white border border-[#2a3942]'
                }`}
              >
                🏪 Business
              </button>
            )}

            {isAdmin && currentScreen === 'admin-dashboard' && (
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`py-1 px-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-purple-400 text-slate-950 shadow-xs'
                    : 'bg-[#202c33] text-slate-400 hover:text-white border border-[#2a3942]'
                }`}
              >
                👑 Admin
              </button>
            )}
          </div>
        )}

        {/* Alerts Stream */}
        <div className="p-3.5 overflow-y-auto space-y-2.5 flex-1 scrollbar-none">
          {categorizedAlerts.length === 0 ? (
            <div className="py-14 text-center space-y-2 text-slate-500">
              <span className="text-3xl block">🔕</span>
              <p className="text-xs font-bold text-slate-400">
                {!currentUser ? 'No public announcements' : 'No new alerts right now'}
              </p>
              <p className="text-[10px] text-slate-500 max-w-[240px] mx-auto leading-relaxed">
                {!currentUser
                  ? 'Sign in to receive personal inquiries, seller updates, and status alerts.'
                  : activeTab === 'admin'
                  ? 'All pending listings and WhatsApp activations are clear.'
                  : activeTab === 'seller'
                  ? 'Customer inquiries, saves, and orders will ring here.'
                  : 'Replies to your comments and discount alerts will ring here.'}
              </p>
            </div>
          ) : (
            categorizedAlerts.map((notif) => {
              const badge = getTagBadge(notif.tag);
              const isRead = Boolean(notif.is_read || notif.read || readIds.has(String(notif.id)));

              let timeDisplay = notif.time || 'Recently';
              if (notif.created_at) {
                try {
                  timeDisplay = new Date(notif.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                } catch {}
              }

              return (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-2 active:scale-[0.99] relative group ${
                    isRead
                      ? 'bg-[#202c33]/50 border-[#2a3942]/60 opacity-80 hover:opacity-100 hover:border-slate-600'
                      : 'bg-[#182229] border-amber-400/50 shadow-md hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      {!isRead && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 shadow-xs shadow-amber-400/80 animate-pulse" />
                      )}
                      <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[9.5px] text-slate-400 font-mono">
                        {timeDisplay}
                      </span>

                      {!isRead && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkSingleRead(e, notif)}
                          className="text-[9.5px] font-bold text-amber-300 hover:text-white px-1.5 py-0.5 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 rounded-md transition cursor-pointer"
                          title="Mark as read"
                        >
                          Mark read ✓
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <h4 className={`text-xs font-black leading-snug ${isRead ? 'text-slate-200' : 'text-white'}`}>
                      {notif.title}
                    </h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>
                  </div>

                  <div className="pt-1 flex items-center justify-between border-t border-[#2a3942]/60 text-[10px]">
                    <span className="text-slate-400 text-[10px]">
                      {ADMIN_TAGS.has(notif.tag)
                        ? 'Tap to Inspect in Admin Studio ➔'
                        : SELLER_TAGS.has(notif.tag)
                        ? 'Tap to View in Business Hub ➔'
                        : 'Tap to View Details ➔'}
                    </span>
                    <span className="text-amber-300 font-bold group-hover:translate-x-0.5 transition-transform">
                      Open ➔
                    </span>
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