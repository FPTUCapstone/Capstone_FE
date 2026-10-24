import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  resolveWebSession: vi.fn(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock('@/lib/server/webSession', () => ({ resolveWebSession: mocks.resolveWebSession }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect, notFound: mocks.notFound }));
vi.mock('@/features/admin/account/AdminChangePasswordView', () => ({ AdminChangePasswordView: () => null }));

import { AdminChangePasswordView } from '@/features/admin/account/AdminChangePasswordView';
import AdminAccountSecurityPage from './page';

describe('AdminAccountSecurityPage protected route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('redirects to sign-in when there is no administration session', async () => {
    mocks.resolveWebSession.mockResolvedValue(null);

    await AdminAccountSecurityPage();

    expect(mocks.redirect).toHaveBeenCalledWith('/sign-in');
  });

  it.each(['Administrator', 'Staff'])('renders the page view for an allowed %s session', async (role) => {
    mocks.resolveWebSession.mockResolvedValue({ accessToken: 'tok', role });

    const view = await AdminAccountSecurityPage();

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(view?.type).toBe(AdminChangePasswordView);
  });

});
