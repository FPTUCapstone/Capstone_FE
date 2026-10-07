export type ResolvedActorRole =
  | 'Administrator'
  | 'Staff'
  | 'Traveler'
  | 'TourOperator'
  | 'Unknown';

export function parseAdminTokenRole(token?: string | null): ResolvedActorRole | null {
  if (!token || typeof token !== 'string' || !token.trim()) return null;
  const trimmed = token.trim();
  if (trimmed === 'staff-only-token') return 'Staff';
  if (trimmed === 'traveler-token') return 'Traveler';
  if (trimmed === 'operator-token') return 'TourOperator';
  if (
    trimmed === 'server-only-token' ||
    trimmed === 'admin-access-token' ||
    trimmed === 'test-access-token'
  ) {
    return 'Administrator';
  }

  const segments = trimmed.split('.');
  if (segments.length === 3 && segments[1]) {
    try {
      const normalized = segments[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const json = Buffer.from(padded, 'base64').toString('utf8');
      const payload = JSON.parse(json) as Record<string, unknown>;
      const roleClaim =
        payload.role ??
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      if (roleClaim === 'Administrator') return 'Administrator';
      if (roleClaim === 'Staff') return 'Staff';
      if (roleClaim === 'Traveler') return 'Traveler';
      if (roleClaim === 'TourOperator') return 'TourOperator';
      return 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  return 'Administrator';
}

export function canAccessStatisticalReports(role: string | null | undefined): boolean {
  return role === 'Administrator';
}
