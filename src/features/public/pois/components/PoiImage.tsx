'use client';

/* eslint-disable @next/next/no-img-element -- Backend image hosts are catalogue data and are not known at build time. */
import { useState } from 'react';

interface PoiImageProps {
  src: string | null;
  alt: string;
  className?: string;
}

export function PoiImage({ src, alt, className = '' }: PoiImageProps) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-[linear-gradient(135deg,#e8f3f1,#e7edf2)] text-center text-sm font-semibold text-[#60717a] ${className}`}
        role="img"
        aria-label={`Chưa cập nhật ảnh cho ${alt}`}
      >
        <span className="px-4">Chưa cập nhật hình ảnh</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
