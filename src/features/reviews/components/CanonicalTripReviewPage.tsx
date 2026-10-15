'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PublicNavigation } from '@/components/navigation/PublicNavigation';
import { ROUTES } from '@/lib/routes';
import { createReview, getReviewContext, updateReview } from '../services/canonicalReviewApi';
import type { CanonicalReview, ReviewableRecordRef, TripReviewContext } from '../types/canonicalReview';
import { CanonicalReviewApiError } from '../types/canonicalReview';
import { canonicalReviewMessage } from '../resources/canonicalReviewMessages';
import { isPositiveInt64 } from '../types/reviewableRecordId';

const MAX_FILE_BYTES = 5_000_000;
const DUPLICATE_RECOVERY_ERROR = 'The existing review could not be loaded. Please try again.';
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

function hasUsableRecoveredReview(value: TripReviewContext, reference: ReviewableRecordRef): boolean {
  const review = value?.review;
  return value?.existingReviewKind === 'new' &&
    value.reviewableRecord?.kind === reference.kind && value.reviewableRecord.id === reference.id &&
    Array.isArray(value.editableFields) && value.editableFields.every(field => typeof field === 'string') &&
    review?.kind === 'new' && typeof review.reviewId === 'string' && isPositiveInt64(review.reviewId) &&
    review.reviewableRecord?.kind === reference.kind && review.reviewableRecord.id === reference.id &&
    Number.isInteger(review.overallRating) && review.overallRating >= 1 && review.overallRating <= 5 &&
    typeof review.title === 'string' && review.title.trim().length > 0 &&
    typeof review.content === 'string' && review.content.trim().length > 0 &&
    typeof review.publishDisplayName === 'boolean' &&
    typeof review.version === 'string' && review.version.length > 0;
}

export function CanonicalTripReviewPage({ reference }: { reference: ReviewableRecordRef }) {
  const router = useRouter();
  const [context, setContext] = useState<TripReviewContext | null>(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [publishDisplayName, setPublishDisplayName] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  const load = async (
    clearCurrentContext = false,
    accept: (value: TripReviewContext) => boolean = () => true,
  ): Promise<TripReviewContext | null> => {
    setBusy(true);
    setMessage(null);
    if (clearCurrentContext) setContext(null);
    try {
      const value = await getReviewContext(reference);
      if (!accept(value)) return null;
      setContext(value);
      if (value.review?.kind === 'new') {
        setRating(value.review.overallRating);
        setTitle(value.review.title);
        setContent(value.review.content);
        setPublishDisplayName(value.review.publishDisplayName);
      }
      return value;
    } catch (error) {
      setMessage(canonicalReviewMessage(error instanceof CanonicalReviewApiError ? error.errorCode : 'MSG127'));
      return null;
    } finally { setBusy(false); }
  };

  // Loading is the effect's external synchronization; state updates occur after the request settles.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [reference.kind, reference.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = context?.review?.kind === 'new' ? context.review as CanonicalReview : null;
  const editable = Boolean(current && context?.editableFields.length);
  const readOnly = Boolean(current && !editable);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (rating < 1 || rating > 5 || !title.trim() || !content.trim()) {
      setMessage('Please provide a rating, title, and review.'); return;
    }
    setBusy(true); setMessage(null);
    try {
      const input = { overallRating: rating, title: title.trim(), content: content.trim(), publishDisplayName, files,
        version: current?.version };
      await (current ? updateReview(reference, input) : createReview(reference, input));
      setFiles([]);
      if (current) { await load(); setMessage('Review updated.'); }
      else {
        setMessage('Review published. Returning to Trip History…');
        window.setTimeout(() => router.push(ROUTES.account.trips), 800);
      }
    } catch (error) {
      const code = error instanceof CanonicalReviewApiError ? error.errorCode : 'MSG127';
      if (code === 'trip_review.duplicate') {
        const recovered = await load(true, value => hasUsableRecoveredReview(value, reference));
        if (recovered) {
          setMessage(canonicalReviewMessage(code));
        } else {
          setContext(null);
          setMessage(DUPLICATE_RECOVERY_ERROR);
        }
      } else {
        setMessage(canonicalReviewMessage(code));
        setBusy(false);
      }
    }
  };

  return <div className="min-h-screen bg-[#F3F6F7] text-[#00152A]">
    <PublicNavigation />
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href={ROUTES.account.trips} className="text-sm font-semibold text-[#006B5F]">← Back to trip history</Link>
      <h1 className="mt-5 text-3xl font-black">Trip review</h1>
      {busy && !context ? <p className="mt-6" role="status">Loading review…</p> : null}
      {message ? <p className="mt-4 rounded-xl border bg-white p-3 text-sm" role="status">{message}</p> : null}
      {context ? <>
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-extrabold">{context.summary?.name ?? 'Review subject'}</h2>
          <p className="mt-1 text-sm text-slate-600">{context.summary?.bookingReference}</p>
          <p className="text-sm text-slate-600">{context.summary?.departureAtUtc ? new Date(context.summary.departureAtUtc).toLocaleString() : ''}</p>
        </section>
        {context.existingReviewKind === 'legacy' ? <p className="mt-5 rounded-xl bg-amber-50 p-4">This legacy review is read-only.</p>
        : !current && !context.canSubmit ? <p className="mt-5 rounded-xl bg-amber-50 p-4">Review unavailable: {context.submitUnavailableReason}</p>
        : <form onSubmit={submit} className="mt-5 space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          {readOnly ? <p className="rounded-lg bg-slate-100 p-3 text-sm">The seven-day edit window has expired. This review is read-only.</p> : null}
          <fieldset disabled={readOnly || busy} className="space-y-4">
            <legend className="sr-only">Review details</legend>
            <fieldset><legend className="block text-sm font-bold">Rating</legend>
              <div className="mt-1 flex gap-1" role="radiogroup" aria-label="Rating">
                {[1,2,3,4,5].map(v => <button key={v} type="button" role="radio" aria-checked={rating === v}
                  aria-label={`${v} star${v === 1 ? '' : 's'}`} onClick={() => setRating(v)}
                  className={`text-3xl ${v <= rating ? 'text-amber-500' : 'text-slate-300'}`}>★</button>)}
              </div>
            </fieldset>
            <label className="block text-sm font-bold">Title
              <input value={title} onChange={e => setTitle(e.target.value)} maxLength={200} required className="mt-1 block w-full rounded-lg border p-2" />
            </label>
            <label className="block text-sm font-bold">Review
              <textarea value={content} onChange={e => setContent(e.target.value)} maxLength={1000} required rows={6} className="mt-1 block w-full rounded-lg border p-2" />
            </label>
            {!current ? <label className="block text-sm font-bold">Photos (optional, up to 5)
              <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e => {
                const selected = Array.from(e.target.files ?? []);
                const valid = selected.length <= 5 && selected.every(file => file.size > 0 && file.size <= MAX_FILE_BYTES && allowedTypes.has(file.type));
                if (!valid) { setMessage('Select up to five JPEG, PNG, or WebP images, each no larger than 5,000,000 bytes.'); e.target.value = ''; return; }
                setFiles(selected); setMessage(null);
              }} className="mt-1 block w-full text-sm" />
            </label> : null}
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={publishDisplayName} onChange={e => setPublishDisplayName(e.target.checked)} /> Publish my display name</label>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link href={ROUTES.account.trips} className="inline-flex min-h-11 items-center justify-center rounded-xl border px-4 py-3 font-bold">Cancel</Link>
              {!readOnly ? <button className="rounded-xl bg-[#006B5F] px-4 py-3 font-bold text-white" type="submit">{current ? 'Update review' : 'Publish review'}</button> : null}
            </div>
          </fieldset>
        </form>}
      </> : null}
    </main>
  </div>;
}
