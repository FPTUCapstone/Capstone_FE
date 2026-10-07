import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCookie: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: mocks.getCookie }),
}));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
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

function createJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.sig`;
}

describe('UC-67 /admin/reports protected route & mode gate', () => {
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

  it('defaults normal /admin/reports route navigation to PRODUCTION mode with an Administrator JWT', async () => {
    mocks.getCookie.mockReturnValue({
      value: createJwt({ sub: 'admin-1', role: 'Administrator' }),
    });

    const result = (await StatisticalReportsPage({})) as unknown as {
      props: { actorRole: string; initialMode: string };
    };

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(result.props.actorRole).toBe('Administrator');
    expect(result.props.initialMode).toBe('PRODUCTION');
  });

  it('enables DEMO mode only when explicit ?demo=true is provided in a non-production environment', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    mocks.getCookie.mockReturnValue({
      value: createJwt({ sub: 'admin-1', role: 'Administrator' }),
    });

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
      value: createJwt({ sub: 'admin-1', role: 'Administrator' }),
    });

    const result = (await StatisticalReportsPage({
      searchParams: Promise.resolve({ demo: 'true' }),
    })) as unknown as {
      props: { actorRole: string; initialMode: string };
    };

    expect(result.props.actorRole).toBe('Administrator');
    expect(result.props.initialMode).toBe('PRODUCTION');
  });

  it('fails closed (resolves Unknown role) when an arbitrary opaque token or malformed JWT is present', async () => {
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
      expect(result.props.initialMode).toBe('PRODUCTION');
    }
  });

  it.each(['Staff', 'Traveler', 'TourOperator'] as const)(
    'passes non-Administrator role (%s) from JWT so StatisticalReportsView denies access',
    async (nonAdminRole) => {
      mocks.getCookie.mockReturnValue({
        value: createJwt({ sub: 'user-2', role: nonAdminRole }),
      });

      const result = (await StatisticalReportsPage({})) as unknown as {
        props: { actorRole: string };
      };

      expect(mocks.redirect).not.toHaveBeenCalled();
      expect(result.props.actorRole).toBe(nonAdminRole);
    },
  );
});
