'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { StatusBadge } from '@/components/ui/StatusBadge';

import { DemoModeBanner, PendingIntegrationNotice, focusRing } from './components/ModerationNotices';
import { isTourModerationDemoRequested } from './demo/tourModerationDemoMode';
import { tourModerationEn } from './resources/en';
import { getPendingTourPosts } from './services/tourModerationService';
import type { PendingTourPost, TourQueueQuery } from './types';
import { formatDisplayDate, formatDisplayDateTime, formatVnd } from './utils/format';
import { buildTourDetailHref, buildTourQueueHref, parseTourQueueQuery } from './utils/queueQuery';

const copy = tourModerationEn.queue;

interface SearchFormProps {
  readonly appliedKeyword: string;
  readonly onSubmit: (keyword: string) => void;
  readonly onReset: () => void;
}

/** CR-02: the draft keyword is applied only on explicit submit, never per keystroke. */
function QueueSearchForm({ appliedKeyword, onSubmit, onReset }: SearchFormProps) {
  const [draft, setDraft] = useState(appliedKeyword);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(draft.trim());
  };

  return (
    <form role="search" onSubmit={handleSubmit} className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="tour-queue-search" className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#43474d]">
          {copy.searchLabel}
        </label>
        <input
          id="tour-queue-search"
          type="search"
          value={draft}
          maxLength={100}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={copy.searchPlaceholder}
          className={`min-h-11 w-full rounded-xl border border-[#c3c6ce] bg-white px-3 text-sm text-[#191c1e] ${focusRing}`}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className={`min-h-11 rounded-xl bg-[#006b5f] px-5 text-sm font-bold text-white hover:bg-[#005048] ${focusRing}`}
        >
          {copy.searchButton}
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft('');
            onReset();
          }}
          className={`min-h-11 rounded-xl border border-[#c3c6ce] bg-white px-5 text-sm font-bold text-[#00152a] hover:bg-[#eceef1] ${focusRing}`}
        >
          {copy.resetButton}
        </button>
      </div>
    </form>
  );
}

function QueueRow({ tour, href }: { tour: PendingTourPost; href: string }) {
  return (
    <li className="grid gap-3 px-5 py-5 lg:grid-cols-[2fr_1.3fr_1fr_0.9fr_0.9fr_auto] lg:items-center lg:gap-4">
      <div>
        <span className="text-xs font-semibold text-[#74777e] lg:sr-only">{copy.columns.tour}</span>
        <h2 className="text-sm font-bold text-[#00152a]">{tour.tourName}</h2>
        <p className="text-xs text-[#43474d]">{tour.location}</p>
      </div>
      <div>
        <span className="text-xs font-semibold text-[#74777e] lg:sr-only">{copy.columns.operator}</span>
        <p className="text-sm font-semibold text-[#006b5f]">{tour.operatorName}</p>
      </div>
      <div>
        <span className="text-xs font-semibold text-[#74777e] lg:sr-only">{copy.columns.submitted}</span>
        <p className="font-mono text-xs text-[#191c1e]">{formatDisplayDateTime(tour.submittedAtUtc)}</p>
      </div>
      <div>
        <span className="text-xs font-semibold text-[#74777e] lg:sr-only">{copy.columns.departure}</span>
        <p className="font-mono text-xs text-[#191c1e]">{formatDisplayDate(tour.departureAtUtc)}</p>
      </div>
      <div>
        <span className="text-xs font-semibold text-[#74777e] lg:sr-only">{copy.columns.price}</span>
        <p className="font-mono text-xs font-bold text-[#00152a]">{formatVnd(tour.priceVnd)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
        <StatusBadge tone="coral">{copy.pendingStatus}</StatusBadge>
        <Link
          href={href}
          aria-label={copy.viewDetailsFor(tour.tourName)}
          className={`inline-flex min-h-11 items-center rounded-xl border border-[#006b5f] px-4 text-xs font-bold text-[#006b5f] hover:bg-[#006b5f] hover:text-white ${focusRing}`}
        >
          {copy.viewDetails}
        </Link>
      </div>
    </li>
  );
}

function QueuePagination({
  page,
  totalPages,
  query,
  demo,
}: {
  page: number;
  totalPages: number;
  query: TourQueueQuery;
  demo: boolean;
}) {
  const linkClass = `inline-flex min-h-11 items-center rounded-xl border border-[#c3c6ce] bg-white px-4 text-xs font-bold text-[#00152a] hover:bg-[#eceef1] ${focusRing}`;
  const disabledClass = 'inline-flex min-h-11 items-center rounded-xl border border-[#e0e3e6] px-4 text-xs font-bold text-[#a0a3a8]';

  return (
    <nav aria-label={tourModerationEn.pagination.label} className="mt-4 flex flex-wrap items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={buildTourQueueHref({ ...query, page: page - 1 }, demo)} className={linkClass}>
          {tourModerationEn.pagination.previous}
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClass}>
          {tourModerationEn.pagination.previous}
        </span>
      )}
      <p className="text-xs font-semibold text-[#43474d]">
        {tourModerationEn.pagination.pageOf(page, totalPages)}
      </p>
      {page < totalPages ? (
        <Link href={buildTourQueueHref({ ...query, page: page + 1 }, demo)} className={linkClass}>
          {tourModerationEn.pagination.next}
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClass}>
          {tourModerationEn.pagination.next}
        </span>
      )}
    </nav>
  );
}

export function TourReviewQueue() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const demo = isTourModerationDemoRequested(searchParams.get('demo'));
  const query = parseTourQueueQuery(searchParams);
  const result = getPendingTourPosts(query, { demo });

  return (
    <main className="min-h-[calc(100vh-65px)] bg-[#f7f9fc] px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 border-b border-[#c3c6ce] pb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-[#006b5f]">{copy.eyebrow}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#00152a]">{copy.title}</h1>
          <p className="mt-2 text-sm text-[#43474d]">{copy.subtitle}</p>
        </header>

        {result.status === 'NO_BACKEND' ? (
          <PendingIntegrationNotice body={tourModerationEn.pendingIntegration.queueBody} />
        ) : (
          <>
            <DemoModeBanner />
            <QueueSearchForm
              key={query.keyword}
              appliedKeyword={query.keyword}
              onSubmit={(keyword) => router.push(buildTourQueueHref({ page: 1, keyword }, demo))}
              onReset={() => router.push(buildTourQueueHref({ page: 1, keyword: '' }, demo))}
            />

            <p className="mb-3 text-sm font-semibold text-[#00152a]" aria-live="polite">
              {copy.totalCount(result.totalCount)}
            </p>

            {result.items.length === 0 ? (
              <section role="status" className="rounded-2xl border border-[#c3c6ce] bg-white p-8 text-center shadow-xs">
                <h2 className="text-base font-bold text-[#00152a]">{copy.emptyTitle}</h2>
                <p className="mt-1 text-sm text-[#43474d]">{copy.emptyBody}</p>
              </section>
            ) : (
              <section className="overflow-hidden rounded-2xl border border-[#c3c6ce] bg-white shadow-xs">
                <div
                  aria-hidden="true"
                  className="hidden grid-cols-[2fr_1.3fr_1fr_0.9fr_0.9fr_auto] gap-4 border-b border-[#c3c6ce] bg-[#eceef1] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#43474d] lg:grid"
                >
                  <span>{copy.columns.tour}</span>
                  <span>{copy.columns.operator}</span>
                  <span>{copy.columns.submitted}</span>
                  <span>{copy.columns.departure}</span>
                  <span>{copy.columns.price}</span>
                  <span className="text-right">{copy.columns.action}</span>
                </div>
                <ul aria-label={copy.listLabel} className="divide-y divide-[#eceef1]">
                  {result.items.map((tour) => (
                    <QueueRow
                      key={tour.id}
                      tour={tour}
                      href={buildTourDetailHref(tour.id, { page: result.page, keyword: query.keyword }, demo)}
                    />
                  ))}
                </ul>
              </section>
            )}

            {result.totalCount > 0 ? (
              <QueuePagination
                page={result.page}
                totalPages={result.totalPages}
                query={{ page: result.page, keyword: query.keyword }}
                demo={demo}
              />
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
