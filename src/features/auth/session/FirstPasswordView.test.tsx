import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthStorage } from './authSession';
const mocks = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn(), logout: vi.fn(), adminLogout: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }) }));
vi.mock('@/lib/authApi', () => ({ webLogout: mocks.logout }));
vi.mock('@/features/admin/auth/services/adminSessionClient', () => ({ signOutAdminSession: mocks.adminLogout }));
vi.mock('@/features/account/security/webChangePasswordCapability', () => ({ createWebChangePasswordCapability: () => ({ status: 'available' }) }));
vi.mock('@/features/admin/account/adminChangePasswordCapability', () => ({ createAdminChangePasswordCapability: () => ({ status: 'available' }) }));
vi.mock('@/features/account/security/ChangePasswordForm', () => ({ ChangePasswordForm: ({ onSuccess }: { onSuccess: () => void }) => <button onClick={onSuccess}>Password API succeeded</button> }));
import { FirstPasswordView, WebFirstPasswordPage } from './FirstPasswordView';
const context = { userId: 7, email: 'provider@example.com', fullName: 'Provider', role: 'ServiceProvider', status: 'Active', accessToken: 'token', accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z' };
beforeEach(() => { vi.resetAllMocks(); AuthStorage.clear(); });
afterEach(() => AuthStorage.clear());
describe('first-password continuation', () => {
  it('waits for an unrestricted replacement context before provider navigation', () => {
    AuthStorage.accept({ ...context, mustChangePassword: true }, false);
    render(<FirstPasswordView />);
    fireEvent.click(screen.getByRole('button', { name: 'Password API succeeded' }));
    expect(mocks.replace).not.toHaveBeenCalled();
    AuthStorage.accept({ ...context, mustChangePassword: false }, false);
    fireEvent.click(screen.getByRole('button', { name: 'Password API succeeded' }));
    expect(mocks.replace).toHaveBeenCalledWith('/provider/bookings');
  });
  it('lets a restricted account sign out through the real session adapter', async () => {
    mocks.logout.mockResolvedValue(undefined);
    AuthStorage.accept({ ...context, mustChangePassword: true }, false);
    render(<FirstPasswordView />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/sign-in'));
    expect(AuthStorage.getContext()).toBeNull();
  });

  describe('WebFirstPasswordPage guard', () => {
    it('redirects already-unrestricted active accounts to their landing destination', () => {
      AuthStorage.accept({ ...context, mustChangePassword: false }, false);
      render(<WebFirstPasswordPage />);
      expect(mocks.replace).toHaveBeenCalledWith('/provider/bookings');
    });

    it('renders the password view when mustChangePassword is true', () => {
      AuthStorage.accept({ ...context, mustChangePassword: true }, false);
      render(<WebFirstPasswordPage />);
      expect(screen.getByText('Change your temporary password to continue.')).toBeDefined();
      expect(mocks.replace).not.toHaveBeenCalled();
    });
  });
});
