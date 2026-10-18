import React, { useState } from 'react';
import { verifyAdminMasterKey } from '../../services/authService';

export default function AdminKeyModal({ isOpen, onClose, onSuccess }) {
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!keyInput.trim() || isVerifying) return;

    setIsVerifying(true);
    setError('');

    const result = await verifyAdminMasterKey(keyInput);
    setIsVerifying(false);

    if (result.success) {
      setKeyInput('');
      setError('');
      onSuccess?.(result.token);
    } else {
      setError(result.error || 'Invalid Master Admin Key');
    }
  };

  return (
    <div
      data-modal-open="true"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fade-in"
    >
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-xs p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🛡️</span>
            <div>
              <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">
                Master Admin Access
              </h3>
              <p className="text-[10px] text-slate-400">
                Server-Verified Security Gate
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value);
                setError('');
              }}
              placeholder="Enter Master Admin Key"
              autoFocus
              disabled={isVerifying}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none transition"
            />
            {error && (
              <p className="text-[10px] text-rose-400 font-bold mt-1.5">
                ⚠️ {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isVerifying || !keyInput.trim()}
            className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-lg active:scale-95 transition cursor-pointer"
          >
            {isVerifying ? 'Verifying with Server...' : 'Unlock Admin Console'}
          </button>
        </form>
      </div>
    </div>
  );
}