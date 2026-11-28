import 'server-only';
import { cookies } from 'next/headers';
import { ADMIN_ACCESS_TOKEN_COOKIE, isSameOriginRequest, jsonNoStore, verifyAdminSessionFromCookies } from '@/lib/server/adminSession';
import { fetchBackend } from '@/lib/server/backend';
import { CHANNEL_STATUSES } from './paymentChannel';

const publicFields = ['channelId', 'opaqueId', 'status', 'channelVersion', 'beneficiaryAccountNumberMasked', 'beneficiaryAccountName', 'beneficiaryBankCode', 'webhookRegisteredAt', 'connectedAt', 'lastVerifiedAt', 'allowedActions'];
const adminFields = [...publicFields, 'tourOperatorUserId', 'operatorName', 'createdAt', 'updatedAt'];
const credentialFields = ['clientId', 'apiKey', 'checksumKey', 'beneficiaryAccountNumber', 'beneficiaryAccountName', 'beneficiaryBankCode'];
function record(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function pick(value: unknown, keys: string[]) { return record(value) ? Object.fromEntries(keys.filter((key) => key in value).map((key) => [key, value[key]])) : null; }
const fail = (status = 503, code = 'payment_channel.unavailable') => jsonNoStore({ errorCode: code }, status);
async function readJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) return {};
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const item = await reader.read(); if (item.done) break;
    size += item.value.byteLength;
    if (size > 16384) { await reader.cancel(); throw new RangeError(); }
    chunks.push(item.value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
export async function proxyPaymentChannel(request: Request, actor: 'operator' | 'admin', path: string[] = []): Promise<Response> {
  const writing = request.method !== 'GET';
  const allowed = actor === 'operator'
    ? (!path.length && ['GET', 'PUT'].includes(request.method)) || (path.length === 1 && path[0] === 'verify' && request.method === 'POST')
    : (!path.length && request.method === 'GET') || (path.length === 2 && /^[1-9]\d{0,18}$/.test(path[0]) && ['approve', 'disable'].includes(path[1]) && request.method === 'POST');
  if (!allowed) return fail(404, 'payment_channel.not_found');
  if (writing && !isSameOriginRequest(request)) return fail(403, 'payment_channel.forbidden');
  try {
    let body: string | undefined;
    if (request.method === 'PUT' || (actor === 'admin' && writing)) {
      if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return fail(415, 'payment_channel.validation_failed');
      let input: unknown;
      try { input = await readJson(request); } catch (error) { return fail(error instanceof RangeError ? 413 : 400, 'payment_channel.validation_failed'); }
      if (!record(input)) return fail(400, 'payment_channel.validation_failed');
      body = JSON.stringify(pick(input, actor === 'operator' ? credentialFields : ['operationId', 'expectedVersion', 'reason']));
    }
    const jar = await cookies(); let token: string | undefined;
    if (actor === 'admin') {
      token = jar.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
      const session = verifyAdminSessionFromCookies(jar);
      if (!token || !session) return fail(401, 'UNAUTHENTICATED');
      if (session.role !== 'Administrator') return fail(403, 'payment_channel.forbidden');
    } else {
      const refresh = jar.get('tripmate_refresh')?.value;
      if (!refresh) return fail(401, 'UNAUTHENTICATED');
      const refreshed = await fetchBackend('/api/v1/auth/web/refresh', { method: 'POST', headers: { Cookie: `tripmate_refresh=${encodeURIComponent(refresh)}` }, signal: request.signal });
      if (!refreshed.ok) return fail(refreshed.status >= 500 ? 503 : 401);
      const session = await refreshed.json().catch(() => null);
      if (session?.data?.role !== 'TourOperator') return fail(403, 'payment_channel.forbidden');
      token = session?.data?.accessToken;
      if (typeof token !== 'string' || !token) return fail(401, 'UNAUTHENTICATED');
    }
    const query = new URLSearchParams();
    if (actor === 'admin' && !path.length) {
      const incoming = new URL(request.url).searchParams;
      const status = incoming.get('status');
      if (status && !(CHANNEL_STATUSES as readonly string[]).includes(status)) return fail(400, 'payment_channel.validation_failed');
      if (status) query.set('status', status);
      for (const key of ['page', 'pageSize']) {
        const value = incoming.get(key);
        if (value && !/^[1-9]\d{0,5}$/.test(value)) return fail(400, 'payment_channel.validation_failed');
        if (value) query.set(key, value);
      }
    }
    const base = actor === 'operator' ? '/api/v1/operator/payment-channel' : '/api/v1/admin/operator-payment-channels';
    const suffix = path.length ? `/${path.join('/')}` : '';
    const response = await fetchBackend(`${base}${suffix}${query.size ? `?${query}` : ''}`, { method: request.method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body, signal: request.signal });
    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const code = record(data) && typeof data.errorCode === 'string' && /^payment_channel\.[a-z_]+$/.test(data.errorCode) ? data.errorCode : 'payment_channel.unavailable';
      return fail(response.status >= 500 ? 503 : response.status, code);
    }
    if (!record(data)) return fail();
    if (actor === 'admin' && !path.length) {
      if (!Array.isArray(data.items)) return fail();
      return jsonNoStore({ ...pick(data, ['totalCount', 'page', 'pageSize']), items: data.items.map((item) => pick(item, adminFields)) });
    }
    return jsonNoStore(pick(data, publicFields));
  } catch { return fail(); }
}
