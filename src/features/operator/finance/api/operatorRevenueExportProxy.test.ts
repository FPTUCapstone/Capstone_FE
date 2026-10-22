import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, fetchBackendMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  fetchBackendMock: vi.fn(),
}));

vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));

import { proxyDownloadRevenueExport, proxyRevenueExports } from './operatorRevenueExportProxy';

function cookieJar(refreshCookie?: string) {
  return {
    get: (name: string) =>
      name === 'tripmate_refresh' && refreshCookie ? { value: refreshCookie } : undefined,
  };
}

function mockOperatorRefresh() {
  fetchBackendMock.mockImplementation(async (path: string) => {
    if (path === '/api/v1/auth/web/refresh') {
      return new Response(JSON.stringify({
        data: { accessToken: 'operator-token', role: 'TourOperator' },
      }), { status: 200 });
    }
    return new Response(null, { status: 404 });
  });
}

describe('operatorRevenueExportProxy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe('proxyRevenueExports', () => {
    it.each([undefined, 'null', 'https://foreign.test', 'invalid-origin'])(
      'rejects POST origin %s before credentials, refresh or body processing',
      async (origin) => {
        vi.stubEnv('TRIPMATE_WEB_ORIGIN', '');
        cookiesMock.mockResolvedValue(cookieJar('valid-refresh-token'));
        mockOperatorRefresh();
        const response = await proxyRevenueExports(new Request(
          'http://localhost:3001/api/operator/revenue/exports', {
            method: 'POST',
            headers: origin === undefined ? {} : { Origin: origin },
            body: 'malformed JSON',
          },
        ));

        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({ errorCode: 'MSG126' });
        expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0');
        expect(cookiesMock).not.toHaveBeenCalled();
        expect(fetchBackendMock).not.toHaveBeenCalled();
      },
    );

    it('accepts the configured Web origin behind an internal proxy host', async () => {
      vi.stubEnv('TRIPMATE_WEB_ORIGIN', 'https://tripmate.test');
      cookiesMock.mockResolvedValue(cookieJar('valid-refresh-token'));
      fetchBackendMock.mockResolvedValueOnce(new Response(JSON.stringify({
        data: { accessToken: 'operator-token', role: 'TourOperator' },
      }))).mockResolvedValueOnce(new Response(JSON.stringify({ id: 42 }), { status: 201 }));
      const payload = { startDate: '2026-08-01', endDate: '2026-08-31' };

      const response = await proxyRevenueExports(new Request(
        'http://internal:3001/api/operator/revenue/exports', {
          method: 'POST', headers: { Origin: 'https://tripmate.test' },
          body: JSON.stringify(payload),
        },
      ));

      expect(response.status).toBe(201);
      expect(await response.json()).toEqual({ id: 42 });
      expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0');
      expect(fetchBackendMock.mock.calls[1][0]).toBe('/api/v1/operator/revenue/exports');
      expect(JSON.parse(fetchBackendMock.mock.calls[1][1].body)).toEqual(payload);
    });

    it('returns 401 UNAUTHENTICATED when refresh cookie is missing', async () => {
      cookiesMock.mockResolvedValue(cookieJar(undefined));

      const request = new Request('http://localhost:3001/api/operator/revenue/exports');
      const response = await proxyRevenueExports(request);

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ errorCode: 'UNAUTHENTICATED' });
      expect(fetchBackendMock).not.toHaveBeenCalled();
    });

    it('returns 401 UNAUTHENTICATED when refresh endpoint returns a non-operator role', async () => {
      cookiesMock.mockResolvedValue(cookieJar('valid-refresh-token'));
      fetchBackendMock.mockImplementation(async (path: string) => {
        if (path === '/api/v1/auth/web/refresh') {
          return new Response(JSON.stringify({
            data: { accessToken: 'traveler-token', role: 'Traveler' },
          }), { status: 200 });
        }
        return new Response(null, { status: 404 });
      });

      const request = new Request('http://localhost:3001/api/operator/revenue/exports');
      const response = await proxyRevenueExports(request);

      expect(response.status).toBe(401);
    });

    it('forwards POST with the JSON body and Bearer token to the create endpoint', async () => {
      cookiesMock.mockResolvedValue(cookieJar('valid-refresh-token'));
      mockOperatorRefresh();
      fetchBackendMock.mockImplementationOnce(async (path: string) => {
        if (path === '/api/v1/auth/web/refresh') {
          return new Response(JSON.stringify({
            data: { accessToken: 'operator-token', role: 'TourOperator' },
          }), { status: 200 });
        }
        return new Response(null, { status: 404 });
      }).mockImplementationOnce(async () =>
        new Response(JSON.stringify({ id: 42, status: 'Ready' }), { status: 201 }));

      const payload = {
        startDate: '2026-08-01', endDate: '2026-08-31', granularity: 'monthly',
        format: 'xlsx', scope: 'summary',
      };
      const request = new Request('http://localhost:3001/api/operator/revenue/exports', {
        method: 'POST',
        headers: { Origin: 'http://localhost:3001' },
        body: JSON.stringify(payload),
      });

      const response = await proxyRevenueExports(request);

      expect(response.status).toBe(201);
      expect(await response.json()).toEqual({ id: 42, status: 'Ready' });
      expect(fetchBackendMock.mock.calls[1][0]).toBe('/api/v1/operator/revenue/exports');
      expect(fetchBackendMock.mock.calls[1][1].method).toBe('POST');
      expect(fetchBackendMock.mock.calls[1][1].headers.Authorization).toBe('Bearer operator-token');
      expect(JSON.parse(fetchBackendMock.mock.calls[1][1].body)).toEqual(payload);
    });

    it('forwards GET history with the query string', async () => {
      cookiesMock.mockResolvedValue(cookieJar('valid-refresh-token'));
      fetchBackendMock.mockImplementationOnce(async () =>
        new Response(JSON.stringify({
          data: { accessToken: 'operator-token', role: 'TourOperator' },
        }), { status: 200 })
      ).mockImplementationOnce(async () =>
        new Response(JSON.stringify({ items: [], totalCount: 0 }), { status: 200 }));

      const request = new Request('http://localhost:3001/api/operator/revenue/exports?page=2&pageSize=10');
      const response = await proxyRevenueExports(request);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ items: [], totalCount: 0 });
      expect(fetchBackendMock.mock.calls[1][0]).toBe('/api/v1/operator/revenue/exports?page=2&pageSize=10');
      expect(fetchBackendMock.mock.calls[1][1].method).toBe('GET');
    });

    it('maps an upstream 500 to a safe 503 MSG127', async () => {
      cookiesMock.mockResolvedValue(cookieJar('valid-refresh-token'));
      fetchBackendMock.mockImplementationOnce(async () =>
        new Response(JSON.stringify({
          data: { accessToken: 'operator-token', role: 'TourOperator' },
        }), { status: 200 })
      ).mockImplementationOnce(async () =>
        new Response(JSON.stringify({ title: 'DB connection failed' }), { status: 500 }));

      const request = new Request('http://localhost:3001/api/operator/revenue/exports');
      const response = await proxyRevenueExports(request);

      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ errorCode: 'MSG127' });
    });

    it('maps an upstream 422 MSG128 (no records) through unchanged', async () => {
      cookiesMock.mockResolvedValue(cookieJar('valid-refresh-token'));
      fetchBackendMock.mockImplementationOnce(async () =>
        new Response(JSON.stringify({
          data: { accessToken: 'operator-token', role: 'TourOperator' },
        }), { status: 200 })
      ).mockImplementationOnce(async () =>
        new Response(JSON.stringify({ errorCode: 'MSG128' }), { status: 422 }));

      const request = new Request('http://localhost:3001/api/operator/revenue/exports', {
        method: 'POST',
        headers: { Origin: 'http://localhost:3001' },
        body: JSON.stringify({ startDate: '2026-08-01', endDate: '2026-08-31' }),
      });
      const response = await proxyRevenueExports(request);

      expect(response.status).toBe(422);
      expect(await response.json()).toEqual({ errorCode: 'MSG128' });
    });
  });

  describe('proxyDownloadRevenueExport', () => {
    it('rejects a non-numeric export id before contacting the backend', async () => {
      cookiesMock.mockResolvedValue(cookieJar('valid-refresh-token'));
      mockOperatorRefresh();

      const request = new Request('http://localhost:3001/api/operator/revenue/exports/abc/download');
      const response = await proxyDownloadRevenueExport(request, 'abc');

      expect(response.status).toBe(404);
      expect(fetchBackendMock).not.toHaveBeenCalledWith(
        expect.stringContaining('/download'), expect.anything());
    });

    it('streams the file through this origin and never exposes the signed storage URL', async () => {
      cookiesMock.mockResolvedValue(cookieJar('valid-refresh-token'));
      fetchBackendMock.mockImplementationOnce(async () =>
        new Response(JSON.stringify({
          data: { accessToken: 'operator-token', role: 'TourOperator' },
        }), { status: 200 })
      ).mockImplementationOnce(async () =>
        new Response(JSON.stringify({
          fileName: 'tripmate-revenue-20260801-20260831-42.xlsx',
          downloadUrl: 'https://res.cloudinary.com/signed/revenue-exports/42?sig=abc',
        }), { status: 200 }));

      const fileBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(fileBytes, { status: 200 }));
      vi.stubGlobal('fetch', fetchMock);

      const request = new Request('http://localhost:3001/api/operator/revenue/exports/42/download');
      const response = await proxyDownloadRevenueExport(request, '42');

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Disposition')).toBe(
        'attachment; filename="tripmate-revenue-20260801-20260831-42.xlsx"');
      expect(response.headers.get('Content-Type')).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(new Uint8Array(await response.arrayBuffer())).toEqual(fileBytes);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://res.cloudinary.com/signed/revenue-exports/42?sig=abc', expect.anything());

      // The signed URL must never appear in any value returned to the browser.
      const bodyText = Array.from(new Uint8Array(fileBytes)).join(',');
      expect(bodyText).not.toContain('cloudinary');
    });

    it('returns a safe not-found for a foreign or missing export id', async () => {
      cookiesMock.mockResolvedValue(cookieJar('valid-refresh-token'));
      fetchBackendMock.mockImplementationOnce(async () =>
        new Response(JSON.stringify({
          data: { accessToken: 'operator-token', role: 'TourOperator' },
        }), { status: 200 })
      ).mockImplementationOnce(async () =>
        new Response(JSON.stringify({ errorCode: 'revenue_export.not_found' }), { status: 404 }));

      const request = new Request('http://localhost:3001/api/operator/revenue/exports/999/download');
      const response = await proxyDownloadRevenueExport(request, '999');

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ errorCode: 'revenue_export.not_found' });
    });
  });
});
