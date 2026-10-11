import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, fetchBackendMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  fetchBackendMock: vi.fn(),
}));

vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));

import { proxyOperatorApplication } from './operatorApplicationProxy';

function cookieJar(refreshCookie?: string) {
  return {
    get: (name: string) =>
      name === 'tripmate_refresh' && refreshCookie ? { value: refreshCookie } : undefined,
  };
}

describe('operatorApplicationProxy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 UNAUTHENTICATED when refresh cookie is missing', async () => {
    cookiesMock.mockResolvedValue(cookieJar(undefined));

    const request = new Request('http://localhost:3001/api/operator/application');
    const response = await proxyOperatorApplication(request);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ errorCode: 'UNAUTHENTICATED' });
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('returns 401 UNAUTHENTICATED when refresh endpoint returns non-operator role', async () => {
    cookiesMock.mockResolvedValue(cookieJar('valid-refresh-token'));
    fetchBackendMock.mockImplementation(async (path: string) => {
      if (path === '/api/v1/auth/web/refresh') {
        return new Response(JSON.stringify({
          data: { accessToken: 'traveler-token', role: 'Traveler' },
        }), { status: 200 });
      }
      return new Response(null, { status: 404 });
    });

    const request = new Request('http://localhost:3001/api/operator/application');
    const response = await proxyOperatorApplication(request);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ errorCode: 'UNAUTHENTICATED' });
  });

  it('forwards GET request to /api/v1/operator/application with Bearer token', async () => {
    cookiesMock.mockResolvedValue(cookieJar('valid-refresh-token'));
    fetchBackendMock.mockImplementation(async (path: string) => {
      if (path === '/api/v1/auth/web/refresh') {
        return new Response(JSON.stringify({
          data: { accessToken: 'operator-token', role: 'TourOperator' },
        }), { status: 200 });
      }
      if (path === '/api/v1/operator/application') {
        return new Response(JSON.stringify({
          userId: 12,
          userStatus: 'Rejected',
          approvalStatus: 'Rejected',
          companyName: 'Đà Nẵng Discovery',
        }), { status: 200 });
      }
      return new Response(null, { status: 404 });
    });

    const request = new Request('http://localhost:3001/api/operator/application');
    const response = await proxyOperatorApplication(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      userId: 12,
      userStatus: 'Rejected',
      approvalStatus: 'Rejected',
      companyName: 'Đà Nẵng Discovery',
    });

    expect(fetchBackendMock.mock.calls[1][0]).toBe('/api/v1/operator/application');
    expect(fetchBackendMock.mock.calls[1][1].method).toBe('GET');
    expect(fetchBackendMock.mock.calls[1][1].headers.Authorization).toBe('Bearer operator-token');
  });

  it('forwards PUT request with multipart body to /api/v1/operator/application/resubmit', async () => {
    cookiesMock.mockResolvedValue(cookieJar('valid-refresh-token'));
    fetchBackendMock.mockImplementation(async (path: string) => {
      if (path === '/api/v1/auth/web/refresh') {
        return new Response(JSON.stringify({
          data: { accessToken: 'operator-token', role: 'TourOperator' },
        }), { status: 200 });
      }
      if (path === '/api/v1/operator/application/resubmit') {
        return new Response(JSON.stringify({
          userId: 12,
          userStatus: 'PendingApproval',
          approvalStatus: 'PendingApproval',
          messageCode: 'MSG162',
        }), { status: 200 });
      }
      return new Response(null, { status: 404 });
    });

    const formData = new FormData();
    formData.append('companyName', 'New Company');
    formData.append('taxCode', '0101234567');

    const request = new Request('http://localhost:3001/api/operator/application/resubmit', {
      method: 'PUT',
    });
    (request as unknown as { formData: () => Promise<FormData> }).formData = async () => formData;

    const response = await proxyOperatorApplication(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      userId: 12,
      userStatus: 'PendingApproval',
      approvalStatus: 'PendingApproval',
      messageCode: 'MSG162',
    });

    expect(fetchBackendMock.mock.calls[1][0]).toBe('/api/v1/operator/application/resubmit');
    expect(fetchBackendMock.mock.calls[1][1].method).toBe('PUT');
    expect(fetchBackendMock.mock.calls[1][1].headers.Authorization).toBe('Bearer operator-token');
    expect(fetchBackendMock.mock.calls[1][1].body).toBe(formData);
  });

  it('safely proxies 409 MSG159 duplicate identifier error', async () => {
    cookiesMock.mockResolvedValue(cookieJar('valid-refresh-token'));
    fetchBackendMock.mockImplementation(async (path: string) => {
      if (path === '/api/v1/auth/web/refresh') {
        return new Response(JSON.stringify({
          data: { accessToken: 'operator-token', role: 'TourOperator' },
        }), { status: 200 });
      }
      if (path === '/api/v1/operator/application/resubmit') {
        return new Response(JSON.stringify({
          errorCode: 'MSG159',
          errors: { taxCode: ['MSG159'] },
          title: 'Confidential database info',
        }), { status: 409 });
      }
      return new Response(null, { status: 404 });
    });

    const formData = new FormData();
    const request = new Request('http://localhost:3001/api/operator/application/resubmit', {
      method: 'PUT',
    });
    (request as unknown as { formData: () => Promise<FormData> }).formData = async () => formData;

    const response = await proxyOperatorApplication(request);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      errorCode: 'MSG159',
      errors: { taxCode: ['MSG159'] },
    });
  });

  it('safely proxies 409 MSG161 invalid application state error', async () => {
    cookiesMock.mockResolvedValue(cookieJar('valid-refresh-token'));
    fetchBackendMock.mockImplementation(async (path: string) => {
      if (path === '/api/v1/auth/web/refresh') {
        return new Response(JSON.stringify({
          data: { accessToken: 'operator-token', role: 'TourOperator' },
        }), { status: 200 });
      }
      if (path === '/api/v1/operator/application/resubmit') {
        return new Response(JSON.stringify({
          errorCode: 'MSG161',
        }), { status: 409 });
      }
      return new Response(null, { status: 404 });
    });

    const formData = new FormData();
    const request = new Request('http://localhost:3001/api/operator/application/resubmit', {
      method: 'PUT',
    });
    (request as unknown as { formData: () => Promise<FormData> }).formData = async () => formData;

    const response = await proxyOperatorApplication(request);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ errorCode: 'MSG161' });
  });

  it('maps upstream 500 error to safe 503 MSG127', async () => {
    cookiesMock.mockResolvedValue(cookieJar('valid-refresh-token'));
    fetchBackendMock.mockImplementation(async (path: string) => {
      if (path === '/api/v1/auth/web/refresh') {
        return new Response(JSON.stringify({
          data: { accessToken: 'operator-token', role: 'TourOperator' },
        }), { status: 200 });
      }
      if (path === '/api/v1/operator/application') {
        return new Response(JSON.stringify({
          title: 'Internal Server Error at SQL Host',
        }), { status: 500 });
      }
      return new Response(null, { status: 404 });
    });

    const request = new Request('http://localhost:3001/api/operator/application');
    const response = await proxyOperatorApplication(request);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ errorCode: 'MSG127' });
  });
});
