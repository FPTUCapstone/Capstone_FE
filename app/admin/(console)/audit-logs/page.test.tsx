import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCookie: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: mocks.getCookie }),
}));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/features/admin/audit-logs/components/AuditLogManagementView', () => ({
  AuditLogManagementView: () => null,
}));

import AuditLogsPage from './page';

describe('UC-68 protected route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('redirects a missing Admin cookie to login with the audit-list return URL', async () => {
    mocks.getCookie.mockReturnValue(undefined);

    await AuditLogsPage();

    expect(mocks.redirect).toHaveBeenCalledWith(
      '/admin/login?returnUrl=%2Fadmin%2Faudit-logs',
    );
  });

  it('renders the route when the HttpOnly Admin cookie is present', async () => {
    mocks.getCookie.mockReturnValue({ value: 'server-only-token' });

    await AuditLogsPage();

    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
