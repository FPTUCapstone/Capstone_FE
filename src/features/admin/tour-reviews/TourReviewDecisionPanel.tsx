'use client';

import { useEffect, useRef, useState } from 'react';

import { ModerationDialog } from './components/ModerationDialog';
import { focusRing } from './components/ModerationNotices';
import { RejectTourDialog, type RejectionReason } from './components/RejectTourDialog';
import { tourModerationEn } from './resources/en';
import type { ReviewCriterionKey } from './types';

const copy = tourModerationEn.decision;

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

type DemoDecision =
  | { readonly kind: 'approved' }
  | { readonly kind: 'rejected'; readonly reason: RejectionReason };

/**
 * Review decision panel. Rendered only behind the demo gate: there is no tour moderation
 * backend contract, so every decision here is a clearly labelled local simulation.
 */
export function TourReviewDecisionPanel() {
  const [checklist, setChecklist] = useState(initialChecklist);
  const [note, setNote] = useState('');
  const [checklistError, setChecklistError] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [decision, setDecision] = useState<DemoDecision | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // The decision controls become disabled, so move focus to the announced result.
  useEffect(() => {
    if (decision) resultRef.current?.focus();
  }, [decision]);

  const allPassed = CRITERIA.every((key) => checklist[key]);
  const decided = decision !== null;

  const handleApproveClick = () => {
    if (!allPassed) {
      setChecklistError(true);
      return;
    }
    setChecklistError(false);
    setApproveOpen(true);
  };

  return (
    <section aria-labelledby="tour-decision-title" className="rounded-2xl border border-[#c3c6ce] bg-white p-5 shadow-xs">
      <h2 id="tour-decision-title" className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#00152a]">
        <span className="material-symbols-outlined text-[#006b5f]" aria-hidden="true">
          checklist
        </span>
        {copy.title}
      </h2>

      {decision ? (
        <div
          ref={resultRef}
          tabIndex={-1}
          role="status"
          className={`mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-semibold text-amber-900 ${focusRing}`}
        >
          <p>{decision.kind === 'approved' ? copy.approvedResult : copy.rejectedResult}</p>
          {decision.kind === 'rejected' ? (
            <p className="mt-2 font-normal">
              <span className="font-bold">{copy.recordedReasonLabel}: </span>
              {decision.reason.categoryLabel ? `${decision.reason.categoryLabel} — ` : ''}
              {decision.reason.detail}
            </p>
          ) : null}
        </div>
      ) : null}

      <fieldset disabled={decided} aria-describedby="tour-checklist-hint">
        <legend className="mb-1 text-xs font-bold uppercase tracking-wider text-[#43474d]">{copy.checklistLegend}</legend>
        <p id="tour-checklist-hint" className="mb-3 text-xs text-[#43474d]">
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
                className={`mt-0.5 h-4 w-4 rounded accent-[#006b5f] ${focusRing}`}
              />
              <span className="text-sm font-medium leading-tight text-[#191c1e]">{copy.criteria[key]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <label htmlFor="tour-reviewer-note" className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#43474d]">
          {copy.noteLabel}
        </label>
        <p id="tour-reviewer-note-hint" className="mb-1 text-xs text-[#43474d]">
          {copy.noteHint}
        </p>
        <textarea
          id="tour-reviewer-note"
          rows={3}
          maxLength={1000}
          value={note}
          disabled={decided}
          aria-describedby="tour-reviewer-note-hint"
          onChange={(event) => setNote(event.target.value)}
          className={`w-full rounded-xl border border-[#c3c6ce] bg-[#f7f9fc] p-3 text-sm ${focusRing}`}
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
          disabled={decided}
          aria-describedby={checklistError ? 'tour-checklist-error' : undefined}
          className={`flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-[#006b5f] text-sm font-bold text-white hover:bg-[#005048] disabled:opacity-60 ${focusRing}`}
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">
            check_circle
          </span>
          {copy.approveButton}
        </button>
        <button
          type="button"
          onClick={() => setRejectOpen(true)}
          disabled={decided}
          className={`flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-[#c3c6ce] bg-[#eceef1] text-sm font-bold text-[#ba1a1a] hover:bg-[#ffdad6] disabled:opacity-60 ${focusRing}`}
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
        description={tourModerationEn.approveDialog.description}
        onClose={() => setApproveOpen(false)}
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setApproveOpen(false)}
            className={`min-h-11 rounded-xl border border-[#c3c6ce] px-4 text-sm font-bold text-[#00152a] hover:bg-[#eceef1] ${focusRing}`}
          >
            {tourModerationEn.approveDialog.cancel}
          </button>
          <button
            type="button"
            onClick={() => {
              setApproveOpen(false);
              setDecision({ kind: 'approved' });
            }}
            className={`min-h-11 rounded-xl bg-[#006b5f] px-4 text-sm font-bold text-white hover:bg-[#005048] ${focusRing}`}
          >
            {tourModerationEn.approveDialog.confirm}
          </button>
        </div>
      </ModerationDialog>

      <RejectTourDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={(reason) => setDecision({ kind: 'rejected', reason })}
      />
    </section>
  );
}
