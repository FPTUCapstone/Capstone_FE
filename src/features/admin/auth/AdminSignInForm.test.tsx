import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminSignInForm, getSafeAdminReturnUrl } from './AdminSignInForm';

const { router } = vi.hoisted(() => ({
  router: { replace: vi.fn(), refresh: vi.fn() },
}));

vi.mock('next/navigation', () => ({ useRouter: () => router }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ message: 'Signed in.' })));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Administration return URL and role-aware routing', () => {
  it('returns only local Admin routes for Administrator and defaults to /admin instead of /admin/catalogue/points-of-interest/new', () => {
    expect(getSafeAdminReturnUrl(undefined, 'Administrator')).toBe('/admin');
    expect(getSafeAdminReturnUrl('/admin/audit-logs', 'Administrator')).toBe('/admin/audit-logs');
    expect(getSafeAdminReturnUrl('/admin/audit-logs?pageNumber=2', 'Administrator')).toBe('/admin/audit-logs?pageNumber=2');
    expect(getSafeAdminReturnUrl('/admin/reports', 'Administrator')).toBe('/admin/reports');
    expect(getSafeAdminReturnUrl('/admin/reports?demo=true', 'Administrator')).toBe('/admin/reports?demo=true');
    expect(getSafeAdminReturnUrl('https://attacker.example/admin', 'Administrator')).toBe('/admin');
    expect(getSafeAdminReturnUrl('//attacker.example/admin', 'Administrator')).toBe('/admin');
    expect(getSafeAdminReturnUrl('/admin/login', 'Administrator')).toBe('/admin');
    expect(getSafeAdminReturnUrl('/admin/forgot-password', 'Administrator')).toBe('/admin');
  });

  it('routes Staff to /admin/staff by default and prevents redirect into Administrator-only or pending routes', () => {
    expect(getSafeAdminReturnUrl(undefined, 'Staff')).toBe('/admin/staff');
    expect(getSafeAdminReturnUrl('/admin/staff', 'Staff')).toBe('/admin/staff');
    expect(getSafeAdminReturnUrl('/admin/account/security', 'Staff')).toBe('/admin/account/security');
    expect(getSafeAdminReturnUrl('/admin/tours/reviews', 'Staff')).toBe('/admin/staff');
    expect(getSafeAdminReturnUrl('/admin/catalogue/points-of-interest/new', 'Staff')).toBe('/admin/staff');
    expect(getSafeAdminReturnUrl('/admin/tour-operator-applications/1', 'Staff')).toBe('/admin/staff');
    expect(getSafeAdminReturnUrl('/admin/reports', 'Staff')).toBe('/admin/staff');
    expect(getSafeAdminReturnUrl('/admin/reports?demo=true', 'Staff')).toBe('/admin/staff');
    expect(getSafeAdminReturnUrl('/admin', 'Staff')).toBe('/admin/staff');
    expect(getSafeAdminReturnUrl('/admin/audit-logs', 'Staff')).toBe('/admin/staff');
    expect(getSafeAdminReturnUrl('/admin/settings/algorithm-parameters', 'Staff')).toBe('/admin/staff');
    expect(getSafeAdminReturnUrl('https://attacker.example/admin/staff', 'Staff')).toBe('/admin/staff');
  });

  it('returns Administrator to the protected Admin page after successful sign-in', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ authenticated: true, role: 'Administrator' })),
    );

    render(<AdminSignInForm returnUrl="/admin/audit-logs" />);
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'admin@tripmate.local' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'ValidPassword!123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/admin/audit-logs'));
    expect(router.refresh).toHaveBeenCalledTimes(1);
  });

  it('routes Staff to /admin/staff after sign-in even when returnUrl points to an Administrator-only page', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ authenticated: true, role: 'Staff' })),
    );

    render(<AdminSignInForm returnUrl="/admin/audit-logs" />);
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'staff@tripmate.local' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'ValidPassword!123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/admin/staff'));
    expect(router.refresh).toHaveBeenCalledTimes(1);
  });
});
