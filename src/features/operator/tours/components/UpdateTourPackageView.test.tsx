import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateTourPackageView } from './UpdateTourPackageView';
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

const mockTourDraft: TourPackageDto = {
  id: 'tour-ba-na',
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
  media: [],
  createdAt: '2026-10-01',
  updatedAt: '2026-10-01',
};

describe('UpdateTourPackageView (UC-36 Screen #42)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pre-filled tour package fields for editing draft', () => {
    render(<UpdateTourPackageView initialTour={mockTourDraft} isDemo={false} />);

    expect(screen.getByDisplayValue('Khám phá Bà Nà Hills - Cầu Vàng')).toBeDefined();
    expect(screen.getByDisplayValue('Đà Nẵng')).toBeDefined();
    expect(screen.getByDisplayValue('1250000')).toBeDefined();
  });

  it('renders truthful PENDING_BE_INTEGRATION banner in real mode', () => {
    render(<UpdateTourPackageView initialTour={mockTourDraft} isDemo={false} />);

    expect(
      screen.getByText(/Tính năng cập nhật gói tour đang chờ kết nối máy chủ/i)
    ).toBeDefined();
  });

  it('enforces read-only mode when status is Pending (MSG122)', () => {
    const pendingTour: TourPackageDto = {
      ...mockTourDraft,
      status: 'Pending',
    };

    render(<UpdateTourPackageView initialTour={pendingTour} isDemo={false} />);

    // Read-only notification banner
    expect(
      screen.getByText(/Gói tour đang chờ kiểm duyệt/i)
    ).toBeDefined();

    // Inputs should be disabled
    const titleInput = screen.getByLabelText(/Tên gói tour/i) as HTMLInputElement;
    expect(titleInput.disabled).toBe(true);
  });

  it('displays approved version notification and sold seats (BR-103, BR-61)', () => {
    const approvedTour: TourPackageDto = {
      ...mockTourDraft,
      status: 'Approved',
      version: 1,
      schedules: [
        {
          id: 'sch-1',
          departureDate: '2026-11-20',
          returnDate: '2026-11-20',
          totalCapacity: 30,
          reservedCapacity: 12, // 12 sold!
          meetingPoint: 'Khách sạn trung tâm',
          status: 'Scheduled',
        },
      ],
    };

    render(<UpdateTourPackageView initialTour={approvedTour} isDemo={false} />);

    expect(screen.getByText(/12 chỗ đã xác nhận đặt chỗ/i)).toBeDefined();
    expect(screen.getByText(/Sẽ tạo v2/i)).toBeDefined();
  });

  it('displays rejection notice if tour status is Rejected', () => {
    const rejectedTour: TourPackageDto = {
      ...mockTourDraft,
      status: 'Rejected',
      rejectionReason: 'Thiếu hình ảnh chất lượng cao và thông tin xe đưa đón chưa rõ ràng.',
    };

    render(<UpdateTourPackageView initialTour={rejectedTour} isDemo={false} />);

    expect(screen.getByText(/Lý do từ chối từ Quản trị viên:/i)).toBeDefined();
    expect(
      screen.getByText(/Thiếu hình ảnh chất lượng cao và thông tin xe đưa đón chưa rõ ràng./i)
    ).toBeDefined();
  });

  it('enforces BR-61 capacity floor validation on client update', async () => {
    const tourWithBookings: TourPackageDto = {
      ...mockTourDraft,
      schedules: [
        {
          id: 'sch-1',
          departureDate: '2026-11-20',
          returnDate: '2026-11-20',
          totalCapacity: 30,
          reservedCapacity: 15, // 15 slots sold!
          meetingPoint: 'Khách sạn trung tâm',
          status: 'Scheduled',
        },
      ],
    };

    render(<UpdateTourPackageView initialTour={tourWithBookings} isDemo={false} />);

    const capInput = screen.getByLabelText(/Sức chứa tổng cộng/i);
    // Lower capacity below sold slots (from 30 to 10)
    fireEvent.change(capInput, { target: { value: '10' } });

    const saveBtn = screen.getByRole('button', { name: /Lưu thay đổi/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Sức chứa không được giảm xuống dưới số lượng chỗ đã bán/i)
      ).toBeDefined();
    });
  });

  describe('Demo Mode (?demo=1 continuity)', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
    });

    it('preserves demo=1 on back links when isDemo is true', () => {
      render(<UpdateTourPackageView initialTour={mockTourDraft} isDemo={true} />);

      const backLinks = screen.getAllByRole('link', { name: /Quay lại danh sách|Quay lại/i });
      for (const link of backLinks) {
        expect(link.getAttribute('href')).toBe('/partner/tours?demo=1');
      }
    });

    it('keeps back links clean when isDemo is false', () => {
      render(<UpdateTourPackageView initialTour={mockTourDraft} isDemo={false} />);

      const backLinks = screen.getAllByRole('link', { name: /Quay lại danh sách|Quay lại/i });
      for (const link of backLinks) {
        expect(link.getAttribute('href')).toBe('/partner/tours');
      }
    });

    it('preserves demo=1 on router.push when clicking Gửi xét duyệt in demo mode', () => {
      render(<UpdateTourPackageView initialTour={mockTourDraft} isDemo={true} />);

      const submitBtn = screen.getByRole('button', { name: /Gửi xét duyệt/i });
      fireEvent.click(submitBtn);

      expect(mocks.push).toHaveBeenCalledWith(`/partner/tours/${mockTourDraft.id}/submit?demo=1`);
    });

    it('preserves demo=1 on router.push after saving changes in demo mode', async () => {
      render(<UpdateTourPackageView initialTour={mockTourDraft} isDemo={true} />);

      const saveBtn = screen.getByRole('button', { name: /Lưu thay đổi/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mocks.push).toHaveBeenCalledWith('/partner/tours?demo=1');
      });
    });
  });
});
