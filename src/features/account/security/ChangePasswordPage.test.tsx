import { render } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => mocks }));
vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: () => ({ status: 'authenticated', context: { role: 'ServiceProvider' } }),
}));
vi.mock('@/features/account/common/AccountWorkspaceContext', () => ({ useAccountWorkspace: () => ({ isInsideShell: false }) }));
vi.mock('@/components/navigation/PublicNavigation', () => ({ PublicNavigation: () => null }));
vi.mock('@/features/account/common/AccountWorkspaceNav', () => ({ AccountWorkspaceNav: () => null }));
import { ChangePasswordPage } from './ChangePasswordPage';

beforeEach(() => vi.clearAllMocks());
it('sends a Service Provider to their own password security page', () => {
  render(<ChangePasswordPage />);
  expect(mocks.replace).toHaveBeenCalledWith('/provider/security');
});
