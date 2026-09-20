import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  confirmWebPasswordReset,
  loginWithWebRecovery,
  requestWebPasswordReset,
  resendWebVerification,
} from './webRecovery';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  verify: vi.fn(),
  firebase: vi.fn(),
  send: vi.fn(),
  requestReset: vi.fn(),
  confirmReset: vi.fn(),
  auth: { currentUser: null as unknown },
}));

vi.mock('@/lib/authApi', async (original) => ({
  ...(await original<typeof import('@/lib/authApi')>()),
  webLogin: mocks.login,
  webVerifyEmail: mocks.verify,
  requestPasswordReset: mocks.requestReset,
  confirmPasswordReset: mocks.confirmReset,
}));
vi.mock('@/lib/firebase', () => ({ getFirebaseAuth: () => mocks.auth }));
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: mocks.firebase,
  sendEmailVerification: mocks.send,
}));

const input = {
  email: 'user@example.com',
  password: ' unchanged ',
  keepMeSignedIn: true,
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.currentUser = null;
});

describe('Backend-only Web sign-in', () => {
  it('forwards email and password to the Backend login without any Firebase step', async () => {
    const context = {
      userId: 42,
      email: 'user@example.com',
      fullName: '',
      role: 'TourOperator',
      status: 'Active',
      applicationStatus: 'Rejected',
      accessToken: 'backend-access',
      accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
    };
    mocks.login.mockResolvedValue(context);

    expect(await loginWithWebRecovery(input, false)).toBe(context);
    expect(mocks.login).toHaveBeenCalledTimes(1);
    expect(mocks.login).toHaveBeenCalledWith(
      { email: 'user@example.com', password: ' unchanged ', keepMeSignedIn: true },
      false,
    );
    // Firebase must never be touched by the Web password sign-in flow.
    expect(mocks.firebase).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.verify).not.toHaveBeenCalled();
  });

  it.each([
    ['auth.invalid_credentials', 401],
    ['auth.account_locked', 403],
    ['auth.account_inactive', 403],
    ['auth.account_state_unresolved', 403],
    ['MSG_UNVERIFIED', 403],
  ])('propagates Backend failure %s without falling back to Firebase', async (code, status) => {
    const error = { code, status, message: 'internal detail' };
    mocks.login.mockRejectedValue(error);
    await expect(loginWithWebRecovery(input, false)).rejects.toMatchObject({ code });
    expect(mocks.firebase).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.verify).not.toHaveBeenCalled();
  });
});

describe('Verification email resend is disabled until UC-06 lands', () => {
  it('never calls Firebase sendEmailVerification or signInWithEmailAndPassword', async () => {
    await expect(resendWebVerification(input.email, input.password)).rejects.toMatchObject({
      code: 'MSG_VERIFICATION_RESEND_UNAVAILABLE',
    });
    expect(mocks.firebase).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.login).not.toHaveBeenCalled();
    expect(mocks.verify).not.toHaveBeenCalled();
  });
});

describe('UC-06 password reset orchestration', () => {
  const resetMessage = { message: 'If an account exists for this email, reset instructions have been sent.' };

  it('normalizes the email like Web sign-in and requests a reset OTP', async () => {
    mocks.requestReset.mockResolvedValue(resetMessage);

    expect(await requestWebPasswordReset('  User@Example.COM ')).toBe(resetMessage);
    expect(mocks.requestReset).toHaveBeenCalledTimes(1);
    expect(mocks.requestReset).toHaveBeenCalledWith('user@example.com');
  });

  it('returns the generic Backend DTO without account-specific interpretation', async () => {
    mocks.requestReset.mockResolvedValue(resetMessage);

    const result = await requestWebPasswordReset('user@example.com');
    expect(result).toEqual(resetMessage);
    // No Firebase email action is ever involved.
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('confirms with the normalized retained email, exact payload and a verbatim string OTP', async () => {
    mocks.confirmReset.mockResolvedValue({ message: 'Your password has been reset. You can now sign in with your new password.' });

    await confirmWebPasswordReset({ email: '  User@Example.COM ', code: '012345', newPassword: 'NewPassword1!' });

    expect(mocks.confirmReset).toHaveBeenCalledTimes(1);
    expect(mocks.confirmReset).toHaveBeenCalledWith({
      email: 'user@example.com',
      code: '012345',
      newPassword: 'NewPassword1!',
    });
  });

  it.each([
    { code: 'MSG14', status: 400 },
    { code: 'MSG127', status: 500 },
    { status: 429 },
  ])('propagates Backend reset failure %# untouched for the caller to map', async (error) => {
    mocks.confirmReset.mockRejectedValue(error);

    await expect(
      confirmWebPasswordReset({ email: 'user@example.com', code: '123456', newPassword: 'NewPassword1!' }),
    ).rejects.toMatchObject(error);
  });
});
