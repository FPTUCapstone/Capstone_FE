import 'server-only';
import { cookies } from 'next/headers';
import { ADMIN_ACCESS_TOKEN_COOKIE, clearAdminSession, isSameOriginRequest, jsonNoStore, verifyAdminSessionFromCookies } from '@/lib/server/adminSession';
import { fetchBackend } from '@/lib/server/backend';

const validId = (id: string) => /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id));
const unavailable = () => jsonNoStore({ title: 'Chưa thể tải dữ liệu khiếu nại. Vui lòng thử lại.' }, 503);

/** Staff authority is independent of Administrator authority. Never expose private storage URLs. */
export async function proxyStaffComplaints(request: Request, id?: string, action?: 'decisions' | 'evidence', evidenceId?: string): Promise<Response> {
  if ((id && !validId(id)) || (evidenceId && !validId(evidenceId))) return jsonNoStore({ title: 'Invalid ID.' }, 400);
  if (request.method === 'POST' && !isSameOriginRequest(request)) return jsonNoStore({ title: 'Request origin is not allowed.' }, 403);
  const store = await cookies();
  const token = store.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  const session = token ? verifyAdminSessionFromCookies(store) : null;
  if (!session) return clearAdminSession(jsonNoStore({ title: 'Staff sign-in required.' }, 401));
  if (session.role !== 'Staff') return jsonNoStore({ title: 'Staff access required.' }, 403);

  let body: string | undefined;
  if (request.method === 'POST') {
    const value: unknown = await request.json().catch(() => null);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return jsonNoStore({ title: 'Invalid decision.' }, 400);
    const rec = value as Record<string, unknown>;
    const { action: decision, amount, targetParty, expectedVersion, operationId } = rec;
    const reason = typeof rec.reason === 'string' ? rec.reason.trim() : '';
    const contractBasis = typeof rec.contractBasis === 'string' ? rec.contractBasis.trim() : '';
    if (!['RequestEvidence', 'Reject', 'RefundFull', 'RefundPartial'].includes(String(decision)) ||
      !reason || reason.length > 1000 || !contractBasis || contractBasis.length > 1000 ||
      typeof expectedVersion !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(expectedVersion) || expectedVersion.length > 128 ||
      typeof operationId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(operationId) ||
      (decision === 'RefundPartial' && (typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount <= 0)) ||
      (decision === 'RequestEvidence' && !['Traveler', 'Operator'].includes(String(targetParty))))
      return jsonNoStore({ title: 'Vui lòng kiểm tra quyết định, lý do và căn cứ hợp đồng.' }, 400);
    body = JSON.stringify({ action: decision, reason, contractBasis, expectedVersion, operationId,
      ...(decision === 'RefundPartial' ? { amount } : {}), ...(decision === 'RequestEvidence' ? { targetParty } : {}) });
  }
  const query = new URLSearchParams();
  if (!id) {
    const incoming = new URL(request.url).searchParams;
    for (const key of ['page', 'pageSize', 'status']) { const value = incoming.get(key); if (value) query.set(key, value); }
  }
  const path = `/api/v1/staff/post-trip-complaints${id ? `/${id}` : ''}${action ? `/${action}` : ''}${evidenceId ? `/${evidenceId}` : ''}${query.size ? `?${query}` : ''}`;
  try {
    const upstream = await fetchBackend(path, { method: request.method, headers: {
      Authorization: `Bearer ${token}`, Accept: action === 'evidence' ? 'application/pdf,image/png,image/jpeg' : 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    }, body, signal: request.signal });
    if (upstream.status === 401) return clearAdminSession(jsonNoStore({ title: 'Staff sign-in required.' }, 401));
    if (!upstream.ok) {
      if (upstream.status >= 500) return unavailable();
      const titles: Record<number, string> = { 403: 'Staff access required.', 404: 'Không tìm thấy hồ sơ hoặc bằng chứng.', 409: 'Hồ sơ đã thay đổi. Hãy tải lại trước khi xử lý.', 400: 'Quyết định chưa hợp lệ. Hãy kiểm tra thông tin và tải lại hồ sơ.' };
      return jsonNoStore({ title: titles[upstream.status] ?? 'Chưa thể thực hiện yêu cầu.' }, upstream.status);
    }
    if (action === 'evidence') {
      const contentType = upstream.headers.get('Content-Type')?.split(';')[0].toLowerCase();
      if (!contentType || !['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(contentType)) return unavailable();
      const bytes = await upstream.arrayBuffer();
      if (!bytes.byteLength || bytes.byteLength > 10 * 1024 * 1024) return unavailable();
      return new Response(bytes, { headers: { 'Content-Type': contentType, 'Content-Disposition': 'inline',
        'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "sandbox; default-src 'none'" } });
    }
    return jsonNoStore(await upstream.json());
  } catch { return unavailable(); }
}

