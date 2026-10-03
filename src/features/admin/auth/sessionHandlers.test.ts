import { beforeEach, describe, expect, it, vi } from 'vitest';

import { signInAdmin } from './sessionHandlers';

// The mocked adminSession helpers return plain marker objects, not real
// NextResponse instances; tests read those markers through this shape.
type HandlerResult = { kind: string; status: number; body: Record<string, unknown>; token?: string };

vi.mock('server-only', () => ({}));

const adminSessionMocks = vi.hoisted(() => ({
  isSameOriginRequest: vi.fn(() => true),
  jsonNoStore: vi.fn((body: unknown, status = 200) => ({ kind: 'json', body, status })),
  clearAdminSession: vi.fn((response: unknown) => response),
  setAdminSession: vi.fn((response: unknown, token: string) => ({ ...(response as object), token })),
}));

vi.mock('@/lib/server/adminSession', () => adminSessionMocks);

const fetchBackendMock = vi.hoisted(() => ({ fetchBackend: vi.fn() }));
vi.mock('@/lib/server/backend', () => fetchBackendMock);

const envelopeData = {
  userId: 7,
  email: 'admin@tripmate.com',
  fullName: 'Administrator',
  role: 'Administrator',
  status: 'Active',
  accessToken: 'admin-access-token',
  accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
};

const loginEnvelope = { success: true, statusCode: 200, message: 'Signed in.', data: envelopeData, errors: null };

function backendLoginResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function adminRequest(): Request {
  return new Request('https://tripmate.local/api/admin/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@tripmate.com', password: 'Password1!' }),
  });
}


beforeEach(() => {
  vi.clearAllMocks();
  adminSessionMocks.isSameOriginRequest.mockReturnValue(true);
  fetchBackendMock.fetchBackend.mockReset();
});

describe('Admin BFF sign-in contract (POST /api/v1/auth/web/admin/login)', () => {
  it('calls the Backend web admin login endpoint and parses the envelope data', async () => {
    fetchBackendMock.fetchBackend.mockImplementationOnce(async () => backendLoginResponse(loginEnvelope));

    const result = await signInAdmin(adminRequest()) as unknown as HandlerResult;

    expect(fetchBackendMock.fetchBackend).toHaveBeenCalledTimes(1);
    expect(fetchBackendMock.fetchBackend.mock.calls[0][0]).toBe('/api/v1/auth/web/admin/login');
    expect(JSON.parse(String(fetchBackendMock.fetchBackend.mock.calls[0][1]?.body))).toEqual({
      email: 'admin@tripmate.com',
      password: 'Password1!',
      keepMeSignedIn: false,
    });
    expect(result.kind).toBe('json');
    expect(result.body.authenticated).toBe(true);
    expect(result.token).toBe('admin-access-token');
  });

  it('issues the session directly after the validated admin login response without a secondary probe', async () => {
    fetchBackendMock.fetchBackend.mockImplementationOnce(async () => backendLoginResponse(loginEnvelope));

    const result = await signInAdmin(adminRequest()) as unknown as HandlerResult;

    expect(fetchBackendMock.fetchBackend).toHaveBeenCalledTimes(1);
    expect(adminSessionMocks.setAdminSession).toHaveBeenCalledTimes(1);
    expect(adminSessionMocks.setAdminSession).toHaveBeenCalledWith(expect.anything(), 'admin-access-token', expect.any(Date));
    expect(result.body.authenticated).toBe(true);
  });

  it('accepts an Administrator with Active status using string role/status values', async () => {
    fetchBackendMock.fetchBackend.mockImplementationOnce(async () => backendLoginResponse(loginEnvelope));

    const result = await signInAdmin(adminRequest()) as unknown as HandlerResult;

    expect(result.body.authenticated).toBe(true);
  });

  it.each(['TourOperator', 'Traveler', 3, null])('rejects non-administrator role %s with 403', async (role) => {
    fetchBackendMock.fetchBackend.mockImplementationOnce(async () =>
      backendLoginResponse({ ...loginEnvelope, data: { ...envelopeData, role } }),
    );

    const result = await signInAdmin(adminRequest()) as unknown as HandlerResult;

    expect(result.status).toBe(403);
    expect(result.body.message).toBe('An active Administrator account is required.');
  });

  it.each(['Inactive', 'Locked', 'PendingEmailVerification'])('rejects an administrator with %s status with 403', async (status) => {
    fetchBackendMock.fetchBackend.mockImplementationOnce(async () =>
      backendLoginResponse({ ...loginEnvelope, data: { ...envelopeData, status } }),
    );

    const result = await signInAdmin(adminRequest()) as unknown as HandlerResult;

    expect(result.status).toBe(403);
    expect(result.body.message).toBe('An active Administrator account is required.');
  });

  it.each([
    ['missing data envelope', { success: true, statusCode: 200, message: 'ok' }],
    ['missing accessToken', { success: true, statusCode: 200, data: { ...envelopeData, accessToken: undefined } }],
    ['success=false at 200', { success: false, statusCode: 200, message: 'denied', data: envelopeData }],
    ['access token at the response root only', { success: true, statusCode: 200, accessToken: 'root-token', role: 3, status: 2 }],
  ])('treats a malformed success response (%s) as 502', async (_name, body) => {
    fetchBackendMock.fetchBackend.mockImplementationOnce(async () => backendLoginResponse(body));

    const result = await signInAdmin(adminRequest()) as unknown as HandlerResult;

    expect(result.status).toBe(502);
    expect(result.body.message).toBe('Sign in is temporarily unavailable. Please try again.');
    expect(adminSessionMocks.setAdminSession).not.toHaveBeenCalled();
  });

  it('rejects an expired or unparseable accessTokenExpiresAtUtc with 502', async () => {
    fetchBackendMock.fetchBackend.mockImplementationOnce(async () =>
      backendLoginResponse({ ...loginEnvelope, data: { ...envelopeData, accessTokenExpiresAtUtc: 'not-a-date' } }),
    );

    const result = await signInAdmin(adminRequest()) as unknown as HandlerResult;

    expect(result.status).toBe(502);
  });

  it('returns the safe 503 message when the Backend call fails', async () => {
    fetchBackendMock.fetchBackend.mockRejectedValueOnce(new Error('upstream down'));

    const result = await signInAdmin(adminRequest()) as unknown as HandlerResult;

    expect(result.status).toBe(503);
    expect(result.body.message).toBe('Sign in is temporarily unavailable. Please try again.');
  });

  it('returns the safe 503 message when the Backend answers with a server error', async () => {
    fetchBackendMock.fetchBackend.mockImplementationOnce(async () => backendLoginResponse({ message: 'boom' }, 500));

    const result = await signInAdmin(adminRequest()) as unknown as HandlerResult;

    expect(result.status).toBe(503);
    expect(result.body.message).toBe('Sign in is temporarily unavailable. Please try again.');
  });

  it.each([
    [401, 'Incorrect email or password. Please try again.'],
    [403, 'This account cannot access the administration workspace.'],
    [400, 'Enter a valid email address and password.'],
  ])('maps a Backend %i to its safe message', async (status, message) => {
    fetchBackendMock.fetchBackend.mockImplementationOnce(async () => backendLoginResponse({ message: 'internal detail' }, status));

    const result = await signInAdmin(adminRequest()) as unknown as HandlerResult;

    expect(result.status).toBe(status);
    expect(result.body.message).toBe(message);
    expect(result.body.message).not.toContain('internal detail');
  });

  it('keeps the same-origin guard before any Backend call', async () => {
    adminSessionMocks.isSameOriginRequest.mockReturnValue(false);

    const result = await signInAdmin(adminRequest()) as unknown as HandlerResult;

    expect(result.status).toBe(403);
    expect(fetchBackendMock.fetchBackend).not.toHaveBeenCalled();
  });

  it('makes no further Backend request after the login response is accepted', async () => {
    fetchBackendMock.fetchBackend.mockImplementation(async () => {
      throw new Error('no request beyond the admin login is allowed');
    });
    fetchBackendMock.fetchBackend.mockImplementationOnce(async () => backendLoginResponse(loginEnvelope));

    const result = await signInAdmin(adminRequest()) as unknown as HandlerResult;

    expect(fetchBackendMock.fetchBackend).toHaveBeenCalledTimes(1);
    expect(result.body.authenticated).toBe(true);
    expect(adminSessionMocks.setAdminSession).toHaveBeenCalledTimes(1);
  });
});
