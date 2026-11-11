import 'server-only';

import { DEV_TOUR_QUERY_KEYS } from '../utils/devTourQuery';
import { DEV_SEARCH_ERRORS, devTourSearchCopy } from '../resources/en';
import { isDevRecord, parseDevPagedTours, parseDevTourCategories } from './devTourContract';

function localOrigin(value: string | undefined): URL | null {
  try {
    const url = new URL(value ?? '');
    return url.protocol === 'http:' && ['127.0.0.1', '[::1]'].includes(url.hostname) && url.pathname === '/' && !url.username && !url.password && !url.search && !url.hash ? url : null;
  } catch { return null; }
}

function configuration() {
  const origin = localOrigin(process.env.TM70_SEARCH_DEV_ORIGIN);
  const backend = localOrigin(process.env.TM70_SEARCH_DEV_BACKEND_ORIGIN);
  const key = process.env.TM70_SEARCH_DEV_KEY ?? '';
  if (process.env.NODE_ENV !== 'development' || process.env.TM70_SEARCH_DEV_ENABLED !== 'true' || !origin || !backend || key.length < 32 || /[\r\n]/.test(key)) return null;
  return { origin, backend, key };
}

export function isDevTourSearchEnabled(): boolean { return configuration() !== null; }

function problem(status: number, title: string, errorCode?: string, traceId?: string): Response {
  return Response.json({ status, title, ...(errorCode ? { errorCode } : {}) }, { status, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/problem+json', ...(traceId ? { 'X-TM70-Trace-Id': traceId } : {}) } });
}

function validForwardingHeaders(headers: Headers, origin: URL): boolean {
  const keys = [...headers.keys()].filter((key) => key === 'forwarded' || key.startsWith('x-forwarded-'));
  if (keys.length === 0) return true;
  // Next 16.3 adds these four headers from its socket by default. They remain
  // spoofable HTTP data; only the required loopback listener establishes scope.
  return keys.length === 4 && !headers.has('forwarded') &&
    ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(headers.get('x-forwarded-for') ?? '') &&
    headers.get('x-forwarded-host') === origin.host &&
    headers.get('x-forwarded-port') === (origin.port || '80') &&
    headers.get('x-forwarded-proto') === 'http';
}

export async function proxyDevTourRequest(request: Request, resource: 'search' | 'categories'): Promise<Response> {
  const config = configuration();
  if (!config) return problem(404, 'Development search is unavailable.');
  const url = new URL(request.url);
  const host = request.headers.get('host');
  const origin = request.headers.get('origin');
  const site = request.headers.get('sec-fetch-site');
  // Request headers cannot attest peer IP. This boundary additionally requires the
  // documented loopback-only server bind and forbids reverse proxies/tunnels.
  const forwardingValid = validForwardingHeaders(request.headers, config.origin);
  // Next's dev Route Handler adapter normalizes its internal URL to localhost.
  // Accept that internal form only when external Host and the full generated
  // forwarding quartet still identify the exact configured numeric loopback.
  const nextInternalOrigin = new URL(config.origin);
  nextInternalOrigin.hostname = 'localhost';
  const validRequestOrigin = url.origin === config.origin.origin ||
    (url.origin === nextInternalOrigin.origin && host === config.origin.host &&
      request.headers.has('x-forwarded-for') && forwardingValid);
  if (!validRequestOrigin || (host && host !== config.origin.host) || (origin && origin !== config.origin.origin) || (site && !['same-origin', 'none'].includes(site)) || !forwardingValid) return problem(403, 'Local same-origin development access is required.');
  const query = new URLSearchParams();
  if (resource === 'search') {
    if ([...url.searchParams.keys()].some((key) => !DEV_TOUR_QUERY_KEYS.has(key))) return problem(400, devTourSearchCopy.invalidFilters);
    for (const key of DEV_TOUR_QUERY_KEYS) {
      const values = url.searchParams.getAll(key);
      if (values.length > 1) return problem(400, 'Duplicate search filters are not supported.');
      if (values[0]?.trim()) query.set(key, values[0].trim());
    }
  }
  const upstreamUrl = new URL(`/api/dev/tours/${resource}`, config.backend);
  upstreamUrl.search = query.toString();
  let traceId: string | undefined;
  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'GET', cache: 'no-store', redirect: 'error',
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(30_000)]),
      headers: { Accept: 'application/json', 'X-TM70-Dev-Key': config.key },
    });
    const upstreamTrace = upstream.headers.get('X-TM70-Trace-Id');
    if (upstreamTrace && /^[A-Za-z0-9._:-]{1,256}$/.test(upstreamTrace)) traceId = upstreamTrace;
    const data: unknown = await upstream.json();
    if (!upstream.ok) {
      const code = isDevRecord(data) && typeof data.errorCode === 'string' && Object.hasOwn(DEV_SEARCH_ERRORS, data.errorCode) ? data.errorCode : undefined;
      return problem(upstream.status, code ? DEV_SEARCH_ERRORS[code] : upstream.status === 400 ? devTourSearchCopy.invalidFilters : devTourSearchCopy.requestFailed, code, traceId);
    }
    const safeData = resource === 'search' ? parseDevPagedTours(data) : parseDevTourCategories(data);
    return Response.json(safeData, { headers: { 'Cache-Control': 'no-store', ...(traceId ? { 'X-TM70-Trace-Id': traceId } : {}) } });
  } catch {
    return problem(502, 'Development search is temporarily unavailable.', undefined, traceId);
  }
}
