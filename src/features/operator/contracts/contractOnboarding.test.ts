import { describe, expect, it } from 'vitest';
import { parseWebAuthContext } from '@/features/auth/session/authSession';
import { signInDestination } from '@/features/auth/routing/signInDestination';
import { partnerRouteDecision } from '@/features/operator/access/partnerRouteDecision';
const context = { userId: 42, email: 'operator@example.test', fullName: 'Operator', role: 'TourOperator', status: 'Active', applicationStatus: 'Approved', accessToken: 'token', accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z' };
describe('authoritative contract onboarding', () => {
  it('routes a newly approved operator to the contract until signing completes', () => {
    const parsed = parseWebAuthContext({ ...context, onboardingState: 'AwaitingSignature', contractStatus: 'PendingSignature', currentContractId: '9999999999999999' });
    expect(parsed.onboardingState).toBe('AwaitingSignature'); expect(parsed.currentContractId).toBe('9999999999999999');
    expect(signInDestination(parsed)).toBe('/partner/contract');
    expect(partnerRouteDecision('dashboard', parsed)).toEqual({ action: 'redirect', href: '/partner/contract' });
    expect(partnerRouteDecision('contract', parsed)).toEqual({ action: 'allow' });
  });
  it('retains legacy access but fails closed on an explicitly unknown onboarding state', () => {
    expect(signInDestination(parseWebAuthContext(context))).toBe('/partner');
    const unknown = parseWebAuthContext({ ...context, onboardingState: 'future-state' });
    expect(signInDestination(unknown)).toBeNull();
    expect(partnerRouteDecision('dashboard', unknown)).toEqual({ action: 'redirect', href: '/partner/application' });
  });
  it('allows signed operators to revisit their contract and rejects malformed contract identifiers', () => {
    const signed = parseWebAuthContext({ ...context, onboardingState: 'Active', contractStatus: 'Signed', currentContractId: '2' });
    expect(partnerRouteDecision('contract', signed)).toEqual({ action: 'allow' });
    expect(() => parseWebAuthContext({ ...context, onboardingState: 'AwaitingSignature', currentContractId: '../other' })).toThrow();
  });
  it('uses the authoritative review state even if an old application projection still says Approved', () => {
    expect(signInDestination(parseWebAuthContext({ ...context, onboardingState: 'AwaitingReview' }))).toBe('/partner/application');
  });
});
