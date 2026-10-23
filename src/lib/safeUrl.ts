/**
 * An API-provided URL that is safe to put in `href` / `src`: absolute `https:` only (FEC §12).
 * Anything else (javascript:, http:, relative, malformed) becomes null so the caller omits the link/image.
 */
export function safeHttpsUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}
