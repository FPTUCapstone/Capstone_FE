'use client';

import { useEffect, useRef, useState } from 'react';

import { ModerationDialog } from './components/ModerationDialog';
import { focusRing } from './components/ModerationNotices';
import { RejectTourDialog, type RejectionReason } from './components/RejectTourDialog';
import { tourModerationEn } from './resources/en';
import type { ApprovalOutcome } from './services/approvalFeedback';
import { approveDraftVersion, rejectDraftVersion } from './services/pendingChangeModerationApi';
import type { DecisionSender } from './services/tourModerationApi';
import { classifyFailure, type ModerationFailure } from './useModerationResource';

const copy = tourModerationEn.draftVersion.decision;

function composeReason(reason: RejectionReason): string {
  return reason.categoryLabel ? `${reason.categoryLabel} — ${reason.detail}` : reason.detail;
}

type Decision = { readonly kind: 'approved' } | { readonly kind: 'rejected'; readonly reason: RejectionReason };

const FAILURE_MESSAGE: Record<ModerationFailure, string> = {
  unauthorized: tourModerationEn.decisionLive.sessionEnded,
  forbidden: tourModerationEn.decisionLive.forbidden,
  notFound: copy.staleDecision,
  conflict: copy.staleDecision,
  invalid: tourModerationEn.decisionLive.invalid,
  unavailable: tourModerationEn.decisionLive.unavailable,
};

/**
 * TM-82 §5.4: approve/reject a draft version. No 5-criterion checklist — the backend endpoint
 * takes none (spec §4) — so this is deliberately a separate, simpler panel from
 * `TourReviewDecisionPanel`, not a mode added onto it.
 */
export function DraftVersionDecisionPanel({
  pendingChangeId,
  onDecision,
}: {
  pendingChangeId: string;
  onDecision: (outcome: ApprovalOutcome) => void;
}) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lockedByConflict, setLockedByConflict] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (decision) resultRef.current?.focus();
  }, [decision]);

  const decided = decision !== null;
  const controlsDisabled = decided || submitting || lockedByConflict;

  async function submitDecision(send: DecisionSender, recorded: Decision) {
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await send();
      setDecision(recorded);
      if (recorded.kind === 'approved') onDecision('draftApproved');
    } catch (error) {
      const failure = classifyFailure(error);
      setSubmitError(FAILURE_MESSAGE[failure]);
      if (failure === 'conflict' || failure === 'notFound') setLockedByConflict(true);
      if (recorded.kind === 'approved' && failure === 'conflict') onDecision('draftAlreadyDecided');
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="draft-decision-title" className="rounded-2xl border border-[#DCE2DD] bg-white p-5 shadow-xs">
      <h2 id="draft-decision-title" className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#1C2928]">
        <span className="material-symbols-outlined text-[#174B4A]" aria-hidden="true">
          checklist
        </span>
        {copy.title}
      </h2>

      {decision ? (
        <div
          ref={resultRef}
          tabIndex={-1}
          role="status"
          className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-semibold text-emerald-900"
        >
          <p>{decision.kind === 'approved' ? copy.approvedResult : copy.rejectedResult}</p>
          {decision.kind === 'rejected' ? (
            <p className="mt-2 font-normal">
              {decision.reason.categoryLabel ? `${decision.reason.categoryLabel} — ` : ''}
              {decision.reason.detail}
            </p>
          ) : null}
        </div>
      ) : null}

      {submitting ? (
        <p role="status" className="mb-4 rounded-xl bg-[#F7F5EF] p-3 text-xs font-semibold text-[#5B6E69]">
          {copy.submitting}
        </p>
      ) : null}
      {submitError ? (
        <p role="alert" className="mb-4 rounded-xl bg-[#ffdad6] p-3 text-xs font-semibold text-[#93000a]">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => setApproveOpen(true)}
          disabled={controlsDisabled}
          className={`flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-[#174B4A] text-sm font-bold text-white hover:bg-[#103B39] disabled:opacity-60 ${focusRing}`}
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">
            check_circle
          </span>
          {copy.approveButton}
        </button>
        <button
          type="button"
          onClick={() => setRejectOpen(true)}
          disabled={controlsDisabled}
          className={`flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-[#DCE2DD] bg-[#DCE2DD] text-sm font-bold text-[#ba1a1a] hover:bg-[#ffdad6] disabled:opacity-60 ${focusRing}`}
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">
            close
          </span>
          {copy.rejectButton}
        </button>
      </div>

      <ModerationDialog
        open={approveOpen}
        titleId="approve-draft-title"
        title={copy.approveDialogTitle}
        descriptionId="approve-draft-description"
        description={copy.approveDialogDescription}
        onClose={() => setApproveOpen(false)}
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setApproveOpen(false)}
            className={`min-h-11 rounded-xl border border-[#DCE2DD] px-4 text-sm font-bold text-[#1C2928] hover:bg-[#DCE2DD] ${focusRing}`}
          >
            {tourModerationEn.approveDialog.cancel}
          </button>
          <button
            type="button"
            onClick={() => {
              setApproveOpen(false);
              void submitDecision(async () => { await approveDraftVersion(pendingChangeId); }, { kind: 'approved' });
            }}
            className={`min-h-11 rounded-xl bg-[#174B4A] px-4 text-sm font-bold text-white hover:bg-[#103B39] ${focusRing}`}
          >
            {tourModerationEn.approveDialog.confirm}
          </button>
        </div>
      </ModerationDialog>

      <RejectTourDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        live
        onConfirm={(reason) => {
          void submitDecision(
            async () => { await rejectDraftVersion(pendingChangeId, composeReason(reason)); },
            { kind: 'rejected', reason },
          );
        }}
      />
    </section>
  );
}
