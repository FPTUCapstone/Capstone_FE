/**
 * Shared canonical FE password policy.
 *
 * Shared pre-submit validation for local-password entry (registration and
 * UC-06 reset). Passwords are validated without normalization so the exact
 * value entered by the user remains the value submitted for authentication.
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
  if (/\s/u.test(password)) {
    return 'Password cannot contain whitespace.';
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
