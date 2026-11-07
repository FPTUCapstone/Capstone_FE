// Client checks give early feedback; the Backend validators remain the source of truth.
export const EVIDENCE_URL_MAX_LENGTH = 1000;
export const AUTHORITY_REFERENCE_MAX_LENGTH = 200;
export const EVIDENCE_REFERENCE_MAX_LENGTH = 500;
export const EMERGENCY_CONTACT_MAX_LENGTH = 100;

export function isValidHttpsUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'https:') return false;
    if (url.username || url.password) return false;
    return true;
  } catch {
    return false;
  }
}
