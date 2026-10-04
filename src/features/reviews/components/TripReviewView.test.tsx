import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TripCardDto } from '@/features/trips/types/tripHistory';
import * as reviewApi from '../services/reviewApi';
import { TripReviewView } from './TripReviewView';

const mockTrip: TripCardDto = {
  tripId: 'trip-demo-01',
  tripType: 'SelfPlannedItinerary',
  title: 'Hành trình Đà Nẵng - Hội An',
  departureDatetime: '2026-05-24T08:00:00Z',
  status: 'Completed',
  statusLabel: 'Đã hoàn thành',
  stopsSummary: ['Ngũ Hành Sơn', 'Hội An'],
  isReviewed: false,
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: vi.fn(),
    push: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue('1'),
  }),
}));

describe('TripReviewView Component (REVIEW-7, REVIEW-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('REVIEW-7: Live comment counter updates correctly with input', () => {
    render(<TripReviewView trip={mockTrip} />);

    const textarea = screen.getByPlaceholderText(/Chia sẻ cảm nhận chi tiết của bạn/i);
    expect(screen.getByText('0 / 500 ký tự')).toBeDefined();

    // Type 33 characters
    fireEvent.change(textarea, { target: { value: 'Chuyến đi này rất tuyệt vời luôn!' } });

    expect(screen.getByText(/33 \/ 500 ký tự/i)).toBeDefined();
  });

  it('Displays error when submitted with missing rating (MSG66)', async () => {
    render(<TripReviewView trip={mockTrip} />);

    const titleInput = screen.getByRole('textbox', { name: /Tiêu đề đánh giá/i });
    fireEvent.change(titleInput, { target: { value: 'Chuyến đi thú vị' } });

    const textarea = screen.getByPlaceholderText(/Chia sẻ cảm nhận chi tiết của bạn/i);
    fireEvent.change(textarea, {
      target: { value: 'Nội dung đánh giá hợp lệ.' },
    });

    const submitBtn = screen.getByRole('button', { name: /Gửi đánh giá/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Vui lòng chọn số sao đánh giá/i)).toBeDefined();
    });
  });

  it('Displays error when submitted with empty title (MSG01)', async () => {
    render(<TripReviewView trip={mockTrip} />);

    // Select 5 stars
    const star5 = screen.getByRole('radio', { name: '5 sao' });
    fireEvent.click(star5);

    const textarea = screen.getByPlaceholderText(/Chia sẻ cảm nhận chi tiết của bạn/i);
    fireEvent.change(textarea, { target: { value: 'Chuyến đi rất tốt.' } });

    const submitBtn = screen.getByRole('button', { name: /Gửi đánh giá/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Tiêu đề đánh giá là bắt buộc/i)).toBeDefined();
    });
  });

  it('Displays error when submitted with empty comment (MSG01)', async () => {
    render(<TripReviewView trip={mockTrip} />);

    // Select 5 stars
    const star5 = screen.getByRole('radio', { name: '5 sao' });
    fireEvent.click(star5);

    const titleInput = screen.getByRole('textbox', { name: /Tiêu đề đánh giá/i });
    fireEvent.change(titleInput, { target: { value: 'Tiêu đề đánh giá' } });

    const submitBtn = screen.getByRole('button', { name: /Gửi đánh giá/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Nội dung đánh giá là bắt buộc/i)).toBeDefined();
    });
  });

  it('REVIEW-10: Rejects non-image files and files larger than 5MB', async () => {
    render(<TripReviewView trip={mockTrip} />);

    const fileInput = screen.getByLabelText(/Tải lên ảnh chuyến đi/i);

    // 1. Invalid mime type (e.g., pdf)
    const invalidFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Ảnh phải thuộc định dạng JPG, PNG hoặc WEBP/i)).toBeDefined();
    });

    // 2. File exceeding 5MB (5 * 1024 * 1024 + 1 bytes)
    const bigFile = new File(['x'.repeat(100)], 'huge.jpg', { type: 'image/jpeg' });
    Object.defineProperty(bigFile, 'size', { value: 6 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [bigFile] } });

    await waitFor(() => {
      expect(screen.getByText(/vượt quá dung lượng tối đa 5MB/i)).toBeDefined();
    });
  });

  it('Shows PENDING_BE_INTEGRATION banner in real mode without fake success', async () => {
    vi.spyOn(reviewApi, 'submitTripReview').mockResolvedValue({
      status: 'PENDING_BE_INTEGRATION',
      message: 'Tính năng gửi đánh giá đang chờ kích hoạt API máy chủ (Capstone_BE).',
    });

    render(<TripReviewView trip={mockTrip} />);

    // Select 5 stars
    const star5 = screen.getByRole('radio', { name: '5 sao' });
    fireEvent.click(star5);

    // Enter valid title
    const titleInput = screen.getByRole('textbox', { name: /Tiêu đề đánh giá/i });
    fireEvent.change(titleInput, {
      target: { value: 'Chuyến đi tuyệt vời' },
    });

    // Enter valid comment
    const textarea = screen.getByPlaceholderText(/Chia sẻ cảm nhận chi tiết của bạn/i);
    fireEvent.change(textarea, {
      target: { value: 'Lộ trình rất vừa vặn, thời gian tham quan các điểm rất hợp lý.' },
    });

    const submitBtn = screen.getByRole('button', { name: /Gửi đánh giá/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Chờ kích hoạt dịch vụ lưu đánh giá/i)).toBeDefined();
    });
  });
});
