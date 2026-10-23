import { afterEach, describe, expect, it, vi } from 'vitest';

import { isOperatorApplicationDemoRequested } from './operatorApplicationDemoMode';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('isOperatorApplicationDemoRequested', () => {
  it('opens only for a non-production build with the env flag and ?demo=1', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', 'true');
    expect(isOperatorApplicationDemoRequested('1')).toBe(true);
  });

  it.each([null, undefined, '', '0', 'true'])('stays closed for demo=%s', (param) => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', 'true');
    expect(isOperatorApplicationDemoRequested(param)).toBe(false);
  });

  it('stays closed without the env flag', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', 'false');
    expect(isOperatorApplicationDemoRequested('1')).toBe(false);
  });

  it('stays closed in a production build even with the flag and ?demo=1', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', 'true');
    expect(isOperatorApplicationDemoRequested('1')).toBe(false);
  });
});
