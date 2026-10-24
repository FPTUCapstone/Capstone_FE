import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  resolveWebSession: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('@/lib/server/webSession', () => ({ resolveWebSession: mocks.resolveWebSession }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));

import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import RoutesPage from './page';

describe('RoutesPage (/admin/routes protected route)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('redirects to sign-in with the route return URL when there is no administration session', async () => {
    mocks.resolveWebSession.mockResolvedValue(null);

    await RoutesPage();

    expect(mocks.redirect).toHaveBeenCalledWith('/sign-in?returnUrl=%2Fadmin%2Froutes');
  });

  it('renders the page for an Administrator session', async () => {
    mocks.resolveWebSession.mockResolvedValue({ accessToken: 'tok', role: 'Administrator' });

    render(await RoutesPage());

    expect(screen.getByRole('heading', { level: 1, name: 'Route Master Data' })).toBeTruthy();
  });

  it('renders AdminAccessDeniedView for a Staff session (BR-115)', async () => {
    mocks.resolveWebSession.mockResolvedValue({ accessToken: 'tok', role: 'Staff' });

    const view = await RoutesPage();

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(view?.type).toBe(AdminAccessDeniedView);
  });
});
