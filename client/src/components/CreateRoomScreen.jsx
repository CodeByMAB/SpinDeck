import { useStore } from '../stores/useStore';
import { useState, useEffect } from 'react';
import { Wordmark, EqBars } from './Brand';
import { SlotMachine } from './SlotMachine';
import { PinQRCode } from './PinQRCode';

// Reel 3 settles at ~2740ms; QR appears at 2850ms; spin resets at 3200ms.
const QR_REVEAL_MS  = 2850;
const SPIN_RESET_MS = 3200;
// After spin resets the button becomes active. Auto-advance after 90s if unused.
const AUTO_ENTER_MS = 90_000;

export default function CreateRoomScreen({ onBack, onAnimDone }) {
  const createRoom = useStore(state => state.createRoom);
  const room       = useStore(state => state.room);
  const isLoading  = useStore(state => state.isLoading);
  const roomError  = useStore(state => state.roomError);

  const hasPin = !!room?.pin;

  const [triggerSpin, setTriggerSpin] = useState(false);
  const [showQR,      setShowQR]      = useState(false);
  const [animDone,    setAnimDone]    = useState(false); // true after reels settle

  useEffect(() => {
    if (!isLoading && hasPin) {
      setTriggerSpin(true);
      setShowQR(false);
      setAnimDone(false);

      const qrTimer   = setTimeout(() => setShowQR(true),      QR_REVEAL_MS);
      const spinTimer = setTimeout(() => {
        setTriggerSpin(false);
        setAnimDone(true);
      }, SPIN_RESET_MS);

      return () => {
        clearTimeout(qrTimer);
        clearTimeout(spinTimer);
      };
    }
  }, [isLoading, hasPin]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance 90 seconds after the animation finishes
  useEffect(() => {
    if (!animDone) return;
    const t = setTimeout(() => onAnimDone?.(), AUTO_ENTER_MS);
    return () => clearTimeout(t);
  }, [animDone]); // eslint-disable-line react-hooks/exhaustive-deps

  const joinUrl = hasPin ? `${window.location.origin}?pin=${room.pin}` : '';

  return (
    <div className="sd-bg min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-12 pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-tx-md text-sm hover:text-tx-hi transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <Wordmark size={22} />
        <div className="w-10" />
      </div>

      {/* Status header */}
      <div className="px-6 pt-6 pb-2">
        <div
          className="font-mono text-[11px] text-cyan tracking-[0.3em] text-center mb-1.5"
          style={{ textShadow: '0 0 8px rgba(0,217,255,0.6)' }}
        >
          {hasPin ? '[ DECK ARMED ]' : '[ SPINNING THE WHEELS… ]'}
        </div>
        <div className="font-display font-bold text-center leading-none text-[28px] tracking-tight">
          {hasPin ? (
            <>Your room<br /><span className="text-cyan">is ready!</span></>
          ) : (
            <>Ready to drop<br /><span className="text-magenta">the needle?</span></>
          )}
        </div>
      </div>

      {roomError && (
        <div className="mx-5 mt-4 p-3 rounded-xl bg-magenta/10 border border-magenta/40 text-magenta text-sm font-mono tracking-wider">
          ERR · {roomError}
        </div>
      )}

      {/* PIN reveal card */}
      <div className="px-4 pt-7 pb-3">
        <div
          className="surface relative overflow-hidden"
          style={{
            padding: '28px 16px 20px',
            borderRadius: 22,
            background: 'radial-gradient(ellipse at top, rgba(0,217,255,0.16), rgba(13,8,32,0.85))',
          }}
        >
          {hasPin && <div className="scan-line" style={{ top: 0 }} />}

          <div className="font-mono text-center text-[10px] text-tx-md tracking-[0.3em] mb-4">
            ROOM PIN — VALID 4H
          </div>

          <SlotMachine pin={hasPin ? room.pin : ''} size="lg" isSpinning={triggerSpin} />

          <PinQRCode pin={hasPin ? room.pin : ''} size={160} visible={showQR} />

          <div className="flex justify-center items-center gap-2 mt-5">
            <EqBars />
            <span className="font-mono text-[10px] text-tx-md tracking-[0.2em]">
              {hasPin ? 'WAITING FOR THE FLOOR…' : 'GENERATING CODE…'}
            </span>
          </div>
        </div>
      </div>

      {/* Share row — only after PIN exists */}
      {hasPin && (
        <div className="px-4 pb-3 flex gap-2">
          <button
            className="btn-neon btn-cyan flex-1"
            onClick={() => {
              const shareText = `Join my SpinDeck room!\nPIN: ${room.pin}\n${joinUrl}`;
              if (navigator.share) {
                navigator.share({ title: 'SpinDeck', text: shareText, url: joinUrl }).catch(() => {});
              } else {
                navigator.clipboard?.writeText(shareText);
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
            </svg>
            Copy Link
          </button>
        </div>
      )}

      <div className="flex-1" />

      {/* Primary CTA */}
      <div className="px-5 pb-8">
        {!hasPin ? (
          <button
            onClick={() => createRoom()}
            disabled={isLoading}
            className="btn-neon btn-primary w-full"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
                  <path fill="currentColor" opacity="0.85" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                </svg>
                Spinning Wheels…
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
                </svg>
                Generate Room PIN
              </>
            )}
          </button>
        ) : animDone ? (
          /* Animation finished — let the host enter the room */
          <button
            onClick={() => onAnimDone?.()}
            className="btn-neon btn-cyan w-full"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Drop the Needle
          </button>
        ) : (
          /* Reels still spinning */
          <button className="btn-neon btn-primary w-full" disabled>
            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
              <path fill="currentColor" opacity="0.85" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
            </svg>
            Spinning…
          </button>
        )}
      </div>
    </div>
  );
}
