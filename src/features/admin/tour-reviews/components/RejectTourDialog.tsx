'use client';

import { useState, type FormEvent } from 'react';

import { DEMO_REJECTION_REASON_CATEGORIES } from '../demo/demoTourModerationFixtures';
import { tourModerationEn as tourModerationEnOriginal } from '../resources/en';
import { tourModerationVi } from '../resources/vi';
import { useI18n } from '@/i18n';
import { ModerationDialog } from './ModerationDialog';
import { focusRing } from './ModerationNotices';

const DEMO_MAX_REASON_LENGTH = 1000;
/** The backend stores at most 500 characters; the category label and its separator count against it. */
const LIVE_MAX_REASON_LENGTH = 500;
const CATEGORY_SEPARATOR_LENGTH = 3;

export interface RejectionReason {
  readonly categoryLabel: string | null;
  readonly detail: string;
}

interface RejectTourDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (reason: RejectionReason) => void;
  /** True when the decision is really sent to the backend (not the local demo simulation). */
  readonly live?: boolean;
}

/**
 * Screen #15: rejection / revision reason, followed by the CR-05 confirmation step.
 * The detailed reason is required; the category options are demo-only fixtures.
 */
export function RejectTourDialog({ open, onClose, onConfirm, live = false }: RejectTourDialogProps) {
  const { locale, hasProvider } = useI18n();
  const tourModeration = hasProvider && locale === 'vi' ? tourModerationVi : tourModerationEnOriginal;
  const copy = tourModeration.rejectDialog;
  const liveCopy = tourModeration.decisionLive;
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
    if (!detail.trim() || detail.trim().length > detailLimit) {
      setShowError(true);
      return;
    }
    setStep('confirm');
  };

  const categoryLabel =
    DEMO_REJECTION_REASON_CATEGORIES.find((option) => option.value === category)?.label ?? null;
  const maxTotal = live ? LIVE_MAX_REASON_LENGTH : DEMO_MAX_REASON_LENGTH;
  const detailLimit = maxTotal - (categoryLabel ? categoryLabel.length + CATEGORY_SEPARATOR_LENGTH : 0);
  const tooLong = detail.trim().length > detailLimit;
  const invalidDetail = showError && (!detail.trim() || tooLong);

  if (step === 'confirm') {
    return (
      <ModerationDialog
        key="confirm"
        open={open}
        titleId="reject-tour-confirm-title"
        title={copy.confirmTitle}
        descriptionId="reject-tour-confirm-description"
        description={live ? liveCopy.rejectConfirmDescription : copy.confirmDescription}
        onClose={close}
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setStep('reason')}
            className={`min-h-11 rounded-xl border border-[#DCE2DD] px-4 text-sm font-bold text-[#1C2928] hover:bg-[#DCE2DD] ${focusRing}`}
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
      description={live ? liveCopy.rejectDescription : copy.description}
      onClose={close}
    >
      <form noValidate onSubmit={handleReasonSubmit} className="space-y-4">
        <div>
          <label htmlFor="reject-tour-category" className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#5B6E69]">
            {copy.categoryLabel}
          </label>
          <select
            id="reject-tour-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={`min-h-11 w-full rounded-xl border border-[#DCE2DD] bg-white px-3 text-sm ${focusRing}`}
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
          <label htmlFor="reject-tour-reason" className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#5B6E69]">
            {copy.reasonLabel}
          </label>
          <p id={hintId} className="mb-1 text-xs text-[#5B6E69]">
            {live ? liveCopy.rejectReasonHint : copy.reasonHint}
          </p>
          <textarea
            id="reject-tour-reason"
            rows={4}
            required
            maxLength={Math.max(detailLimit, 1)}
            value={detail}
            aria-invalid={invalidDetail}
            aria-describedby={invalidDetail ? `${hintId} ${errorId}` : hintId}
            onChange={(event) => setDetail(event.target.value)}
            className={`w-full rounded-xl border bg-white p-3 text-sm ${
              invalidDetail ? 'border-[#ba1a1a]' : 'border-[#DCE2DD]'
            } ${focusRing}`}
          />
          {invalidDetail ? (
            <p id={errorId} role="alert" className="mt-1 text-xs font-semibold text-[#ba1a1a]">
              {tooLong ? liveCopy.reasonTooLong(detailLimit) : copy.reasonRequired}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            className={`min-h-11 rounded-xl border border-[#DCE2DD] px-4 text-sm font-bold text-[#1C2928] hover:bg-[#DCE2DD] ${focusRing}`}
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
