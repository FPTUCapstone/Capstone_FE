import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { InlineBookingRefund } from './InlineBookingRefund';

vi.mock('./DirectRefundCasePage', () => ({ DirectRefundCasePage: ({ caseId, embedded }: { caseId: string; embedded?: boolean }) => <div>Direct {caseId} {embedded ? 'embedded' : 'page'}</div> }));
vi.mock('./RefundProgressPage', () => ({ RefundProgressPage: ({ embedded }: { embedded?: boolean }) => <div>Legacy {embedded ? 'embedded' : 'page'}</div> }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('detects the booking case and embeds its existing refund form', async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ caseId: 7 }));
  vi.stubGlobal('fetch', fetchMock);
  render(<InlineBookingRefund bookingId="42" />);
  await screen.findByText('Direct 7 embedded');
  expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/traveler/direct-refunds/by-booking/42');
});
it('uses the legacy refund view only when no direct case exists', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
  render(<InlineBookingRefund bookingId="42" />);
  await screen.findByText('Legacy embedded');
});
it('does not silently use the old flow on network or authorization failure', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
  render(<InlineBookingRefund bookingId="42" />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Thử lại' })).toBeTruthy());
  expect(screen.queryByText('Legacy embedded')).toBeNull();
});
