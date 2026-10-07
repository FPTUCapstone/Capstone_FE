import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCookie: vi.fn(),
  redirect: vi.fn(),
  fetchBackend: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: mocks.getCookie }),
}));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/lib/server/backend', () => ({
  fetchBackend: mocks.fetchBackend,
}));
vi.mock('@/features/admin/reports/components/StatisticalReportsView', () => ({
  StatisticalReportsView: ({
    actorRole,
    initialMode,
  }: {
    actorRole?: string | null;
    initialMode?: string;
  }) => ({
    renderedActorRole: actorRole,
    renderedInitialMode: initialMode,
  }),
}));

import StatisticalReportsPage from './page';
import { canAccessStatisticalReports } from '@/features/admin/reports/guards/statisticalReportAuth';

function createJwt(payload: Record<string, unknown>, signature = 'fake-signature'): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.${signature}`;
}

describe('UC-67 /admin/reports protected route & trusted server session boundary', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('redirects a missing Admin cookie to login with /admin/reports returnUrl', async () => {
    mocks.getCookie.mockReturnValue(undefined);

    await StatisticalReportsPage({});

    expect(mocks.redirect).toHaveBeenCalledWith(
      '/admin/login?returnUrl=%2Fadmin%2Freports',
    );
  });

  it('CRITICAL REGRESSION: denies a forged JWT payload with role="Administrator" when Backend session verification is absent or fails', async () => {
    const forgedAdminToken = createJwt({ sub: 'attacker', role: 'Administrator' }, 'fake-signature');
    mocks.getCookie.mockReturnValue({ value: forgedAdminToken });

    // Case 1: Backend rejects forged signature with 401 Unauthorized
    mocks.fetchBackend.mockResolvedValueOnce({ ok: false, status: 401 });
    const rejectedResult = (await StatisticalReportsPage({})) as unknown as {
      props: { actorRole: string; initialMode: string };
    };
    expect(rejectedResult.props.actorRole).toBe('Unknown');
    expect(canAccessStatisticalReports(rejectedResult.props.actorRole)).toBe(false);

    // Case 2: Backend session verification infrastructure is unconfigured/unavailable
    mocks.fetchBackend.mockRejectedValueOnce(new Error('BackendConfigurationError'));
    const unverifiedResult = (await StatisticalReportsPage({})) as unknown as {
      props: { actorRole: string; initialMode: string };
    };
    expect(unverifiedResult.props.actorRole).toBe('PENDING_AUTH_SESSION_VERIFICATION');
    expect(canAccessStatisticalReports(unverifiedResult.props.actorRole)).toBe(false);
  });

  it('allows Administrator access ONLY when the server-side Backend session verifier confirms 200 OK, and defaults to PRODUCTION mode', async () => {
    mocks.getCookie.mockReturnValue({
      value: createJwt({ sub: 'admin-1', role: 'Administrator' }, 'verified-by-backend'),
    });
    mocks.fetchBackend.mockResolvedValueOnce({ ok: true, status: 200 });

    const result = (await StatisticalReportsPage({})) as unknown as {
      props: { actorRole: string; initialMode: string };
    };

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.fetchBackend).toHaveBeenCalledWith(
      '/api/v1/admin/system-configs/algorithm-parameters',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.props.actorRole).toBe('Administrator');
    expect(canAccessStatisticalReports(result.props.actorRole)).toBe(true);
    expect(result.props.initialMode).toBe('PRODUCTION');
  });

  it('enables DEMO mode only when explicit ?demo=true is provided in a non-production environment with a verified Administrator session', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    mocks.getCookie.mockReturnValue({
      value: createJwt({ sub: 'admin-1', role: 'Administrator' }, 'verified-by-backend'),
    });
    mocks.fetchBackend.mockResolvedValueOnce({ ok: true, status: 200 });

    const result = (await StatisticalReportsPage({
      searchParams: Promise.resolve({ demo: 'true' }),
    })) as unknown as {
      props: { actorRole: string; initialMode: string };
    };

    expect(result.props.actorRole).toBe('Administrator');
    expect(result.props.initialMode).toBe('DEMO');
  });

  it('locks mode to PRODUCTION when NODE_ENV=production even if ?demo=true is passed', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    mocks.getCookie.mockReturnValue({
      value: createJwt({ sub: 'admin-1', role: 'Administrator' }, 'verified-by-backend'),
    });
    mocks.fetchBackend.mockResolvedValueOnce({ ok: true, status: 200 });

    const result = (await StatisticalReportsPage({
      searchParams: Promise.resolve({ demo: 'true' }),
    })) as unknown as {
      props: { actorRole: string; initialMode: string };
    };

    expect(result.props.actorRole).toBe('Administrator');
    expect(result.props.initialMode).toBe('PRODUCTION');
  });

  it('fails closed (resolves Unknown role without trusting token) when an opaque token, malformed JWT, or JWT without role is present', async () => {
    for (const invalidToken of [
      'server-only-token',
      'random-opaque-token',
      'not.a.valid-base64-json',
      createJwt({ sub: 'no-role-claim' }),
    ]) {
      mocks.getCookie.mockReturnValue({ value: invalidToken });

      const result = (await StatisticalReportsPage({})) as unknown as {
        props: { actorRole: string; initialMode: string };
      };

      expect(result.props.actorRole).toBe('Unknown');
      expect(canAccessStatisticalReports(result.props.actorRole)).toBe(false);
      expect(result.props.initialMode).toBe('PRODUCTION');
    }
    expect(mocks.fetchBackend).not.toHaveBeenCalled();
  });

  it.each(['Staff', 'Traveler', 'TourOperator'] as const)(
    'resolves non-Administrator role (%s) and denies access without authorizing UC-67',
    async (nonAdminRole) => {
      mocks.getCookie.mockReturnValue({
        value: createJwt({ sub: 'user-2', role: nonAdminRole }),
      });

      const result = (await StatisticalReportsPage({})) as unknown as {
        props: { actorRole: string };
      };

      expect(mocks.redirect).not.toHaveBeenCalled();
      expect(mocks.fetchBackend).not.toHaveBeenCalled();
      expect(result.props.actorRole).toBe(nonAdminRole);
      expect(canAccessStatisticalReports(result.props.actorRole)).toBe(false);
    },
  );
});
