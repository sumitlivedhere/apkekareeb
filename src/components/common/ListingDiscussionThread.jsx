import React, { useState, useRef, useEffect } from 'react';
import { useThreadSlice, useInterestSlice, hyperlocalStore } from '../../store/hyperlocalStore';
import VoiceNotePlayer from './VoiceNotePlayer';
import { uploadVoiceNoteToStorage } from '../../services/listingService';
import { getCurrentUserProfile } from '../../services/authService';
import {
  getOptimizedVoiceStream,
  createOptimizedMediaRecorder,
} from '../../utils/audioCompressor';

export default function ListingDiscussionThread({
  listingId,
  listingTitle = 'Listing',
  sellerName = 'Verified Seller',
  sellerPhone = '',
  initialInterestCount = 0,
  variant = 'corner', // 'corner' | 'reels'
  onNewNotification,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => getCurrentUserProfile());
  const [newComment, setNewComment] = useState('');
  const [userName, setUserName] = useState(currentUser?.full_name || '');
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSellerMode, setIsSellerMode] = useState(false);

  // Sync active user profile on modal open
  useEffect(() => {
    if (isOpen) {
      const user = getCurrentUserProfile();
      setCurrentUser(user);
      if (user?.full_name && !userName) {
        setUserName(user.full_name);
      }
    }
  }, [isOpen]);

  // Tier 2 & Tier 3 Permissions Verification
  const isTier2Verified = Boolean(
    currentUser &&
      (currentUser.verification_tier === 'verified_resident' ||
        currentUser.verification_tier === 'verified_merchant' ||
        currentUser.is_merchant === true)
  );

  // 🎙️ Buyer Audio Recording & Server Upload State
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isUploadingBuyerVoice, setIsUploadingBuyerVoice] = useState(false);

  const buyerMediaRecorderRef = useRef(null);
  const buyerAudioChunksRef = useRef([]);
  const buyerTimerRef = useRef(null);

  // 🎙️ Seller Audio Recording & Server Upload State
  const [sellerRecordingId, setSellerRecordingId] = useState(null);
  const [sellerRecordSeconds, setSellerRecordSeconds] = useState(0);
  const [isUploadingSellerVoice, setIsUploadingSellerVoice] = useState(false);

  const sellerMediaRecorderRef = useRef(null);
  const sellerAudioChunksRef = useRef([]);
  const sellerTimerRef = useRef(null);

  const [pendingConfirmQuery, setPendingConfirmQuery] = useState(null);

  const comments = useThreadSlice(listingId, []);
  const interestCount = useInterestSlice(listingId, initialInterestCount);
  const inputRef = useRef(null);

  // 🎙️ 1. Buyer: Start Recording Pure Voice Note (16kHz Mono Opus)
  const startBuyerVoiceRecording = async () => {
    if (!currentUser) {
      alert('⚠️ Login Required: Please sign in with your phone and 4-digit MPIN first.');
      return;
    }
    if (!isTier2Verified) {
      alert('🔒 Tier 2 Verification Required: Only Verified Residents can send voice notes. Please request your 6-digit WhatsApp PIN from your Profile page.');
      return;
    }

    try {
      const stream = await getOptimizedVoiceStream();
      buyerAudioChunksRef.current = [];

      const mediaRecorder = createOptimizedMediaRecorder(stream);
      buyerMediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) buyerAudioChunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordSeconds(0);

      buyerTimerRef.current = setInterval(() => {
        setRecordSeconds((p) => p + 1);
      }, 1000);
    } catch {
      alert('Microphone permission denied. Please allow microphone access in your browser settings.');
    }
  };

  // 🎙️ 2. Buyer: Stop, Upload to Backend Storage & Save
  const stopAndSendBuyerVoice = () => {
    const mediaRecorder = buyerMediaRecorderRef.current;
    if (!mediaRecorder) return;

    mediaRecorder.onstop = async () => {
      clearInterval(buyerTimerRef.current);
      setIsUploadingBuyerVoice(true);

      try {
        const audioBlob = new Blob(buyerAudioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });

        // Upload voice note to Supabase Storage
        const publicAudioUrl = await uploadVoiceNoteToStorage(audioBlob);
        const durationStr = `0:${recordSeconds < 10 ? '0' : ''}${recordSeconds}`;
        const sender = currentUser?.full_name || userName.trim() || 'Town User';

        hyperlocalStore.addThreadComment(
          listingId,
          {
            userName: sender,
            type: 'audio',
            audioUrl: publicAudioUrl,
            audioDuration: durationStr,
            text: '🎤 Voice Note Question',
            isPublic: true,
          },
          listingTitle
        );

        if (onNewNotification) {
          onNewNotification({
            tag: 'VOICE INQUIRY',
            title: `Voice note on "${listingTitle}"`,
            message: `${sender} sent an audio question (${durationStr})`,
            time: 'Just now',
            type: 'comment',
            targetId: listingId,
          });
        }
      } catch (err) {
        console.error('Failed to upload buyer voice note:', err);
      } finally {
        mediaRecorder.stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        setRecordSeconds(0);
        setIsUploadingBuyerVoice(false);
      }
    };

    mediaRecorder.stop();
  };

  const cancelBuyerVoiceRecording = () => {
    if (buyerMediaRecorderRef.current) {
      clearInterval(buyerTimerRef.current);
      buyerMediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      buyerMediaRecorderRef.current = null;
      setIsRecording(false);
      setRecordSeconds(0);
    }
  };

  // 🎙️ 3. Seller: Start Recording Audio Reply
  const startSellerVoiceRecording = async (commentId) => {
    try {
      const stream = await getOptimizedVoiceStream();
      sellerAudioChunksRef.current = [];

      const mediaRecorder = createOptimizedMediaRecorder(stream);
      sellerMediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) sellerAudioChunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      setSellerRecordingId(commentId);
      setSellerRecordSeconds(0);

      sellerTimerRef.current = setInterval(() => {
        setSellerRecordSeconds((p) => p + 1);
      }, 1000);
    } catch {
      alert('Microphone permission denied.');
    }
  };

  // 🎙️ 4. Seller: Stop, Upload to Backend Storage & Save
  const stopAndSendSellerVoice = (commentId) => {
    const mediaRecorder = sellerMediaRecorderRef.current;
    if (!mediaRecorder) return;

    mediaRecorder.onstop = async () => {
      clearInterval(sellerTimerRef.current);
      setIsUploadingSellerVoice(true);

      try {
        const audioBlob = new Blob(sellerAudioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });

        const publicAudioUrl = await uploadVoiceNoteToStorage(audioBlob);
        const durationStr = `0:${sellerRecordSeconds < 10 ? '0' : ''}${sellerRecordSeconds}`;

        hyperlocalStore.addSellerReply(
          listingId,
          commentId,
          {
            type: 'audio',
            audioUrl: publicAudioUrl,
            duration: durationStr,
            sellerName: `${sellerName} (Owner)`,
            timestamp: 'Just now',
          },
          listingTitle
        );
      } catch (err) {
        console.error('Failed to upload seller voice note:', err);
      } finally {
        mediaRecorder.stream.getTracks().forEach((t) => t.stop());
        setSellerRecordingId(null);
        setSellerRecordSeconds(0);
        setActiveReplyId(null);
        setIsUploadingSellerVoice(false);
      }
    };

    mediaRecorder.stop();
  };

  const cancelSellerVoiceRecording = () => {
    if (sellerMediaRecorderRef.current) {
      clearInterval(sellerTimerRef.current);
      sellerMediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      sellerMediaRecorderRef.current = null;
      setSellerRecordingId(null);
      setSellerRecordSeconds(0);
    }
  };

  useEffect(() => {
    return () => {
      if (buyerTimerRef.current) clearInterval(buyerTimerRef.current);
      if (sellerTimerRef.current) clearInterval(sellerTimerRef.current);
      if (buyerMediaRecorderRef.current) {
        buyerMediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      }
      if (sellerMediaRecorderRef.current) {
        sellerMediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleIncrementInterest = (e) => {
    e.stopPropagation();
    hyperlocalStore.incrementInterest(listingId, interestCount, listingTitle, sellerName);
  };

  // 📝 5. Buyer Text Query Gate Check
  const handleInitiateSend = (e) => {
    if (e) e.preventDefault();
    if (!newComment.trim()) return;

    if (!currentUser) {
      alert('⚠️ Login Required: Please log in with your phone and 4-digit MPIN.');
      return;
    }

    if (!isTier2Verified) {
      alert('🔒 Tier 2 Verification Required: Only Verified Residents can post questions or comments. Enter your 6-digit WhatsApp PIN on your Profile page.');
      return;
    }

    setPendingConfirmQuery({
      senderName: currentUser?.full_name || userName.trim() || 'Town User',
      queryText: newComment.trim(),
    });
  };

  const handleConfirmAndSend = () => {
    if (!pendingConfirmQuery) return;

    const { senderName, queryText } = pendingConfirmQuery;

    hyperlocalStore.addThreadComment(
      listingId,
      {
        userName: senderName,
        type: 'text',
        text: queryText,
        isPublic: true,
      },
      listingTitle
    );

    if (onNewNotification) {
      onNewNotification({
        tag: 'NEW INQUIRY',
        title: `Query on "${listingTitle}"`,
        message: `${senderName} asked: "${queryText}"`,
        time: 'Just now',
        type: 'comment',
        targetId: listingId,
      });
    }

    setNewComment('');
    setPendingConfirmQuery(null);
  };

  const handlePostTextReply = (commentId) => {
    if (!replyText.trim()) return;

    hyperlocalStore.addSellerReply(
      listingId,
      commentId,
      {
        type: 'text',
        text: replyText.trim(),
        sellerName: `${sellerName} (Owner)`,
        timestamp: 'Just now',
      },
      listingTitle
    );

    setReplyText('');
    setActiveReplyId(null);
  };

  const getAvatarColor = (name = 'U') => {
    const colors = ['bg-rose-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-teal-500'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <>
      {/* 🌟 1. CARD CORNER BADGES */}
      {variant === 'corner' && (
        <div className="absolute top-2.5 right-2.5 flex items-center space-x-1.5 z-10 font-sans">
          <button
            type="button"
            onClick={handleIncrementInterest}
            className="px-2 py-1 rounded-xl bg-slate-950/80 hover:bg-slate-950 text-amber-300 border border-amber-400/30 text-[10px] font-black flex items-center space-x-1 backdrop-blur-xs transition active:scale-90 cursor-pointer shadow-md"
          >
            <span>⭐</span>
            <span>{interestCount}</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
            className="px-2 py-1 rounded-xl bg-slate-950/80 hover:bg-slate-950 text-slate-200 border border-white/20 text-[10px] font-black flex items-center space-x-1 backdrop-blur-xs transition active:scale-90 cursor-pointer shadow-md"
          >
            <span>💬</span>
            <span>{comments.length}</span>
          </button>
        </div>
      )}

      {variant === 'reels' && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          className="flex flex-col items-center justify-center group active:scale-75 transition cursor-pointer font-sans"
        >
          <div className="w-10 h-10 rounded-full bg-slate-950/85 hover:bg-slate-950 backdrop-blur-md border border-slate-700 flex items-center justify-center text-base shadow-xl group-hover:border-amber-300 transition">
            💬
          </div>
          <span className="text-[10px] font-black text-white drop-shadow-md mt-0.5">
            {comments.length > 0 ? comments.length : 'Ask'}
          </span>
        </button>
      )}

      {/* 🌟 2. BOTTOM TRAY SHEET */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-end justify-center animate-fade-in select-none font-sans"
        >
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          <div className="relative z-10 bg-slate-950 border-t border-slate-800 rounded-t-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl text-slate-100 animate-slide-up">
            <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mt-2.5 mb-1" />

            {/* Header Bar */}
            <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-100 flex items-center space-x-1.5">
                  <span>💬</span>
                  <span>Questions & Discussion ({comments.length})</span>
                </h2>
                <p className="text-[10px] text-slate-400 truncate max-w-[220px]">
                  {listingTitle}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsSellerMode(!isSellerMode)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                    isSellerMode
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {isSellerMode ? '👑 Owner Mode' : '👤 User Mode'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Tier 2 Status Banner */}
            {!isTier2Verified && (
              <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-[10.5px] text-amber-300 flex items-center justify-between">
                <span>🔒 Viewing Mode: Tier 2 Verified Resident PIN required to ask questions.</span>
              </div>
            )}

            {/* Q&A Comments Stream */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 max-h-[46vh]">
              {comments.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <span className="text-3xl text-slate-600">🎙️</span>
                  <p className="text-xs text-slate-400 font-medium">
                    No active questions. Verified residents can tap the mic below to ask via voice note!
                  </p>
                </div>
              ) : (
                comments.map((c, idx) => {
                  const userInitial = (c.userName || 'U').charAt(0).toUpperCase();
                  const avatarBg = getAvatarColor(c.userName || 'U');
                  const isSellerRecordingThis = sellerRecordingId === c.id;

                  return (
                    <div key={c.id || idx} className="space-y-2">
                      <div className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-full ${avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm`}>
                          {userInitial}
                        </div>

                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[11px] font-bold text-slate-200 truncate">
                              @{c.userName?.toLowerCase().replace(/\s+/g, '_') || 'town_user'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              • {c.timestamp || 'Just now'}
                            </span>
                          </div>

                          {/* Render Voice Note Player or Text */}
                          {c.type === 'audio' || c.audioUrl ? (
                            <VoiceNotePlayer
                              audioUrl={c.audioUrl}
                              duration={c.audioDuration}
                              senderName={c.userName}
                            />
                          ) : (
                            <p className="text-xs text-slate-100 leading-relaxed break-words font-normal">
                              {c.text}
                            </p>
                          )}

                          {isSellerMode && !c.sellerReply && activeReplyId !== c.id && (
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => setActiveReplyId(c.id)}
                                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition cursor-pointer flex items-center space-x-1"
                              >
                                <span>↩</span>
                                <span>Reply as Owner</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Nested Seller Reply (Voice or Text) */}
                      {c.sellerReply && (
                        <div className="ml-11 flex items-start space-x-2.5 pt-1">
                          <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0 shadow-md">
                            👑
                          </div>

                          <div className="flex-1 space-y-1 min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <span className="bg-slate-900 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-full text-[10px] font-black flex items-center space-x-0.5">
                                <span>{sellerName}</span>
                                <span className="text-amber-400">✓</span>
                              </span>
                              <span className="text-[9px] text-slate-500">• Verified Response</span>
                            </div>

                            {c.sellerReply.type === 'audio' || c.sellerReply.audioUrl ? (
                              <VoiceNotePlayer
                                audioUrl={c.sellerReply.audioUrl}
                                duration={c.sellerReply.duration}
                                senderName="Owner Voice Note"
                              />
                            ) : (
                              <p className="text-xs text-slate-200 leading-relaxed break-words font-normal">
                                {c.sellerReply.text}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Seller Inline Reply Box */}
                      {isSellerMode && activeReplyId === c.id && !c.sellerReply && (
                        <div className="ml-11 pt-1.5 space-y-1.5">
                          {isSellerRecordingThis ? (
                            <div className="flex items-center justify-between p-2 bg-rose-500/20 border border-rose-500/50 rounded-2xl animate-pulse">
                              <span className="text-xs font-black text-rose-300">
                                {isUploadingSellerVoice
                                  ? 'Saving voice...'
                                  : `🔴 Recording: 0:${sellerRecordSeconds < 10 ? '0' : ''}${sellerRecordSeconds}`}
                              </span>
                              <div className="flex items-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={cancelSellerVoiceRecording}
                                  disabled={isUploadingSellerVoice}
                                  className="text-[10px] font-bold text-slate-400 hover:text-white"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => stopAndSendSellerVoice(c.id)}
                                  disabled={isUploadingSellerVoice}
                                  className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer"
                                >
                                  {isUploadingSellerVoice ? 'Sending...' : 'Send Voice ➔'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => startSellerVoiceRecording(c.id)}
                                className="w-8 h-8 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center text-sm font-black shadow-md cursor-pointer shrink-0"
                                title="Reply with Voice Note"
                              >
                                🎙️
                              </button>

                              <input
                                type="text"
                                autoFocus
                                placeholder={`Reply as ${sellerName}...`}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handlePostTextReply(c.id)}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                              />

                              <button
                                type="button"
                                onClick={() => handlePostTextReply(c.id)}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer active:scale-95 shrink-0"
                              >
                                Reply
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* 🌟 3. BUYER ASK BAR (VOICE NOTE OR TEXT) */}
            <div className="p-3.5 border-t border-slate-800 bg-slate-950 space-y-2.5">
              <div className="flex items-center justify-between px-2">
                <span className="text-[11px] font-bold text-slate-300">
                  {currentUser ? `Asking as ${currentUser.full_name}` : 'Sign In required to post'}
                </span>
                <span className="text-[10px] text-amber-400 font-bold">
                  {isTier2Verified ? 'Tier 2 Verified ✓' : 'Tier 2 Required 🔒'}
                </span>
              </div>

              {/* Active Recording State vs. Input Bar */}
              {isRecording ? (
                <div className="flex items-center justify-between bg-rose-500/20 border border-rose-500/60 rounded-full px-4 py-2.5 animate-pulse">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-xs font-black text-rose-300">
                      {isUploadingBuyerVoice
                        ? 'Saving voice...'
                        : `Recording Voice Note: 0:${recordSeconds < 10 ? '0' : ''}${recordSeconds}`}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={cancelBuyerVoiceRecording}
                      disabled={isUploadingBuyerVoice}
                      className="text-[10px] font-bold text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={stopAndSendBuyerVoice}
                      disabled={isUploadingBuyerVoice}
                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-full shadow-md cursor-pointer active:scale-95"
                    >
                      {isUploadingBuyerVoice ? 'Sending...' : 'Send Voice ➔'}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInitiateSend} className="relative">
                  <div className="flex items-center bg-slate-900 border border-slate-800 focus-within:border-amber-400 rounded-full px-4 py-2 shadow-xl transition">
                    <span className="text-slate-400 text-sm mr-2.5">🔍</span>

                    <input
                      ref={inputRef}
                      type="text"
                      placeholder={
                        isTier2Verified
                          ? 'Ask about price, condition, visit timings...'
                          : 'Tier 2 PIN required to post questions...'
                      }
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                    />

                    {/* 🎙️ Voice Note Trigger */}
                    <button
                      type="button"
                      onClick={startBuyerVoiceRecording}
                      className="ml-2 w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 hover:from-amber-300 text-slate-950 flex items-center justify-center text-sm font-black transition cursor-pointer shadow-md active:scale-90 shrink-0"
                      title="Record Voice Note (Tier 2)"
                    >
                      🎙️
                    </button>

                    {/* Ask Button */}
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="ml-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-30 text-slate-950 font-black text-xs rounded-full transition cursor-pointer active:scale-95 shrink-0"
                    >
                      Ask
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* 🌟 4. CONFIRMATION SHEET */}
            {pendingConfirmQuery && (
              <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm rounded-t-3xl flex items-center justify-center p-4 animate-fade-in font-sans">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 w-full max-w-sm space-y-3.5 shadow-2xl">
                  <div className="flex items-center space-x-2">
                    <span className="text-base">💬</span>
                    <h3 className="text-xs font-black text-slate-100">Confirm Question to Seller</h3>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                    <div className="text-[10px] text-slate-400">
                      Sending as: <strong className="text-amber-300">{pendingConfirmQuery.senderName}</strong>
                    </div>
                    <p className="text-xs text-slate-100 font-medium leading-relaxed">
                      "{pendingConfirmQuery.queryText}"
                    </p>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    This inquiry will be sent directly to <strong>{sellerName}</strong>.
                  </p>

                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={handleConfirmAndSend}
                      className="flex-1 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer active:scale-95"
                    >
                      ✓ Confirm & Send
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingConfirmQuery(null)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      ✎ Edit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}