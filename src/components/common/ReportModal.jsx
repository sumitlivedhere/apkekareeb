import React, { useState } from 'react';
import { reportListing } from '../../services/listingService';
import { getCurrentUserProfile, sanitizePhone } from '../../services/authService';

const REPORT_REASONS = [
  'Spam / Repetitive Posting (स्पैम / बार-बार पोस्ट)',
  'Fake Price or Rates (गलत या भ्रामक कीमत)',
  'Wrong Category / Irrelevant (गलत केटेगरी)',
  'Suspected Scam / Fraud (धोखाधड़ी / फर्जी दुकान)',
  'Out of Stock / Shop Closed (दुकान बंद / अनुपलब्ध)',
  'Inappropriate Image or Content (अनुचित सामग्री)',
];

export default function ReportModal({
  isOpen,
  listing,
  reporterPhone = '',
  onClose,
  onSuccess,
}) {
  const currentUser = getCurrentUserProfile();
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [customNotes, setCustomNotes] = useState('');
  const [userPhone, setUserPhone] = useState(() => reporterPhone || currentUser?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !listing) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg('');

    const cleanPhone = sanitizePhone(userPhone || currentUser?.phone) || '9876543210';
    const finalReason = `${selectedReason}${customNotes.trim() ? ` - Details: ${customNotes.trim()}` : ''}`;
    const listingTitle = listing.title || listing.name || 'Reported Listing';
    const targetListingId = listing.id || listing.listingId;

    try {
      const res = await reportListing(
        targetListingId,
        cleanPhone,
        finalReason,
        listingTitle
      );

      if (res && res.error) {
        setStatusMsg(res.error.message || 'Failed to submit report. Please check your connection.');
      } else {
        setIsSuccess(true);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          setIsSuccess(false);
          onClose();
        }, 1800);
      }
    } catch (err) {
      console.error('Report submission error:', err);
      setStatusMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-4 space-y-3.5 shadow-2xl text-slate-100 text-xs">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center space-x-1.5 text-rose-400 font-black">
            <span>🚩</span>
            <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">
              Report Listing (शिकायत दर्ज करें)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Target Listing Summary */}
        <div className="p-2.5 bg-slate-950 rounded-2xl border border-slate-800">
          <p className="text-xs font-black text-slate-100 truncate">{listing.title || listing.name}</p>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            👤 {listing.sellerName || listing.seller_name || 'Seller'} • 📍 {listing.location || listing.location_name || 'Alwar'}
          </span>
        </div>

        {statusMsg && (
          <div className="p-2 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-[10px] font-bold text-center">
            ⚠️ {statusMsg}
          </div>
        )}

        {isSuccess ? (
          <div className="py-6 text-center space-y-1.5 animate-fade-in">
            <span className="text-3xl block">🛡️</span>
            <h4 className="text-sm font-black text-emerald-400">Report Sent to Master Admin</h4>
            <p className="text-[10px] text-slate-400">
              Thank you for helping keep our town marketplace authentic and fraud-free.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Select Reason (कारण चुनें) *
              </label>
              <div className="space-y-1 max-h-44 overflow-y-auto pr-0.5 scrollbar-none">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r}
                    className={`flex items-center space-x-2 p-2 rounded-xl border cursor-pointer transition ${
                      selectedReason === r
                        ? 'bg-rose-500/10 border-rose-500/50 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReasonOption"
                      value={r}
                      checked={selectedReason === r}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="accent-rose-500"
                    />
                    <span className="text-[10.5px] font-semibold truncate">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[9.5px] font-bold text-slate-400 mb-1">
                Your Mobile Number (Optional for Admin Follow-up)
              </label>
              <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1.5">
                <span className="text-slate-500 font-bold mr-1.5 text-xs">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-transparent text-xs text-slate-100 font-mono font-bold focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9.5px] font-bold text-slate-400 mb-1">
                Additional Note (वैकल्पिक विवरण)
              </label>
              <textarea
                rows={2}
                placeholder="Explain what is misleading or wrong..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="pt-1 flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-xs shadow-md active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report 🚩'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}