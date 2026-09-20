import { describe, expect, it } from 'vitest';

import {
  extractFieldErrors,
  getApiErrorMessage,
  mapFirebaseAuthError,
  mapPasswordResetError,
  mapWebRecoveryError,
} from './authErrorMapper';

describe('auth error mapping', () => {
  it('directs administrators rejected by Google to email/password', () => {
    expect(getApiErrorMessage({
      code: 'auth.admin_google_sign_in_disabled', status: 403, message: 'internal detail',
    })).toBe('Administrator accounts must sign in with email and password.');
  });

  it('maps a structured Backend duplicate-account error by code', () => {
    expect(
      getApiErrorMessage({
        code: 'MSG03',
        message: 'internal backend detail',
        status: 409,
      }),
    ).toBe('An account with this email already exists. Please sign in or use another email.');
  });

  it('maps MSG_PHONE_DUP to its specific message', () => {
    expect(
      getApiErrorMessage({
        code: 'MSG_PHONE_DUP',
        message: 'internal backend detail',
        status: 400,
      }),
    ).toBe('This phone number is already registered to another account.');
  });

  it('maps AUTH_TOKEN_INVALID to a specific message instead of the MSG127 fallback', () => {
    const message = getApiErrorMessage({
      code: 'AUTH_TOKEN_INVALID',
      message: 'internal backend detail',
      status: 401,
    });

    expect(message).toBe(
      'Your authentication token is invalid or has expired. Please try again.',
    );
    expect(message).not.toBe('Something went wrong. Please try again later.');
  });

  it('maps AUTH_EMAIL_MISMATCH to a specific message instead of the MSG127 fallback', () => {
    const message = getApiErrorMessage({
      code: 'AUTH_EMAIL_MISMATCH',
      message: 'internal backend detail',
      status: 400,
    });

    expect(message).toBe(
      'The email address does not match the account used for registration. Please try again with the same email address.',
    );
    expect(message).not.toBe('Something went wrong. Please try again later.');
  });

  it('still falls back to the generic message for unknown codes', () => {
    expect(
      getApiErrorMessage({
        code: 'AUTH_TOKEN_MISSING',
        message: 'internal backend detail',
        status: 400,
      }),
    ).toBe('Something went wrong. Please try again later.');
  });

  it('does not expose an unknown Backend response message', () => {
    expect(
      getApiErrorMessage({
        code: 'UNEXPECTED_INTERNAL_CODE',
        message: 'database host db-prod-01 rejected the request',
        status: 500,
      }),
    ).toBe('Something went wrong. Please try again later.');
  });

  it('does not expose an unknown Backend field-error message', () => {
    expect(extractFieldErrors({ Email: 'database host db-prod-01 rejected the request' })).toEqual({
      Email: 'Something went wrong. Please try again later.',
    });
  });

  it.each([
    ['auth/email-already-in-use', 'An account with this email already exists. Please sign in or use another email.'],
    ['auth/invalid-email', 'Invalid email format. Please enter a valid email address.'],
    ['auth/network-request-failed', 'No internet connection. Please check your connection and try again.'],
    ['auth/invalid-action-code', 'The verification link is invalid, expired, or has already been used.'],
  ])('maps Firebase code %s without exposing its raw message', (code, expected) => {
    expect(mapFirebaseAuthError({ code, message: `Firebase: Error (${code}).` })).toBe(expected);
  });

  it('uses a safe fallback for an unknown Firebase error', () => {
    expect(
      mapFirebaseAuthError(
        { code: 'auth/internal-error', message: 'Firebase internal implementation detail' },
        'Registration failed. Please try again.',
      ),
    ).toBe('Registration failed. Please try again.');
  });
});

describe('UC-06 password reset error mapping', () => {
  const MSG14_RESET_COPY = 'The verification code is invalid or has expired. Please try again or request a new code.';

  it('maps MSG14 to reset-specific safe feedback, not the email-verification wording', () => {
    const message = mapPasswordResetError({ code: 'MSG14', status: 400 });
    expect(message).toBe(MSG14_RESET_COPY);
    expect(message).not.toBe(mapWebRecoveryError({ code: 'MSG14', status: 400 }));
  });

  it('stays stateless: repeated MSG14 responses map identically with no attempt counter', () => {
    const first = mapPasswordResetError({ code: 'MSG14', status: 400 });
    const second = mapPasswordResetError({ code: 'MSG14', status: 400 });
    const third = mapPasswordResetError({ code: 'MSG14', status: 400 });
    expect(first).toBe(second);
    expect(second).toBe(third);
    // No remaining-attempt disclosure exists anywhere in the mapping output.
    expect(first).not.toMatch(/attempt/i);
  });

  it('maps MSG127 to the generic system-failure copy', () => {
    expect(mapPasswordResetError({ code: 'MSG127', status: 500 })).toBe(
      'Something went wrong. Please try again later.',
    );
  });

  it('maps HTTP 429 to safe rate-limit feedback', () => {
    expect(mapPasswordResetError({ status: 429 })).toBe(
      'Too many attempts. Please wait before trying again.',
    );
  });

  it('maps a network failure to the existing connection feedback', () => {
    expect(mapPasswordResetError(new TypeError('Failed to fetch'))).toBe(
      'Unable to connect to TripMate. Please check your connection and try again.',
    );
  });

  it('never leaks unknown raw Backend messages', () => {
    const message = mapPasswordResetError({
      code: 'AUTH_INTERNAL_ALIAS',
      message: 'SQL timeout on Users_PasswordHash at 10.0.0.4',
      status: 500,
    });
    expect(message).toBe('Something went wrong. Please try again later.');
    expect(message).not.toContain('SQL');
  });

  it('preserves non-reset MSG14 behavior for email verification flows', () => {
    expect(mapWebRecoveryError({ code: 'MSG14', status: 400 })).toBe(
      'Your verification session is invalid or has expired. Please sign in and try again.',
    );
  });
});
