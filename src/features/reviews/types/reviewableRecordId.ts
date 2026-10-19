const MAX_SIGNED_INT64 = '9223372036854775807';

export function isPositiveInt64(value: string): boolean {
  if (!/^[1-9]\d*$/.test(value)) return false;
  return value.length < MAX_SIGNED_INT64.length ||
    (value.length === MAX_SIGNED_INT64.length && value <= MAX_SIGNED_INT64);
}
