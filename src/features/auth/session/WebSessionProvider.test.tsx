import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStorage } from './authSession';

const mocks = vi.hoisted(() => ({ webRefresh: vi.fn() }));
vi.mock('@/lib/authApi', () => ({ webRefresh: mocks.webRefresh }));

const { WebSessionProvider } = await import('./WebSessionProvider');
const { useWebSession } = await import('./useWebSession');

const ctx = { userId: 42, email: 'user@example.com', fullName: 'User', role: 'Traveler', status: 'Active', applicationStatus: null, accessToken: 'test-access', accessTokenExpiresAtUtc: new Date(Date.now() + 60000).toISOString() };

function Probe() {
  const { status, context } = useWebSession();
  return <p>{status}:{context?.role ?? 'none'}</p>;
}

afterEach(() => { cleanup(); vi.clearAllMocks(); });
beforeEach(() => { AuthStorage.clear(); localStorage.clear(); sessionStorage.clear(); });

describe('WebSessionProvider (shared S01 bootstrap)', () => {
  it('drives the cookie restore so a consumer observes restoring then authenticated, with a single refresh call', async () => {
    let settleRefresh!: () => void;
    const gate = new Promise<void>((resolve) => { settleRefresh = resolve; });
    mocks.webRefresh.mockImplementation(async () => { await gate; return AuthStorage.accept(ctx, false); });
    render(
      <WebSessionProvider>
        <Probe />
      </WebSessionProvider>,
    );
    // Provider and consumer share one restore; empty memory is not Guest yet.
    expect(screen.getByText('restoring:none')).toBeDefined();
    expect(mocks.webRefresh).toHaveBeenCalledTimes(1);
    settleRefresh();
    await waitFor(() => expect(screen.getByText('authenticated:Traveler')).toBeDefined());
    expect(mocks.webRefresh).toHaveBeenCalledTimes(1);
  });

  it('settles unauthenticated on 401 without authenticating from persisted metadata', async () => {
    sessionStorage.setItem('tripmate_user', JSON.stringify({ ...ctx, keepMeSignedIn: false }));
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    render(
      <WebSessionProvider>
        <Probe />
      </WebSessionProvider>,
    );
    await waitFor(() => expect(screen.getByText('unauthenticated:none')).toBeDefined());
    expect(AuthStorage.getContext()).toBeNull();
  });
});
