'use client';

import { useEffect, useRef, useState } from 'react';

import { ModerationDialog } from './components/ModerationDialog';
import { focusRing } from './components/ModerationNotices';
import { RejectTourDialog, type RejectionReason } from './components/RejectTourDialog';
import { tourModerationEn } from './resources/en';
import { submitApproval, submitRejection, type DecisionSender } from './services/tourModerationApi';
import type { ReviewCriterionKey } from './types';
import { classifyFailure, type ModerationFailure } from './useModerationResource';

const copy = tourModerationEn.decision;
const liveCopy = tourModerationEn.decisionLive;

const CRITERIA: readonly ReviewCriterionKey[] = [
  'contentCompleteness',
  'imageAppropriateness',
  'pricePlausibility',
  'policyCompliance',
  'itineraryFeasibility',
];

const initialChecklist: Record<ReviewCriterionKey, boolean> = {
  contentCompleteness: false,
  imageAppropriateness: false,
  pricePlausibility: false,
  policyCompliance: false,
  itineraryFeasibility: false,
};

type Decision =
  | { readonly kind: 'approved' }
  | { readonly kind: 'rejected'; readonly reason: RejectionReason };

const FAILURE_MESSAGE: Record<ModerationFailure, string> = {
  unauthorized: liveCopy.sessionEnded,
  forbidden: liveCopy.forbidden,
  notFound: liveCopy.alreadyDecided,
  conflict: liveCopy.alreadyDecided,
  invalid: liveCopy.invalid,
  unavailable: liveCopy.unavailable,
};

function composeReason(reason: RejectionReason): string {
  return reason.categoryLabel ? `${reason.categoryLabel} — ${reason.detail}` : reason.detail;
}

interface TourReviewDecisionPanelProps {
  /**
   * Present only for a tour loaded from the backend: decisions are then really submitted.
   * Absent in demo mode, where every decision stays a local simulation.
   */
  readonly liveTourId?: string;
}

/**
 * Review decision panel. With `liveTourId` the decision is submitted to the backend (one request at a time,
 * outcomes reported honestly); without it (demo mode) every decision is a clearly labelled local simulation.
 */
export function TourReviewDecisionPanel({ liveTourId }: TourReviewDecisionPanelProps = {}) {
  const [checklist, setChecklist] = useState(initialChecklist);
  const [note, setNote] = useState('');
  const [checklistError, setChecklistError] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lockedByConflict, setLockedByConflict] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);

  // The decision controls become disabled, so move focus to the announced result.
  useEffect(() => {
    if (decision) resultRef.current?.focus();
  }, [decision]);

  const allPassed = CRITERIA.every((key) => checklist[key]);
  const decided = decision !== null;
  const controlsDisabled = decided || submitting || lockedByConflict;
  const isLive = liveTourId !== undefined;

  /** Submits one live decision. The ref blocks a second click before React re-renders the disabled state. */
  const submitLive = async (send: DecisionSender, recorded: Decision) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await send();
      setDecision(recorded);
    } catch (error) {
      const failure = classifyFailure(error);
      setSubmitError(FAILURE_MESSAGE[failure]);
      if (failure === 'conflict' || failure === 'notFound') setLockedByConflict(true);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  const handleApproveClick = () => {
    if (!allPassed) {
      setChecklistError(true);
      return;
    }
    setChecklistError(false);
    setApproveOpen(true);
  };

  return (
    <section aria-labelledby="tour-decision-title" className="rounded-2xl border border-[#DCE2DD] bg-white p-5 shadow-xs">
      <h2 id="tour-decision-title" className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#1C2928]">
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
          className={`mb-4 rounded-xl border p-3 text-xs font-semibold ${
            isLive ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-amber-300 bg-amber-50 text-amber-900'
          } ${focusRing}`}
        >
          <p>
            {decision.kind === 'approved'
              ? isLive
                ? liveCopy.approvedResult
                : copy.approvedResult
              : isLive
                ? liveCopy.rejectedResult
                : copy.rejectedResult}
          </p>
          {decision.kind === 'rejected' ? (
            <p className="mt-2 font-normal">
              <span className="font-bold">{isLive ? liveCopy.recordedReasonLabel : copy.recordedReasonLabel}: </span>
              {decision.reason.categoryLabel ? `${decision.reason.categoryLabel} — ` : ''}
              {decision.reason.detail}
            </p>
          ) : null}
        </div>
      ) : null}

      {submitting ? (
        <p role="status" className="mb-4 rounded-xl bg-[#F7F5EF] p-3 text-xs font-semibold text-[#5B6E69]">
          {liveCopy.submitting}
        </p>
      ) : null}
      {submitError ? (
        <p role="alert" className="mb-4 rounded-xl bg-[#ffdad6] p-3 text-xs font-semibold text-[#93000a]">
          {submitError}
        </p>
      ) : null}

      <fieldset disabled={controlsDisabled} aria-describedby="tour-checklist-hint">
        <legend className="mb-1 text-xs font-bold uppercase tracking-wider text-[#5B6E69]">{copy.checklistLegend}</legend>
        <p id="tour-checklist-hint" className="mb-3 text-xs text-[#5B6E69]">
          {copy.checklistHint}
        </p>
        <div className="space-y-3">
          {CRITERIA.map((key) => (
            <label key={key} className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={checklist[key]}
                onChange={() => {
                  setChecklist((current) => ({ ...current, [key]: !current[key] }));
                  setChecklistError(false);
                }}
                className={`mt-0.5 h-4 w-4 rounded accent-[#174B4A] ${focusRing}`}
              />
              <span className="text-sm font-medium leading-tight text-[#1C2928]">{copy.criteria[key]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <label htmlFor="tour-reviewer-note" className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#5B6E69]">
          {copy.noteLabel}
        </label>
        <p id="tour-reviewer-note-hint" className="mb-1 text-xs text-[#5B6E69]">
          {copy.noteHint}
        </p>
        <textarea
          id="tour-reviewer-note"
          rows={3}
          maxLength={1000}
          value={note}
          disabled={controlsDisabled}
          aria-describedby="tour-reviewer-note-hint"
          onChange={(event) => setNote(event.target.value)}
          className={`w-full rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] p-3 text-sm ${focusRing}`}
        />
      </div>

      {checklistError ? (
        <p id="tour-checklist-error" role="alert" className="mt-4 rounded-xl bg-[#ffdad6] p-3 text-xs font-semibold text-[#93000a]">
          {copy.checklistIncomplete}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={handleApproveClick}
          disabled={controlsDisabled}
          aria-describedby={checklistError ? 'tour-checklist-error' : undefined}
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
        titleId="approve-tour-title"
        title={tourModerationEn.approveDialog.title}
        descriptionId="approve-tour-description"
        description={isLive ? liveCopy.approveDescription : tourModerationEn.approveDialog.description}
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
              if (liveTourId === undefined) {
                setDecision({ kind: 'approved' });
                return;
              }
              void submitLive(() => submitApproval(liveTourId, checklist, note), { kind: 'approved' });
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
        live={isLive}
        onConfirm={(reason) => {
          if (liveTourId === undefined) {
            setDecision({ kind: 'rejected', reason });
            return;
          }
          void submitLive(() => submitRejection(liveTourId, composeReason(reason)), { kind: 'rejected', reason });
        }}
      />
    </section>
  );
}
