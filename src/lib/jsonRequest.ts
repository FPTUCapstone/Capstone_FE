/**
 * One JSON request to the TripMate API from the browser: bearer token, cookies, abort support and a body
 * that is parsed null-safely (non-JSON or JSON `null` both come back as `null`). Callers map the status
 * to their own typed error.
 */

import { isRecord } from './typeGuards';

export interface JsonResponse {
  status: number;
  body: unknown;
}

export interface JsonRequestOptions {
  method?: 'GET' | 'POST' | 'PUT';
  accessToken?: string | null;
  signal?: AbortSignal;
  /** Serialized as JSON when present. */
  jsonBody?: unknown;
  headers?: Record<string, string>;
  /** Error to throw when the server cannot be reached (an aborted request is rethrown as is). */
  networkError: () => Error;
}

export async function requestJson(url: string, options: JsonRequestOptions): Promise<JsonResponse> {
  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
  if (options.jsonBody !== undefined) headers['Content-Type'] = 'application/json';
  if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      credentials: 'include',
      signal: options.signal,
      headers,
      body: options.jsonBody === undefined ? undefined : JSON.stringify(options.jsonBody),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw options.networkError();
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { status: response.status, body };
}

/** The body as an object to read problem-details fields from; `{}` for null or non-object bodies. */
export function bodyRecord(body: unknown): Record<string, unknown> {
  return isRecord(body) ? body : {};
}

/** Message for an HTTP status from a per-status table, with a fallback. */
export function messageForStatus(
  status: number,
  messages: Partial<Record<number, string>>,
  fallback: string,
): string {
  return messages[status] ?? fallback;
}
