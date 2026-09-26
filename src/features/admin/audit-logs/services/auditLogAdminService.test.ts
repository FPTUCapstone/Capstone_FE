import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAuditLogDetail, getAuditLogs } from './auditLogAdminService';

afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });

describe('audit API ProblemDetails contract', () => {
  it.each(['list', 'detail'])('reads the root errorCode for %s', async (endpoint) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      title: 'Forbidden', status: 403, errorCode: 'admin.audit_log_forbidden',
    }), { status: 403 })));
    await expect(endpoint === 'list' ? getAuditLogs({}) : getAuditLogDetail(1))
      .rejects.toMatchObject({ statusCode: 403, errorCode: 'admin.audit_log_forbidden' });
  });

  it('carries ValidationProblemDetails messages for a rejected date range', async () => {
    const errors = { '': ['The submitted Event Date range is logically invalid.'] };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      title: 'One or more validation errors occurred.', status: 400, errors,
    }), { status: 400 })));
    await expect(getAuditLogs({ fromDateUtc: '2026-09-20T00:00:00Z', toDateUtc: '2026-09-19T00:00:00Z' }))
      .rejects.toMatchObject({ statusCode: 400, validationErrors: errors });
  });

  it('clears the stored session on an empty 401 detail response', async () => {
    for (const key of ['tripmate_access_token', 'tripmate_refresh_token', 'tripmate_user']) localStorage.setItem(key, 'test');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    await expect(getAuditLogDetail(1)).rejects.toMatchObject({ statusCode: 401 });
    expect(localStorage.length).toBe(0);
  });

  it('ignores malformed validation entries and does not carry validation data from a 500', async () => {
    const errors = { fromDateUtc: ['Enter a valid date.', null, 42, ''], invalid: 'not an array' };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ errors }), { status: 400 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ errors }), { status: 500 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(getAuditLogs({})).rejects.toMatchObject({ validationErrors: { fromDateUtc: ['Enter a valid date.'] } });
    await expect(getAuditLogs({})).rejects.toMatchObject({ validationErrors: {} });
  });
});
