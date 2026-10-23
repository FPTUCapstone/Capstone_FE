'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { StatusBadge } from '@/components/ui/StatusBadge';
import { ROUTES } from '@/lib/routes';

import { DemoModeBanner, PendingIntegrationNotice, focusRing } from './components/QueueNotices';
import { isOperatorApplicationDemoRequested } from './demo/operatorApplicationDemoMode';
import { operatorApplicationQueueEn } from './resources/en';
import { getPendingOperatorApplications } from './services/operatorApplicationQueueService';
import type { OperatorApplicationQueueQuery, PendingOperatorApplication } from './types';
import { formatSubmittedAt } from './utils/format';
import { buildOperatorApplicationQueueHref, parseOperatorApplicationQueueQuery } from './utils/queueQuery';

const copy = operatorApplicationQueueEn.queue;
const GRID = 'lg:grid-cols-[2fr_1fr_1.3fr_1fr_auto]';

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
        <label htmlFor="operator-application-search" className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#43474d]">
          {copy.searchLabel}
        </label>
        <input
          id="operator-application-search"
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

function QueueRow({ application }: { application: PendingOperatorApplication }) {
  return (
    <li className={`grid gap-3 px-5 py-5 lg:items-center lg:gap-4 ${GRID}`}>
      <div>
        <span className="text-xs font-semibold text-[#74777e] lg:sr-only">{copy.columns.company}</span>
        <h2 className="text-sm font-bold text-[#00152a]">{application.companyName}</h2>
      </div>
      <div>
        <span className="text-xs font-semibold text-[#74777e] lg:sr-only">{copy.columns.taxCode}</span>
        <p className="font-mono text-xs text-[#191c1e]">{application.taxCode}</p>
      </div>
      <div>
        <span className="text-xs font-semibold text-[#74777e] lg:sr-only">{copy.columns.licence}</span>
        <p className="font-mono text-xs text-[#191c1e]">{application.businessLicenseNumber}</p>
      </div>
      <div>
        <span className="text-xs font-semibold text-[#74777e] lg:sr-only">{copy.columns.submitted}</span>
        <p className="font-mono text-xs text-[#191c1e]">{formatSubmittedAt(application.submittedAtUtc)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
        <StatusBadge tone="coral">{copy.pendingStatus}</StatusBadge>
        <Link
          href={ROUTES.admin.operatorApplication(application.userId)}
          aria-label={copy.reviewApplicationFor(application.companyName)}
          className={`inline-flex min-h-11 items-center rounded-xl border border-[#006b5f] px-4 text-xs font-bold text-[#006b5f] hover:bg-[#006b5f] hover:text-white ${focusRing}`}
        >
          {copy.reviewApplication}
        </Link>
      </div>
    </li>
  );
}

function QueuePagination({
  page,
  totalPages,
  keyword,
  demo,
}: {
  page: number;
  totalPages: number;
  keyword: string;
  demo: boolean;
}) {
  const text = operatorApplicationQueueEn.pagination;
  const linkClass = `inline-flex min-h-11 items-center rounded-xl border border-[#c3c6ce] bg-white px-4 text-xs font-bold text-[#00152a] hover:bg-[#eceef1] ${focusRing}`;
  const disabledClass = 'inline-flex min-h-11 items-center rounded-xl border border-[#e0e3e6] px-4 text-xs font-bold text-[#a0a3a8]';
  const hrefFor = (target: number) => buildOperatorApplicationQueueHref({ page: target, keyword }, demo);

  return (
    <nav aria-label={text.label} className="mt-4 flex flex-wrap items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={linkClass}>
          {text.previous}
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClass}>
          {text.previous}
        </span>
      )}
      <p className="text-xs font-semibold text-[#43474d]">{text.pageOf(page, totalPages)}</p>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={linkClass}>
          {text.next}
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClass}>
          {text.next}
        </span>
      )}
    </nav>
  );
}

export function OperatorApplicationQueue() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const demo = isOperatorApplicationDemoRequested(searchParams.get('demo'));
  const query: OperatorApplicationQueueQuery = parseOperatorApplicationQueueQuery(searchParams);
  const result = getPendingOperatorApplications(query, { demo });

  return (
    <main className="min-h-[calc(100vh-65px)] bg-[#f7f9fc] px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 border-b border-[#c3c6ce] pb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-[#006b5f]">{copy.eyebrow}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#00152a]">{copy.title}</h1>
          <p className="mt-2 text-sm text-[#43474d]">{copy.subtitle}</p>
        </header>

        {result.status === 'NO_BACKEND' ? (
          <PendingIntegrationNotice />
        ) : (
          <>
            <DemoModeBanner />
            <QueueSearchForm
              key={query.keyword}
              appliedKeyword={query.keyword}
              onSubmit={(keyword) => router.push(buildOperatorApplicationQueueHref({ page: 1, keyword }, demo))}
              onReset={() => router.push(buildOperatorApplicationQueueHref({ page: 1, keyword: '' }, demo))}
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
                  className={`hidden gap-4 border-b border-[#c3c6ce] bg-[#eceef1] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#43474d] lg:grid ${GRID}`}
                >
                  <span>{copy.columns.company}</span>
                  <span>{copy.columns.taxCode}</span>
                  <span>{copy.columns.licence}</span>
                  <span>{copy.columns.submitted}</span>
                  <span className="text-right">{copy.columns.action}</span>
                </div>
                <ul aria-label={copy.listLabel} className="divide-y divide-[#eceef1]">
                  {result.items.map((application) => (
                    <QueueRow key={application.userId} application={application} />
                  ))}
                </ul>
              </section>
            )}

            {result.totalCount > 0 ? (
              <QueuePagination page={result.page} totalPages={result.totalPages} keyword={query.keyword} demo={demo} />
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
