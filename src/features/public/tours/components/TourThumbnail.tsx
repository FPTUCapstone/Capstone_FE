'use client';

/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';

function TourImagePlaceholder() {
  return (
    <div
      data-testid="tour-image-placeholder"
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-teal-50 text-slate-400"
    >
      <span aria-hidden="true" className="material-symbols-outlined text-4xl text-teal-600/40">
        tour
      </span>
    </div>
  );
}

function NetworkThumbnail({ src, title }: { src: string; title: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');

  return (
    <>
      {status !== 'loaded' && <TourImagePlaceholder />}
      {status !== 'failed' && (
        <img
          src={src}
          alt={title}
          className="relative h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('failed')}
        />
      )}
    </>
  );
}

export function TourThumbnail({ url, title }: { url: string | null; title: string }) {
  const src = url?.trim();
  return src ? <NetworkThumbnail key={src} src={src} title={title} /> : <TourImagePlaceholder />;
}
