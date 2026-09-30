import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateSchedulingRequestPage } from '../components/CreateSchedulingRequestPage';

vi.mock('@/components/navigation/PublicNavigation', () => ({
  PublicNavigation: () => <nav data-testid="public-navigation">Public Navigation</nav>,
}));

vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: () => ({
    status: 'unauthenticated',
    context: null,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('CreateSchedulingRequestPage (/plan - UC-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders page layout with PublicNavigation, breadcrumb, and title', () => {
    render(<CreateSchedulingRequestPage />);

    expect(screen.getByTestId('public-navigation')).toBeDefined();
    expect(screen.getByText('Lập lịch trình thông minh')).toBeDefined();
    expect(
      screen.getByRole('heading', { name: /Lập Lịch Trình Du Lịch Tối Ưu/i, level: 1 }),
    ).toBeDefined();
    expect(screen.getByText(/Bạn đang sử dụng chế độ Khách/i)).toBeDefined();
  });
});
