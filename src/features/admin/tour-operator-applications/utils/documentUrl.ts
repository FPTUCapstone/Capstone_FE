const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Returns the normalized URL only when it is an absolute HTTP(S) URL. Relative,
 * protocol-relative, malformed and other-scheme values (javascript:, data:, file:, ...)
 * yield null, so the caller renders no active link.
 */
export function getSafeDocumentUrl(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  // Protocol-relative values inherit the page scheme and host resolution; never treat them as safe.
  if (!trimmed || trimmed.startsWith('//')) return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  return ALLOWED_PROTOCOLS.has(parsed.protocol) ? parsed.href : null;
}
