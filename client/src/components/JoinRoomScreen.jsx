import { useState, useEffect } from 'react';
import { useStore } from '../stores/useStore';
import { Wordmark, PinDisplay } from './Brand';

export default function JoinRoomScreen({ onBack, initialPin = '' }) {
  const [pin, setPin] = useState(initialPin);
  const joinRoom = useStore(state => state.joinRoom);
  const username = useStore(state => state.username);
  const isLoading = useStore(state => state.isLoading);
  const roomError = useStore(state => state.roomError);

  // Auto-join when arriving via QR code deeplink with a complete PIN and a saved username.
  // Without a username the join will fail gracefully (roomError shows).
  useEffect(() => {
    if (initialPin.length === 4 && username.trim()) {
      joinRoom(initialPin);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleJoin = async () => {
    if (pin.length === 4 && !isLoading) await joinRoom(pin);
  };

  const press = (key) => {
    if (isLoading) return;
    if (key === '⌫') {
      setPin(p => p.slice(0, -1));
    } else if (pin.length < 4 && /^\d$/.test(key)) {
      const next = pin + key;
      setPin(next);
      // Auto-submit on 4th digit
      if (next.length === 4) joinRoom(next);
    }
  };

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

      {/* Heading */}
      <div className="px-6 pt-7 pb-3">
        <div
          className="font-mono text-[11px] text-magenta tracking-[0.3em]"
          style={{ textShadow: '0 0 8px rgba(255,45,142,0.5)' }}
        >
          // INCOMING TRANSMISSION
        </div>
        <div className="font-display font-bold text-[32px] leading-[1.05] tracking-tight mt-1.5">
          Drop in.<br />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(90deg, #00D9FF, #FF2D8E)',
            }}
          >
            Punch the PIN.
          </span>
        </div>
      </div>

      {roomError && (
        <div className="mx-5 mt-2 p-3 rounded-xl bg-magenta/10 border border-magenta/40 text-magenta text-sm font-mono tracking-wider">
          ERR · {roomError}
        </div>
      )}

      {/* PIN display */}
      <div className="px-4 pt-5 pb-1">
        <PinDisplay pin={pin} size="lg" />
        <div className="font-mono text-center text-[10px] text-tx-lo tracking-[0.25em] mt-3.5">
          4-DIGIT ROOM CODE
        </div>
      </div>

      {/* Numpad */}
      <div className="px-8 pt-5 grid grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) => (
          <button
            key={i}
            disabled={k === ''}
            onClick={() => press(k)}
            className="rounded-2xl font-mono font-bold transition active:scale-95 disabled:opacity-0"
            style={{
              height: 60,
              fontSize: 22,
              color: k === '⌫' ? '#FF2D8E' : '#F7F2FF',
              background: k === '' ? 'transparent'
                : k === '⌫' ? 'rgba(255,45,142,0.08)'
                : 'rgba(26,12,46,0.6)',
              border: k === '' ? 'none'
                : k === '⌫' ? '1px solid rgba(255,45,142,0.3)'
                : '1px solid #3A2266',
            }}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* CTA */}
      <div className="px-5 pt-3 pb-8">
        <button
          onClick={handleJoin}
          disabled={isLoading || pin.length !== 4}
          className="btn-neon btn-cyan w-full"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
                <path fill="currentColor" opacity="0.85" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
              </svg>
              Connecting…
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="12" cy="12" r="1.2" fill="currentColor" />
              </svg>
              Hit the Decks
            </>
          )}
        </button>
        {pin.length < 4 && (
          <p className="font-mono text-center text-[10px] text-tx-mute tracking-[0.18em] mt-2.5">
            ENTER {4 - pin.length} MORE DIGIT{4 - pin.length === 1 ? '' : 'S'}…
          </p>
        )}
      </div>
    </div>
  );
}
