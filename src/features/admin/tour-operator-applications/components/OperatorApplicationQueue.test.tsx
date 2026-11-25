import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { TourOperatorApplicationListView } from './TourOperatorApplicationListView';

afterEach(() => vi.unstubAllGlobals());

it('loads actual applications when no fixture is supplied', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [{ userId: 42, companyName: 'Real operator', taxCode: '0312345678', contactPhone: '', submittedAt: '2026-11-24', applicationStatus: 'Pending', documentsCount: 1, hasBusinessLicense: true }], totalCount: 1 }), { status: 200 }));
  vi.stubGlobal('fetch', fetcher);
  render(<TourOperatorApplicationListView />);
  expect(await screen.findByText('Real operator')).toBeTruthy();
  await waitFor(() => expect(fetcher).toHaveBeenCalled());
});

it('shows a load error rather than an empty queue on forbidden response', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 403 })));
  render(<TourOperatorApplicationListView />);
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(screen.queryByText('No operator applications in queue')).toBeNull();
});
