'use client';

import React, { useEffect, useRef, useState } from 'react';
import { tripReviewEn } from '@/features/trips/resources/en';
import type { ReviewPhotoItem } from '../types/review';

interface PhotoUploadPreviewProps {
  photos: ReviewPhotoItem[];
  onChange: (photos: ReviewPhotoItem[]) => void;
  maxPhotos?: number;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB per BR-16 / MSG20
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function PhotoUploadPreview({
  photos,
  onChange,
  maxPhotos = 5,
}: PhotoUploadPreviewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createdUrlsRef = useRef<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Revoke all created object URLs strictly on component unmount
  useEffect(() => {
    const createdUrls = createdUrlsRef.current;
    return () => {
      createdUrls.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      createdUrls.clear();
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) {
      setError(tripReviewEn.validation.photosMaxCount(maxPhotos));
      return;
    }

    const newPhotos: ReviewPhotoItem[] = [];

    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];

      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(tripReviewEn.validation.photosInvalidType);
        continue;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(tripReviewEn.validation.photosMaxSize(file.name));
        continue;
      }

      const blobUrl = URL.createObjectURL(file);
      createdUrlsRef.current.add(blobUrl);
      newPhotos.push({
        id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        size: file.size,
        url: blobUrl,
      });
    }

    if (newPhotos.length > 0) {
      onChange([...photos, ...newPhotos]);
    }

    // Reset input value so same file can be re-selected if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (id: string) => {
    const target = photos.find((p) => p.id === id);
    if (target && target.url.startsWith('blob:')) {
      createdUrlsRef.current.delete(target.url);
      URL.revokeObjectURL(target.url);
    }
    onChange(photos.filter((p) => p.id !== id));
  };

  return (
    <section aria-labelledby="photos-title" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 id="photos-title" className="text-sm font-extrabold text-[#00152A]">
          {tripReviewEn.tripReview.photosOptionalTitle}
        </h3>
        <span className="text-xs font-semibold text-slate-500">
          {tripReviewEn.tripReview.photosCountBadge(photos.length, maxPhotos)}
        </span>
      </div>

      <p className="text-xs text-slate-500 mb-3">
        {tripReviewEn.tripReview.photosHelperText}
      </p>

      {error && (
        <p role="alert" className="mb-3 text-xs font-semibold text-rose-600">
          {error}
        </p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        aria-label={tripReviewEn.accessibility.uploadPhotosAria}
      />

      {/* Photos Grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-2xs"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={photo.name || tripReviewEn.accessibility.tripPhotoAlt(index + 1)}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              aria-label={tripReviewEn.accessibility.removePhotoAria(photo.name)}
              onClick={() => handleRemovePhoto(photo.id)}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-rose-600"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1 text-[9px] font-medium text-white truncate">
              {photo.name}
            </div>
          </div>
        ))}

        {/* Upload Button Box if below max */}
        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-2 text-center text-slate-500 transition hover:border-[#006B5F] hover:bg-[#E6F4F1]/30 hover:text-[#006B5F] active:scale-95"
            aria-label={tripReviewEn.accessibility.addPhotoAria}
          >
            <span className="material-symbols-outlined text-[24px] text-[#006B5F]">
              add_photo_alternate
            </span>
            <span className="mt-1 text-[11px] font-bold text-slate-800">
              {tripReviewEn.actions.addPhoto}
            </span>
            <span className="text-[9px] text-slate-400">
              {tripReviewEn.tripReview.photoUnder5Mb}
            </span>
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
        <span className="material-symbols-outlined text-[14px] text-[#006B5F]" aria-hidden="true">
          info
        </span>
        <span>{tripReviewEn.demo.photoLocalPreviewNotice}</span>
      </div>
    </section>
  );
}
