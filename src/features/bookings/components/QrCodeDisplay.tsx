'use client';

import { QRCodeSVG } from 'qrcode.react';

interface QrCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
  ariaLabel?: string;
}

/**
 * Standard, scannable QR code (UC-29). `value` is the server-issued `qr.content`, encoded exactly as
 * received; error-correction level M and the four-module quiet zone keep it readable on screens.
 */
export function QrCodeDisplay({
  value,
  size = 220,
  className = '',
  ariaLabel = 'Mã QR vé điện tử',
}: QrCodeDisplayProps) {
  return (
    <div
      className={`inline-block rounded-2xl bg-white p-2 border border-slate-200 ${className}`}
      role="img"
      aria-label={ariaLabel}
    >
      <QRCodeSVG value={value} size={size} level="M" marginSize={4} bgColor="#ffffff" fgColor="#00152a" />
    </div>
  );
}
