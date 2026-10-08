export const operatorMessages: Record<string, string> = {
  MSG01: 'This field is required.',
  MSG02: 'Invalid email format. Please enter a valid email address (e.g., user@example.com).',
  MSG03: 'An account with this email already exists. Please sign in or use another email.',
  MSG04: 'Invalid phone number. Phone number must be 10 digits starting with 0.',
  MSG05: 'Password must be at least 8 characters, containing uppercase, lowercase, number, and special character.',
  MSG06: 'Passwords do not match. Please re-enter.',
  MSG07: 'Account registered successfully! Please verify your email/OTP to activate your account.',
  MSG08: 'Your business profile has been submitted for verification. Admin review takes 1-2 business days.',
  MSG157: 'Please upload the required business licence document.',
  MSG158: 'The uploaded file type is not supported or the file exceeds the size limit.',
  MSG159: 'This business licence number or tax code is already registered.',
  MSG160: 'An application is already pending review for this business information.',
  OPERATOR_TAX_CODE_INVALID: 'Tax Code must be 10 digits or 10 digits followed by a hyphen and 3 digits (e.g. 0315678901-001).',
  OPERATOR_TRAVEL_LICENSE_INVALID: 'Travel Licence Number must follow 79-0123/2026/TCDL-GPLHQT or 01-0456/2025/SDL-GPLHND.',
  MSG127: 'TripMate is temporarily unable to process your request. Please check your connection and try again.',
  MSG_TOS: 'You must accept the Terms of Service, Privacy Policy and Partner Agreement.',
  AUTH_TOKEN_MISSING: 'Your registration session has expired. Please sign in with the same email and try again.',
  AUTH_TOKEN_INVALID: 'Your registration session has expired. Please sign in with the same email and try again.',
  AUTH_EMAIL_MISMATCH: 'The registration email does not match the Firebase account. Please use the same email.',
  'auth.request_invalid': 'Please correct the highlighted fields.',
};

export function operatorMessage(code: string | undefined): string {
  return code && Object.hasOwn(operatorMessages, code) ? operatorMessages[code] : operatorMessages.MSG127;
}
