'use client';

import { useState } from 'react';

import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ModerationDialog } from '@/features/admin/tour-reviews/components/ModerationDialog';

import { PAYOUT_REASON_MAX_LENGTH, PAYOUT_REASON_MIN_LENGTH, validateRejectionReason } from './payoutReview';
import { PayoutReviewError, rejectPayout } from './payoutReviewService';

const MSG157 = `Rejection reason must be between ${PAYOUT_REASON_MIN_LENGTH} and ${PAYOUT_REASON_MAX_LENGTH} characters.`;

interface PayoutRejectDialogProps {
  readonly open: boolean;
  readonly payoutId: string;
  readonly payoutCode: string;
  readonly onClose: () => void;
  readonly onRejected: () => void;
  /** 409: someone else already decided this request. Closes the dialog too, but with a different parent-level message. */
  readonly onConflict: () => void;
}

/** UC-74 confirmation. The reason is required (10-500 characters after trim, decision D2/MSG157). */
export function PayoutRejectDialog({
  open, payoutId, payoutCode, onClose, onRejected, onConflict,
}: PayoutRejectDialogProps) {
  const [reason, setReason] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (loading) return;
    setReason('');
    setFieldError(null);
    setError(null);
    onClose();
  };

  const confirm = async () => {
    if (loading) return; // double-submit guard
    const validation = validateRejectionReason(reason);
    if (!validation.ok) {
      setFieldError(MSG157);
      return;
    }
    setFieldError(null);
    setLoading(true);
    setError(null);
    try {
      await rejectPayout(payoutId, validation.value);
      setReason('');
      onRejected();
    } catch (caught) {
      if (caught instanceof PayoutReviewError && caught.status === 400) {
        // Keeps the user's text; server-side MSG157 (errorCode or errors.reason) takes precedence.
        setFieldError(MSG157);
        return;
      }
      if (caught instanceof PayoutReviewError && caught.status === 409) {
        setReason('');
        onConflict(); // the parent shows the conflict message and re-fetches the authoritative status
        return;
      }
      setError(
        caught instanceof PayoutReviewError
          ? (caught.errorMessage ?? 'The rejection could not be completed.')
          : 'TripMate is temporarily unable to process your request.',
      );
    } finally {
      setLoading(false);
    }
  };

  const errorId = 'reject-payout-reason-error';
  const hintId = 'reject-payout-reason-hint';

  return (
    <ModerationDialog
      open={open}
      titleId="reject-payout-title"
      title={`Reject ${payoutCode}`}
      descriptionId="reject-payout-description"
      description="A rejection reason is required. The Tour Operator will be able to view it and submit a new request for the same period."
      onClose={close}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="reject-payout-reason" className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#43474d]">
            Reason for rejection
          </label>
          <p id={hintId} className="mb-1 text-xs text-[#43474d]">
            {reason.length}/{PAYOUT_REASON_MAX_LENGTH}
          </p>
          <textarea
            id="reject-payout-reason"
            rows={4}
            maxLength={PAYOUT_REASON_MAX_LENGTH}
            value={reason}
            disabled={loading}
            aria-invalid={fieldError !== null}
            aria-describedby={fieldError ? `${hintId} ${errorId}` : hintId}
            onChange={(event) => { setReason(event.target.value); setFieldError(null); }}
            className={`w-full rounded-xl border bg-white p-3 text-sm disabled:opacity-60 ${
              fieldError ? 'border-[#ba1a1a]' : 'border-[#c3c6ce]'
            } focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006b5f]`}
          />
          {fieldError ? (
            <p id={errorId} role="alert" className="mt-1 text-xs font-semibold text-[#ba1a1a]">
              {fieldError}
            </p>
          ) : null}
        </div>

        {error ? <FeedbackAlert tone="error">{error}</FeedbackAlert> : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={close}
            className="min-h-11 rounded-xl border border-[#c3c6ce] px-4 text-sm font-bold text-[#00152a] hover:bg-[#eceef1] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00152a]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={confirm}
            className="min-h-11 rounded-xl bg-[#ba1a1a] px-4 text-sm font-bold text-white hover:bg-[#93000a] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ba1a1a]"
          >
            {loading ? 'Rejecting…' : 'Confirm rejection'}
          </button>
        </div>
      </div>
    </ModerationDialog>
  );
}
