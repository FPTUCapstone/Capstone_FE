import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  approveDraftVersion,
  fetchLiveTourForDiff,
  fetchModerationQueue,
  fetchPendingChangeDetail,
  rejectDraftVersion,
} from './pendingChangeModerationApi';
import { ModerationApiError } from './tourModerationApi';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const queueItem = {
  id: 55,
  tourId: 42,
  kind: 'DraftVersion',
  operatorUserId: 101,
  title: 'Tour Bà Nà (bản nháp)',
  status: 'PendingReview',
  submittedAtUtc: '2026-11-20T01:00:00+00:00',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchModerationQueue', () => {
  it('parses a combined queue page with both kinds', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        items: [queueItem, { ...queueItem, id: 12, tourId: 12, kind: 'NewSubmission' }],
        page: 1,
        pageSize: 20,
        totalCount: 2,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchModerationQueue(1);

    expect(result.items).toHaveLength(2);
    expect(result.items[0].kind).toBe('DraftVersion');
    expect(result.items[1].kind).toBe('NewSubmission');
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/tours/moderation-queue', expect.objectContaining({ method: 'GET' }));
  });

  it('includes page in the query string only when above 1', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], page: 2, pageSize: 20, totalCount: 0 }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchModerationQueue(2);

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/tours/moderation-queue?page=2', expect.anything());
  });

  it('rejects an unrecognized kind as an invalid response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ items: [{ ...queueItem, kind: 'SomethingElse' }], page: 1, pageSize: 20, totalCount: 1 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchModerationQueue(1)).rejects.toBeInstanceOf(ModerationApiError);
  });

  it('surfaces a 403 as ModerationApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ title: 'Staff access is required.' }, 403)));
    await expect(fetchModerationQueue(1)).rejects.toMatchObject({ status: 403 });
  });
});

describe('fetchPendingChangeDetail / fetchLiveTourForDiff', () => {
  it('fetchPendingChangeDetail returns the parsed ApiPendingChange shape as-is', async () => {
    const detail = { id: 55, tourId: 42, status: 'PendingReview', title: 'x' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(detail)));

    const result = await fetchPendingChangeDetail('55');

    expect(result).toEqual(detail);
  });

  it('fetchPendingChangeDetail rejects a non-numeric id before any request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchPendingChangeDetail('abc')).rejects.toMatchObject({ status: 400 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetchLiveTourForDiff calls the plain tour detail route', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 42 }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchLiveTourForDiff('42');

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/tours/42', expect.objectContaining({ method: 'GET' }));
  });
});

describe('approveDraftVersion / rejectDraftVersion', () => {
  it('approveDraftVersion POSTs with no body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ id: 55, tourId: 42, status: 'Applied', tourStatus: 'Approved', message: 'MSG144' }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await approveDraftVersion('55');

    expect(result.message).toBe('MSG144');
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.body).toBeUndefined();
  });

  it('rejectDraftVersion POSTs a trimmed reason', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ id: 55, tourId: 42, status: 'Rejected', tourStatus: 'Approved', message: 'MSG145' }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await rejectDraftVersion('55', '  Thiếu ảnh  ');

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ reason: 'Thiếu ảnh' });
  });

  it('surfaces a 409 stale-decision failure (MSG133) as ModerationApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse({ title: 'Already decided', errorCode: 'operator_tour.invalid_state' }, 409),
    ));

    await expect(approveDraftVersion('55')).rejects.toMatchObject({ status: 409, errorCode: 'operator_tour.invalid_state' });
  });

  it('a network failure surfaces as status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network down')));

    await expect(approveDraftVersion('55')).rejects.toMatchObject({ status: 0 });
  });
});
