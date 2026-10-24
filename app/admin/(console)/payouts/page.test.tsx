import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  resolveWebSession: vi.fn(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock('@/lib/server/webSession', () => ({ resolveWebSession: mocks.resolveWebSession }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect, notFound: mocks.notFound }));
vi.mock('@/features/admin/payout-records/PayoutRecordsScreen', () => ({ PayoutRecordsScreen: () => null }));

import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { PayoutRecordsScreen } from '@/features/admin/payout-records/PayoutRecordsScreen';
import PayoutsPage from './page';

describe('PayoutsPage protected route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('redirects to sign-in when there is no administration session', async () => {
    mocks.resolveWebSession.mockResolvedValue(null);

    await PayoutsPage();

    expect(mocks.redirect).toHaveBeenCalledWith('/sign-in?returnUrl=%2Fadmin%2Fpayouts');
  });

  it.each(['Staff'])('renders the page view for an allowed %s session', async (role) => {
    mocks.resolveWebSession.mockResolvedValue({ accessToken: 'tok', role });

    const view = await PayoutsPage();

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(view?.type).toBe(PayoutRecordsScreen);
  });

  it.each(['Administrator'])('renders AdminAccessDeniedView for a %s session', async (role) => {
    mocks.resolveWebSession.mockResolvedValue({ accessToken: 'tok', role });

    const view = await PayoutsPage();

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(view?.type).toBe(AdminAccessDeniedView);
  });
});
