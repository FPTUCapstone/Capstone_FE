import 'server-only';

import { cookies } from 'next/headers';
import { ADMIN_ACCESS_TOKEN_COOKIE, isSameOriginRequest, verifyAdminSessionFromCookies } from '@/lib/server/adminSession';
import { fetchBackend } from '@/lib/server/backend';

const PROVIDER_PATH = '/api/v1/provider/service-booking-requests';
const PROVIDER_STATEMENTS_PATH = '/api/v1/provider/commission-statements';
const STAFF_RECONCILIATION_PATH = '/api/v1/admin/commercial-settlements/reconciliation';
const SAFE_CODES = new Set(['MSG01', 'MSG05', 'MSG34', 'MSG123', 'MSG126', 'MSG127', 'MSG133', 'MSG143', 'MSG172', 'MSG202', 'MSG207', 'MSG208', 'MSG209', 'MSG210', 'auth.password_change_required', 'MSG_PHONE_DUP', 'ServiceProviderRequest.Forbidden', 'ServiceProviderRequest.NotFound', 'ServiceProviderRequest.InvalidInput', 'ServiceProviderRequest.InvalidState', 'ServiceProviderRequest.VersionConflict', 'ServiceProviderRequest.IdempotencyMismatch', 'CommissionStatement.Forbidden', 'CommissionStatement.NotFound', 'CommissionStatement.InvalidInput', 'CommissionStatement.InvalidState', 'CommissionStatement.MissingBankReference', 'CommissionStatement.AlreadyPaid', 'CommissionStatement.SystemError']);
const QUERY_KEYS = ['status', 'requestedDateFrom', 'requestedDateTo', 'keyword', 'pageNumber', 'pageSize'];
const STATEMENT_QUERY_KEYS = ['status', 'period', 'keyword', 'pageNumber', 'pageSize'];
const RECONCILIATION_QUERY_KEYS = ['providerId', 'status', 'period', 'keyword', 'pageNumber', 'pageSize'];

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
  if (!request.body) return failure(400);
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 32_768) {
        await reader.cancel();
        return failure(413);
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally { reader.releaseLock(); }
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

export async function proxyProviderAvailability(request: Request, serviceId?: string, startsAt?: string): Promise<Response> {
  const publishing = startsAt !== undefined;
  const utcTimestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
  if (serviceId !== undefined && !/^[1-9]\d{0,18}$/.test(serviceId)) return failure(400);
  if (publishing && (!serviceId || !isSameOriginRequest(request))) return failure(403);
  if (publishing && !utcTimestamp.test(startsAt)) return failure(400);
  try {
    const session = await providerServerContext();
    if (!session) return failure(401);
    if (session.role !== 'ServiceProvider' || session.mustChangePassword) return failure(403);
    const headers: Record<string, string> = { Authorization: `Bearer ${session.token}` };
    const base = '/api/v1/provider/commercial-services';
    let path = serviceId ? `${base}/${serviceId}/availability` : base;
    let body: string | undefined;
    if (publishing) {
      const input = await readBody(request);
      if (input instanceof Response) return input;
      if (!Number.isSafeInteger(input.quantity) || (input.quantity as number) < 0 || (input.quantity as number) > 2147483647) return failure(400);
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({ quantity: input.quantity });
      path += `/${encodeURIComponent(startsAt)}`;
    } else if (serviceId) {
      const incoming = new URL(request.url).searchParams;
      const query = new URLSearchParams();
      for (const key of ['from', 'to']) {
        const value = incoming.get(key);
        if (value === null) continue;
        if (!utcTimestamp.test(value)) return failure(400);
        query.set(key, value);
      }
      if (query.size) path += `?${query}`;
    }
    const response = await fetchBackend(path, { method: publishing ? 'PUT' : 'GET', headers, body, signal: request.signal });
    if (!response.ok) return failure(response.status);
    return json(await response.json(), response.status);
  } catch {
    return failure(503);
  }
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

export async function proxyProviderStatements(
  request: Request,
  id?: string,
  action?: 'report-payment'
): Promise<Response> {
  if (id !== undefined && !/^[1-9]\d{0,18}$/.test(id)) return failure(400);
  if (request.method !== (action ? 'POST' : 'GET')) return failure(405);
  if (action && !isSameOriginRequest(request)) return failure(403);

  try {
    const auth = await providerServerContext();
    if (!auth) return failure(401);
    if (auth.role !== 'ServiceProvider' || auth.mustChangePassword) return failure(403);

    const headers: Record<string, string> = { Authorization: `Bearer ${auth.token}` };
    let path = id ? `${PROVIDER_STATEMENTS_PATH}/${id}` : PROVIDER_STATEMENTS_PATH;
    let payload: string | undefined;

    if (action === 'report-payment') {
      const body = await readBody(request);
      if (body instanceof Response) return body;
      if (typeof body.bankTransferReference !== 'string' || !body.bankTransferReference.trim()) {
        return failure(400, { errorCode: 'MSG172' });
      }
      payload = JSON.stringify({ bankTransferReference: body.bankTransferReference.trim() });
      path += '/report-payment';
      headers['Content-Type'] = 'application/json';
      const key = request.headers.get('idempotency-key');
      if (key) headers['Idempotency-Key'] = key;
    } else if (!id) {
      const incoming = new URL(request.url).searchParams;
      const query = new URLSearchParams();
      for (const name of STATEMENT_QUERY_KEYS) {
        const value = incoming.get(name);
        if (value) query.set(name, value);
      }
      if (query.size) path += `?${query}`;
    }

    const response = await fetchBackend(path, {
      method: request.method,
      headers,
      body: payload,
      signal: request.signal,
    });
    const result: unknown = await response.json().catch(() => null);
    if (!response.ok) return failure(response.status, result);
    return result && typeof result === 'object'
      ? json({ success: true, data: 'data' in result ? result.data : result }, response.status)
      : failure(502);
  } catch {
    return failure(503);
  }
}

export async function proxyStaffReconciliation(
  request: Request,
  id?: string,
  action?: 'reconcile' | 'generate' | 'process-overdue'
): Promise<Response> {
  if (id !== undefined && !/^[1-9]\d{0,18}$/.test(id)) return failure(400);
  if (request.method !== (action ? 'POST' : 'GET')) return failure(405);
  if (action && !isSameOriginRequest(request)) return failure(403);

  try {
    const store = await cookies();
    const session = verifyAdminSessionFromCookies(store);
    if (!session) return failure(401);
    if ((session.role !== 'Staff' && session.role !== 'Administrator') || session.mustChangePassword) {
      return failure(403);
    }
    const token = store.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
    if (!token) return failure(401);

    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    let path = id ? `${STAFF_RECONCILIATION_PATH}/${id}` : STAFF_RECONCILIATION_PATH;
    let payload: string | undefined;

    if (action === 'reconcile') {
      const body = await readBody(request);
      if (body instanceof Response) return body;
      path += '/reconcile';
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify({
        notes: typeof body.notes === 'string' ? body.notes.trim() : null,
      });
    } else if (action === 'generate') {
      path += '/generate';
      if (request.headers.get('content-type')?.includes('application/json')) {
        const body = await readBody(request);
        if (!(body instanceof Response)) {
          headers['Content-Type'] = 'application/json';
          payload = JSON.stringify(body);
        }
      }
    } else if (action === 'process-overdue') {
      path += '/process-overdue';
    } else if (!id) {
      const incoming = new URL(request.url).searchParams;
      const query = new URLSearchParams();
      for (const name of RECONCILIATION_QUERY_KEYS) {
        const value = incoming.get(name);
        if (value) query.set(name, value);
      }
      if (query.size) path += `?${query}`;
    }

    const response = await fetchBackend(path, {
      method: request.method,
      headers,
      body: payload,
      signal: request.signal,
    });
    const result: unknown = await response.json().catch(() => null);
    if (!response.ok) return failure(response.status, result);
    return result && typeof result === 'object'
      ? json({ success: true, data: 'data' in result ? result.data : result }, response.status)
      : failure(502);
  } catch {
    return failure(503);
  }
}
