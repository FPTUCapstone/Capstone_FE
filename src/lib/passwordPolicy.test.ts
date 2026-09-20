import { describe, expect, it } from 'vitest';

import { validatePassword } from './passwordPolicy';

// Expectations pin the exact legacy granular messages extracted from
// TravelerRegistrationForm.tsx so registration behavior is unchanged.
describe('validatePassword (shared canonical FE password policy)', () => {
  it('requires a password', () => {
    expect(validatePassword('')).toBe('Please enter your password.');
  });

  it.each([' NewPassword1!', 'NewPassword1! ', ' NewPassword1! '])(
    'rejects leading/trailing whitespace: %s',
    (password) => {
      expect(validatePassword(password)).toBe(
        'Password cannot start or end with a space.',
      );
    },
  );

  it('rejects passwords shorter than 8 characters', () => {
    expect(validatePassword('New1!a')).toBe('Password must be at least 8 characters.');
  });

  it('rejects passwords longer than 72 characters', () => {
    expect(validatePassword(`${'Aa1!'.repeat(18)}A`)).toBe(
      'Password must not exceed 72 characters.',
    );
  });

  it.each([
    ['Password1', 'Password must contain at least one special character.'],
    ['password1!', 'Password must contain uppercase, lowercase, number, and special character.'],
    ['PASSWORD1!', 'Password must contain uppercase, lowercase, number, and special character.'],
    ['Password!!', 'Password must contain uppercase, lowercase, number, and special character.'],
    ['         ', 'Password cannot start or end with a space.'],
  ])('rejects "%s" with the exact legacy granular message', (password, expected) => {
    expect(validatePassword(password)).toBe(expected);
  });

  it.each([
    ['aaaa!!!!', 'Password must contain uppercase, lowercase, number, and special character.'],
    ['aaaa1111', 'Password must contain uppercase and special character.'],
    ['AAAA1111', 'Password must contain at least one special character.'],
    ['a!', 'Password must be at least 8 characters.'],
  ])('rejects "%s" with the legacy fallback message', (password, expected) => {
    expect(validatePassword(password)).toBe(expected);
  });

  it.each(['NewPassword1!', '0123456aA!', 'aA1!aA1!aA1!'])(
    'accepts valid password: %s',
    (password) => {
      expect(validatePassword(password)).toBeNull();
    },
  );
});
