import 'server-only';

export class BackendConfigurationError extends Error {
  constructor() {
    super('TRIPMATE_API_BASE_URL must be an absolute HTTP(S) origin.');
    this.name = 'BackendConfigurationError';
  }
}

export async function fetchBackend(path: string, init: RequestInit = {}): Promise<Response> {
  let base: URL;
  try {
    base = new URL(process.env.TRIPMATE_API_BASE_URL ?? '');
    if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.pathname !== '/' || base.search || base.hash) {
      throw new BackendConfigurationError();
    }
  } catch {
    throw new BackendConfigurationError();
  }

  // Only application-owned paths may be requested through this authenticated boundary.
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    throw new Error('The backend path must be relative to its configured origin.');
  }
  const url = new URL(path, base);
  if (url.origin !== base.origin) throw new Error('Invalid backend origin.');
  const timeout = AbortSignal.timeout(15_000);
  return fetch(url, {
    ...init,
    cache: 'no-store',
    redirect: 'error',
    signal: init.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
  });
}
