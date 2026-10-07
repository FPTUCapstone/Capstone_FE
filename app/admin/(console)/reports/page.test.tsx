import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCookie: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: mocks.getCookie }),
}));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/features/admin/reports/components/StatisticalReportsView', () => ({
  StatisticalReportsView: ({ actorRole }: { actorRole?: string }) => ({
    renderedActorRole: actorRole,
  }),
}));

import StatisticalReportsPage from './page';

describe('UC-67 /admin/reports protected route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('redirects a missing Admin cookie to login with /admin/reports returnUrl', async () => {
    mocks.getCookie.mockReturnValue(undefined);

    await StatisticalReportsPage();

    expect(mocks.redirect).toHaveBeenCalledWith(
      '/admin/login?returnUrl=%2Fadmin%2Freports',
    );
  });

  it('passes Administrator role when the HttpOnly Admin cookie is present', async () => {
    mocks.getCookie.mockReturnValue({ value: 'server-only-token' });

    const result = (await StatisticalReportsPage()) as unknown as {
      props: { actorRole: string };
    };

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(result.props.actorRole).toBe('Administrator');
  });

  it('passes Staff role when a Staff session token is present so StatisticalReportsView denies access', async () => {
    mocks.getCookie.mockReturnValue({ value: 'staff-only-token' });

    const result = (await StatisticalReportsPage()) as unknown as {
      props: { actorRole: string };
    };

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(result.props.actorRole).toBe('Staff');
  });
});
