import { QRCodeSVG } from 'qrcode.react';

export function PinQRCode({ pin, size = 160, visible = true }) {
  if (!pin || !visible) return null;

  const joinUrl = `${window.location.origin}?pin=${pin}`;

  return (
    <div className="flex flex-col items-center mt-6">
      <div
        className="p-3 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.95)',
          boxShadow: '0 0 28px rgba(0,217,255,0.35)',
        }}
      >
        <QRCodeSVG
          value={joinUrl}
          size={size}
          level="M"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="#050309"
        />
      </div>
      <div className="font-mono text-[10px] text-tx-md tracking-[0.2em] mt-3">
        SCAN TO JOIN
      </div>
    </div>
  );
}
