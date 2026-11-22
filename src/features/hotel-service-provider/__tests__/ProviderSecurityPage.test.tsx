import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(), push: vi.fn(),
  session: { status: 'authenticated', context: { userId: 7, role: 'ServiceProvider', status: 'Active', fullName: 'Provider', email: 'provider@example.com', mustChangePassword: false } },
  execute: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => mocks }));
vi.mock('@/features/auth/session/useWebSession', () => ({ useWebSession: () => mocks.session }));
vi.mock('@/features/account/security/webChangePasswordCapability', () => ({ createWebChangePasswordCapability: () => ({ status: 'available', execute: mocks.execute }) }));
vi.mock('@/features/account/security/ChangePasswordForm', () => ({
  ChangePasswordForm: ({ onCancel, onSessionExpired, userDisplay }: { onCancel: () => void; onSessionExpired: () => void; userDisplay: { name: string } }) => <div>
    <p>{userDisplay.name}</p><button onClick={onCancel}>Cancel change</button><button onClick={onSessionExpired}>Expire session</button>
  </div>,
}));
import { ProviderSecurityPage } from '../components/ProviderSecurityPage';
import { ProviderWorkspaceShell } from '../components/ProviderWorkspaceShell';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.status = 'authenticated';
  mocks.session.context.role = 'ServiceProvider';
  mocks.session.context.mustChangePassword = false;
});

describe('Provider password security', () => {
  it('allows an already activated Provider to change their password', () => {
    render(<ProviderSecurityPage />);
    expect(screen.getByRole('heading', { name: 'Account security' })).toBeDefined();
    expect(screen.getByText('Provider')).toBeDefined();
    expect(mocks.replace).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel change' }));
    expect(mocks.push).toHaveBeenCalledWith('/provider/bookings');
  });
  it('keeps the first-password requirement in force', () => {
    mocks.session.context.mustChangePassword = true;
    render(<ProviderSecurityPage />);
    expect(screen.queryByRole('button', { name: 'Cancel change' })).toBeNull();
    expect(mocks.replace).toHaveBeenCalledWith('/first-password');
  });
  it('does not render the Provider form for a Traveler', () => {
    mocks.session.context.role = 'Traveler';
    render(<ProviderSecurityPage />);
    expect(screen.queryByRole('button', { name: 'Cancel change' })).toBeNull();
    expect(mocks.replace).toHaveBeenCalledWith('/');
  });
  it('preserves the security return URL on session expiry', () => {
    render(<ProviderSecurityPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Expire session' }));
    expect(mocks.replace).toHaveBeenCalledWith('/sign-in?returnUrl=%2Fprovider%2Fsecurity');
  });
  it('does not show an authenticated form while restoring', () => {
    mocks.session.status = 'restoring';
    render(<ProviderSecurityPage />);
    expect(screen.getByRole('status')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Cancel change' })).toBeNull();
  });
  it('makes security reachable from the Provider workspace', () => {
    render(<ProviderWorkspaceShell><p>Workspace</p></ProviderWorkspaceShell>);
    expect(screen.getByRole('link', { name: 'Security' }).getAttribute('href')).toBe('/provider/security');
  });
});
