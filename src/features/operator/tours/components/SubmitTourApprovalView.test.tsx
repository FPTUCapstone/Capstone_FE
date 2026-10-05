import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubmitTourApprovalView } from './SubmitTourApprovalView';
import type { TourPackageDto } from '../types/tourLifecycle';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.push,
    replace: mocks.replace,
  }),
}));

const mockCompleteTour: TourPackageDto = {
  id: 'tour-complete-1',
  tourCode: 'TP-0142',
  operatorUserId: 101,
  title: 'Khám phá Bà Nà Hills - Cầu Vàng',
  destination: 'Đà Nẵng',
  category: 'Di sản & Thiên nhiên',
  durationDays: 1,
  basePrice: 1250000,
  maxCapacity: 30,
  description: 'Trải nghiệm cáp treo đạt kỷ lục thế giới và ngắm nhìn Cầu Vàng hùng vĩ.',
  cancellationPolicy: 'Hoàn tiền 100% khi hủy trước ngày khởi hành 24 giờ.',
  status: 'Draft',
  version: 1,
  itinerary: [
    {
      dayNo: 1,
      title: 'Ngày 1: Bà Nà Hills trọn ngày',
      activities: [
        {
          id: 'act-1',
          time: '08:00',
          poiName: 'Cáp treo Bà Nà',
          stayDurationMinutes: 60,
          transport: 'Cáp treo',
        },
      ],
    },
  ],
  schedules: [
    {
      id: 'sch-1',
      departureDate: '2026-11-20',
      returnDate: '2026-11-20',
      totalCapacity: 30,
      reservedCapacity: 0,
      meetingPoint: 'Khách sạn trung tâm',
      status: 'Scheduled',
    },
  ],
  media: [
    {
      id: 'm-1',
      url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
      caption: 'Cầu Vàng',
      isPrimary: true,
    },
  ],
  createdAt: '2026-10-01',
  updatedAt: '2026-10-01',
};

const mockIncompleteTour: TourPackageDto = {
  ...mockCompleteTour,
  id: 'tour-incomplete-1',
  cancellationPolicy: '', // Missing policy!
  schedules: [], // Missing schedule!
};

describe('SubmitTourApprovalView (UC-37 Screen #43)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Screen #43 header and tour summary card', () => {
    render(<SubmitTourApprovalView tour={mockCompleteTour} isDemo={false} />);

    expect(
      screen.getByRole('heading', { level: 1, name: /Gửi duyệt gói tour/i })
    ).toBeDefined();
    expect(screen.getByText('Khám phá Bà Nà Hills - Cầu Vàng')).toBeDefined();
    expect(screen.getByText(/TP-0142/i)).toBeDefined();
    expect(screen.getByText(/1,250,000 đ/i)).toBeDefined();
  });

  it('renders completeness checklist items', () => {
    render(<SubmitTourApprovalView tour={mockCompleteTour} isDemo={false} />);

    expect(screen.getByText(/Tên tour, điểm đến và mô tả chi tiết/i)).toBeDefined();
    expect(screen.getByText(/Lịch trình chi tiết và điểm tham quan/i)).toBeDefined();
    expect(screen.getByText(/Giá tour và sức chứa chỗ/i)).toBeDefined();
    expect(screen.getByText(/Chính sách hủy tour/i)).toBeDefined();
    expect(screen.getByText(/Lịch khởi hành mở bán/i)).toBeDefined();
  });

  it('enforces submit button state based on mandatory criteria', () => {
    const { unmount } = render(<SubmitTourApprovalView tour={mockCompleteTour} isDemo={false} />);

    const submitBtn = screen.getByRole('button', { name: /Gửi yêu cầu xét duyệt/i });
    expect((submitBtn as HTMLButtonElement).disabled).toBe(false);

    unmount();

    render(<SubmitTourApprovalView tour={mockIncompleteTour} isDemo={false} />);

    const disabledBtn = screen.getByRole('button', { name: /Gửi yêu cầu xét duyệt/i });
    expect((disabledBtn as HTMLButtonElement).disabled).toBe(true);

    expect(
      screen.getByText(/mục bắt buộc chưa hoàn tất/i)
    ).toBeDefined();
  });

  it('opens confirmation modal dialog (MSG111) when submit is clicked', () => {
    render(<SubmitTourApprovalView tour={mockCompleteTour} isDemo={false} />);

    const submitBtn = screen.getByRole('button', { name: /Gửi yêu cầu xét duyệt/i });
    fireEvent.click(submitBtn);

    expect(
      screen.getByRole('heading', { name: /Gửi gói tour này để xét duyệt/i })
    ).toBeDefined();
    expect(
      screen.getByText(/Gói tour sẽ chuyển sang trạng thái/i)
    ).toBeDefined();
  });

  it('displays truthful PENDING_BE_INTEGRATION message upon confirm in real mode', async () => {
    render(<SubmitTourApprovalView tour={mockCompleteTour} isDemo={false} />);

    // Open modal
    const submitBtn = screen.getByRole('button', { name: /Gửi yêu cầu xét duyệt/i });
    fireEvent.click(submitBtn);

    // Click confirm in modal
    const confirmBtn = screen.getByRole('button', { name: /Xác nhận gửi/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(
        screen.getAllByText(/Tính năng quản lý vòng đời gói tour đối tác đang chờ kết nối dịch vụ máy chủ/i).length
      ).toBeGreaterThan(0);
    });
  });
});
