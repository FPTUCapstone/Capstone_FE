import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

import { AdminChangePasswordView } from '../AdminChangePasswordView';

describe('AdminChangePasswordView', () => {
  it('renders the admin change password view with Administrator badge', () => {
    render(<AdminChangePasswordView />);

    expect(screen.getByRole('heading', { name: 'Đổi mật khẩu' })).toBeDefined();
    expect(screen.getAllByText('Administrator').length).toBe(2);
    expect(screen.getByLabelText('Mật khẩu hiện tại')).toBeDefined();
    expect(screen.getByLabelText('Mật khẩu mới')).toBeDefined();
    expect(screen.getByLabelText('Xác nhận mật khẩu mới')).toBeDefined();
  });
});
