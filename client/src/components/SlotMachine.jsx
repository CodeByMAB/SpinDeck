// Slot machine PIN display with spinning animation

import { useState, useEffect, useRef } from 'react';

export function SlotMachine({ pin = '', size = 'lg', isSpinning = false }) {
  const [displayDigits, setDisplayDigits] = useState(['', '', '', '']);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef(null);
  
  const css = size === 'lg'
    ? { width: 64, height: 80, fontSize: 44 }
    : { width: 52, height: 64, fontSize: 32 };

  // Spin animation
  useEffect(() => {
    if (isSpinning && pin) {
      setIsAnimating(true);
      
      // Rapidly cycle through random digits
      intervalRef.current = setInterval(() => {
        setDisplayDigits([
          Math.floor(Math.random() * 10),
          Math.floor(Math.random() * 10),
          Math.floor(Math.random() * 10),
          Math.floor(Math.random() * 10),
        ]);
      }, 80);
      
      // Stop after 2 seconds and show actual PIN
      const timeout = setTimeout(() => {
        clearInterval(intervalRef.current);
        setDisplayDigits(pin.split(''));
        setIsAnimating(false);
      }, 2000);
      
      return () => {
        clearInterval(intervalRef.current);
        clearTimeout(timeout);
      };
    } else if (pin) {
      setDisplayDigits(pin.split(''));
    }
  }, [isSpinning, pin]);

  return (
    <div className="flex gap-2.5 justify-center">
      {displayDigits.map((digit, i) => (
        <div
          key={i}
          className={`pin-cell ${digit === '' || digit === undefined ? 'empty' : ''} ${isAnimating ? 'spinning' : ''}`}
          style={{
            width: css.width,
            height: css.height,
            fontSize: css.fontSize,
            transition: isAnimating ? 'none' : 'all 0.3s ease-out',
          }}
        >
          {digit === '' || digit === undefined ? '–' : digit}
        </div>
      ))}
    </div>
  );
}