import { describe, expect, it } from 'vitest';
import { parseWebAuthContext } from './authSession';
import { signInDestination } from '../routing/signInDestination';

const base = {
  userId: 7, email: 'provider@example.com', fullName: 'Provider', role: 'ServiceProvider',
  status: 'Active', accessToken: 'token', accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
};

describe('TM225 provider authentication', () => {
  it('recognizes the wire role and routes to the provider workspace', () => {
    expect(signInDestination(parseWebAuthContext({ ...base, mustChangePassword: false }))).toBe('/provider/bookings');
  });
  it('requires first-password change before entering the workspace', () => {
    const context = parseWebAuthContext({ ...base, mustChangePassword: true });
    expect(context.mustChangePassword).toBe(true);
    expect(signInDestination(context)).toBe('/first-password');
  });
  it('rejects malformed restriction flags and retains legacy contexts', () => {
    expect(() => parseWebAuthContext({ ...base, mustChangePassword: 'false' })).toThrow();
    expect(parseWebAuthContext({ ...base, role: 'Traveler' }).mustChangePassword).toBe(false);
  });
});
