import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuditLogServiceError, getAuditLogs } from './auditLogAdminService';

const validPage = {
  items: [{
    id: 1,
    result: 'Success',
    actionType: 'UpdateAlgorithmParameters',
    actorUserId: 2,
    actorEmail: 'admin@tripmate.local',
    actorFullName: null,
    actorRole: 'Administrator',
    affectedEntity: 'SystemConfig',
    affectedEntityId: 3,
    ipAddress: null,
    createdAtUtc: '2026-09-29T10:00:00Z',
    createdAtLocal: '29/09/2026 17:00:00',
  }],
  pageNumber: 1,
  pageSize: 10,
  totalCount: 1,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('UC-68 audit log service contract', () => {
  it('accepts the BE result field and nullable actor name', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(validPage)));

    await expect(getAuditLogs({ pageNumber: 1, pageSize: 10 }))
      .resolves.toEqual(validPage);
  });

  it.each([
    { ...validPage, items: [{ ...validPage.items[0], id: Number.MAX_SAFE_INTEGER + 1 }] },
    { ...validPage, items: [{ ...validPage.items[0], result: 'Unknown' }] },
    { ...validPage, items: 'not-an-array' },
  ])('rejects a malformed success payload', async (payload) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(payload)));

    await expect(getAuditLogs({})).rejects.toMatchObject({
      statusCode: 503,
      message: 'TripMate is temporarily unable to process your request. Please check your connection and try again.',
    });
  });

  it('does not expose an upstream error title', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(
      { title: 'SQL Server internal topology' },
      { status: 500 },
    )));

    await expect(getAuditLogs({})).rejects.toEqual(expect.objectContaining<Partial<AuditLogServiceError>>({
      statusCode: 500,
      message: 'TripMate is temporarily unable to process your request. Please check your connection and try again.',
    }));
  });

  it('passes the abort signal to the same-origin request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(validPage));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();

    await getAuditLogs({ keyword: 'audit' }, controller.signal);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/audit-logs?keyword=audit',
      expect.objectContaining({ signal: controller.signal }),
    );
  });
});
