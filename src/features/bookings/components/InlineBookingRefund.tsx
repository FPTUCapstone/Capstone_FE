'use client';

import { useEffect, useState } from 'react';
import { DirectRefundCasePage } from './DirectRefundCasePage';
import { RefundProgressPage } from './RefundProgressPage';

type State = { phase: 'loading' | 'error' | 'legacy' } | { phase: 'direct'; caseId: string };

/** Resolve the payment flow only when a real booking's refund panel is opened. */
export function InlineBookingRefund({ bookingId }: { bookingId: string }) {
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setState({ phase: 'loading' });
      void fetch(`/api/v1/traveler/direct-refunds/by-booking/${encodeURIComponent(bookingId)}`, { cache: 'no-store', signal: controller.signal })
        .then(async response => {
          if (response.status === 404) return { phase: 'legacy' } as const;
          if (!response.ok) throw new Error('Refund unavailable');
          const body: unknown = await response.json();
          const caseId = body && typeof body === 'object' && 'caseId' in body ? body.caseId : null;
          if (typeof caseId !== 'number' || !Number.isSafeInteger(caseId) || caseId <= 0) throw new Error('Invalid case');
          return { phase: 'direct', caseId: String(caseId) } as const;
        })
        .then(next => { if (!controller.signal.aborted) setState(next); })
        .catch(() => { if (!controller.signal.aborted) setState({ phase: 'error' }); });
    }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [bookingId, revision]);

  if (state.phase === 'direct') return <DirectRefundCasePage bookingId={bookingId} caseId={state.caseId} embedded />;
  if (state.phase === 'legacy') return <RefundProgressPage bookingId={bookingId} embedded />;
  if (state.phase === 'error') return <div role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800"><p>Chưa thể tải thông tin hoàn tiền.</p><button type="button" onClick={() => setRevision(value => value + 1)} className="mt-2 font-semibold underline">Thử lại</button></div>;
  return <p role="status" className="py-6 text-center text-sm text-slate-500">Đang tải thông tin hoàn tiền…</p>;
}
