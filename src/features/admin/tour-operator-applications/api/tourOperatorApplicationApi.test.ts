import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ApiError,
  approveOperatorApplication,
  rejectOperatorApplication,
} from './tourOperatorApplicationApi';

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const rejectedResult = {
  userId: 3,
  accountStatus: 'Rejected',
  applicationStatus: 'Rejected',
  rejectionReason: 'Business licence could not be verified.',
  reviewedBy: 1,
  reviewedAt: '2026-10-09T03:00:00Z',
  message: 'Application rejected. Notification sent to operator.',
};

const approvedResult = {
  userId: 3,
  accountStatus: 'Active',
  applicationStatus: 'Approved',
  reviewedBy: 1,
  reviewedAt: '2026-10-09T03:00:00Z',
  message: 'Tour Operator "Hoi An Travel" approved. Account activated.',
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('UC-51 reject request', () => {
  it('sends the trimmed reason and returns the verified Backend result', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(rejectedResult));

    const result = await rejectOperatorApplication(3, 'Business licence could not be verified.');

    expect(result).toEqual(rejectedResult);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/tour-operator-applications/3/reject');
    expect(JSON.parse(init.body)).toEqual({ reason: 'Business licence could not be verified.' });
  });

  it.each([
    ['an empty body', null],
    ['a non-object body', 'ok'],
    ['a status other than Rejected', { ...rejectedResult, applicationStatus: 'PendingApproval' }],
    ['a missing status', { ...rejectedResult, applicationStatus: undefined }],
  ])('treats %s as an unconfirmed result', async (_label, body) => {
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const error = await rejectOperatorApplication(3, 'Reason').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).errorCode).toBe('UNCONFIRMED_RESPONSE');
  });

  it('surfaces the HTTP status of a failed request', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ title: 'Rejection reason is required.' }, 400));

    const error = await rejectOperatorApplication(3, 'Reason').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).statusCode).toBe(400);
    expect((error as ApiError).message).toBe('Rejection reason is required.');
  });
});

describe('UC-50 approve request', () => {
  it('returns the verified Backend result', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(approvedResult));

    await expect(approveOperatorApplication(3)).resolves.toEqual(approvedResult);
  });

  it('treats a response that does not confirm approval as unconfirmed', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ...approvedResult, applicationStatus: 'PendingApproval' }));

    const error = await approveOperatorApplication(3).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).errorCode).toBe('UNCONFIRMED_RESPONSE');
  });
});
