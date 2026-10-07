'use client';

import { useState, type FormEvent } from 'react';

import { DEMO_REJECTION_REASON_CATEGORIES } from '../demo/demoTourModerationFixtures';
import { tourModerationEn } from '../resources/en';
import { ModerationDialog } from './ModerationDialog';
import { focusRing } from './ModerationNotices';

const copy = tourModerationEn.rejectDialog;
const MAX_REASON_LENGTH = 1000;

export interface RejectionReason {
  readonly categoryLabel: string | null;
  readonly detail: string;
}

interface RejectTourDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (reason: RejectionReason) => void;
}

/**
 * Screen #15: rejection / revision reason, followed by the CR-05 confirmation step.
 * The detailed reason is required; the category options are demo-only fixtures.
 */
export function RejectTourDialog({ open, onClose, onConfirm }: RejectTourDialogProps) {
  const [step, setStep] = useState<'reason' | 'confirm'>('reason');
  const [category, setCategory] = useState('');
  const [detail, setDetail] = useState('');
  const [showError, setShowError] = useState(false);

  const close = () => {
    setStep('reason');
    setCategory('');
    setDetail('');
    setShowError(false);
    onClose();
  };

  const handleReasonSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!detail.trim()) {
      setShowError(true);
      return;
    }
    setStep('confirm');
  };

  const categoryLabel =
    DEMO_REJECTION_REASON_CATEGORIES.find((option) => option.value === category)?.label ?? null;

  if (step === 'confirm') {
    return (
      <ModerationDialog
        key="confirm"
        open={open}
        titleId="reject-tour-confirm-title"
        title={copy.confirmTitle}
        descriptionId="reject-tour-confirm-description"
        description={copy.confirmDescription}
        onClose={close}
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setStep('reason')}
            className={`min-h-11 rounded-xl border border-[#c3c6ce] px-4 text-sm font-bold text-[#00152a] hover:bg-[#eceef1] ${focusRing}`}
          >
            {copy.back}
          </button>
          <button
            type="button"
            onClick={() => {
              const reason = { categoryLabel, detail: detail.trim() };
              close();
              onConfirm(reason);
            }}
            className={`min-h-11 rounded-xl bg-[#ba1a1a] px-4 text-sm font-bold text-white hover:bg-[#93000a] ${focusRing}`}
          >
            {copy.confirmReject}
          </button>
        </div>
      </ModerationDialog>
    );
  }

  const errorId = 'reject-tour-reason-error';
  const hintId = 'reject-tour-reason-hint';

  return (
    <ModerationDialog
      key="reason"
      open={open}
      titleId="reject-tour-title"
      title={copy.title}
      descriptionId="reject-tour-description"
      description={copy.description}
      onClose={close}
    >
      <form noValidate onSubmit={handleReasonSubmit} className="space-y-4">
        <div>
          <label htmlFor="reject-tour-category" className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#43474d]">
            {copy.categoryLabel}
          </label>
          <select
            id="reject-tour-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={`min-h-11 w-full rounded-xl border border-[#c3c6ce] bg-white px-3 text-sm ${focusRing}`}
          >
            <option value="">{copy.categoryPlaceholder}</option>
            {DEMO_REJECTION_REASON_CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="reject-tour-reason" className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#43474d]">
            {copy.reasonLabel}
          </label>
          <p id={hintId} className="mb-1 text-xs text-[#43474d]">
            {copy.reasonHint}
          </p>
          <textarea
            id="reject-tour-reason"
            rows={4}
            required
            maxLength={MAX_REASON_LENGTH}
            value={detail}
            aria-invalid={showError && !detail.trim()}
            aria-describedby={showError && !detail.trim() ? `${hintId} ${errorId}` : hintId}
            onChange={(event) => setDetail(event.target.value)}
            className={`w-full rounded-xl border bg-white p-3 text-sm ${
              showError && !detail.trim() ? 'border-[#ba1a1a]' : 'border-[#c3c6ce]'
            } ${focusRing}`}
          />
          {showError && !detail.trim() ? (
            <p id={errorId} role="alert" className="mt-1 text-xs font-semibold text-[#ba1a1a]">
              {copy.reasonRequired}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            className={`min-h-11 rounded-xl border border-[#c3c6ce] px-4 text-sm font-bold text-[#00152a] hover:bg-[#eceef1] ${focusRing}`}
          >
            {copy.cancel}
          </button>
          <button
            type="submit"
            className={`min-h-11 rounded-xl bg-[#ba1a1a] px-4 text-sm font-bold text-white hover:bg-[#93000a] ${focusRing}`}
          >
            {copy.confirmRejection}
          </button>
        </div>
      </form>
    </ModerationDialog>
  );
}
