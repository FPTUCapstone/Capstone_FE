import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  resolveWebSession: vi.fn(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock('@/lib/server/webSession', () => ({ resolveWebSession: mocks.resolveWebSession }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect, notFound: mocks.notFound }));
vi.mock('@/features/admin/user-accounts/components/UserAccountDetailUnavailableView', () => ({ UserAccountDetailUnavailableView: () => null }));

import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { UserAccountDetailUnavailableView } from '@/features/admin/user-accounts/components/UserAccountDetailUnavailableView';
import UserAccountDetailPage from './page';

describe('UserAccountDetailPage protected route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('redirects to sign-in when there is no administration session', async () => {
    mocks.resolveWebSession.mockResolvedValue(null);

    await UserAccountDetailPage({ params: Promise.resolve({ userId: '7' }) });

    expect(mocks.redirect).toHaveBeenCalledWith('/sign-in?returnUrl=%2Fadmin%2Fusers');
  });

  it.each(['Administrator'])('renders the page view for an allowed %s session', async (role) => {
    mocks.resolveWebSession.mockResolvedValue({ accessToken: 'tok', role });

    const view = await UserAccountDetailPage({ params: Promise.resolve({ userId: '7' }) });

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(view?.type).toBe(UserAccountDetailUnavailableView);
  });

  it.each(['Staff'])('renders AdminAccessDeniedView for a %s session', async (role) => {
    mocks.resolveWebSession.mockResolvedValue({ accessToken: 'tok', role });

    const view = await UserAccountDetailPage({ params: Promise.resolve({ userId: '7' }) });

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(view?.type).toBe(AdminAccessDeniedView);
  });
});
