const canonicalPositiveInteger = /^[1-9]\d*$/;

export function parseApplicationId(value: string): number | null {
  if (!canonicalPositiveInteger.test(value)) return null;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}
