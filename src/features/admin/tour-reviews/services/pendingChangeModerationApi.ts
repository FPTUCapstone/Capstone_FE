import type { ApiPendingChange, ApiTourDetail } from '@/features/operator/tours/services/operatorTourApi';

import { ModerationApiError } from './tourModerationApi';

const POSITIVE_INTEGER = /^[1-9]\d*$/;
const SAFE_ERROR_CODE = /^[a-z0-9._-]{1,100}$/i;

export type ModerationQueueKind = 'NewSubmission' | 'DraftVersion';

/** One row of `GET /api/admin/tours/moderation-queue` (TM-82 §5.6) — deliberately minimal. */
export interface ModerationQueueItem {
  readonly id: number;
  readonly tourId: number;
  readonly kind: ModerationQueueKind;
  readonly operatorUserId: number;
  readonly title: string;
  readonly status: string;
  readonly submittedAtUtc: string | null;
}

export interface ModerationQueuePage {
  readonly items: readonly ModerationQueueItem[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
}

export interface DraftVersionDecisionResult {
  readonly id: number;
  readonly tourId: number;
  readonly status: string;
  readonly tourStatus: string;
  readonly message: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requirePositiveIntegerId(id: string, label: string): string {
  if (!POSITIVE_INTEGER.test(id)) throw new ModerationApiError(400, `A valid ${label} ID is required.`);
  return id;
}

async function requestJson(url: string, init: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      credentials: 'same-origin',
      headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ModerationApiError(0);
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const problem = isRecord(body) ? body : {};
    const title = typeof problem.title === 'string' && problem.title.length <= 500 ? problem.title : undefined;
    const errorCode =
      typeof problem.errorCode === 'string' && SAFE_ERROR_CODE.test(problem.errorCode) ? problem.errorCode : undefined;
    throw new ModerationApiError(response.status, title, errorCode);
  }
  return body;
}

function text(value: unknown): string {
  if (typeof value !== 'string') throw new ModerationApiError(0, 'The tour moderation service returned an unexpected response.');
  return value;
}

function textOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return text(value);
}

function num(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ModerationApiError(0, 'The tour moderation service returned an unexpected response.');
  }
  return value;
}

function isModerationQueueKind(value: unknown): value is ModerationQueueKind {
  return value === 'NewSubmission' || value === 'DraftVersion';
}

function parseQueueItem(raw: unknown): ModerationQueueItem {
  if (!isRecord(raw)) throw new ModerationApiError(0, 'The tour moderation service returned an unexpected response.');
  const kind = raw.kind;
  if (!isModerationQueueKind(kind)) throw new ModerationApiError(0, 'The tour moderation service returned an unexpected response.');
  return {
    id: num(raw.id),
    tourId: num(raw.tourId),
    kind,
    operatorUserId: num(raw.operatorUserId),
    title: text(raw.title),
    status: text(raw.status),
    submittedAtUtc: textOrNull(raw.submittedAtUtc),
  };
}

function parseModerationQueuePage(payload: unknown): ModerationQueuePage {
  if (!isRecord(payload)) throw new ModerationApiError(0, 'The tour moderation service returned an unexpected response.');
  const items = payload.items;
  if (!Array.isArray(items)) throw new ModerationApiError(0, 'The tour moderation service returned an unexpected response.');
  return {
    items: items.map(parseQueueItem),
    page: num(payload.page),
    pageSize: num(payload.pageSize),
    totalCount: num(payload.totalCount),
  };
}

function parseDecisionResult(payload: unknown): DraftVersionDecisionResult {
  if (!isRecord(payload)) throw new ModerationApiError(0, 'The tour moderation service returned an unexpected response.');
  return {
    id: num(payload.id),
    tourId: num(payload.tourId),
    status: text(payload.status),
    tourStatus: text(payload.tourStatus),
    message: text(payload.message),
  };
}

/** TM-82 §5.6: the combined queue (first-time submissions + draft versions), additive to `fetchPendingTourPage`. */
export async function fetchModerationQueue(page: number, signal?: AbortSignal): Promise<ModerationQueuePage> {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return parseModerationQueuePage(
    await requestJson(`/api/admin/tours/moderation-queue${qs ? `?${qs}` : ''}`, { method: 'GET', signal }),
  );
}

/** Staff's view of a draft version's proposed values — reuses the Operator's own `ApiPendingChange` shape. */
export async function fetchPendingChangeDetail(pendingChangeId: string, signal?: AbortSignal): Promise<ApiPendingChange> {
  const id = requirePositiveIntegerId(pendingChangeId, 'pending-change');
  return (await requestJson(`/api/admin/tours/pending-changes/${id}`, { method: 'GET', signal })) as ApiPendingChange;
}

/** The live tour's current values, fetched alongside the draft's proposed ones for the diff view. */
export async function fetchLiveTourForDiff(tourId: string, signal?: AbortSignal): Promise<ApiTourDetail> {
  const id = requirePositiveIntegerId(tourId, 'tour');
  return (await requestJson(`/api/admin/tours/${id}`, { method: 'GET', signal })) as ApiTourDetail;
}

/** No body — unlike first-time-submission approval, a draft-version decision takes no checklist. */
export async function approveDraftVersion(pendingChangeId: string, signal?: AbortSignal): Promise<DraftVersionDecisionResult> {
  const id = requirePositiveIntegerId(pendingChangeId, 'pending-change');
  return parseDecisionResult(
    await requestJson(`/api/admin/tours/pending-changes/${id}/approve`, { method: 'POST', signal }),
  );
}

export async function rejectDraftVersion(
  pendingChangeId: string,
  reason: string,
  signal?: AbortSignal,
): Promise<DraftVersionDecisionResult> {
  const id = requirePositiveIntegerId(pendingChangeId, 'pending-change');
  return parseDecisionResult(
    await requestJson(`/api/admin/tours/pending-changes/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason.trim() }),
      signal,
    }),
  );
}
