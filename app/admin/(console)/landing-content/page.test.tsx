import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  resolveWebSession: vi.fn(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock('@/lib/server/webSession', () => ({ resolveWebSession: mocks.resolveWebSession }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect, notFound: mocks.notFound }));
vi.mock('@/features/admin/landing-content/LandingContentScreen', () => ({ LandingContentScreen: () => null }));

import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { LandingContentScreen } from '@/features/admin/landing-content/LandingContentScreen';
import LandingContentPage from './page';

describe('LandingContentPage protected route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('redirects to sign-in when there is no administration session', async () => {
    mocks.resolveWebSession.mockResolvedValue(null);

    await LandingContentPage();

    expect(mocks.redirect).toHaveBeenCalledWith('/sign-in?returnUrl=%2Fadmin%2Flanding-content');
  });

  it.each(['Administrator', 'Staff'])('renders the page view for an allowed %s session', async (role) => {
    mocks.resolveWebSession.mockResolvedValue({ accessToken: 'tok', role });

    const view = await LandingContentPage();

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(view?.type).toBe(LandingContentScreen);
  });

  it.each(['Traveler'])('renders AdminAccessDeniedView for a %s session', async (role) => {
    mocks.resolveWebSession.mockResolvedValue({ accessToken: 'tok', role });

    const view = await LandingContentPage();

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(view?.type).toBe(AdminAccessDeniedView);
  });
});
