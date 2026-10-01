import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCookie: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: mocks.getCookie }),
}));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/features/admin/account/AdminChangePasswordView', () => ({
  AdminChangePasswordView: () => <div>Admin UC-07</div>,
}));

import AdminAccountSecurityPage from './page';

describe('/admin/account/security protected route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('redirects a missing Admin session cookie through the canonical guard', async () => {
    mocks.getCookie.mockReturnValue(undefined);

    await AdminAccountSecurityPage();

    expect(mocks.redirect).toHaveBeenCalledWith('/admin/login');
  });

  it('remains accessible when the HttpOnly Admin session cookie is present', async () => {
    mocks.getCookie.mockReturnValue({ value: 'server-only-token' });

    render(await AdminAccountSecurityPage());

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(screen.getByText('Admin UC-07')).toBeDefined();
  });
});
