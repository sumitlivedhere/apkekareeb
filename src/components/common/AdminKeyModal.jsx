import React, { useState } from 'react';

// You can change this Master Key to any secret passcode you prefer
export const MASTER_ADMIN_KEY = 'JagadUsha@NEBExt3/33';

export default function AdminKeyModal({ isOpen, onClose, onSuccess }) {
  const [inputKey, setInputKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputKey.trim() === MASTER_ADMIN_KEY) {
      localStorage.setItem('townhub_admin_unlocked', 'true');
      setErrorMsg('');
      onSuccess();
    } else {
      setErrorMsg('❌ Invalid Master Admin Key. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in select-none">
      <div className="bg-[#1e050a] border border-amber-500/50 w-full max-w-sm rounded-3xl p-5 shadow-[0_10px_35px_rgba(0,0,0,0.7)] space-y-4 text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#5e121e]/60 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl p-1 rounded-xl bg-amber-400/10 border border-amber-400/30">👑</span>
            <div>
              <h3 className="text-xs font-black text-amber-300">Admin Master Access</h3>
              <p className="text-[9.5px] text-rose-200/70">Manual Merchant Seeding Mode</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#350a12] text-amber-200 hover:bg-[#4d0f1b] flex items-center justify-center text-xs font-bold transition"
          >
            ✕
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[10px] font-black uppercase text-amber-400/90 block mb-1">
              Enter Master Admin Key *
            </label>
            <input
              type="password"
              required
              autoFocus
              placeholder="Enter Admin Key (Default: ALWAR777)"
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              className="w-full bg-[#120205] border border-amber-500/40 rounded-xl px-3 py-2.5 text-xs font-bold text-amber-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
            />
          </div>

          {errorMsg && (
            <p className="text-[10px] font-bold text-rose-400 bg-rose-950/40 p-2 rounded-lg border border-rose-800/40">
              {errorMsg}
            </p>
          )}

          <div className="p-2.5 rounded-xl bg-[#2b050d] border border-amber-400/20 text-[9.5px] text-amber-100/75 leading-tight">
            💡 Entering the master key unlocks instant listing creation across all town categories on this device.
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg active:scale-95 transition cursor-pointer"
          >
            Unlock Admin Posting ➔
          </button>
        </form>

      </div>
    </div>
  );
}