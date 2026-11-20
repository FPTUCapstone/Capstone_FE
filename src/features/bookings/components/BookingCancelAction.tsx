'use client';

import { useState } from 'react';

import type { TicketStatus } from '../types/ticket';
import type { BookingCancellationResponse } from '../services/cancellationApi';
import { BookingCancelDialog } from './BookingCancelDialog';
import { cancellationMessages as m } from './cancellationMessages';

const CANCELLABLE_TICKET_STATUSES: readonly TicketStatus[] = ['NotYetActive', 'Valid'];

interface BookingCancelActionProps {
  bookingId: string;
  ticketStatus: TicketStatus;
  onCancelled?: (result: BookingCancellationResponse, message: string) => void;
}

export function BookingCancelAction({ bookingId, ticketStatus, onCancelled }: BookingCancelActionProps) {
  const [open, setOpen] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [cancelledMessage, setCancelledMessage] = useState<string>(m.cancelled);

  if (!CANCELLABLE_TICKET_STATUSES.includes(ticketStatus)) return null;

  return (
    <div>
      {cancelled ? (
        <p role="status" className="text-sm font-semibold text-slate-700">
          {cancelledMessage}
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center rounded-xl bg-rose-700 px-6 py-3 text-xs font-bold text-white shadow-md transition hover:bg-rose-800"
        >
          {m.title}
        </button>
      )}
      {open ? (
        <BookingCancelDialog
          bookingId={bookingId}
          onClose={() => setOpen(false)}
          onCancelled={(result: BookingCancellationResponse) => {
            setOpen(false);
            setCancelled(true);
            const message = result.refundStatus === 'Reconciliation'
                ? m.refundReconciliation
                : result.refundStatus === 'NotRequired'
                  ? m.refundNotRequired
                  : m.cancelled;
            setCancelledMessage(message);
            onCancelled?.(result, message);
          }}
        />
      ) : null}
    </div>
  );
}
