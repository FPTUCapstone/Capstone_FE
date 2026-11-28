import 'server-only';
import { cookies } from 'next/headers';
import { isSameOriginRequest } from '@/lib/server/adminSession';
import { fetchBackend } from '@/lib/server/backend';

type Party = 'Traveler' | 'Operator';
type Operation = 'staff-review' | 'staff-evidence' | 'reconsideration' | 'evidence';
const noStore = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
const fail = (status: number) => Response.json({ errorCode: status === 409 ? 'complaint.review_changed' : 'complaint.review_unavailable' }, { status, headers: noStore });
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const unwrap = (value: unknown) => record(value) && 'data' in value ? value.data : value;
const pick = (value: Record<string, unknown>, keys: string[]) => Object.fromEntries(keys.filter((key) => key in value).map((key) => [key, value[key]]));

export async function proxyPartyStaffReview(request: Request, party: Party, id: string, operation: Operation, evidenceId?: string): Promise<Response> {
  if (!/^[1-9]\d*$/.test(id) || (operation === 'evidence' && !/^[1-9]\d*$/.test(evidenceId ?? ''))) return fail(404);
  const mutating = operation === 'staff-evidence' || operation === 'reconsideration';
  if (mutating && !isSameOriginRequest(request)) return fail(403);
  const refresh = (await cookies()).get('tripmate_refresh')?.value;
  if (!refresh) return fail(401);
  try {
    const auth = await fetchBackend('/api/v1/auth/web/refresh', { method: 'POST', headers: { Cookie: `tripmate_refresh=${encodeURIComponent(refresh)}` }, signal: request.signal });
    const session = unwrap(await auth.json().catch(() => null));
    if (!auth.ok || !record(session) || typeof session.accessToken !== 'string') return fail(401);
    if (session.role !== (party === 'Traveler' ? 'Traveler' : 'TourOperator')) return fail(403);
    const prefix = party === 'Traveler' ? `/api/v1/traveler/complaints/${id}` : `/api/v1/operator/post-trip-complaints/${id}`;
    let body: FormData | undefined;
    if (mutating) {
      const length = request.headers.get('content-length');
      if (length && (!/^\d+$/.test(length) || Number(length) > 16 * 1024 * 1024)) return fail(413);
      const form = await request.formData().catch(() => null);
      if (!form || Array.from(form.keys()).some((key) => !['operationId', 'requestEventId', 'reason', 'files'].includes(key))) return fail(400);
      const key = form.get('operationId'); const reason = form.get('reason'); const files = form.getAll('files'); const eventId = form.get('requestEventId');
      if (typeof key !== 'string' || !/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(key) || typeof reason !== 'string' || !reason.trim() || reason.length > 1000 || (operation === 'staff-evidence' && (typeof eventId !== 'string' || !/^[1-9]\d*$/.test(eventId)))) return fail(400);
      if (files.length < 1 || files.length > 3 || files.some((file) => typeof file === 'string' || file.size <= 0 || file.size > 5 * 1024 * 1024 || !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type))) return fail(400);
      body = new FormData(); body.set('operationId', key); body.set('reason', reason.trim());
      if (operation === 'staff-evidence') body.set('requestEventId', String(eventId));
      for (const file of files as File[]) body.append('files', file, file.name.replace(/[\r\n"\\]/g, '_').slice(0, 255));
    }
    const suffix = operation === 'evidence' ? `staff-review/evidence/${evidenceId}` : operation;
    const upstream = await fetchBackend(`${prefix}/${suffix}`, { method: mutating ? 'POST' : 'GET', headers: { Authorization: `Bearer ${session.accessToken}` }, body, signal: request.signal });
    if (!upstream.ok) return fail([400, 401, 403, 404, 409, 413, 429].includes(upstream.status) ? upstream.status : 503);
    if (operation === 'evidence') {
      const type = upstream.headers.get('content-type')?.split(';')[0] ?? '';
      if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(type)) return fail(503);
      const bytes = await upstream.arrayBuffer();
      if (!bytes.byteLength || bytes.byteLength > 10 * 1024 * 1024) return fail(503);
      return new Response(bytes, { headers: { ...noStore, 'Content-Type': type, 'Content-Disposition': `inline; filename="evidence-${evidenceId}.${type === 'application/pdf' ? 'pdf' : type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg'}"`, 'Content-Security-Policy': "sandbox; default-src 'none'" } });
    }
    const value = unwrap(await upstream.json().catch(() => null));
    if (!record(value) || value.complaintId !== Number(id) || typeof value.status !== 'string' || !Array.isArray(value.reviewHistory) || !Array.isArray(value.allowedActions)) return fail(503);
    return Response.json({
      ...pick(value, ['complaintId', 'status']),
      isClosed: value.isClosed === true,
      allowedActions: value.allowedActions.filter((action) => ['SubmitEvidence', 'RequestReconsideration'].includes(String(action))),
      reviewHistory: value.reviewHistory.filter(record).map((event) => pick(event, ['id', 'action', 'reason', 'contractBasis', 'amount', 'targetParty', 'createdAtUtc', 'dueAtUtc', 'requestEventId'])),
      evidence: Array.isArray(value.evidence) ? value.evidence.filter(record).map((file) => pick(file, ['id', 'fileName', 'contentType', 'byteLength', 'uploadedAtUtc'])) : [],
    }, { headers: noStore });
  } catch { return fail(503); }
}
