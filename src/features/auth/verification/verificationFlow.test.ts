import { describe, expect, it } from 'vitest';

import { resolveVerificationFlow } from './verificationFlow';

describe('resolveVerificationFlow', () => {
  it.each(['operator', 'operator-mobile'] as const)('keeps the supported direct %s flow', (flow) => {
    expect(resolveVerificationFlow({ flow })).toBe(flow);
  });

  it('recovers a supported flow from a Firebase continue URL for the verification route', () => {
    expect(resolveVerificationFlow({
      continueUrl: 'https://tripmate.example/verify-email?flow=operator-mobile',
    })).toBe('operator-mobile');
  });

  it.each([
    undefined,
    'not a URL',
    'https://tripmate.example/sign-in?flow=operator',
    'https://tripmate.example/verify-email?flow=traveler',
  ])('rejects missing or unsupported continue URL %s', (continueUrl) => {
    expect(resolveVerificationFlow({ continueUrl })).toBeUndefined();
  });

  it('prefers a supported direct flow over the nested continue URL', () => {
    expect(resolveVerificationFlow({
      flow: 'operator',
      continueUrl: 'https://tripmate.example/verify-email?flow=operator-mobile',
    })).toBe('operator');
  });
});
