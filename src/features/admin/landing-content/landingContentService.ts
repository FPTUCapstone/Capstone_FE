import {
  isLandingContent,
  isLandingContentState,
  isTourOptionList,
  isVersionSummary,
  type ContentErrors,
  type ImageRef,
  type LandingContent,
  type LandingContentState,
  type TourOption,
} from './landingContent';

/** `status` 0 means the request failed or the response body was not what the contract promises. */
export class LandingContentError extends Error {
  constructor(
    public readonly status: number,
    public readonly errorCode?: string,
    public readonly fieldErrors?: ContentErrors,
  ) {
    super(`Landing content request failed (${status}).`);
    this.name = 'LandingContentError';
  }
}

// Same-origin server proxy. The access token stays in the HttpOnly admin
// session cookie; the browser sends credentials and never handles a token.
const PROXY_ROUTE = '/api/admin/landing-content';

export interface DraftState {
  baseVersion: number;
  content: LandingContent;
}

type Guard<T> = (value: unknown) => value is T;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isImageRef(value: unknown): value is ImageRef {
  return isRecord(value) && typeof value.mediaId === 'string' && typeof value.url === 'string';
}

function isDraftState(value: unknown): value is DraftState {
  return isRecord(value) && typeof value.baseVersion === 'number' && isLandingContent(value.content);
}

function isPublished(value: unknown): value is LandingContentState['published'] {
  return isVersionSummary(value) && isLandingContent((value as unknown as Record<string, unknown>).content);
}

function readFieldErrors(body: unknown): ContentErrors | undefined {
  if (!isRecord(body) || !isRecord(body.errors)) return undefined;
  const entries = Object.entries(body.errors).filter(
    (entry): entry is [string, ContentErrors[string]] => typeof entry[1] === 'string',
  );
  return entries.length > 0 ? (Object.fromEntries(entries) as ContentErrors) : undefined;
}

async function request<T>(
  method: 'GET' | 'PUT' | 'POST',
  path: string,
  guard: Guard<T>,
  body?: unknown,
): Promise<T> {
  const isForm = body instanceof FormData;
  let response: Response;
  try {
    response = await fetch(`${PROXY_ROUTE}${path}`, {
      method,
      cache: 'no-store',
      credentials: 'same-origin',
      headers: body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : undefined,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new LandingContentError(0);
  }
  const parsed: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const errorCode = isRecord(parsed) && typeof parsed.errorCode === 'string' ? parsed.errorCode : undefined;
    throw new LandingContentError(response.status, errorCode, readFieldErrors(parsed));
  }
  if (!guard(parsed)) throw new LandingContentError(0);
  return parsed;
}

export function getLandingContent() {
  return request('GET', '', isLandingContentState);
}

export function saveDraft(baseVersion: number, content: LandingContent) {
  return request('PUT', '/draft', isDraftState, { baseVersion, content });
}

export function publishDraft(baseVersion: number) {
  return request('POST', '/publish', isPublished, { baseVersion });
}

export function restoreVersion(versionId: string) {
  return request('POST', '/restore', isDraftState, { versionId });
}

export function uploadImage(file: File) {
  const form = new FormData();
  form.append('file', file);
  return request('POST', '/media', isImageRef, form);
}

export function getApprovedTours(): Promise<TourOption[]> {
  return request('GET', '/approved-tours', isTourOptionList);
}
