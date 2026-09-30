import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateSchedulingRequestForm } from '../components/CreateSchedulingRequestForm';
import * as schedulingApi from '../services/schedulingApi';
import * as preferencesStorage from '@/features/account/preferences/travelPreferencesStorage';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('CreateSchedulingRequestForm (UC-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders all form cards and inputs correctly', () => {
    render(<CreateSchedulingRequestForm />);

    expect(screen.getByText(/1\. Điểm đến & Vị trí khởi hành/i)).toBeDefined();
    expect(screen.getByText(/2\. Thời gian & Thời lượng chuyến đi/i)).toBeDefined();
    expect(screen.getByText(/3\. Phương tiện & Nhịp độ di chuyển/i)).toBeDefined();
    expect(screen.getByText(/4\. Ngân sách & Sở thích trải nghiệm/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i })).toBeDefined();
  });

  it('pre-fills preferences from UC-09 stored preferences', () => {
    vi.spyOn(preferencesStorage, 'loadStoredPreferences').mockReturnValueOnce({
      interests: ['food', 'relaxation'],
      travelStyle: 'couple',
      budgetLevel: 'premium',
      preferredTransport: 'car',
      travelPace: 'relaxed',
      foodPreference: 'noRestriction',
      autoApplyToPlans: true,
    });

    render(<CreateSchedulingRequestForm userId={123} />);

    expect(screen.getByText(/Đã tự động điền các thông số từ/i)).toBeDefined();
    expect(screen.getByText(/6 giờ \(360 phút\)/i)).toBeDefined();
  });

  it('allows changing destination preset and updates start address', () => {
    render(<CreateSchedulingRequestForm />);

    const select = screen.getByLabelText(/Thành phố \/ Điểm đến/i);
    fireEvent.change(select, { target: { value: 'hoian' } });

    const startAddrInput = screen.getByLabelText(/Vị trí xuất phát/i) as HTMLInputElement;
    expect(startAddrInput.value).toContain('Hội An');
  });

  it('updates duration and live end-time calculation', () => {
    render(<CreateSchedulingRequestForm />);

    const timeInput = screen.getByLabelText(/Giờ xuất phát/i);
    fireEvent.change(timeInput, { target: { value: '09:00' } });

    const quickPresetBtn = screen.getByRole('button', { name: /3 giờ \(Nửa buổi\)/i });
    fireEvent.click(quickPresetBtn);

    expect(screen.getByText('12:00')).toBeDefined();
    expect(screen.getByText(/Cùng ngày ✓/i)).toBeDefined();
  });

  it('shows error if past start date is selected (BR-22)', async () => {
    render(<CreateSchedulingRequestForm />);

    const dateInput = screen.getByLabelText(/Ngày bắt đầu/i);
    fireEvent.change(dateInput, { target: { value: '2020-01-01' } });

    const submitBtn = screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Ngày bắt đầu chuyến đi không thể ở trong quá khứ/i)).toBeDefined();
    });
  });

  it('shows error if budget is zero or negative', async () => {
    render(<CreateSchedulingRequestForm />);

    const budgetInput = screen.getByLabelText(/Ngân sách dự kiến/i);
    fireEvent.change(budgetInput, { target: { value: '-50000' } });

    const submitBtn = screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Ngân sách dự kiến phải lớn hơn 0 VNĐ/i)).toBeDefined();
    });
  });

  it('toggles interest chips correctly', () => {
    render(<CreateSchedulingRequestForm />);

    const foodChip = screen.getByRole('button', { name: /Ẩm thực/i });
    fireEvent.click(foodChip);

    const natureChip = screen.getByRole('button', { name: /Thiên nhiên/i });
    fireEvent.click(natureChip);
  });

  it('submits form and calls onSuccess when API responds successfully', async () => {
    const mockSuccessResponse = {
      success: true,
      messageCode: 'MSG30',
      message: 'Khởi tạo lịch trình thành công!',
      data: {
        schedulingRequestId: 10,
        itineraryId: 888,
        title: 'Lịch trình Đà Nẵng',
        status: 'OptimalGenerated',
        totalEstimatedCost: 650000,
        totalDurationMinutes: 480,
        items: [],
      },
    };

    vi.spyOn(schedulingApi, 'createSchedulingRequest').mockResolvedValueOnce(mockSuccessResponse);
    const onSuccessMock = vi.fn();

    render(<CreateSchedulingRequestForm onSuccess={onSuccessMock} />);

    const submitBtn = screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Đang khởi tạo lịch trình tối ưu với thuật toán CSP/i)).toBeDefined();
    });

    await waitFor(
      () => {
        expect(onSuccessMock).toHaveBeenCalledWith(mockSuccessResponse.data);
      },
      { timeout: 4000 },
    );
  });
});
