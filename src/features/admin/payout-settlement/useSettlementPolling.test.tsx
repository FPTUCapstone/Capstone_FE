import { act, fireEvent, renderHook, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PayoutSettlementDetailScreen } from './PayoutSettlementDetailScreen';
import { PayoutSettlementError, authorizeSettlement, fetchSettlementDetail } from './payoutSettlementService';
import { approved, processing, withOutcome } from './settlementFixtures';
import { useSettlementPolling } from './useSettlementPolling';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
}));
vi.mock('./payoutSettlementService', () => ({
  fetchSettlementDetail: vi.fn(),
  authorizeSettlement: vi.fn(),
  PayoutSettlementError: class extends Error {
    constructor(public status: number, public errorCode?: string, public errorMessage?: string, public currentStatus?: string) { super(); }
  },
}));

const fetchMock = vi.mocked(fetchSettlementDetail);
const authorizeMock = vi.mocked(authorizeSettlement);

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  vi.useFakeTimers();
  replace.mockClear();
  fetchMock.mockReset();
});
afterEach(() => {
  setHidden(false);
  vi.useRealTimers();
});

describe('useSettlementPolling', () => {
  it('does nothing while disabled', async () => {
    const poll = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useSettlementPolling(false, poll));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(poll).not.toHaveBeenCalled();
  });

  it('polls every 15 seconds while enabled', async () => {
    const poll = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useSettlementPolling(true, poll));
    await vi.advanceTimersByTimeAsync(14_999);
    expect(poll).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(poll).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(poll).toHaveBeenCalledTimes(3);
  });

  it('waits for a slow poll to finish before scheduling the next one', async () => {
    let finish: () => void = () => {};
    const poll = vi.fn().mockImplementation(() => new Promise<void>((resolve) => { finish = resolve; }));
    renderHook(() => useSettlementPolling(true, poll));
    await vi.advanceTimersByTimeAsync(15_000);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(poll).toHaveBeenCalledTimes(1);
    finish();
    await vi.advanceTimersByTimeAsync(15_000);
    expect(poll).toHaveBeenCalledTimes(2);
  });

  it('stops when disabled and when unmounted', async () => {
    const poll = vi.fn().mockResolvedValue(undefined);
    const { rerender, unmount } = renderHook(({ enabled }) => useSettlementPolling(enabled, poll), {
      initialProps: { enabled: true },
    });
    await vi.advanceTimersByTimeAsync(15_000);
    expect(poll).toHaveBeenCalledTimes(1);
    rerender({ enabled: false });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(poll).toHaveBeenCalledTimes(1);
    rerender({ enabled: true });
    unmount();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(poll).toHaveBeenCalledTimes(1);
  });

  it('pauses while the tab is hidden and resumes with an immediate refresh when it is visible again', async () => {
    const poll = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useSettlementPolling(true, poll));
    act(() => setHidden(true));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(poll).not.toHaveBeenCalled();
    act(() => setHidden(false));
    await vi.advanceTimersByTimeAsync(0);
    expect(poll).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(15_000);
    expect(poll).toHaveBeenCalledTimes(2);
  });
});

describe('detail screen auto-refresh', () => {
  it('keeps polling a processing payout and stops once it is settled', async () => {
    const settled = withOutcome('Settled', {
      gatewayState: 'Completed', failureCode: null, submittedAtUtc: '2026-11-01T09:00:05+00:00', reconciliationRequired: false,
    });
    fetchMock.mockResolvedValueOnce(processing).mockResolvedValueOnce(processing).mockResolvedValue(settled);

    render(<PayoutSettlementDetailScreen payoutId="123" />);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(screen.getByLabelText('Payout status: Settlement processing')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(screen.getByLabelText('Payout status: Settled')).toBeTruthy();

    await act(async () => { await vi.advanceTimersByTimeAsync(120_000); });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it.each([
    ['an approved payout', approved],
    ['a payout that needs manual reconciliation', withOutcome('SettlementProcessing', {
      gatewayState: 'ManualReconciliation', failureCode: null, submittedAtUtc: null, reconciliationRequired: true,
    })],
  ])('does not poll %s', async (_name, detail) => {
    fetchMock.mockResolvedValue(detail);
    render(<PayoutSettlementDetailScreen payoutId="123" />);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    await act(async () => { await vi.advanceTimersByTimeAsync(120_000); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('survives a transient failure while polling and keeps the last known data', async () => {
    fetchMock.mockResolvedValueOnce(processing).mockRejectedValueOnce(new PayoutSettlementError(503)).mockResolvedValue(processing);
    render(<PayoutSettlementDetailScreen payoutId="123" />);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(screen.getByLabelText('Payout status: Settlement processing')).toBeTruthy();
    expect(screen.queryByText(/temporarily unable/)).toBeNull();
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it.each([404, 403, 401])('stops polling after a %i', async (status) => {
    fetchMock.mockResolvedValueOnce(processing).mockRejectedValue(new PayoutSettlementError(status));
    render(<PayoutSettlementDetailScreen payoutId="123" />);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await act(async () => { await vi.advanceTimersByTimeAsync(120_000); });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('announces a status change in the live region', async () => {
    const settled = withOutcome('Settled', {
      gatewayState: 'Completed', failureCode: null, submittedAtUtc: null, reconciliationRequired: false,
    });
    fetchMock.mockResolvedValueOnce(processing).mockResolvedValue(settled);
    render(<PayoutSettlementDetailScreen payoutId="123" />);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    const live = screen.getByText(/status: Settlement processing/);
    expect(live.getAttribute('aria-live')).toBe('polite');
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(screen.getByText(/Payout PO-000123 status: Settled/)).toBeTruthy();
  });

  it('drops the stale "being processed" message once the polled status changes', async () => {
    const failed = withOutcome('SettlementFailed', {
      gatewayState: 'Completed', failureCode: 'gateway_failed', submittedAtUtc: null, reconciliationRequired: false,
    });
    fetchMock.mockResolvedValueOnce(approved).mockResolvedValueOnce(processing).mockResolvedValue(failed);
    authorizeMock.mockResolvedValue({
      payoutId: '123', payoutCode: 'PO-000123', status: 'SettlementProcessing', authorizedAtUtc: '2026-11-01T09:00:00+00:00',
    });

    render(<PayoutSettlementDetailScreen payoutId="123" />);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    fireEvent.click(screen.getByRole('button', { name: 'Authorize settlement' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm settlement' }));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(screen.getByText('Settlement authorized. The transfer is being processed.')).toBeTruthy();

    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(screen.getByLabelText('Payout status: Settlement failed')).toBeTruthy();
    expect(screen.queryByText('Settlement authorized. The transfer is being processed.')).toBeNull();
  });
});
