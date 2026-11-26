import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateTourPackageView } from './UpdateTourPackageView';
import type { TourPackageDto } from '../types/tourLifecycle';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  createOrResumeDraftVersion: vi.fn(),
  saveDraftVersion: vi.fn(),
  submitDraftVersion: vi.fn(),
  discardDraftVersion: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.push,
    replace: mocks.replace,
  }),
}));

vi.mock('../services/operatorTourService', async () => {
  const actual = await vi.importActual<typeof import('../services/operatorTourService')>('../services/operatorTourService');
  return {
    ...actual,
    createOrResumeDraftVersion: mocks.createOrResumeDraftVersion,
    saveDraftVersion: mocks.saveDraftVersion,
    submitDraftVersion: mocks.submitDraftVersion,
    discardDraftVersion: mocks.discardDraftVersion,
  };
});

vi.mock('./useTourCatalogues', () => ({
  useTourCatalogues: () => ({
    categories: [{ categoryId: 3, code: 'NATURE', name: 'Nature' }],
    destinations: [
      { destinationId: 1, name: 'Đà Nẵng' },
      { destinationId: 2, name: 'Quảng Nam' },
    ],
    policies: [{ id: 7, name: 'Standard scheduled departure', description: null, rules: [] }],
    pois: [{ id: 11, name: 'Bà Nà Hills', categoryName: 'Nature', address: null, averageVisitDurationMinutes: 120 }],
    loading: false,
    error: null,
  }),
}));

const mockTourDraft: TourPackageDto = {
  id: 'tour-ba-na',
  tourCode: 'TP-0142',
  operatorUserId: 101,
  title: 'Khám phá Bà Nà Hills - Cầu Vàng',
  destination: 'Đà Nẵng',
  destinationIds: [1],
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

const approvedTourBase: TourPackageDto = {
  ...mockTourDraft,
  status: 'Approved',
  schedules: [
    { id: 'sch-1', departureDate: '2026-11-20', returnDate: '2026-11-20', totalCapacity: 30, reservedCapacity: 12, meetingPoint: 'Khách sạn trung tâm', status: 'Scheduled' },
  ],
};

function draftFor(liveTour: TourPackageDto, overrides: Partial<TourPackageDto> = {}): TourPackageDto {
  return { ...liveTour, id: `${liveTour.id}-pending-change`, status: 'Draft', ...overrides };
}

describe('UpdateTourPackageView (UC-36 Screen #42)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-15T00:00:00Z'));
    vi.clearAllMocks();
    mocks.createOrResumeDraftVersion.mockReset();
    mocks.saveDraftVersion.mockReset();
    mocks.submitDraftVersion.mockReset();
    mocks.discardDraftVersion.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders pre-filled tour package fields for editing draft', () => {
    render(<UpdateTourPackageView initialTour={mockTourDraft} isDemo={false} />);

    expect(screen.getByDisplayValue('Khám phá Bà Nà Hills - Cầu Vàng')).toBeDefined();
    expect((screen.getByRole('checkbox', { name: 'Đà Nẵng' }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole('checkbox', { name: 'Quảng Nam' }) as HTMLInputElement).checked).toBe(false);
    expect(screen.getByDisplayValue('1250000')).toBeDefined();
    expect(screen.getByText('Khởi hành 20/11/2026')).toBeDefined();
  });

  it('fills in missing itinerary days from an existing tour duration', () => {
    render(<UpdateTourPackageView initialTour={{ ...mockTourDraft, durationDays: 3 }} isDemo={false} />);

    expect(screen.getByText('Ngày 3')).toBeDefined();
  });

  it('does not claim the backend is unavailable in real mode (UC-35/36 are integrated)', () => {
    render(<UpdateTourPackageView initialTour={mockTourDraft} isDemo={false} />);

    expect(screen.queryByText(/đang chờ kết nối/i)).toBeNull();
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

  describe('Approved/Published tour → draft version (TM-82 / UC-36)', () => {
    it('edge case 1: creates a draft version on mount and shows the live-bookings notice', async () => {
      const draft = draftFor(approvedTourBase);
      mocks.createOrResumeDraftVersion.mockResolvedValue(draft);

      render(<UpdateTourPackageView initialTour={approvedTourBase} isDemo={false} />);

      await waitFor(() => expect(mocks.createOrResumeDraftVersion).toHaveBeenCalledWith(approvedTourBase.id, approvedTourBase));
      await waitFor(() => expect(screen.getByText(/12 chỗ đã xác nhận đặt chỗ/i)).toBeDefined());
      expect(screen.getByText(/Lưu vào bản nháp/i)).toBeDefined();
      // The live tour's own status never changes to reflect the draft being edited.
      expect(screen.getAllByText('Approved').length).toBeGreaterThan(0);
    });

    it('edge case 2: resuming an already-open draft calls create-or-resume exactly once, not twice', async () => {
      const draft = draftFor(approvedTourBase, { status: 'PendingReview' });
      mocks.createOrResumeDraftVersion.mockResolvedValue(draft);

      render(<UpdateTourPackageView initialTour={approvedTourBase} isDemo={false} />);

      await waitFor(() => expect(mocks.createOrResumeDraftVersion).toHaveBeenCalledTimes(1));
    });

    it('edge case 3: a draft in PendingReview locks the form read-only', async () => {
      const draft = draftFor(approvedTourBase, { status: 'PendingReview' });
      mocks.createOrResumeDraftVersion.mockResolvedValue(draft);

      render(<UpdateTourPackageView initialTour={approvedTourBase} isDemo={false} />);

      await waitFor(() => expect(screen.getByText(/Gói tour đang chờ kiểm duyệt/i)).toBeDefined());
      const titleInput = screen.getByLabelText(/Tên gói tour/i) as HTMLInputElement;
      expect(titleInput.disabled).toBe(true);
    });

    it('edge case 4: discarding a Draft/Rejected draft version calls discardDraftVersion and returns to the list', async () => {
      const draft = draftFor(approvedTourBase, { status: 'Rejected', rejectionReason: 'Thiếu ảnh' });
      mocks.createOrResumeDraftVersion.mockResolvedValue(draft);
      mocks.discardDraftVersion.mockResolvedValue(undefined);

      render(<UpdateTourPackageView initialTour={approvedTourBase} isDemo={false} />);

      const discardBtn = await screen.findByRole('button', { name: /Bỏ bản nháp/i });
      fireEvent.click(discardBtn);

      await waitFor(() => expect(mocks.discardDraftVersion).toHaveBeenCalledWith(approvedTourBase.id, draft.id));
      await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/partner/tours'));
    });

    it('edge case 7: a Rejected draft version shows its own rejection reason, and submit resubmits the same draft', async () => {
      const draft = draftFor(approvedTourBase, { status: 'Rejected', rejectionReason: 'Thiếu thông tin xe đưa đón.' });
      mocks.createOrResumeDraftVersion.mockResolvedValue(draft);
      mocks.submitDraftVersion.mockResolvedValue({ status: 'SUCCESS', data: { ...draft, status: 'PendingReview' } });

      render(<UpdateTourPackageView initialTour={approvedTourBase} isDemo={false} />);

      await waitFor(() => expect(screen.getByText(/Thiếu thông tin xe đưa đón\./i)).toBeDefined());
      const submitBtn = screen.getByRole('button', { name: /Gửi xét duyệt/i });
      fireEvent.click(submitBtn);

      await waitFor(() => expect(mocks.submitDraftVersion).toHaveBeenCalledWith(approvedTourBase.id, draft.id, approvedTourBase));
      // Never routes to the old UC-37 first-time-submission page.
      expect(mocks.push).not.toHaveBeenCalledWith(expect.stringContaining('/submit'));
    });

    it('save button calls saveDraftVersion, never the old createTour(sourceTourId) path', async () => {
      const draft = draftFor(approvedTourBase);
      mocks.createOrResumeDraftVersion.mockResolvedValue(draft);
      mocks.saveDraftVersion.mockResolvedValue({ status: 'SUCCESS', data: draft });

      render(<UpdateTourPackageView initialTour={approvedTourBase} isDemo={false} />);

      const saveBtn = await screen.findByRole('button', { name: /Lưu bản nháp/i });
      fireEvent.click(saveBtn);

      await waitFor(() => expect(mocks.saveDraftVersion).toHaveBeenCalledWith(
        approvedTourBase.id, draft.id, expect.anything(), approvedTourBase,
      ));
    });
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

  it('adds itinerary days from duration and lets the operator add a stop to the new day', () => {
    render(<UpdateTourPackageView initialTour={mockTourDraft} isDemo={false} />);

    fireEvent.change(screen.getByLabelText(/Thời lượng \(ngày\)/i), { target: { value: '2' } });

    expect(screen.getByText('Ngày 2')).toBeDefined();
    fireEvent.click(screen.getAllByRole('button', { name: /Thêm điểm dừng/i })[1]);

    expect(screen.getAllByText('Điểm dừng 1')).toHaveLength(2);
  });

  it('removes extra itinerary days when duration is reduced', () => {
    render(<UpdateTourPackageView initialTour={mockTourDraft} isDemo={false} />);

    fireEvent.change(screen.getByLabelText(/Thời lượng \(ngày\)/i), { target: { value: '2' } });
    expect(screen.getByText('Ngày 2')).toBeDefined();

    fireEvent.change(screen.getByLabelText(/Thời lượng \(ngày\)/i), { target: { value: '1' } });
    expect(screen.queryByText('Ngày 2')).toBeNull();
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
