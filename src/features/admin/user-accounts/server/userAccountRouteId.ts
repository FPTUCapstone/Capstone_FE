export function parseUserAccountRouteId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;

  const userId = Number(value);
  return Number.isSafeInteger(userId) && userId > 0 ? userId : null;
}
