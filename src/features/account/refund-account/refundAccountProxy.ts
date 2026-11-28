import 'server-only';
import { cookies } from 'next/headers';
import { isSameOriginRequest } from '@/lib/server/adminSession';
import { fetchBackend } from '@/lib/server/backend';

type BankAccount = { bankCode: string; accountNumber: string; accountHolder: string };
const PATH = '/api/v1/traveler/refund-account';
function json(body: unknown, status = 200) { return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0' } }); }
function project(value: unknown): BankAccount | null {
  if (value === null) return null;
  if (!value || typeof value !== 'object') throw new Error('Invalid account');
  const data = value as Record<string, unknown>;
  if (typeof data.bankCode !== 'string' || typeof data.accountNumber !== 'string' || typeof data.accountHolder !== 'string') throw new Error('Invalid account');
  return { bankCode: data.bankCode.trim(), accountNumber: data.accountNumber.trim(), accountHolder: data.accountHolder.trim() };
}

export async function proxyRefundAccount(request: Request): Promise<Response> {
  if (!['GET', 'PUT'].includes(request.method)) return json({ errorCode: 'METHOD_NOT_ALLOWED' }, 405);
  if (request.method === 'PUT' && !isSameOriginRequest(request)) return json({ errorCode: 'FORBIDDEN' }, 403);
  try {
    const refresh = (await cookies()).get('tripmate_refresh')?.value;
    if (!refresh) return json({ errorCode: 'UNAUTHENTICATED' }, 401);
    const auth = await fetchBackend('/api/v1/auth/web/refresh', { method: 'POST', headers: { Cookie: `tripmate_refresh=${encodeURIComponent(refresh)}` }, signal: request.signal });
    if (!auth.ok) return json({ errorCode: auth.status === 401 ? 'UNAUTHENTICATED' : 'SERVICE_UNAVAILABLE' }, auth.status === 401 ? 401 : 503);
    const authBody = await auth.json() as { data?: { role?: string; accessToken?: string } };
    if (!authBody.data?.accessToken) return json({ errorCode: 'UNAUTHENTICATED' }, 401);
    if (authBody.data.role !== 'Traveler') return json({ errorCode: 'FORBIDDEN' }, 403);
    let account: BankAccount | null = null;
    if (request.method === 'PUT') {
      try {
        const text = await request.text();
        if (text.length > 4096) return json({ errorCode: 'INVALID_REQUEST' }, 400);
        account = project(JSON.parse(text));
        if (!account || !account.bankCode || !account.accountNumber || !account.accountHolder || account.bankCode.length > 20 || account.accountNumber.length > 50 || account.accountHolder.length > 200) return json({ errorCode: 'INVALID_REQUEST' }, 400);
      } catch { return json({ errorCode: 'INVALID_REQUEST' }, 400); }
    }
    const upstream = await fetchBackend(PATH, {
      method: request.method,
      headers: { Authorization: `Bearer ${authBody.data.accessToken}`, Accept: 'application/json', ...(account ? { 'Content-Type': 'application/json' } : {}) },
      body: account ? JSON.stringify(account) : undefined, signal: request.signal,
    });
    if (!upstream.ok) return json({ errorCode: upstream.status === 400 ? 'INVALID_REQUEST' : upstream.status === 401 ? 'UNAUTHENTICATED' : upstream.status === 403 ? 'FORBIDDEN' : 'SERVICE_UNAVAILABLE' }, [400, 401, 403].includes(upstream.status) ? upstream.status : 503);
    if (upstream.status === 204) return json(account);
    return json(project(await upstream.json()));
  } catch { return json({ errorCode: 'SERVICE_UNAVAILABLE' }, 503); }
}
