import { parseAmendPostTripComplaintEvidenceResponse, parseMyPostTripComplaints, parsePostTripComplaintContext, parseSubmitPostTripComplaintResponse } from './postTripComplaintResponse';
import type { AmendPostTripComplaintEvidenceResponse, MyPostTripComplaint, PostTripComplaintContext, SubmitPostTripComplaintInput, SubmitPostTripComplaintResponse } from '../types/postTripComplaint';
import { PostTripComplaintApiError } from '../types/postTripComplaint';

function contextPath(bookingId: string): string { return `/api/v1/traveler/bookings/${encodeURIComponent(bookingId)}/post-trip-complaint`; }
function submitPath(bookingId: string): string { return `/api/v1/traveler/bookings/${encodeURIComponent(bookingId)}/post-trip-complaints`; }
function amendEvidencePath(bookingId: string): string { return `/api/v1/traveler/bookings/${encodeURIComponent(bookingId)}/post-trip-complaint/evidence`; }
const myComplaintsPath = '/api/v1/traveler/post-trip-complaints';
async function error(response: Response): Promise<never> {
  const body: unknown = await response.json().catch(() => null);
  const code = body && typeof body === 'object' && 'errorCode' in body && typeof body.errorCode === 'string' ? body.errorCode : 'complaint.storage_unavailable';
  throw new PostTripComplaintApiError(response.status, code);
}

export async function getPostTripComplaintContext(bookingId: string, signal?: AbortSignal): Promise<PostTripComplaintContext> {
  let response: Response;
  try { response = await fetch(contextPath(bookingId), { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' }, signal }); }
  catch (cause) { if (cause instanceof DOMException && cause.name === 'AbortError') throw cause; throw new PostTripComplaintApiError(503, 'complaint.storage_unavailable'); }
  if (!response.ok) return error(response);
  try { return parsePostTripComplaintContext(await response.json()); } catch { throw new PostTripComplaintApiError(502, 'complaint.invalid_response'); }
}

export async function submitPostTripComplaint(bookingId: string, input: SubmitPostTripComplaintInput, idempotencyKey: string, signal?: AbortSignal): Promise<SubmitPostTripComplaintResponse> {
  const form = new FormData(); form.set('reasonCategory', input.reasonCategory); form.set('reasonDetail', input.reasonDetail);
  for (const file of input.evidence) form.append('evidence', file, file.name);
  let response: Response;
  try { response = await fetch(submitPath(bookingId), { method: 'POST', credentials: 'same-origin', headers: { 'Idempotency-Key': idempotencyKey }, body: form, signal }); }
  catch (cause) { if (cause instanceof DOMException && cause.name === 'AbortError') throw cause; throw new PostTripComplaintApiError(503, 'complaint.storage_unavailable'); }
  if (!response.ok) return error(response);
  try { return parseSubmitPostTripComplaintResponse(await response.json()); } catch { throw new PostTripComplaintApiError(502, 'complaint.invalid_response'); }
}

export async function amendPostTripComplaintEvidence(bookingId: string, evidence: readonly File[], idempotencyKey: string, signal?: AbortSignal): Promise<AmendPostTripComplaintEvidenceResponse> {
  const form = new FormData();
  for (const file of evidence) form.append('evidence', file, file.name);
  let response: Response;
  try { response = await fetch(amendEvidencePath(bookingId), { method: 'POST', credentials: 'same-origin', headers: { 'Idempotency-Key': idempotencyKey }, body: form, signal }); }
  catch (cause) { if (cause instanceof DOMException && cause.name === 'AbortError') throw cause; throw new PostTripComplaintApiError(503, 'complaint.storage_unavailable'); }
  if (!response.ok) return error(response);
  try { return parseAmendPostTripComplaintEvidenceResponse(await response.json()); } catch { throw new PostTripComplaintApiError(502, 'complaint.invalid_response'); }
}

export async function getMyPostTripComplaints(signal?: AbortSignal): Promise<readonly MyPostTripComplaint[]> {
  let response: Response;
  try { response = await fetch(myComplaintsPath, { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' }, signal }); }
  catch (cause) { if (cause instanceof DOMException && cause.name === 'AbortError') throw cause; throw new PostTripComplaintApiError(503, 'complaint.storage_unavailable'); }
  if (!response.ok) return error(response);
  try { return parseMyPostTripComplaints(await response.json()); } catch { throw new PostTripComplaintApiError(502, 'complaint.invalid_response'); }
}
