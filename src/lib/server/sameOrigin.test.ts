import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { isSameOriginRequest } from './sameOrigin';

function request(origin: string | null, url = 'https://tripmate.test/api/x'): Request {
  const headers = new Headers();
  if (origin !== null) headers.set('origin', origin);
  return new Request(url, { method: 'POST', headers });
}

describe('isSameOriginRequest', () => {
  const originalOrigin = process.env.TRIPMATE_WEB_ORIGIN;

  beforeEach(() => {
    delete process.env.TRIPMATE_WEB_ORIGIN;
  });

  afterEach(() => {
    if (originalOrigin === undefined) delete process.env.TRIPMATE_WEB_ORIGIN;
    else process.env.TRIPMATE_WEB_ORIGIN = originalOrigin;
  });

  it('rejects a request without an Origin header', () => {
    expect(isSameOriginRequest(request(null))).toBe(false);
  });

  it('rejects the opaque "null" origin', () => {
    expect(isSameOriginRequest(request('null'))).toBe(false);
  });

  it('accepts the request own origin', () => {
    expect(isSameOriginRequest(request('https://tripmate.test'))).toBe(true);
  });

  it('rejects a foreign origin when TRIPMATE_WEB_ORIGIN is unset', () => {
    expect(isSameOriginRequest(request('https://evil.test'))).toBe(false);
  });

  it('accepts the configured web origin', () => {
    process.env.TRIPMATE_WEB_ORIGIN = 'https://app.tripmate.test';
    expect(isSameOriginRequest(request('https://app.tripmate.test'))).toBe(true);
  });

  it('rejects a configured origin that carries a path, credentials, or query', () => {
    process.env.TRIPMATE_WEB_ORIGIN = 'https://app.tripmate.test/base';
    expect(isSameOriginRequest(request('https://app.tripmate.test'))).toBe(false);
  });
});
