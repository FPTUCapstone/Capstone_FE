import { describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ session: vi.fn(), cookies: vi.fn(), redirect: vi.fn((path: string): never => { throw new Error(path); }) }));
vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect, useRouter: () => ({}) }));
vi.mock('@/lib/server/adminSession', () => ({ verifyAdminSessionFromCookies: mocks.session }));
import StaffComplaintLayout from '../../../../app/admin/(console)/staff/post-trip-complaints/layout';
import { getSafeAdminReturnUrl } from '@/features/admin/auth/AdminSignInForm';
describe('Staff complaint route authority', () => {
  it('preserves a valid Staff detail return route', () => { expect(getSafeAdminReturnUrl('/admin/staff/post-trip-complaints/12', 'Staff')).toBe('/admin/staff/post-trip-complaints/12'); });
  it('does not send Administrator into Staff review', () => { expect(getSafeAdminReturnUrl('/admin/staff/post-trip-complaints/12', 'Administrator')).toBe('/admin'); });
  it('requires Staff at the server page boundary', async () => { mocks.session.mockReturnValue({ role: 'Administrator' }); await expect(StaffComplaintLayout({ children: 'restricted' })).rejects.toThrow('/admin'); });
  it('renders children for Staff', async () => { mocks.session.mockReturnValue({ role: 'Staff' }); expect(await StaffComplaintLayout({ children: 'staff content' })).toBe('staff content'); });
});

