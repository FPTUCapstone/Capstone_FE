'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ROUTES } from '@/lib/routes';

import { DemoModeBanner, focusRing } from './components/ModerationNotices';
import { isTourModerationDemoRequested } from './demo/tourModerationDemoMode';
import { tourModerationEn } from './resources/en';
import { takeApprovalOutcome, type ApprovalOutcome } from './services/approvalFeedback';
import { fetchPendingTourPage } from './services/tourModerationApi';
import { getPendingTourPosts } from './services/tourModerationService';
import type { TourQueueQuery } from './types';
import { useModerationResource, type ModerationFailure } from './useModerationResource';
import { formatDisplayDate, formatDisplayDateTime, formatVnd } from './utils/format';
import { buildTourDetailHref, buildTourQueueHref, parseTourQueueQuery } from './utils/queueQuery';

const copy = tourModerationEn.queue;
// A fixed action track prevents each independent row from sizing columns
// differently according to its button/status content.
const queueColumns = 'lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_13.5rem]';

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
    <form
      role="search"
      onSubmit={handleSubmit}
      className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#DCE2DD] bg-white p-4 shadow-xs sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label htmlFor="tour-queue-search" className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#5B6E69]">
          {copy.searchLabel}
        </label>
        <input
          id="tour-queue-search"
          type="search"
          value={draft}
          maxLength={100}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={copy.searchPlaceholder}
          className={`min-h-10 w-full rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] px-3 text-sm text-[#1C2928] focus:bg-white ${focusRing}`}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className={`min-h-10 cursor-pointer rounded-xl bg-[#103B39] px-5 text-xs font-bold text-white hover:bg-[#174B4A] ${focusRing}`}
        >
          {copy.searchButton}
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft('');
            onReset();
          }}
          className={`min-h-10 cursor-pointer rounded-xl border border-[#DCE2DD] bg-white px-4 text-xs font-bold text-[#1C2928] hover:bg-[#F7F5EF] ${focusRing}`}
        >
          {copy.resetButton}
        </button>
      </div>
    </form>
  );
}

/** The fields a queue row needs; satisfied by both demo fixtures and live backend rows. */
interface QueueRowTour {
  readonly id: string;
  readonly tourName: string;
  readonly operatorName: string;
  readonly location: string;
  readonly submittedAtUtc: string | null;
  readonly departureAtUtc: string | null;
  readonly priceVnd: number;
}

function QueueRow({ tour, href }: { tour: QueueRowTour; href: string }) {
  return (
    <li className={`grid gap-2.5 px-4 py-3.5 transition-colors hover:bg-[#F7F5EF]/60 lg:items-center lg:gap-3 ${queueColumns}`}>
      <div className="min-w-0">
        <span className="text-xs font-semibold text-[#5B6E69] lg:sr-only">{copy.columns.tour}</span>
        <h2 className="truncate text-sm font-bold text-[#1C2928]" title={tour.tourName}>{tour.tourName}</h2>
        <p className="truncate text-xs text-[#5B6E69]" title={tour.location}>{tour.location}</p>
      </div>
      <div className="min-w-0">
        <span className="text-xs font-semibold text-[#5B6E69] lg:sr-only">{copy.columns.operator}</span>
        <p className="truncate text-xs font-semibold text-[#174B4A]" title={tour.operatorName}>{tour.operatorName}</p>
      </div>
      <div>
        <span className="text-xs font-semibold text-[#5B6E69] lg:sr-only">{copy.columns.submitted}</span>
        <p className="font-mono text-xs text-[#1C2928] whitespace-nowrap">{tour.submittedAtUtc ? formatDisplayDateTime(tour.submittedAtUtc) : tourModerationEn.format.unavailable}</p>
      </div>
      <div>
        <span className="text-xs font-semibold text-[#5B6E69] lg:sr-only">{copy.columns.departure}</span>
        <p className="font-mono text-xs text-[#1C2928] whitespace-nowrap">{tour.departureAtUtc ? formatDisplayDate(tour.departureAtUtc) : tourModerationEn.live.noDeparture}</p>
      </div>
      <div className="text-right">
        <span className="text-xs font-semibold text-[#5B6E69] lg:sr-only">{copy.columns.price}</span>
        <p className="font-mono text-xs font-bold tabular-nums text-[#1C2928] whitespace-nowrap">{formatVnd(tour.priceVnd)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        <StatusBadge tone="coral">{copy.pendingStatus}</StatusBadge>
        <Link
          href={href}
          aria-label={copy.viewDetailsFor(tour.tourName)}
          className={`inline-flex min-h-9 items-center whitespace-nowrap rounded-lg border border-[#174B4A] px-3 text-xs font-bold text-[#174B4A] transition hover:bg-[#174B4A] hover:text-white ${focusRing}`}
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
  const linkClass = `inline-flex min-h-11 items-center rounded-xl border border-[#DCE2DD] bg-white px-4 text-xs font-bold text-[#1C2928] hover:bg-[#DCE2DD] ${focusRing}`;
  const disabledClass = 'inline-flex min-h-11 items-center rounded-xl border border-[#DCE2DD] px-4 text-xs font-bold text-[#a0a3a8]';

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
      <p className="text-xs font-semibold text-[#5B6E69]">
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

type QueueView =
  | { readonly kind: 'loading' }
  | { readonly kind: 'failed'; readonly failure: ModerationFailure; readonly retry: () => void }
  | {
      readonly kind: 'ready';
      readonly items: readonly QueueRowTour[];
      readonly totalCount: number;
      readonly page: number;
      readonly totalPages: number;
    };

/** Demo mode stays synchronous and local; otherwise the queue is loaded from the backend. */
function useQueueView(query: TourQueueQuery, demo: boolean): QueueView {
  const { resource, retry } = useModerationResource(
    (signal) => fetchPendingTourPage(query, signal),
    [query.page, query.keyword],
    !demo,
  );

  if (demo) {
    const result = getPendingTourPosts(query, { demo });
    if (result.status === 'DEMO') {
      return { kind: 'ready', items: result.items, totalCount: result.totalCount, page: result.page, totalPages: result.totalPages };
    }
    return { kind: 'failed', failure: 'unavailable', retry };
  }

  if (resource.status === 'ready') {
    const { items, totalCount, page, totalPages } = resource.data;
    return { kind: 'ready', items, totalCount, page, totalPages };
  }
  if (resource.status === 'failed') return { kind: 'failed', failure: resource.failure, retry };
  return { kind: 'loading' };
}

function QueueFailure({ failure, onRetry }: { failure: ModerationFailure; onRetry: () => void }) {
  const live = tourModerationEn.live;
  if (failure === 'unauthorized') {
    return (
      <section role="status" className="rounded-2xl border border-[#DCE2DD] bg-white p-8 text-center text-sm font-semibold text-[#5B6E69] shadow-xs">
        {live.redirecting}
      </section>
    );
  }
  const forbidden = failure === 'forbidden';
  return (
    <section role="alert" className="rounded-2xl border border-[#DCE2DD] bg-white p-6 text-center shadow-xs sm:p-8">
      <h2 className="text-lg font-bold text-[#1C2928]">{forbidden ? live.forbiddenTitle : live.unavailableTitle}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-[#5B6E69]">
        {forbidden ? live.forbiddenBody : live.unavailableQueueBody}
      </p>
      {forbidden ? null : (
        <button
          type="button"
          onClick={onRetry}
          className={`mt-4 min-h-11 rounded-xl bg-[#174B4A] px-5 text-sm font-bold text-white hover:bg-[#103B39] ${focusRing}`}
        >
          {live.retry}
        </button>
      )}
    </section>
  );
}

export function TourReviewQueue() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const demo = isTourModerationDemoRequested(searchParams.get('demo'));
  const query = parseTourQueueQuery(searchParams);
  const view = useQueueView(query, demo);
  const decisionToken = demo ? null : searchParams.get('decision');
  const [outcome, setOutcome] = useState<ApprovalOutcome | null>(null);

  useEffect(() => {
    if (!decisionToken) return;

    // Wait until the queue is mounted so React Strict Mode cannot consume the result twice.
    const frame = requestAnimationFrame(() => {
      const url = new URL(window.location.href);
      if (url.searchParams.get('decision') !== decisionToken) return;
      setOutcome(takeApprovalOutcome(decisionToken));
      url.searchParams.delete('decision');
      window.history.replaceState(null, '', url);
    });
    return () => cancelAnimationFrame(frame);
  }, [decisionToken]);

  useEffect(() => {
    const clear = () => setOutcome(null);
    const onRestore = (event: PageTransitionEvent) => { if (event.persisted) clear(); };
    window.addEventListener('popstate', clear);
    window.addEventListener('pageshow', onRestore);
    return () => {
      window.removeEventListener('popstate', clear);
      window.removeEventListener('pageshow', onRestore);
    };
  }, []);

  useEffect(() => {
    if (view.kind === 'failed' && view.failure === 'unauthorized') {
      router.replace(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.tourReviews)}`);
    }
  }, [view, router]);

  return (
    <main className="min-h-[calc(100vh-65px)] bg-[#F7F5EF] px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          className="mb-6"
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.subtitle}
        />

        {outcome && (
          <div className="mb-4">
            <FeedbackAlert tone={outcome === 'approved' ? 'success' : 'warning'}>
              {tourModerationEn.decisionLive[outcome === 'approved' ? 'approvedResult' : 'alreadyDecided']}
            </FeedbackAlert>
          </div>
        )}

        {view.kind === 'loading' ? (
          <section role="status" className="rounded-2xl border border-[#DCE2DD] bg-white p-8 text-center text-sm font-semibold text-[#5B6E69] shadow-xs">
            {tourModerationEn.live.loadingQueue}
          </section>
        ) : view.kind === 'failed' ? (
          <QueueFailure failure={view.failure} onRetry={view.retry} />
        ) : (
          <>
            {demo ? <DemoModeBanner /> : null}
            <QueueSearchForm
              key={query.keyword}
              appliedKeyword={query.keyword}
              onSubmit={(keyword) => {
                setOutcome(null);
                router.push(buildTourQueueHref({ page: 1, keyword }, demo));
              }}
              onReset={() => {
                setOutcome(null);
                router.push(buildTourQueueHref({ page: 1, keyword: '' }, demo));
              }}
            />

            <p className="mb-3 text-sm font-semibold text-[#1C2928]" aria-live="polite">
              {copy.totalCount(view.totalCount)}
            </p>

            {view.items.length === 0 ? (
              <section role="status" className="rounded-2xl border border-[#DCE2DD] bg-white p-8 text-center shadow-xs">
                <h2 className="text-base font-bold text-[#1C2928]">{copy.emptyTitle}</h2>
                <p className="mt-1 text-sm text-[#5B6E69]">{copy.emptyBody}</p>
              </section>
            ) : (
              <section className="overflow-hidden rounded-2xl border border-[#DCE2DD] bg-white shadow-xs">
                <div
                  aria-hidden="true"
                  className={`hidden gap-3 border-b border-[#DCE2DD] bg-[#F7F5EF] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#5B6E69] lg:grid ${queueColumns}`}
                >
                  <span>{copy.columns.tour}</span>
                  <span>{copy.columns.operator}</span>
                  <span>{copy.columns.submitted}</span>
                  <span>{copy.columns.departure}</span>
                  <span className="text-right">{copy.columns.price}</span>
                  <span className="text-right">{copy.columns.action}</span>
                </div>
                <ul aria-label={copy.listLabel} className="divide-y divide-[#DCE2DD]">
                  {view.items.map((tour) => (
                    <QueueRow
                      key={tour.id}
                      tour={tour}
                      href={buildTourDetailHref(tour.id, { page: view.page, keyword: query.keyword }, demo)}
                    />
                  ))}
                </ul>
              </section>
            )}

            {view.totalCount > 0 ? (
              <QueuePagination
                page={view.page}
                totalPages={view.totalPages}
                query={{ page: view.page, keyword: query.keyword }}
                demo={demo}
              />
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
