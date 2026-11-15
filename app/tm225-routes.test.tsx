import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
const mocks = vi.hoisted(() => ({ session: vi.fn(), redirect: vi.fn((path: string) => { throw new Error(path); }) }));
vi.mock('next/headers', () => ({ cookies: async () => ({}) }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/lib/server/adminSession', () => ({ verifyAdminSessionFromCookies: mocks.session }));
vi.mock('@/features/hotel-service-provider/components/AccountProvisioningForm', () => ({ AccountProvisioningForm: ({ kind }: { kind: string }) => <p>Create {kind}</p> }));
import StaffPage from './admin/(console)/users/create-staff/page';
import ProviderPage from './admin/(console)/service-providers/create/page';
import { UserAccountDirectoryUnavailableView } from '@/features/admin/user-accounts/components/UserAccountDirectoryUnavailableView';

beforeEach(() => vi.clearAllMocks());
describe('UC76–77 route authorization and entrypoints', () => {
  it('limits Staff creation to Administrator', async () => {
    mocks.session.mockReturnValue({ role: 'Administrator' });
    render(await StaffPage());
    expect(screen.getByText('Create staff')).toBeDefined();
  });
  it('limits provider creation to Staff', async () => {
    mocks.session.mockReturnValue({ role: 'Administrator' });
    render(await ProviderPage());
    expect(screen.queryByText('Create provider')).toBeNull();
  });
  it('redirects restricted Staff to first-password before creation', async () => {
    mocks.session.mockReturnValue({ role: 'Staff', mustChangePassword: true });
    await expect(ProviderPage()).rejects.toThrow('/admin/first-password');
  });
  it.each(['Administrator', 'Staff'] as const)('offers the assigned provisioning entrypoint for %s', role => {
    render(<UserAccountDirectoryUnavailableView role={role} />);
    expect(screen.getByRole('link', { name: role === 'Administrator' ? 'Create Staff Account' : 'Create Service Provider Account' }).getAttribute('href')).toBe(role === 'Administrator' ? '/admin/users/create-staff' : '/admin/service-providers/create');
    expect(screen.queryByRole('link', { name: role === 'Staff' ? 'Create Staff Account' : 'Create Service Provider Account' })).toBeNull();
  });
});
