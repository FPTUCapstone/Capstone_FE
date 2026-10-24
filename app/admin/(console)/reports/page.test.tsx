import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  resolveWebSession: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('@/lib/server/webSession', () => ({ resolveWebSession: mocks.resolveWebSession }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/features/admin/reports/components/StatisticalReportsView', () => ({
  StatisticalReportsView: () => null,
}));

import { StatisticalReportsView } from '@/features/admin/reports/components/StatisticalReportsView';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import StatisticalReportsPage from './page';

const PROD_ENV = { ...process.env };

function setEnv(overrides: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete (process.env as Record<string, string | undefined>)[key];
    else (process.env as Record<string, string | undefined>)[key] = value;
  }
}

describe('UC-67 /admin/reports protected route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    setEnv({ NODE_ENV: 'development', NEXT_PUBLIC_ENABLE_DEMO_FIXTURES: 'true' });
  });

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in PROD_ENV)) delete process.env[key];
    }
    Object.assign(process.env, PROD_ENV);
  });

  it('redirects to sign-in with the reports return URL when there is no administration session', async () => {
    mocks.resolveWebSession.mockResolvedValue(null);

    await StatisticalReportsPage({ searchParams: Promise.resolve({}) });

    expect(mocks.redirect).toHaveBeenCalledWith('/sign-in?returnUrl=%2Fadmin%2Freports');
  });

  it('renders the reports view for an Administrator in PRODUCTION mode by default', async () => {
    mocks.resolveWebSession.mockResolvedValue({ accessToken: 'tok', role: 'Administrator' });

    const view = await StatisticalReportsPage({ searchParams: Promise.resolve({}) });

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(view?.type).toBe(StatisticalReportsView);
    expect(view?.props).toMatchObject({ actorRole: 'Administrator', initialMode: 'PRODUCTION' });
  });

  it('renders AdminAccessDeniedView for a Staff session (BR-115)', async () => {
    mocks.resolveWebSession.mockResolvedValue({ accessToken: 'tok', role: 'Staff' });

    const view = await StatisticalReportsPage({ searchParams: Promise.resolve({ demo: '1' }) });

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(view?.type).toBe(AdminAccessDeniedView);
  });

  it('enables DEMO mode for an Administrator with demo fixtures enabled and ?demo=1 in non-production', async () => {
    mocks.resolveWebSession.mockResolvedValue({ accessToken: 'tok', role: 'Administrator' });

    const view = await StatisticalReportsPage({ searchParams: Promise.resolve({ demo: '1' }) });

    expect(view?.props).toMatchObject({ initialMode: 'DEMO' });
  });

  it('locks to PRODUCTION when demo fixtures are disabled, even with ?demo=1', async () => {
    setEnv({ NEXT_PUBLIC_ENABLE_DEMO_FIXTURES: 'false' });
    mocks.resolveWebSession.mockResolvedValue({ accessToken: 'tok', role: 'Administrator' });

    const view = await StatisticalReportsPage({ searchParams: Promise.resolve({ demo: '1' }) });

    expect(view?.props).toMatchObject({ initialMode: 'PRODUCTION' });
  });

  it('locks to PRODUCTION when NODE_ENV is production, even with demo fixtures enabled', async () => {
    setEnv({ NODE_ENV: 'production' });
    mocks.resolveWebSession.mockResolvedValue({ accessToken: 'tok', role: 'Administrator' });

    const view = await StatisticalReportsPage({ searchParams: Promise.resolve({ demo: '1' }) });

    expect(view?.props).toMatchObject({ initialMode: 'PRODUCTION' });
  });
});
