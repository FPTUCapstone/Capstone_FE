import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OperatorBookingsPage from './page';

let mockSearchParams = new URLSearchParams('');

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('OperatorBookingsPage (/partner/bookings)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      NEXT_PUBLIC_ENABLE_DEMO_FIXTURES: 'true',
    };
    mockSearchParams = new URLSearchParams('');
  });

  afterEach(() => {
    cleanup();
    process.env = originalEnv;
  });

  it('renders booking management workspace in production NO_BACKEND mode by default', async () => {
    mockSearchParams = new URLSearchParams('');
    render(<OperatorBookingsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Quản lý đơn đặt chỗ khách hàng/i)).toBeDefined();
      expect(screen.getByText(/Tính năng Quản lý đơn đặt chỗ đang chờ tích hợp API từ Backend/i)).toBeDefined();
    });
  });

  it('renders demo workspace when ?demo=1 query parameter is provided in non-production environment', async () => {
    mockSearchParams = new URLSearchParams('demo=1');
    render(<OperatorBookingsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Quản lý đơn đặt chỗ khách hàng/i)).toBeDefined();
      expect(screen.getByText(/Chế độ xem trước giao diện/i)).toBeDefined();
      expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
    });
  });
});
