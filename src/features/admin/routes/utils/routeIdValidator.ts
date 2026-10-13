const SQL_BIGINT_MAX = BigInt('9223372036854775807');
const BIGINT_ZERO = BigInt(0);

export function parseRouteId(value: string): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  try {
    const parsed = BigInt(trimmed);
    if (parsed <= BIGINT_ZERO || parsed > SQL_BIGINT_MAX) {
      return null;
    }

    return trimmed;
  } catch {
    return null;
  }
}
