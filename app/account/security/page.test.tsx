import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: () => ({
    status: 'authenticated',
    context: {
      userId: 1,
      email: 'traveler@tripmate.vn',
      fullName: 'Nguyen Van A',
      role: 'Traveler',
      status: 'Active',
      accessToken: 'mock-token',
    },
  }),
}));

import AccountSecurityPage, { metadata } from './page';

describe('/account/security production route', () => {
  it('exports appropriate metadata', () => {
    expect(metadata.title).toBe('Đổi mật khẩu | TripMate');
  });

  it('renders the change password page for authenticated user', () => {
    render(<AccountSecurityPage />);
    expect(screen.getByRole('heading', { name: 'Đổi mật khẩu' })).toBeDefined();
    expect(screen.getAllByText('Nguyen Van A').length).toBe(2);
    expect(screen.getByLabelText('Mật khẩu hiện tại')).toBeDefined();
    expect(screen.getByLabelText('Mật khẩu mới')).toBeDefined();
    expect(screen.getByLabelText('Xác nhận mật khẩu mới')).toBeDefined();
  });
});
