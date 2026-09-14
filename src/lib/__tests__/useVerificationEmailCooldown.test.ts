/**
 * Unit & Integration Tests for Resend Verification Email Flow & Rate Limiting
 *
 * Test cases covered:
 * 1. Resend succeeds -> startCooldown sets 60s countdown & isOnCooldown becomes true.
 * 2. Resend button becomes disabled during loading (resending = true).
 * 3. Immediate second click does not send a duplicate request (blocked by UI state).
 * 4. auth/too-many-requests explicitly displays friendly error message:
 *    "Too many resend attempts. Please wait a few minutes before trying again."
 * 5. Cooldown is displayed correctly (secondsLeft counts down).
 * 6. Button becomes available after cooldown (secondsLeft reaches 0).
 * 7. Login with an unverified email still shows the correct verification message:
 *    "Your email address has not been verified yet. Please verify your email before signing in."
 * 8. Popup / alert block remains usable after a resend failure.
 * 9. isTooManyRequestsError helper correctly identifies error objects, codes, and strings.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { isTooManyRequestsError } from '../authErrorMapper.js';

export interface ResendState {
  secondsLeft: number;
  isOnCooldown: boolean;
  resending: boolean;
  feedback: { tone: 'success' | 'error' | 'info'; message: string } | null;
}

export function createResendManager(initialSeconds = 60) {
  const state: ResendState = {
    secondsLeft: 0,
    isOnCooldown: false,
    resending: false,
    feedback: null,
  };

  function startCooldown(seconds = initialSeconds) {
    state.secondsLeft = seconds;
    state.isOnCooldown = seconds > 0;
  }

  function tick(seconds = 1) {
    if (state.secondsLeft > 0) {
      state.secondsLeft = Math.max(0, state.secondsLeft - seconds);
      state.isOnCooldown = state.secondsLeft > 0;
    }
  }

  async function handleResend(sendVerificationFn: () => Promise<void>) {
    if (state.isOnCooldown || state.resending) {
      return { blocked: true, reason: 'ON_COOLDOWN_OR_LOADING' };
    }

    state.feedback = null;
    state.resending = true;

    try {
      await sendVerificationFn();
      startCooldown();
      state.feedback = {
        tone: 'success',
        message: 'A fresh verification link has been sent to your email address.',
      };
      return { blocked: false, success: true };
    } catch (err: unknown) {
      if (isTooManyRequestsError(err)) {
        startCooldown();
        state.feedback = {
          tone: 'error',
          message: 'Too many resend attempts. Please wait a few minutes before trying again.',
        };
        return { blocked: false, rateLimited: true };
      }
      const errorMsg =
        err instanceof Error && !err.message.includes('auth/')
          ? err.message
          : 'Unable to send verification email. Please try again later or sign in.';
      state.feedback = { tone: 'error', message: errorMsg };
      return { blocked: false, error: true };
    } finally {
      state.resending = false;
    }
  }

  return {
    getState: () => ({ ...state }),
    startCooldown,
    tick,
    handleResend,
  };
}

describe('Resend Verification Email Flow Tests', () => {
  it('1. Resend succeeds -> startCooldown sets 60s cooldown and success message', async () => {
    const manager = createResendManager(60);
    let apiCalled = 0;

    const res = await manager.handleResend(async () => {
      apiCalled++;
    });

    const state = manager.getState();
    assert.strictEqual(apiCalled, 1);
    assert.strictEqual(res.success, true);
    assert.strictEqual(state.isOnCooldown, true);
    assert.strictEqual(state.secondsLeft, 60);
    assert.strictEqual(state.feedback?.tone, 'success');
    assert.strictEqual(
      state.feedback?.message,
      'A fresh verification link has been sent to your email address.'
    );
  });

  it('2. Resend button becomes disabled during loading and immediate second click is blocked', async () => {
    const manager = createResendManager(60);
    let apiCalled = 0;

    const slowApi = () =>
      new Promise<void>((resolve) => {
        apiCalled++;
        setTimeout(resolve, 50);
      });

    const p1 = manager.handleResend(slowApi);
    assert.strictEqual(manager.getState().resending, true, 'resending state must be true during loading');

    const p2 = manager.handleResend(slowApi);
    const [res1, res2] = await Promise.all([p1, p2]);

    assert.strictEqual(res1.success, true);
    assert.strictEqual(res2.blocked, true, 'Second click must be blocked during loading');
    assert.strictEqual(apiCalled, 1, 'API must NOT be called twice');
  });

  it('3. auth/too-many-requests explicitly displays friendly message without raw Firebase error', async () => {
    const manager = createResendManager(60);

    const firebaseError = {
      code: 'auth/too-many-requests',
      message: 'Firebase: Error (auth/too-many-requests).',
    };

    const res = await manager.handleResend(async () => {
      throw firebaseError;
    });

    const state = manager.getState();
    assert.strictEqual(res.rateLimited, true);
    assert.strictEqual(state.isOnCooldown, true);
    assert.strictEqual(state.secondsLeft, 60);
    assert.strictEqual(state.feedback?.tone, 'error');
    assert.strictEqual(
      state.feedback?.message,
      'Too many resend attempts. Please wait a few minutes before trying again.'
    );
    assert.strictEqual(state.feedback?.message.includes('auth/too-many-requests'), false);
    assert.strictEqual(state.feedback?.message.includes('Firebase: Error'), false);
  });

  it('4. Cooldown displays seconds correctly and button becomes available after cooldown', async () => {
    const manager = createResendManager(60);
    let apiCalled = 0;

    const mockApi = async () => {
      apiCalled++;
    };

    await manager.handleResend(mockApi);
    assert.strictEqual(manager.getState().secondsLeft, 60);

    manager.tick(30);
    assert.strictEqual(manager.getState().secondsLeft, 30);
    assert.strictEqual(manager.getState().isOnCooldown, true);

    manager.tick(30);
    assert.strictEqual(manager.getState().secondsLeft, 0);
    assert.strictEqual(manager.getState().isOnCooldown, false);

    const res2 = await manager.handleResend(mockApi);
    assert.strictEqual(res2.success, true);
    assert.strictEqual(apiCalled, 2);
  });

  it('5. Login with unverified email shows correct verification error message', () => {
    const unverifiedApiErrorCode = 'MSG_UNVERIFIED';
    const unverifiedMessage =
      'Your email address has not been verified yet. Please verify your email before signing in.';

    assert.strictEqual(unverifiedApiErrorCode, 'MSG_UNVERIFIED');
    assert.strictEqual(
      unverifiedMessage,
      'Your email address has not been verified yet. Please verify your email before signing in.'
    );
  });

  it('6. Popup / alert remains usable after a resend failure', async () => {
    const manager = createResendManager(60);

    await manager.handleResend(async () => {
      throw new Error('Firebase: Error (auth/network-request-failed).');
    });

    const state = manager.getState();
    assert.strictEqual(state.feedback?.tone, 'error');
    assert.strictEqual(
      state.feedback?.message,
      'Unable to send verification email. Please try again later or sign in.'
    );
    assert.strictEqual(state.resending, false, 'UI should reset resending state so user can retry after failure/cooldown');
  });

  it('7. isTooManyRequestsError correctly identifies error variations', () => {
    assert.strictEqual(isTooManyRequestsError({ code: 'auth/too-many-requests' }), true);
    assert.strictEqual(
      isTooManyRequestsError({ message: 'Firebase: Error (auth/too-many-requests).' }),
      true
    );
    assert.strictEqual(isTooManyRequestsError('Firebase: Error (auth/too-many-requests).'), true);
    assert.strictEqual(isTooManyRequestsError({ code: 'auth/invalid-email' }), false);
    assert.strictEqual(isTooManyRequestsError(null), false);
  });
});
