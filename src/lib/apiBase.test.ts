import { afterEach, describe, expect, it, vi } from 'vitest';

import { getApiBase } from './apiBase';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getApiBase', () => {
  it('uses the same-origin API proxy when public API configuration is missing in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');

    expect(getApiBase()).toBe('/api/v1');
  });

  it('keeps the local backend fallback when public API configuration is missing in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');

    expect(getApiBase()).toBe('http://localhost:5021/api/v1');
  });

  it.each([
    ['https://api.tripmate.example', 'https://api.tripmate.example/api/v1'],
    ['https://api.tripmate.example/', 'https://api.tripmate.example/api/v1'],
    ['/api/v1', '/api/v1'],
  ])('normalizes explicit public API configuration %s', (configured, expected) => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', configured);

    expect(getApiBase()).toBe(expected);
  });
});
