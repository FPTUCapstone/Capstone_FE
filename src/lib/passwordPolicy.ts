/**
 * Shared canonical FE password policy.
 *
 * Single source of truth for local-password entry (registration, UC-06 reset
 * password). Extracted verbatim from the inline validation in
 * TravelerRegistrationForm.tsx so registration behavior is unchanged and no
 * second policy can appear. The Backend remains the password authority; these
 * are pre-submit FE checks only.
 */

const PASSWORD_MAX_LENGTH = 72;

/**
 * Validate one password against the canonical FE policy.
 * Returns the user-facing error message, or null when the password is valid.
 */
export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Please enter your password.';
  }
  if (password.startsWith(' ') || password.endsWith(' ')) {
    return 'Password cannot start or end with a space.';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return 'Password must not exceed 72 characters.';
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    if (!hasUpper && !hasLower && !hasDigit && !hasSpecial) {
      return 'Password must contain uppercase, lowercase, number, and special character.';
    }
    if (!hasUpper && !hasDigit && !hasSpecial) {
      return 'Password must contain uppercase, number, and special character.';
    }
    if (!hasUpper && !hasSpecial) {
      return 'Password must contain uppercase and special character.';
    }
    if (!hasSpecial) {
      return 'Password must contain at least one special character.';
    }
    return 'Password must contain uppercase, lowercase, number, and special character.';
  }

  return null;
}
