'use client';

import { useState } from 'react';

import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ModerationDialog } from '@/features/admin/tour-reviews/components/ModerationDialog';

import { formatVnd } from '../payout-records/payoutRecords';
import { PayoutReviewError, approvePayout } from './payoutReviewService';

interface PayoutApproveDialogProps {
  readonly open: boolean;
  readonly payoutId: string;
  readonly payoutCode: string;
  readonly netPayoutAmount: number;
  readonly onClose: () => void;
  readonly onApproved: () => void;
  /** 409: someone else already decided this request. Closes the dialog too, but with a different parent-level message. */
  readonly onConflict: () => void;
}

/** UC-73 confirmation. Forwards the request to settlement; never computes the amount itself. */
export function PayoutApproveDialog({
  open,
  payoutId,
  payoutCode,
  netPayoutAmount,
  onClose,
  onApproved,
  onConflict,
}: PayoutApproveDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (loading) return;
    setError(null);
    onClose();
  };

  const confirm = async () => {
    if (loading) return; // double-submit guard
    setLoading(true);
    setError(null);
    try {
      await approvePayout(payoutId);
      onApproved();
    } catch (caught) {
      if (caught instanceof PayoutReviewError && caught.status === 409) {
        onConflict(); // the parent shows the conflict message and re-fetches the authoritative status
        return;
      }
      setError(
        caught instanceof PayoutReviewError
          ? (caught.errorMessage ?? 'The approval could not be completed.')
          : 'TripMate is temporarily unable to process your request.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModerationDialog
      open={open}
      titleId="approve-payout-title"
      title={`Approve ${payoutCode}`}
      descriptionId="approve-payout-description"
      description={`This moves ${payoutCode} (net payout ${formatVnd(netPayoutAmount)}) to the settlement queue for Administrator authorization.`}
      onClose={close}
    >
      {error ? <div className="mb-4"><FeedbackAlert tone="error">{error}</FeedbackAlert></div> : null}
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
          className="min-h-11 rounded-xl bg-[#006b5f] px-4 text-sm font-bold text-white hover:bg-[#005048] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006b5f]"
        >
          {loading ? 'Approving…' : 'Confirm approval'}
        </button>
      </div>
    </ModerationDialog>
  );
}
