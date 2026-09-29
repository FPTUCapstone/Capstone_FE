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

describe('Administrator return URL', () => {
  it('returns only local Admin routes and rejects open redirects or login loops', () => {
    expect(getSafeAdminReturnUrl('/admin/audit-logs')).toBe('/admin/audit-logs');
    expect(getSafeAdminReturnUrl('/admin/audit-logs?pageNumber=2')).toBe('/admin/audit-logs?pageNumber=2');
    expect(getSafeAdminReturnUrl('https://attacker.example/admin')).toBe('/admin/catalogue/points-of-interest/new');
    expect(getSafeAdminReturnUrl('//attacker.example/admin')).toBe('/admin/catalogue/points-of-interest/new');
    expect(getSafeAdminReturnUrl('/admin/login')).toBe('/admin/catalogue/points-of-interest/new');
  });

  it('returns to the protected Admin page after successful sign-in', async () => {
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
});
