import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  resolveWebSession: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('@/lib/server/webSession', () => ({ resolveWebSession: mocks.resolveWebSession }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/features/admin/audit-logs/components/AuditLogManagementView', () => ({
  AuditLogManagementView: () => null,
}));

import AuditLogsPage from './page';

describe('UC-68 protected route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('redirects to sign-in with the audit-list return URL when there is no administration session', async () => {
    mocks.resolveWebSession.mockResolvedValue(null);

    await AuditLogsPage();

    expect(mocks.redirect).toHaveBeenCalledWith('/sign-in?returnUrl=%2Fadmin%2Faudit-logs');
  });

  it('renders the route for an Administrator session', async () => {
    mocks.resolveWebSession.mockResolvedValue({ accessToken: 'tok', role: 'Administrator' });

    await AuditLogsPage();

    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it('renders the Administrator-only access denied view for a Staff session', async () => {
    mocks.resolveWebSession.mockResolvedValue({ accessToken: 'tok', role: 'Staff' });

    const view = await AuditLogsPage();

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(view).toBeTruthy();
  });
});
