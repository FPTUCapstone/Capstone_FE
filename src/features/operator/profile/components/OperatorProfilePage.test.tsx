import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as webSessionModule from '@/features/auth/session/useWebSession';
import { OperatorProfilePage } from './OperatorProfilePage';

// Mock useSearchParams
const mockGet = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mockGet,
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('OperatorProfilePage Component (Workspace integration & loading states)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue(null); // default real mode
    process.env = { ...originalEnv };

    vi.spyOn(webSessionModule, 'useWebSession').mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 1048,
        email: 'operator@tripmate.vn',
        fullName: 'Han River Operator',
        role: 'TourOperator',
        status: 'Active',
        applicationStatus: 'Approved',
        applicationUnresolved: false,
        accessToken: 'mock-token',
        accessTokenExpiresAtUtc: new Date(Date.now() + 60000).toISOString(),
      },
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllEnvs();
  });

  it('renders neutral loading spinner while restoring session or fetching profile', () => {
    vi.spyOn(webSessionModule, 'useWebSession').mockReturnValue({
      status: 'restoring',
      context: null,
    });

    render(<OperatorProfilePage />);
    expect(screen.getByRole('status', { name: /Đang tải dữ liệu hồ sơ/i })).toBeDefined();
  });

  it('in real mode: renders workspace navigation and truthful pending backend state', async () => {
    render(<OperatorProfilePage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Hồ sơ doanh nghiệp/i })).toBeDefined();
    });

    expect(
      screen.getByText(/Tính năng hồ sơ đối tác đang chờ kết nối máy chủ/i)
    ).toBeDefined();

    // Workspace navigation rendered
    expect(screen.getByLabelText(/Điều hướng không gian làm việc đối tác/i)).toBeDefined();
  });

  it('in demo mode with ?demo=1: renders demo fixture data', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', 'true');
    mockGet.mockReturnValue('1');

    render(<OperatorProfilePage />);

    await waitFor(() => {
      expect(screen.getAllByText(/Han River Travel Co., Ltd/i).length).toBeGreaterThan(0);
    });

    expect(screen.getByText(/DEMO ONLY/i)).toBeDefined();
  });
});
