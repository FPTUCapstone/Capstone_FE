'use client';

import { useRef, useState } from 'react';

import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ModerationDialog } from '@/features/admin/tour-reviews/components/ModerationDialog';

import { formatVnd } from '../payout-records/payoutRecords';
import { SETTLEMENT_MESSAGES, type SettlementDetail } from './payoutSettlement';
import { PayoutSettlementError, authorizeSettlement } from './payoutSettlementService';

interface PayoutSettlementAuthorizeDialogProps {
  readonly open: boolean;
  readonly detail: SettlementDetail;
  readonly onClose: () => void;
  readonly onAuthorized: () => void;
  /** Any definitive answer from the server (409, 422, 404, 403, 401, other 4xx). The parent decides what to show. */
  readonly onRefused: (error: PayoutSettlementError) => void;
}

/** UC-65 confirmation (CR-05). Sends the authorization only; amounts and bank data come from the server. */
export function PayoutSettlementAuthorizeDialog({
  open,
  detail,
  onClose,
  onAuthorized,
  onRefused,
}: PayoutSettlementAuthorizeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const close = () => {
    if (inFlight.current) return;
    setError(null);
    onClose();
  };

  const confirm = async () => {
    if (inFlight.current) return; // double-submit guard
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      await authorizeSettlement(detail.payoutId);
      setError(null);
      onAuthorized();
    } catch (caught) {
      if (caught instanceof PayoutSettlementError && caught.status >= 400 && caught.status < 500) {
        onRefused(caught);
      } else {
        // Network failure or 5xx: the outcome is unknown to the browser, so keep the dialog open for a manual retry.
        setError(SETTLEMENT_MESSAGES.unavailable);
      }
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  };

  const { beneficiary } = detail;

  return (
    <ModerationDialog
      open={open}
      titleId="authorize-settlement-title"
      title={`Authorize ${detail.payoutCode}`}
      descriptionId="authorize-settlement-description"
      description="Confirming starts the bank transfer. The system sends it automatically; you do not transfer money yourself. This cannot be undone here."
      onClose={close}
    >
      <dl className="mb-4 grid gap-3 rounded-xl border border-[#e6edf5] bg-[#f7fafc] p-4 text-sm sm:grid-cols-2">
        <Row label="Tour Operator" value={detail.tourOperator.companyName} />
        <Row label="Net payout" value={formatVnd(detail.netPayoutAmount)} strong />
        <Row label="Bank" value={beneficiary.bankName ?? SETTLEMENT_MESSAGES.notAvailable} />
        <Row label="Account holder" value={beneficiary.accountHolder ?? SETTLEMENT_MESSAGES.notAvailable} />
        <Row label="Account number" value={beneficiary.maskedAccountNumber ?? SETTLEMENT_MESSAGES.notAvailable} mono />
      </dl>
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
          {loading ? 'Authorizing…' : 'Confirm settlement'}
        </button>
      </div>
    </ModerationDialog>
  );
}

function Row({ label, value, strong = false, mono = false }: { label: string; value: string; strong?: boolean; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-[#627d98]">{label}</dt>
      <dd className={`mt-1 text-[#102a43] ${strong ? 'font-extrabold' : ''} ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  );
}
