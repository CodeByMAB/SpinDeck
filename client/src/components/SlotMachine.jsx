import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const DIGIT_H    = 72;   // px height of each digit row in the strip
const REEL_COUNT = 20;   // how many 0–9 cycles make up the strip
const SETTLE_CYC = 15;   // which cycle to land on (deep enough to spin visibly)

const STRIP = [];
for (let c = 0; c < REEL_COUNT; c++) {
  for (let d = 0; d <= 9; d++) STRIP.push(String(d));
}

function calcTargetY(digitIndex) {
  return (SETTLE_CYC * 10 + digitIndex) * DIGIT_H;
}

// ─────────────────────────────────────────────────────────────────────────────
export function SlotMachine({ pin = '', size = 'lg', isSpinning = false }) {
  const css = size === 'lg'
    ? { width: 64, fontSize: 42, gap: 10 }
    : { width: 52, fontSize: 32, gap: 8 };

  const digits = pin ? pin.split('') : ['', '', '', ''];

  return (
    <div className="flex justify-center" style={{ gap: css.gap }}>
      {digits.map((digit, i) => (
        <SlotReel
          key={i}
          digit={digit}
          index={i}
          isSpinning={isSpinning}
          width={css.width}
          fontSize={css.fontSize}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function SlotReel({ digit, index, isSpinning, width, fontSize }) {
  const stripRef = useRef(null);
  const [glowing, setGlowing] = useState(false);

  // Staggered settle: reel 0 first, reel 3 last
  const delay    = 80 + index * 240;       // ms before this reel's transition starts
  const duration = 1.4 + index * 0.18;    // seconds for the deceleration transition

  // ── Static positioning ────────────────────────────────
  // Fires synchronously before paint whenever the digit is known and we're idle.
  // Ensures the strip shows the correct digit immediately without any animation.
  useLayoutEffect(() => {
    if (!digit || isSpinning || !stripRef.current) return;
    const el = stripRef.current;
    el.style.transition = 'none';
    el.style.transform  = `translateY(-${calcTargetY(parseInt(digit, 10))}px)`;
  }, [digit, isSpinning]);

  // ── Snap to random start (before first paint of the spin) ────────────────
  // Runs synchronously (layout phase) so the browser never paints the strip
  // sitting at the settled digit — the very first frame already shows a mid-spin
  // position.
  useLayoutEffect(() => {
    if (!isSpinning || !digit || !stripRef.current) return;
    const el          = stripRef.current;
    const startCycle  = 3 + Math.floor(Math.random() * 5); // cycles 3–7
    const startOffset = Math.floor(Math.random() * 10);
    const startY      = (startCycle * 10 + startOffset) * DIGIT_H;
    el.style.transition = 'none';
    el.style.transform  = `translateY(-${startY}px)`;
  }, [isSpinning]); // digit intentionally excluded — only fires when spin starts/stops

  // ── Animated settle ───────────────────────────────────
  useEffect(() => {
    if (!isSpinning || !digit || !stripRef.current) {
      setGlowing(false);
      return;
    }

    const el     = stripRef.current;
    const target = calcTargetY(parseInt(digit, 10));
    let raf1, raf2, settleId;

    // Wait for `delay` ms (stagger), then use two rAF frames to ensure the
    // layout-effect snap has been committed to the GPU before we add the
    // transition — otherwise some browsers coalesce both style writes and
    // skip the animation.
    const tid = setTimeout(() => {
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          el.style.transition = `transform ${duration}s cubic-bezier(0, 0, 0.18, 1)`;
          el.style.transform  = `translateY(-${target}px)`;
          settleId = setTimeout(() => setGlowing(true), duration * 1000 + 50);
        });
      });
    }, delay);

    return () => {
      clearTimeout(tid);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(settleId);
    };
  }, [isSpinning, digit]); // eslint-disable-line react-hooks/exhaustive-deps

  const isEmpty = !digit;

  return (
    <div style={{
      width, height: DIGIT_H, overflow: 'hidden', position: 'relative',
      borderRadius: 14,
      background: 'rgba(13,8,32,0.88)',
      border: glowing
        ? '1.5px solid rgba(0,217,255,0.75)'
        : isEmpty
          ? '1px dashed rgba(58,34,102,0.5)'
          : '1px solid #3A2266',
      boxShadow: glowing
        ? '0 0 22px rgba(0,217,255,0.4), inset 0 0 14px rgba(0,217,255,0.1)'
        : 'none',
      transition: 'border 0.3s ease, box-shadow 0.3s ease',
    }}>
      {/* Top fade */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 22, zIndex: 2,
        background: 'linear-gradient(to bottom, rgba(7,4,12,0.96), transparent)',
        pointerEvents: 'none',
      }} />
      {/* Bottom fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 22, zIndex: 2,
        background: 'linear-gradient(to top, rgba(7,4,12,0.96), transparent)',
        pointerEvents: 'none',
      }} />

      {isEmpty ? (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'monospace', fontWeight: 900, fontSize,
          color: 'rgba(58,34,102,0.7)',
        }}>–</div>
      ) : (
        <div ref={stripRef} style={{ willChange: 'transform' }}>
          {STRIP.map((d, i) => (
            <div key={i} style={{
              height: DIGIT_H,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'monospace', fontWeight: 900, fontSize,
              color: '#F7F2FF',
            }}>{d}</div>
          ))}
        </div>
      )}
    </div>
  );
}
