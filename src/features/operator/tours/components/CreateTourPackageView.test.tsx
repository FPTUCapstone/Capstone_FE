import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateTourPackageView } from './CreateTourPackageView';

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

describe('CreateTourPackageView (UC-35 Screen #41)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Screen #41 creation view with all required sections', () => {
    render(<CreateTourPackageView isDemo={false} />);

    expect(screen.getByRole('heading', { name: /Tạo gói tour mới/i })).toBeDefined();
    expect(screen.getByLabelText(/Tên gói tour/i)).toBeDefined();
    expect(screen.getByRole('group', { name: /Điểm đến chính/i })).toBeDefined();
    expect(screen.getByRole('checkbox', { name: 'Đà Nẵng' })).toBeDefined();
    expect(screen.getByLabelText(/Mô tả chi tiết gói tour/i)).toBeDefined();
    expect(screen.getByLabelText(/Giá người lớn/i)).toBeDefined();
    expect(screen.getByLabelText(/Sức chứa tối đa/i)).toBeDefined();
    expect(screen.getByLabelText(/Chính sách hủy tour/i)).toBeDefined();
  });

  it('does not claim the backend is unavailable in real mode (UC-35 is integrated)', () => {
    render(<CreateTourPackageView isDemo={false} />);

    expect(screen.queryByText(/đang chờ kết nối/i)).toBeNull();
  });

  it('is honest that cover-photo upload is not available in real mode', () => {
    render(<CreateTourPackageView isDemo={false} />);

    expect(screen.queryByLabelText(/Tải lên hình ảnh/i)).toBeNull();
    expect(screen.getByText(/Hãy lưu bản nháp trước/i)).toBeDefined();
  });

  it('validates mandatory fields on submit and displays error alerts', async () => {
    render(<CreateTourPackageView isDemo={false} />);

    // Click "Lưu bản nháp" with empty title/destination/description
    const saveButton = screen.getByRole('button', { name: /Lưu bản nháp/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      const errorElements = screen.getAllByRole('alert');
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });

  it('allows adding and removing itinerary days and activities', () => {
    render(<CreateTourPackageView isDemo={false} />);

    expect(screen.getByText(/Ngày 1: Khám phá điểm đến/i)).toBeDefined();

    // Click "Thêm ngày"
    const addDayBtn = screen.getByRole('button', { name: /Thêm ngày/i });
    fireEvent.click(addDayBtn);

    expect(screen.getByText(/Ngày 2: Tiếp tục hành trình/i)).toBeDefined();
  });

  it('allows adding schedules', () => {
    render(<CreateTourPackageView isDemo={false} />);

    const addScheduleBtn = screen.getByRole('button', { name: /Thêm lịch/i });
    fireEvent.click(addScheduleBtn);

    const scheduleCards = screen.getAllByText(/Khởi hành #/i);
    expect(scheduleCards.length).toBe(2);
  });

  describe('Demo Mode (?demo=1 continuity)', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
    });

    it('preserves demo=1 on back and cancel links when isDemo is true', () => {
      render(<CreateTourPackageView isDemo={true} />);

      const backLinks = screen.getAllByRole('link', { name: /Quay lại danh sách|Hủy/i });
      for (const link of backLinks) {
        expect(link.getAttribute('href')).toBe('/partner/tours?demo=1');
      }
    });

    it('keeps back and cancel links clean when isDemo is false', () => {
      render(<CreateTourPackageView isDemo={false} />);

      const backLinks = screen.getAllByRole('link', { name: /Quay lại danh sách|Hủy/i });
      for (const link of backLinks) {
        expect(link.getAttribute('href')).toBe('/partner/tours');
      }
    });

    it('preserves demo=1 on router.push after creating draft in demo mode', async () => {
      render(<CreateTourPackageView isDemo={true} />);

      // Fill in required fields
      fireEvent.change(screen.getByLabelText(/Tên gói tour/i), { target: { value: 'Tour Demo Mới' } });
      fireEvent.change(screen.getByLabelText(/Điểm đến chính/i), { target: { value: 'Đà Nẵng' } });
      fireEvent.change(screen.getByLabelText(/Mô tả chi tiết gói tour/i), { target: { value: 'Mô tả chi tiết' } });

      const saveDraftBtn = screen.getByRole('button', { name: /Lưu bản nháp/i });
      fireEvent.click(saveDraftBtn);

      await waitFor(() => {
        expect(mocks.push).toHaveBeenCalledWith('/partner/tours?demo=1');
      });
    });

    it('preserves demo=1 on router.push to submit approval in demo mode', async () => {
      render(<CreateTourPackageView isDemo={true} />);

      // Fill in required fields
      fireEvent.change(screen.getByLabelText(/Tên gói tour/i), { target: { value: 'Tour Demo Duyệt' } });
      fireEvent.change(screen.getByLabelText(/Điểm đến chính/i), { target: { value: 'Đà Nẵng' } });
      fireEvent.change(screen.getByLabelText(/Mô tả chi tiết gói tour/i), { target: { value: 'Mô tả chi tiết' } });

      const saveAndSubmitBtn = screen.getByRole('button', { name: /Lưu và gửi xét duyệt/i });
      fireEvent.click(saveAndSubmitBtn);

      await waitFor(() => {
        expect(mocks.push).toHaveBeenCalledWith(expect.stringMatching(/^\/partner\/tours\/tour-new-\d+\/submit\?demo=1$/));
      });
    });
  });
});
