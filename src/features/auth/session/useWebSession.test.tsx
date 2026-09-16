import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStorage } from '../session/authSession';

const mocks = vi.hoisted(() => ({ webRefresh: vi.fn() }));
vi.mock('@/lib/authApi', () => ({ webRefresh: mocks.webRefresh }));

const { useWebSession } = await import('./useWebSession');

const ctx = { userId: 42, email: 'user@example.com', fullName: 'User', role: 'Traveler', status: 'Active', applicationStatus: null, accessToken: 'test-access', accessTokenExpiresAtUtc: new Date(Date.now() + 60000).toISOString() };

function Probe() {
  const { status, context } = useWebSession();
  return <p>{status}:{context?.role ?? 'none'}</p>;
}

afterEach(() => { cleanup(); vi.clearAllMocks(); });
beforeEach(() => { AuthStorage.clear(); localStorage.clear(); sessionStorage.clear(); });

describe('useWebSession (S01 restoration before routing)', () => {
  it('reports restoring first, then authenticated, when the cookie redeems a context', async () => {
    let settleRefresh!: () => void;
    const gate = new Promise<void>((resolve) => { settleRefresh = resolve; });
    mocks.webRefresh.mockImplementation(async () => { await gate; return AuthStorage.accept(ctx, false); });
    render(<Probe />);
    // Missing in-memory context is NOT treated as Guest until restoration completes.
    expect(screen.getByText(/restoring/)).toBeDefined();
    settleRefresh();
    await waitFor(() => expect(screen.getByText('authenticated:Traveler')).toBeDefined());
    expect(mocks.webRefresh).toHaveBeenCalledTimes(1);
  });

  it('does not call the endpoint when an in-memory context already exists', async () => {
    AuthStorage.accept(ctx, false);
    render(<Probe />);
    await waitFor(() => expect(screen.getByText('authenticated:Traveler')).toBeDefined());
    expect(mocks.webRefresh).not.toHaveBeenCalled();
  });

  it('settles unauthenticated (not stuck restoring) when a warm session is cleared', async () => {
    AuthStorage.accept(ctx, false);
    render(<Probe />);
    await waitFor(() => expect(screen.getByText('authenticated:Traveler')).toBeDefined());
    AuthStorage.clear();
    await waitFor(() => expect(screen.getByText('unauthenticated:none')).toBeDefined());
    expect(mocks.webRefresh).not.toHaveBeenCalled();
  });

  it('ends unauthenticated when refresh is rejected (invalid/expired/revoked/missing cookie)', async () => {
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    render(<Probe />);
    await waitFor(() => expect(screen.getByText('unauthenticated:none')).toBeDefined());
    expect(AuthStorage.getContext()).toBeNull();
  });

  it('persisted display metadata alone never authenticates', async () => {
    sessionStorage.setItem('tripmate_user', JSON.stringify({ ...ctx, keepMeSignedIn: false }));
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    render(<Probe />);
    await waitFor(() => expect(screen.getByText('unauthenticated:none')).toBeDefined());
    expect(AuthStorage.getContext()).toBeNull();
  });
});
