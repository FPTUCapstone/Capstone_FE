import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VerifyEmailHandler } from './VerifyEmailHandler';

const firebaseMocks = vi.hoisted(() => ({ applyActionCode: vi.fn(), checkActionCode: vi.fn() }));
const apiMocks = vi.hoisted(() => ({ saveTokens: vi.fn(), verifyEmail: vi.fn() }));
const authState = vi.hoisted(() => ({
  currentUser: null as null | {
    email: string | null;
    getIdToken: ReturnType<typeof vi.fn>;
    reload: ReturnType<typeof vi.fn>;
  },
}));

vi.mock('firebase/auth', () => ({
  applyActionCode: firebaseMocks.applyActionCode,
  checkActionCode: firebaseMocks.checkActionCode,
}));
vi.mock('@/lib/firebase', () => ({ auth: authState }));
vi.mock('@/lib/authApi', () => apiMocks);

describe('VerifyEmailHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.currentUser = {
      email: 'traveler@example.com',
      getIdToken: vi.fn().mockResolvedValue('verified-token'),
      reload: vi.fn().mockResolvedValue(undefined),
    };
    firebaseMocks.applyActionCode.mockResolvedValue(undefined);
    firebaseMocks.checkActionCode.mockResolvedValue({
      data: { email: 'traveler@example.com' },
    });
    apiMocks.verifyEmail.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('shows success only after Firebase and Backend verification both succeed', async () => {
    render(<VerifyEmailHandler mode="verifyEmail" oobCode="valid-code" />);

    expect(await screen.findByText('Email Verified!')).toBeDefined();
    expect(apiMocks.saveTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
  });

  it('does not show success when the link is opened without a Firebase session', async () => {
    authState.currentUser = null;
    render(<VerifyEmailHandler mode="verifyEmail" oobCode="valid-code" />);

    expect(await screen.findByText('Verification Incomplete')).toBeDefined();
    expect(screen.queryByText('Email Verified!')).toBeNull();
    expect(apiMocks.verifyEmail).not.toHaveBeenCalled();
  });

  it('does not show success when Backend synchronization fails', async () => {
    apiMocks.verifyEmail.mockRejectedValue({
      code: 'MSG127',
      message: 'database host db-prod-01 unavailable',
      status: 500,
    });
    render(<VerifyEmailHandler mode="verifyEmail" oobCode="valid-code" />);

    expect(await screen.findByText('Verification Incomplete')).toBeDefined();
    expect(screen.queryByText('Email Verified!')).toBeNull();
    expect(screen.queryByText(/db-prod-01/)).toBeNull();
    expect(apiMocks.saveTokens).not.toHaveBeenCalled();
  });

  it('does not sync a verification link using a different signed-in Firebase user', async () => {
    if (authState.currentUser) {
      authState.currentUser.email = 'other@example.com';
    }
    render(<VerifyEmailHandler mode="verifyEmail" oobCode="valid-code" />);

    expect(await screen.findByText('Verification Incomplete')).toBeDefined();
    expect(screen.queryByText('Email Verified!')).toBeNull();
    expect(apiMocks.verifyEmail).not.toHaveBeenCalled();
  });

  it('maps an invalid Firebase action code without exposing the SDK message', async () => {
    firebaseMocks.applyActionCode.mockRejectedValue(
      Object.assign(new Error('Firebase: Error (auth/invalid-action-code).'), {
        code: 'auth/invalid-action-code',
      }),
    );
    render(<VerifyEmailHandler mode="verifyEmail" oobCode="invalid-code" />);

    expect(
      await screen.findByText(
        'The verification link is invalid, expired, or has already been used.',
      ),
    ).toBeDefined();
    await waitFor(() => {
      expect(screen.queryByText(/Firebase: Error/)).toBeNull();
    });
  });
});
