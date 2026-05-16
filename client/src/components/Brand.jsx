// Shared visual primitives for SpinDeck.
// Wordmark, VinylDisc, Waveform, PinDisplay — used across screens.

import { useMemo } from 'react';

/* ─── SpinDeck wordmark ─────────────────────────────── */
export function Wordmark({ size = 32 }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="relative flex-shrink-0 rounded-full"
        style={{
          width: size,
          height: size,
          background:
            'radial-gradient(circle at 30% 30%, #C026D3, #6B21A8 60%, #2A1A4E 100%)',
          boxShadow:
            '0 0 14px rgba(168,85,247,0.7), inset 0 0 0 2px rgba(255,255,255,0.06)',
        }}
      >
        <span
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: '32%',
            height: '32%',
            background: '#00D9FF',
            boxShadow: '0 0 10px #00D9FF',
          }}
        />
      </div>
      <div
        className="font-display font-bold text-tx-hi"
        style={{ fontSize: size * 0.78, letterSpacing: '-0.03em' }}
      >
        Spin<span className="text-cyan">Deck</span>
      </div>
    </div>
  );
}

/* ─── Vinyl disc ────────────────────────────────────── */
export function VinylDisc({ size = 240, spinning = true, art, label = 'TRACK' }) {
  return (
    <div className="vinyl" style={{ width: size, height: size }}>
      <div className={'vinyl-inner ' + (spinning ? 'spinning' : '')}>
        <div className="vinyl-label">
          {art ? (
            <img
              src={art}
              alt=""
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="art-placeholder w-full h-full" data-label={label} />
          )}
        </div>
        <div className="vinyl-spindle" />
      </div>
    </div>
  );
}

/* ─── Waveform (procedural, deterministic) ──────────── */
export function Waveform({ progress = 0.4, bars = 56, seed = 7 }) {
  const heights = useMemo(() => {
    const arr = [];
    let s = seed;
    for (let i = 0; i < bars; i++) {
      s = (s * 9301 + 49297) % 233280;
      const r = s / 233280;
      const center = 1 - Math.abs(i / bars - 0.5) * 1.4;
      arr.push(Math.max(0.18, Math.min(1, center * 0.6 + r * 0.7)));
    }
    return arr;
  }, [bars, seed]);
  const playedCount = Math.floor(bars * progress);
  return (
    <div className="wave">
      {heights.map((h, i) => (
        <span
          key={i}
          className={i < playedCount ? 'played' : 'future'}
          style={{ height: `${Math.round(h * 100)}%` }}
        />
      ))}
    </div>
  );
}

/* ─── LED PIN cells ─────────────────────────────────── */
export function PinDisplay({ pin = '', size = 'lg' }) {
  const chars = pin.padEnd(4, ' ').split('');
  const css =
    size === 'lg'
      ? { width: 64, height: 80, fontSize: 44 }
      : { width: 52, height: 64, fontSize: 32 };
  return (
    <div className="flex gap-2.5 justify-center">
      {chars.map((c, i) => (
        <div
          key={i}
          className={'pin-cell ' + (c === ' ' ? 'empty' : '')}
          style={{ width: css.width, height: css.height, fontSize: css.fontSize }}
        >
          {c === ' ' ? '–' : c}
        </div>
      ))}
    </div>
  );
}

/* ─── EQ bars (now playing indicator) ───────────────── */
export function EqBars() {
  return (
    <span className="eq">
      <i /><i /><i /><i />
    </span>
  );
}
