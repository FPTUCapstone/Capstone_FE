import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DirectRefundCaseListScreen } from './DirectRefundCaseListScreen';

const row = { caseId: 7, bookingCode: 'BK-TEST-7', refundAmountVnd: 10000, status: 'Disputed', createdAtUtc: '2026-11-26T12:00:00Z' };
const response = (items = [row], totalCount = 1) => new Response(JSON.stringify({ items, totalCount, pageNumber: 1, pageSize: 20 }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it.each([
  ['admin', '/api/v1/admin/direct-refund-disputes', '/admin/direct-refund-disputes/7'],
  ['operator', '/api/v1/operator/direct-refunds', '/partner/refunds/direct/7'],
] as const)('loads %s cases and links to the matching detail screen without ID entry', async (scope, api, detail) => {
  const fetchMock = vi.fn().mockResolvedValueOnce(response());
  vi.stubGlobal('fetch', fetchMock);
  render(<DirectRefundCaseListScreen scope={scope} />);
  await screen.findByText('BK-TEST-7');
  expect(fetchMock.mock.calls[0][0]).toContain(api);
  expect(screen.getByRole('link', { name: 'Chi tiết hồ sơ #7' }).getAttribute('href')).toBe(detail);
  expect(screen.queryByPlaceholderText('Case ID')).toBeNull();
  expect(screen.getByText('26/11/2026')).toBeTruthy();
});

it('paginates then resets to page one when filtering by status', async () => {
  const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(response([row], 41)));
  vi.stubGlobal('fetch', fetchMock);
  render(<DirectRefundCaseListScreen scope="operator" />);
  await screen.findByText('BK-TEST-7');
  fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }));
  await waitFor(() => expect(fetchMock.mock.calls.at(-1)?.[0]).toContain('pageNumber=2'));
  fireEvent.change(screen.getByRole('combobox', { name: 'Trạng thái' }), { target: { value: 'Disputed' } });
  await waitFor(() => {
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain('pageNumber=1');
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain('status=Disputed');
  });
});

it('shows retry rather than an empty list when the API fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('{}', { status: 503 })).mockResolvedValueOnce(response([])));
  render(<DirectRefundCaseListScreen scope="admin" />);
  fireEvent.click(await screen.findByRole('button', { name: 'Thử lại' }));
  await screen.findByText('Chưa có hồ sơ phù hợp.');
});

it('rejects an invalid response instead of claiming the list is empty', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('{}')));
  render(<DirectRefundCaseListScreen scope="admin" />);
  await screen.findByRole('button', { name: 'Thử lại' });
  expect(screen.queryByText('Chưa có hồ sơ phù hợp.')).toBeNull();
});
