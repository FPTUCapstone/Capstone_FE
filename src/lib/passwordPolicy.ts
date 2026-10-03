/**
 * Shared canonical FE password policy.
 *
 * Shared pre-submit validation for local-password entry (registration and
 * UC-06 reset). Passwords are validated without normalization so the exact
 * value entered by the user remains the value submitted for authentication.
 */

const PASSWORD_MAX_LENGTH = 72;

export type PasswordPolicyIssue =
  | 'required'
  | 'whitespace'
  | 'tooShort'
  | 'tooLong'
  | 'missingAllCharacterClasses'
  | 'missingUpperNumberAndSpecial'
  | 'missingUpperAndSpecial'
  | 'missingSpecial'
  | 'missingCharacterClasses';

const PASSWORD_POLICY_MESSAGES: Record<PasswordPolicyIssue, string> = {
  required: 'Please enter your password.',
  whitespace: 'Password cannot contain whitespace.',
  tooShort: 'Password must be at least 8 characters.',
  tooLong: 'Password must not exceed 72 characters.',
  missingAllCharacterClasses:
    'Password must contain uppercase, lowercase, number, and special character.',
  missingUpperNumberAndSpecial:
    'Password must contain uppercase, number, and special character.',
  missingUpperAndSpecial: 'Password must contain uppercase and special character.',
  missingSpecial: 'Password must contain at least one special character.',
  missingCharacterClasses:
    'Password must contain uppercase, lowercase, number, and special character.',
};

/**
 * Return the stable policy issue without choosing a presentation language.
 * All consumers share this one rule implementation; individual screens may
 * translate the issue for their own locale.
 */
export function getPasswordPolicyIssue(password: string): PasswordPolicyIssue | null {
  if (!password) return 'required';
  if (/\s/u.test(password)) return 'whitespace';
  if (password.length < 8) return 'tooShort';
  if (password.length > PASSWORD_MAX_LENGTH) return 'tooLong';

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    if (!hasUpper && !hasLower && !hasDigit && !hasSpecial) {
      return 'missingAllCharacterClasses';
    }
    if (!hasUpper && !hasDigit && !hasSpecial) {
      return 'missingUpperNumberAndSpecial';
    }
    if (!hasUpper && !hasSpecial) {
      return 'missingUpperAndSpecial';
    }
    if (!hasSpecial) {
      return 'missingSpecial';
    }
    return 'missingCharacterClasses';
  }

  return null;
}

/**
 * Validate one password against the canonical FE policy.
 * Returns the user-facing error message, or null when the password is valid.
 */
export function validatePassword(password: string): string | null {
  const issue = getPasswordPolicyIssue(password);
  return issue ? PASSWORD_POLICY_MESSAGES[issue] : null;
}
