export type AuthRole = 'Traveler' | 'TourOperator' | 'Administrator';
export type ApplicationStatus = 'Approved' | 'PendingApproval' | 'Rejected';
export interface WebAuthContext {
  readonly userId: number;
  readonly email: string;
  readonly fullName: string;
  readonly role: AuthRole;
  readonly status: 'Active';
  readonly applicationStatus: ApplicationStatus | null;
  readonly applicationUnresolved: boolean;
  readonly accessToken: string;
  readonly accessTokenExpiresAtUtc: string;
}
export class InvalidAuthContextError extends Error {
  constructor() { super('INVALID_AUTH_CONTEXT'); this.name = 'InvalidAuthContextError'; }
}

export function parseWebAuthContext(value: unknown): WebAuthContext {
  if (!value || typeof value !== 'object') throw new InvalidAuthContextError();
  const data = value as Record<string, unknown>;
  const expiry = typeof data.accessTokenExpiresAtUtc === 'string' ? data.accessTokenExpiresAtUtc : '';
  if (!Number.isSafeInteger(data.userId) || (data.userId as number) <= 0 ||
      typeof data.email !== 'string' || !data.email.trim() || typeof data.fullName !== 'string' ||
      !['Traveler', 'TourOperator', 'Administrator'].includes(data.role as string) || data.status !== 'Active' ||
      typeof data.accessToken !== 'string' || !data.accessToken.trim() || 'refreshToken' in data ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|\+00:00)$/.test(expiry) ||
      !Number.isFinite(Date.parse(expiry)) || Date.parse(expiry) <= Date.now()) throw new InvalidAuthContextError();
  const operator = data.role === 'TourOperator';
  const known = typeof data.applicationStatus === 'string' && ['Approved', 'PendingApproval', 'Rejected'].includes(data.applicationStatus);
  return Object.freeze({
    userId: data.userId as number, email: data.email, fullName: data.fullName,
    role: data.role as AuthRole, status: 'Active',
    applicationStatus: operator && known ? data.applicationStatus as ApplicationStatus : null,
    applicationUnresolved: operator && !known,
    accessToken: data.accessToken, accessTokenExpiresAtUtc: expiry,
  });
}

let current: WebAuthContext | null = null;
const listeners = new Set<() => void>();
function notify(): void { for (const listener of listeners) { try { listener(); } catch { /* A broken subscriber must not break the session. */ } } }
// Display metadata is never used to restore authentication or authorize requests.
function storageOperation(operation: (storage: Storage) => void): void {
  if (typeof window === 'undefined') return;
  for (const kind of ['localStorage', 'sessionStorage'] as const) {
    try { operation(window[kind]); } catch { /* Storage may be disabled; memory auth remains usable. */ }
  }
}
export const AuthStorage = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  clear(): void {
    current = null;
    storageOperation((storage) => {
      for (const key of ['tripmate_access_token', 'tripmate_refresh_token', 'tripmate_user']) storage.removeItem(key);
    });
    notify();
  },
  accept(value: unknown, keepMeSignedIn: boolean): WebAuthContext {
    if (typeof window === 'undefined') throw new InvalidAuthContextError();
    let context: WebAuthContext;
    try { context = parseWebAuthContext(value); } catch (error) { this.clear(); throw error; }
    current = context;
    storageOperation((storage) => {
      for (const key of ['tripmate_access_token', 'tripmate_refresh_token', 'tripmate_user']) storage.removeItem(key);
    });
    if (typeof window !== 'undefined') {
      const { accessToken: _access, ...metadata } = context;
      void _access;
      try { window[keepMeSignedIn ? 'localStorage' : 'sessionStorage'].setItem('tripmate_user', JSON.stringify({ ...metadata, keepMeSignedIn })); } catch { /* Optional presentation cache. */ }
    }
    notify();
    return context;
  },
  getContext(): WebAuthContext | null { return current && Date.parse(current.accessTokenExpiresAtUtc) > Date.now() ? current : null; },
  getAccessToken(): string | null { return this.getContext()?.accessToken ?? null; },
};
