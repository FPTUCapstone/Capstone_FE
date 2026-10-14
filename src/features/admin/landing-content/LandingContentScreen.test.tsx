import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const service = vi.hoisted(() => ({
  getLandingContent: vi.fn(),
  getApprovedTours: vi.fn(),
  saveDraft: vi.fn(),
  publishDraft: vi.fn(),
  restoreVersion: vi.fn(),
  uploadImage: vi.fn(),
}));

vi.mock('./landingContentService', async () => {
  const actual = await vi.importActual<typeof import('./landingContentService')>('./landingContentService');
  return { ...actual, ...service };
});

import { emptyContent, type LandingContentState } from './landingContent';
import { LandingContentScreen } from './LandingContentScreen';
import { LandingContentError } from './landingContentService';

const state: LandingContentState = {
  published: {
    versionId: 'v3',
    versionNumber: 3,
    publishedByName: 'Linh Admin',
    publishedAtUtc: '2026-10-01T18:00:00Z',
    content: emptyContent(),
  },
  draft: null,
  history: [{ versionId: 'v2', versionNumber: 2, publishedByName: 'Khanh Staff', publishedAtUtc: '2026-09-20T03:00:00Z' }],
};

const UNAVAILABLE = 'TripMate is temporarily unable to process your request. Please check your connection and try again.';

beforeEach(() => {
  vi.clearAllMocks();
  service.getApprovedTours.mockResolvedValue([]);
});

afterEach(() => cleanup());

describe('LandingContentScreen shell', () => {
  it('shows a status while loading and no version data yet', () => {
    service.getLandingContent.mockReturnValue(new Promise(() => {}));
    render(<LandingContentScreen />);
    expect(screen.getByRole('status').textContent).toContain('Loading');
    expect(screen.queryByText('Version 3')).toBeNull();
  });

  it('shows the published version and history after loading', async () => {
    service.getLandingContent.mockResolvedValue(state);
    render(<LandingContentScreen />);
    expect(await screen.findByText('Version 3')).toBeTruthy();
    expect(screen.getAllByText(/02\/10\/2026/).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Restore Previous Version 2' })).toBeTruthy();
  });

  it.each([404, 503])('shows the backend-pending banner for status %i and no version data', async (status) => {
    service.getLandingContent.mockRejectedValue(new LandingContentError(status));
    render(<LandingContentScreen />);
    expect(await screen.findByText('Backend integration pending')).toBeTruthy();
    expect(screen.getByText(UNAVAILABLE)).toBeTruthy();
    expect(screen.queryByText(/^Version \d+$/)).toBeNull();
  });

  it('shows the permission message for status 403', async () => {
    service.getLandingContent.mockRejectedValue(new LandingContentError(403));
    render(<LandingContentScreen />);
    expect(await screen.findByText('You do not have permission to access this function.')).toBeTruthy();
  });

  it('sends the user to login with the exact returnUrl for status 401', async () => {
    service.getLandingContent.mockRejectedValue(new LandingContentError(401));
    render(<LandingContentScreen />);
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/admin/login?returnUrl=%2Fadmin%2Flanding-content'),
    );
  });

  it('treats a malformed response (status 0) as unavailable and retries on demand', async () => {
    service.getLandingContent.mockRejectedValueOnce(new LandingContentError(0)).mockResolvedValueOnce(state);
    render(<LandingContentScreen />);
    expect(await screen.findByText(UNAVAILABLE)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Version 3')).toBeTruthy();
    expect(service.getLandingContent).toHaveBeenCalledTimes(2);
  });
});
