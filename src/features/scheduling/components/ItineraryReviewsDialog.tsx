'use client';

import Link from 'next/link';
import { useRef } from 'react';

import { TripadvisorReviews } from '@/features/public/pois/components/TripadvisorReviews';
import { ROUTES } from '@/lib/routes';

import { useDialogFocus } from './useDialogFocus';

interface ItineraryReviewsDialogProps {
  poiId: number;
  name: string;
  onClose: () => void;
}

/** "Xem đánh giá" from a stop's "⋯" menu (Review 2, D6): Tripadvisor reviews loaded client-side. */
export function ItineraryReviewsDialog({ poiId, name, onClose }: ItineraryReviewsDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useDialogFocus(dialogRef, closeRef, onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 sm:items-center sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Đánh giá: ${name}`}
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">Đánh giá: {name}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-bold text-slate-600 hover:bg-slate-100"
          >
            Đóng
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <TripadvisorReviews poiId={poiId} />
          <Link href={ROUTES.poi(poiId)} className="inline-block text-xs font-bold text-[#007d6e] hover:underline">
            Xem chi tiết địa điểm
          </Link>
        </div>
      </div>
    </div>
  );
}
