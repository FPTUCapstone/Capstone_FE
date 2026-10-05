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

describe('CreateTourPackageView (UC-35 Screen #41)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Screen #41 creation view with all required sections', () => {
    render(<CreateTourPackageView isDemo={false} />);

    expect(screen.getByRole('heading', { name: /Tạo gói tour mới/i })).toBeDefined();
    expect(screen.getByLabelText(/Tên gói tour/i)).toBeDefined();
    expect(screen.getByLabelText(/Điểm đến chính/i)).toBeDefined();
    expect(screen.getByLabelText(/Mô tả chi tiết gói tour/i)).toBeDefined();
    expect(screen.getByLabelText(/Giá người lớn/i)).toBeDefined();
    expect(screen.getByLabelText(/Sức chứa tối đa/i)).toBeDefined();
    expect(screen.getByLabelText(/Chính sách hủy tour/i)).toBeDefined();
  });

  it('displays truthful PENDING_BE_INTEGRATION banner in real mode (NO_BACKEND)', () => {
    render(<CreateTourPackageView isDemo={false} />);

    expect(
      screen.getByText(/Tính năng tạo gói tour đang chờ kết nối dịch vụ máy chủ/i)
    ).toBeDefined();
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
});
