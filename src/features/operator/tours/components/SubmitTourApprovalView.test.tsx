import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as service from '../services/operatorTourService';
import { OperatorTourApiError } from '../services/operatorTourApi';
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
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('identifies the tour, traps focus, and restores the trigger on Escape or backdrop dismissal without submitting', () => {
    const submit = vi.spyOn(service, 'submitTourForApproval');
    render(<SubmitTourApprovalView tour={mockCompleteTour} />);
    const trigger = screen.getByRole('button', { name: /Gửi yêu cầu xét duyệt/i });
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog').textContent).toContain(mockCompleteTour.title);
    const cancel = screen.getByRole('button', { name: 'Hủy bỏ' });
    expect(document.activeElement).toBe(cancel);
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Xác nhận gửi' }));
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(cancel);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('dialog'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(submit).not.toHaveBeenCalled();
  });

  it('sends the note once, locks request controls, and stays read-only after confirmed success until navigation', async () => {
    vi.useFakeTimers();
    let resolve!: (value: Awaited<ReturnType<typeof service.submitTourForApproval>>) => void;
    const submit = vi.spyOn(service, 'submitTourForApproval').mockImplementation(() => new Promise((done) => { resolve = done; }));
    render(<SubmitTourApprovalView tour={mockCompleteTour} />);
    const note = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(note, { target: { value: 'Staff note' } });
    fireEvent.click(screen.getByRole('button', { name: /Gửi yêu cầu xét duyệt/i }));
    const confirm = screen.getByRole('button', { name: 'Xác nhận gửi' });
    act(() => { fireEvent.click(confirm); fireEvent.click(confirm); });
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit.mock.calls[0][1].note).toBe('Staff note');
    expect(note.disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Quay lại chỉnh sửa' }) as HTMLButtonElement).disabled).toBe(true);
    await act(async () => resolve({ status: 'SUCCESS', data: { ...mockCompleteTour, status: 'Pending', submittedAtUtc: '2026-11-18T12:00:00Z' } }));
    expect((screen.getByRole('button', { name: /Gửi yêu cầu xét duyệt/i }) as HTMLButtonElement).disabled).toBe(true);
    expect(note.disabled).toBe(true);
    expect(screen.getByText('Chờ duyệt')).toBeDefined();
    await act(async () => { await vi.advanceTimersByTimeAsync(1200); });
    expect(mocks.push).toHaveBeenCalledWith('/partner/tours');
  });

  it.each([0, 409, 500])('requires reloading before a retry for uncertain or conflicting outcome %s', async (status) => {
    vi.spyOn(service, 'submitTourForApproval').mockRejectedValue(new OperatorTourApiError(status, 'CONFLICT', 'unsafe upstream text'));
    render(<SubmitTourApprovalView tour={mockCompleteTour} />);
    fireEvent.click(screen.getByRole('button', { name: /Gửi yêu cầu xét duyệt/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận gửi' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/tải lại/i));
    expect((screen.getByRole('button', { name: /Gửi yêu cầu xét duyệt/i }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('button', { name: /Tải lại/i })).toBeDefined();
  });

  it('redirects an expired session to sign in', async () => {
    vi.spyOn(service, 'submitTourForApproval').mockRejectedValue(new OperatorTourApiError(401, 'AUTH_REQUIRED', 'expired'));
    render(<SubmitTourApprovalView tour={mockCompleteTour} />);
    fireEvent.click(screen.getByRole('button', { name: /Gửi yêu cầu xét duyệt/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận gửi' }));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith(expect.stringContaining('/sign-in?returnUrl=')));
  });

  it.each([[403, /quyền/i], [404, /Không tìm thấy/i], [422, /mục bắt buộc/i]])('explains submission failure %s and retains the note', async (status, message) => {
    vi.spyOn(service, 'submitTourForApproval').mockRejectedValue(new OperatorTourApiError(status as number, undefined, 'unsafe upstream text'));
    render(<SubmitTourApprovalView tour={mockCompleteTour} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Keep my note' } });
    fireEvent.click(screen.getByRole('button', { name: /Gửi yêu cầu xét duyệt/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận gửi' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(message as RegExp));
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('Keep my note');
    expect((screen.getByRole('button', { name: /Gửi yêu cầu xét duyệt/i }) as HTMLButtonElement).disabled).toBe(status !== 422);
  });

  it('fails safely when a service response cannot confirm Pending', async () => {
    vi.spyOn(service, 'submitTourForApproval').mockResolvedValue({ status: 'SUCCESS', data: { ...mockCompleteTour, status: 'Draft' } });
    render(<SubmitTourApprovalView tour={mockCompleteTour} />);
    fireEvent.click(screen.getByRole('button', { name: /Gửi yêu cầu xét duyệt/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận gửi' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/tải lại/i));
    expect(screen.queryByRole('status')).toBeNull();
    expect((screen.getByRole('button', { name: /Gửi yêu cầu xét duyệt/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('cleans the delayed navigation timer after success on unmount', async () => {
    vi.useFakeTimers();
    vi.spyOn(service, 'submitTourForApproval').mockResolvedValue({ status: 'SUCCESS', data: { ...mockCompleteTour, status: 'Pending' } });
    const view = render(<SubmitTourApprovalView tour={mockCompleteTour} />);
    fireEvent.click(screen.getByRole('button', { name: /Gửi yêu cầu xét duyệt/i }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Xác nhận gửi' })); });
    view.unmount();
    await vi.advanceTimersByTimeAsync(1500);
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('uses Staff copy and a storage limit without unsupported promises', () => {
    const view = render(<SubmitTourApprovalView tour={mockCompleteTour} />);
    expect(view.container.textContent).toContain('Staff');
    expect(view.container.textContent).not.toMatch(/Quản trị viên|1 ngày làm việc|nhận được thông báo/i);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).maxLength).toBe(4000);
  });

  it('does not navigate after unmount while submission is still in flight', async () => {
    vi.useFakeTimers();
    let resolve!: (value: Awaited<ReturnType<typeof service.submitTourForApproval>>) => void;
    vi.spyOn(service, 'submitTourForApproval').mockImplementation(() => new Promise((done) => { resolve = done; }));
    const view = render(<SubmitTourApprovalView tour={mockCompleteTour} />);
    fireEvent.click(screen.getByRole('button', { name: /Gửi yêu cầu xét duyệt/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận gửi' }));
    view.unmount();
    await act(async () => resolve({ status: 'SUCCESS', data: { ...mockCompleteTour, status: 'Pending' } }));
    await vi.advanceTimersByTimeAsync(1500);
    expect(mocks.push).not.toHaveBeenCalled();
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

  it('does not present an obsolete backend-integration banner in real mode', async () => {
    render(<SubmitTourApprovalView tour={mockCompleteTour} isDemo={false} />);

    // Open modal
    const submitBtn = screen.getByRole('button', { name: /Gửi yêu cầu xét duyệt/i });
    fireEvent.click(submitBtn);

    // Click confirm in modal
    const confirmBtn = screen.getByRole('button', { name: /Xác nhận gửi/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.queryByText(/đang chờ kết nối dịch vụ máy chủ/i)).toBeNull();
      expect(screen.getByRole('alert')).toBeDefined();
    });
  });

  it('disables submit button and shows BR-104 notice when tour status is Inactive', () => {
    const inactiveTour: TourPackageDto = {
      ...mockCompleteTour,
      status: 'Inactive',
    };

    render(<SubmitTourApprovalView tour={inactiveTour} isDemo={false} />);

    const submitBtn = screen.getByRole('button', { name: /Gửi yêu cầu xét duyệt/i });
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true);

    expect(
      screen.getByText(/Chỉ gói tour ở trạng thái Bản nháp hoặc Bị từ chối mới có thể gửi xét duyệt\./i)
    ).toBeDefined();
  });

  it('disables submit button and shows MSG122 notice when tour status is Pending', () => {
    const pendingTour: TourPackageDto = {
      ...mockCompleteTour,
      status: 'Pending',
    };

    render(<SubmitTourApprovalView tour={pendingTour} isDemo={false} />);

    const submitBtn = screen.getByRole('button', { name: /Gửi yêu cầu xét duyệt/i });
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true);

    expect(screen.getByText(/Gói tour đã ở trạng thái chờ duyệt\./i)).toBeDefined();
  });

  it('disables submit button and shows MSG110 notice when tour status is Approved', () => {
    const approvedTour: TourPackageDto = {
      ...mockCompleteTour,
      status: 'Approved',
    };

    render(<SubmitTourApprovalView tour={approvedTour} isDemo={false} />);

    const submitBtn = screen.getByRole('button', { name: /Gửi yêu cầu xét duyệt/i });
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true);

    expect(
      screen.getByText(/Gói tour đã được phê duyệt\. Vui lòng tạo phiên bản nháp mới nếu muốn chỉnh sửa\./i)
    ).toBeDefined();
  });

  it('allows Rejected tour to be submitted when completeness criteria are met', () => {
    const rejectedTour: TourPackageDto = {
      ...mockCompleteTour,
      status: 'Rejected',
    };

    render(<SubmitTourApprovalView tour={rejectedTour} isDemo={false} />);

    const submitBtn = screen.getByRole('button', { name: /Gửi yêu cầu xét duyệt/i });
    expect((submitBtn as HTMLButtonElement).disabled).toBe(false);
  });

  describe('Demo Mode (?demo=1 continuity)', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
    });

    it('preserves demo=1 on back link when isDemo is true', () => {
      render(<SubmitTourApprovalView tour={mockCompleteTour} isDemo={true} />);

      const backLink = screen.getByRole('link', { name: /Quay lại danh sách/i });
      expect(backLink.getAttribute('href')).toBe('/partner/tours?demo=1');
    });

    it('keeps back link clean when isDemo is false', () => {
      render(<SubmitTourApprovalView tour={mockCompleteTour} isDemo={false} />);

      const backLink = screen.getByRole('link', { name: /Quay lại danh sách/i });
      expect(backLink.getAttribute('href')).toBe('/partner/tours');
    });

    it('preserves demo=1 on router.push when clicking Quay lại chỉnh sửa in demo mode', () => {
      render(<SubmitTourApprovalView tour={mockCompleteTour} isDemo={true} />);

      const editBtn = screen.getByRole('button', { name: /Quay lại chỉnh sửa/i });
      fireEvent.click(editBtn);

      expect(mocks.push).toHaveBeenCalledWith(`/partner/tours/${mockCompleteTour.id}/edit?demo=1`);
    });

    it('preserves demo=1 on redirect after confirmation in demo mode', async () => {
      vi.useFakeTimers();
      render(<SubmitTourApprovalView tour={mockCompleteTour} isDemo={true} />);

      const submitBtn = screen.getByRole('button', { name: /Gửi yêu cầu xét duyệt/i });
      fireEvent.click(submitBtn);

      const confirmBtn = screen.getByRole('button', { name: /Xác nhận gửi/i });
      fireEvent.click(confirmBtn);

      await vi.advanceTimersByTimeAsync(1500);

      expect(mocks.push).toHaveBeenCalledWith('/partner/tours?demo=1');
      vi.useRealTimers();
    });
  });
});
