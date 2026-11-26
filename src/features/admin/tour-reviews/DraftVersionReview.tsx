'use client';

import { useEffect, useState } from 'react';

import type { ApiPendingChange, ApiTourDetail } from '@/features/operator/tours/services/operatorTourApi';

import { focusRing } from './components/ModerationNotices';
import { DraftVersionDecisionPanel } from './DraftVersionDecisionPanel';
import { tourModerationEn } from './resources/en';
import { fetchLiveTourForDiff, fetchPendingChangeDetail } from './services/pendingChangeModerationApi';
import type { ApprovalOutcome } from './services/approvalFeedback';
import { classifyFailure, type ModerationFailure } from './useModerationResource';

const copy = tourModerationEn.draftVersion;

interface DiffState {
  readonly draft: ApiPendingChange;
  readonly liveTour: ApiTourDetail;
}

type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly data: DiffState }
  | { readonly status: 'failed'; readonly failure: ModerationFailure };

/** Loads the draft's proposed values, then the live tour they would replace, for the diff view. */
function useDraftVersionDiff(pendingChangeId: string): { state: LoadState; retry: () => void } {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const draft = await fetchPendingChangeDetail(pendingChangeId, controller.signal);
        const liveTour = await fetchLiveTourForDiff(String(draft.tourId), controller.signal);
        if (!cancelled) setState({ status: 'ready', data: { draft, liveTour } });
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === 'AbortError')) return;
        setState({ status: 'failed', failure: classifyFailure(error) });
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [pendingChangeId, attempt]);

  return {
    state,
    retry: () => {
      setState({ status: 'loading' });
      setAttempt((value) => value + 1);
    },
  };
}

function DiffRow({ label, live, proposed }: { label: string; live: string; proposed: string }) {
  const changed = live !== proposed;
  return (
    <div className={`grid grid-cols-1 gap-2 rounded-xl p-3 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_minmax(0,1fr)] ${changed ? 'bg-amber-50' : 'bg-[#F7F5EF]'}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-[#5B6E69]">{label}</p>
      <p className={`text-sm ${changed ? 'text-[#5B6E69] line-through' : 'text-[#1C2928]'}`}>{live}</p>
      <p className={`text-sm font-semibold ${changed ? 'text-[#174B4A]' : 'text-[#1C2928]'}`}>{proposed}</p>
    </div>
  );
}

function matchedLiveScheduleIds(draft: ApiPendingChange): Set<number> {
  const ids = new Set<number>();
  for (const schedule of draft.schedules) {
    if (schedule.scheduleId !== null) ids.add(schedule.scheduleId);
  }
  return ids;
}

function ScheduleDiff({ draft, liveTour }: { draft: ApiPendingChange; liveTour: ApiTourDetail }) {
  const liveById = new Map(liveTour.departures.map((departure) => [departure.id, departure]));
  const matchedLiveIds = matchedLiveScheduleIds(draft);

  return (
    <div className="space-y-2">
      {draft.schedules.map((schedule, index) => {
        const live = schedule.scheduleId !== null ? liveById.get(schedule.scheduleId) : undefined;
        const key = schedule.scheduleId ?? `new-${index}`;
        if (!live) {
          return (
            <div key={key} className="rounded-xl border border-dashed border-[#174B4A] bg-[#174B4A]/5 p-3 text-sm">
              <p className="font-bold text-[#174B4A]">{copy.newScheduleLabel}</p>
              <p className="mt-1 text-[#1C2928]">
                {schedule.startAtUtc} → {schedule.endAtUtc} · {copy.capacityLabel}: {schedule.totalCapacity}
              </p>
            </div>
          );
        }
        const changed = live.totalCapacity !== schedule.totalCapacity || live.startAtUtc !== schedule.startAtUtc || live.endAtUtc !== schedule.endAtUtc;
        return (
          <div key={key} className={`rounded-xl p-3 text-sm ${changed ? 'bg-amber-50' : 'bg-[#F7F5EF]'}`}>
            <p className="font-bold text-[#1C2928]">{live.startAtUtc} → {live.endAtUtc}</p>
            <p className="mt-1 text-[#5B6E69]">
              {copy.capacityLabel}: {changed ? <><span className="line-through">{live.totalCapacity}</span> → <strong className="text-[#174B4A]">{schedule.totalCapacity}</strong></> : live.totalCapacity}
            </p>
          </div>
        );
      })}
      {liveTour.departures
        .filter((departure) => !matchedLiveIds.has(departure.id))
        .map((departure) => (
          <div key={departure.id} role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">
            {copy.scheduleInconsistencyWarning}
          </div>
        ))}
    </div>
  );
}

function FailureView({ failure, onRetry }: { failure: ModerationFailure; onRetry: () => void }) {
  const live = tourModerationEn.live;
  const forbidden = failure === 'forbidden';
  const notFound = failure === 'notFound';
  return (
    <section role={notFound ? 'status' : 'alert'} className="rounded-2xl border border-[#DCE2DD] bg-white p-6 text-center shadow-xs sm:p-8">
      <h2 className="text-lg font-bold text-[#1C2928]">
        {notFound ? copy.notFoundTitle : forbidden ? live.forbiddenTitle : live.unavailableTitle}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-[#5B6E69]">
        {notFound ? copy.notFoundBody : forbidden ? live.forbiddenBody : live.unavailableDetailBody}
      </p>
      {!forbidden && !notFound ? (
        <button
          type="button"
          onClick={onRetry}
          className={`mt-4 min-h-11 rounded-xl bg-[#174B4A] px-5 text-sm font-bold text-white hover:bg-[#103B39] ${focusRing}`}
        >
          {live.retry}
        </button>
      ) : null}
    </section>
  );
}

/** TM-82 §5.4: Staff's review of a draft version — full field-by-field diff, no 5-criterion checklist (spec §4). */
export function DraftVersionReview({
  pendingChangeId,
  onDecision,
}: {
  pendingChangeId: string;
  onDecision: (outcome: ApprovalOutcome) => void;
}) {
  const { state, retry } = useDraftVersionDiff(pendingChangeId);

  if (state.status === 'loading') {
    return <section role="status" className="rounded-2xl border border-[#DCE2DD] bg-white p-8 text-center text-sm font-semibold text-[#5B6E69] shadow-xs">{copy.loading}</section>;
  }
  if (state.status === 'failed') {
    return <FailureView failure={state.failure} onRetry={retry} />;
  }

  const { draft, liveTour } = state.data;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        <header className="mb-2 border-b border-[#DCE2DD] pb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#174B4A]">{copy.eyebrow}</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#1C2928] md:text-3xl">{liveTour.title}</h1>
        </header>

        <section aria-labelledby="diff-title" className="rounded-2xl border border-[#DCE2DD] bg-white p-6 shadow-xs">
          <h2 id="diff-title" className="mb-1 text-base font-bold text-[#1C2928]">{copy.diffTitle}</h2>
          <p className="mb-4 text-xs text-[#5B6E69]">{copy.diffHint}</p>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_minmax(0,1fr)] sm:gap-0">
            <span />
            <span className="text-xs font-bold uppercase tracking-wider text-[#5B6E69]">{copy.liveColumnLabel}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#5B6E69]">{copy.proposedColumnLabel}</span>
          </div>
          <div className="mt-2 space-y-1.5">
            <DiffRow label={copy.fields.title} live={liveTour.title} proposed={draft.title} />
            <DiffRow label={copy.fields.description} live={liveTour.description} proposed={draft.description} />
            <DiffRow label={copy.fields.basePrice} live={String(liveTour.basePrice)} proposed={String(draft.basePrice)} />
            <DiffRow label={copy.fields.inclusions} live={liveTour.inclusions ?? ''} proposed={draft.inclusions ?? ''} />
            <DiffRow label={copy.fields.exclusions} live={liveTour.exclusions ?? ''} proposed={draft.exclusions ?? ''} />
            <DiffRow label={copy.fields.destinations} live={liveTour.destinations.map((d) => d.name).join(', ')} proposed={draft.destinationSummary} />
          </div>
        </section>

        <section aria-labelledby="schedule-diff-title" className="rounded-2xl border border-[#DCE2DD] bg-white p-6 shadow-xs">
          <h2 id="schedule-diff-title" className="mb-4 text-base font-bold text-[#1C2928]">{copy.schedulesTitle}</h2>
          <ScheduleDiff draft={draft} liveTour={liveTour} />
        </section>
      </div>

      <div className="space-y-6 lg:col-span-4">
        <DraftVersionDecisionPanel pendingChangeId={pendingChangeId} onDecision={onDecision} />
      </div>
    </div>
  );
}
