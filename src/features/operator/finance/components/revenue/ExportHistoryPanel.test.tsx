import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExportHistoryPanel } from './ExportHistoryPanel';

describe('ExportHistoryPanel (UC-45)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('shows the empty state when there are no exports', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 }), { status: 200 })
    ));

    render(<ExportHistoryPanel isDemo={false} refreshToken={0} />);

    expect(await screen.findByText(/No exports yet/i)).toBeDefined();
  });

  it('renders a Ready export with a working Download action and a Failed export without one', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        items: [
          {
            id: 1, status: 'Ready', requestedAtUtc: '2026-10-20T03:00:00Z',
            expiresAtUtc: '2026-10-27T03:00:00Z', fileName: 'tripmate-revenue-1.xlsx',
            downloadUrl: '/api/operator/revenue/exports/1/download',
          },
          {
            id: 2, status: 'Failed', requestedAtUtc: '2026-10-19T03:00:00Z',
          },
        ],
        totalCount: 2, page: 1, pageSize: 20, totalPages: 1,
      }), { status: 200 })
    ));

    render(<ExportHistoryPanel isDemo={false} refreshToken={0} />);

    await waitFor(() => {
      expect(screen.getByText('Ready')).toBeDefined();
      expect(screen.getByText('Failed')).toBeDefined();
    });

    const downloadButtons = screen.getAllByRole('button', { name: /^Download$/i });
    expect(downloadButtons.length).toBe(1);
  });

  it('polls while an export is Queued and stops once it becomes Ready', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        items: [{ id: 3, status: 'Queued', requestedAtUtc: '2026-10-20T03:00:00Z' }],
        totalCount: 1, page: 1, pageSize: 20, totalPages: 1,
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        items: [{
          id: 3, status: 'Ready', requestedAtUtc: '2026-10-20T03:00:00Z',
          fileName: 'file.xlsx', downloadUrl: '/api/operator/revenue/exports/3/download',
        }],
        totalCount: 1, page: 1, pageSize: 20, totalPages: 1,
      }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    render(<ExportHistoryPanel isDemo={false} refreshToken={0} />);

    await waitFor(() => expect(screen.getByText('Queued')).toBeDefined());
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(10_000);
    await waitFor(() => expect(screen.getByText('Ready')).toBeDefined());
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // No pending items remain, so a further interval must not trigger another request.
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
