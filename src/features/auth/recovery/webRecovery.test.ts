import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loginWithWebRecovery, resendWebVerification } from './webRecovery';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  verify: vi.fn(),
  firebase: vi.fn(),
  send: vi.fn(),
  auth: { currentUser: null as unknown },
}));

vi.mock('@/lib/authApi', async (original) => ({
  ...(await original<typeof import('@/lib/authApi')>()),
  webLogin: mocks.login,
  webVerifyEmail: mocks.verify,
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
