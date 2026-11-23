'use client';

/* eslint-disable @next/next/no-img-element -- Backend image hosts are catalogue data and are not known at build time. */
import { useState } from 'react';

import { getPoiCategoryVisual } from '../utils/poiCategoryVisuals';
import { PoiCategoryIcon } from './PoiCategoryIcon';

interface PoiImageProps {
  src: string | null;
  alt: string;
  className?: string;
  categoryName?: string | null;
  compact?: boolean;
}

export function PoiImage({
  src,
  alt,
  className = '',
  categoryName,
  compact = false,
}: PoiImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    const visual = getPoiCategoryVisual(categoryName);

    return (
      <div
        className={`relative flex flex-col items-center justify-center overflow-hidden ${visual.backdropClass} ${className}`}
        role="img"
        aria-label={`Chưa cập nhật ảnh cho ${alt}`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-35"
          style={{
            backgroundImage: 'radial-gradient(rgba(16,59,57,0.18) 1px, transparent 1px)',
            backgroundSize: compact ? '10px 10px' : '14px 14px',
          }}
        />
        <div
          className={`relative z-10 flex items-center justify-center rounded-xl shadow-xs backdrop-blur-xs ${visual.medallionClass} ${
            compact ? 'h-9 w-9' : 'h-11 w-11'
          }`}
        >
          <PoiCategoryIcon kind={visual.kind} className={compact ? 'h-4.5 w-4.5' : 'h-5 w-5'} />
        </div>
        {!compact ? (
          <span
            className={`relative z-10 mt-2 max-w-[85%] truncate px-2 text-[11px] font-bold tracking-[0.01em] opacity-85 ${visual.captionClass}`}
          >
            {categoryName ?? 'Đang cập nhật ảnh'}
          </span>
        ) : null}
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
