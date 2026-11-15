import 'server-only';

import { cookies } from 'next/headers';
import { ADMIN_ACCESS_TOKEN_COOKIE, isSameOriginRequest, verifyAdminSessionFromCookies } from '@/lib/server/adminSession';
import { fetchBackend } from '@/lib/server/backend';

const PROVIDER_PATH = '/api/v1/provider/service-booking-requests';
const SAFE_CODES = new Set(['MSG01', 'MSG05', 'MSG34', 'MSG123', 'MSG126', 'MSG127', 'MSG133', 'MSG143', 'MSG202', 'auth.password_change_required', 'MSG_PHONE_DUP', 'ServiceProviderRequest.Forbidden', 'ServiceProviderRequest.NotFound', 'ServiceProviderRequest.InvalidInput', 'ServiceProviderRequest.InvalidState', 'ServiceProviderRequest.VersionConflict', 'ServiceProviderRequest.IdempotencyMismatch']);
const QUERY_KEYS = ['status', 'requestedDateFrom', 'requestedDateTo', 'keyword', 'pageNumber', 'pageSize'];

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function failure(status: number, body?: unknown): Response {
  const source = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const code = typeof source.errorCode === 'string' && SAFE_CODES.has(source.errorCode) ? source.errorCode : 'MSG127';
  return json({ errorCode: status === 401 || status === 403 ? 'MSG126' : code }, status);
}

export async function providerServerContext() {
  const refresh = (await cookies()).get('tripmate_refresh')?.value;
  if (!refresh) return null;
  const response = await fetchBackend('/api/v1/auth/web/refresh', {
    method: 'POST', headers: { Cookie: `tripmate_refresh=${encodeURIComponent(refresh)}` },
  });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error('PROVIDER_SESSION_UNAVAILABLE');
  const envelope = await response.json().catch(() => null);
  const data = envelope?.data;
  if (envelope?.success !== true || !data || (data.mustChangePassword !== undefined && typeof data.mustChangePassword !== 'boolean') || data.status !== 'Active' || typeof data.accessToken !== 'string' || !data.accessToken) {
    throw new Error('PROVIDER_SESSION_UNAVAILABLE');
  }
  return { role: data.role as string, mustChangePassword: data.mustChangePassword === true, token: data.accessToken as string };
}

async function readBody(request: Request): Promise<Record<string, unknown> | Response> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return failure(415);
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > 32_768) return failure(413);
  try {
    const value: unknown = JSON.parse(text);
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : failure(400);
  } catch { return failure(400); }
}

function validateMutation(body: Record<string, unknown>, operation: 'decision' | 'outcome'): boolean {
  if (typeof body.rowVersion !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(body.rowVersion)) return false;
  if (operation === 'decision') {
    return body.decision === 'Confirmed' || (body.decision === 'Rejected' && typeof body.reason === 'string' && !!body.reason.trim());
  }
  return body.outcome === 'NoShow' || (body.outcome === 'Completed' && typeof body.actualAmount === 'number' && Number.isFinite(body.actualAmount) && body.actualAmount > 0);
}

export async function proxyProviderWorkflow(request: Request, id?: string, operation?: 'decision' | 'outcome'): Promise<Response> {
  if (id !== undefined && !/^[1-9]\d{0,18}$/.test(id)) return failure(400);
  if (request.method !== (operation ? 'POST' : 'GET')) return failure(405);
  if (operation && !isSameOriginRequest(request)) return failure(403);
  const key = request.headers.get('idempotency-key');
  if (operation && (!key || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key))) return failure(400);
  try {
    const auth = await providerServerContext();
    if (!auth) return failure(401);
    if (auth.role !== 'ServiceProvider' || auth.mustChangePassword) return failure(403);
    const headers: Record<string, string> = { Authorization: `Bearer ${auth.token}` };
    let path = id ? `${PROVIDER_PATH}/${id}` : PROVIDER_PATH;
    let payload: string | undefined;
    if (operation) {
      const body = await readBody(request);
      if (body instanceof Response) return body;
      if (!validateMutation(body, operation)) return failure(400, { errorCode: operation === 'decision' ? 'MSG123' : 'MSG143' });
      const dto = operation === 'decision'
        ? { decision: body.decision, rowVersion: body.rowVersion, ...(body.decision === 'Rejected' ? { reason: (body.reason as string).trim() } : {}) }
        : { outcome: body.outcome, rowVersion: body.rowVersion, ...(body.outcome === 'Completed' ? { actualAmount: body.actualAmount } : {}) };
      payload = JSON.stringify(dto);
      path += `/${operation}`;
      headers['Content-Type'] = 'application/json';
      headers['Idempotency-Key'] = key!;
    } else if (!id) {
      const incoming = new URL(request.url).searchParams;
      const query = new URLSearchParams();
      for (const name of QUERY_KEYS) {
        const value = incoming.get(name);
        if (value) query.set(name, value);
      }
      if (query.size) path += `?${query}`;
    }
    const response = await fetchBackend(path, { method: request.method, headers, body: payload, signal: request.signal });
    const result: unknown = await response.json().catch(() => null);
    if (!response.ok) return failure(response.status, result);
    return result && typeof result === 'object' ? json({ success: true, data: 'data' in result ? result.data : result }, response.status) : failure(502);
  } catch { return failure(503); }
}

export async function proxyProvisionAccount(request: Request, kind: 'staff' | 'provider' | 'pois'): Promise<Response> {
  if (request.method !== (kind === 'pois' ? 'GET' : 'POST')) return failure(405);
  if (kind !== 'pois' && !isSameOriginRequest(request)) return failure(403);
  try {
    const store = await cookies();
    const session = verifyAdminSessionFromCookies(store);
    if (!session) return failure(401);
    if (session.role !== (kind === 'staff' ? 'Administrator' : 'Staff') || session.mustChangePassword) return failure(403);
    const token = store.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
    if (!token) return failure(401);
    let payload: string | undefined;
    if (kind !== 'pois') {
      const body = await readBody(request);
      if (body instanceof Response) return body;
      const { fullName, email, phoneNumber, businessName, category, linkedPoiIds } = body;
      if (![fullName, email, phoneNumber].every(value => typeof value === 'string' && !!value.trim())) return failure(400, { errorCode: 'MSG01' });
      if (!/^\S+@\S+\.\S+$/.test(email as string)) return failure(400, { errorCode: 'MSG143' });
      if (kind === 'provider' && (typeof businessName !== 'string' || !businessName.trim() || !['Hotel', 'VehicleRental', 'Restaurant'].includes(category as string) || !Array.isArray(linkedPoiIds) || !linkedPoiIds.length || !linkedPoiIds.every(id => Number.isSafeInteger(id) && id > 0))) return failure(400, { errorCode: 'MSG34' });
      payload = JSON.stringify({ fullName, email, phoneNumber, ...(kind === 'provider' ? { businessName, category: category === 'VehicleRental' ? 'Vehicle Rental' : category, linkedPoiIds } : {}) });
    }
    const path = kind === 'staff' ? '/api/v1/admin/staff-accounts' : `/api/v1/admin/service-provider-accounts${kind === 'pois' ? '/available-pois' : ''}`;
    const response = await fetchBackend(path, {
      method: request.method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: payload, signal: request.signal,
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) return failure(response.status, result);
    if (!result || typeof result !== 'object') return failure(502);
    if (kind === 'pois') return json({ success: true, data: result.data ?? result }, response.status);
    // Explicit projection ensures provisioning credentials never reach the browser.
    const data = result.data ?? result;
    return json({ success: true, data: {
      userId: data.userId, email: data.email, fullName: data.fullName, role: data.role,
      status: data.status, mustChangePassword: data.mustChangePassword, phoneNumber: data.phoneNumber,
      serviceProviderId: data.serviceProviderId, linkedPoiIds: data.linkedPoiIds, emailDeliveryStatus: data.emailDeliveryStatus,
    } }, response.status);
  } catch { return failure(503); }
}
