import { describe, expect, it } from 'vitest';

import {
  extractFieldErrors,
  getApiErrorMessage,
  mapFirebaseAuthError,
} from './authErrorMapper';

describe('auth error mapping', () => {
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
