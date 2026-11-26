import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as webSessionModule from '@/features/auth/session/useWebSession';
import * as operatorProfileService from '../services/operatorProfileService';
import { OPERATOR_PROFILE_MESSAGES, type OperatorProfileDto } from '../types/operatorProfile';
import { OperatorProfilePage } from './OperatorProfilePage';

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

const realProfile: OperatorProfileDto = {
  userId: 12,
  businessName: 'Sun Tours',
  businessDescription: 'Family tours',
  businessAddress: '1 Beach Rd',
  contactPhone: '0901234567',
  contactEmail: 'hello@suntours.vn',
  website: 'https://suntours.vn',
  businessLicenceNumber: '79-1234/2026/TCDL-GPLHQT',
  taxCode: '0312345678',
  approvalStatus: 'Approved',
  accountEmail: 'owner@suntours.vn',
  isDemo: false,
};

describe('OperatorProfilePage Component (Workspace integration & states)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue(null);
    process.env = { ...originalEnv };

    vi.spyOn(webSessionModule, 'useWebSession').mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 12,
        email: 'owner@suntours.vn',
        fullName: 'Sun Tours Operator',
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
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('renders loading spinner while restoring session', () => {
    vi.spyOn(webSessionModule, 'useWebSession').mockReturnValue({
      status: 'restoring',
      context: null,
    });
    vi.spyOn(operatorProfileService, 'getOperatorProfile').mockReturnValue(
      new Promise(() => {})
    );

    render(<OperatorProfilePage />);
    expect(screen.getByRole('status', { name: /Đang tải dữ liệu hồ sơ/i })).toBeDefined();
  });

  it('in real mode: fetches and renders real profile data', async () => {
    vi.spyOn(operatorProfileService, 'getOperatorProfile').mockResolvedValue({
      status: 'SUCCESS',
      profile: realProfile,
      isDemo: false,
    });

    render(<OperatorProfilePage />);

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/Tên doanh nghiệp lữ hành/i) as HTMLInputElement;
      expect(nameInput.value).toBe('Sun Tours');
    });

    expect(screen.queryByText(/đang chờ kết nối máy chủ/i)).toBeNull();
    expect(screen.getByLabelText(/Điều hướng không gian làm việc đối tác/i)).toBeDefined();
  });

  it('in real mode: shows error alert and allows retry when load fails', async () => {
    const getSpy = vi
      .spyOn(operatorProfileService, 'getOperatorProfile')
      .mockRejectedValueOnce(
        new operatorProfileService.OperatorProfileApiError(
          OPERATOR_PROFILE_MESSAGES.SYSTEM_FAILURE,
          503
        )
      )
      .mockResolvedValueOnce({
        status: 'SUCCESS',
        profile: realProfile,
        isDemo: false,
      });

    render(<OperatorProfilePage />);

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('MSG127');
    });

    fireEvent.click(screen.getByRole('button', { name: /Thử lại/i }));

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledTimes(2);
      const nameInput = screen.getByLabelText(/Tên doanh nghiệp lữ hành/i) as HTMLInputElement;
      expect(nameInput.value).toBe('Sun Tours');
    });
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
