import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(), getReviewContext: vi.fn(), createReview: vi.fn(), updateReview: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/components/navigation/PublicNavigation', () => ({ PublicNavigation: () => null }));
vi.mock('../services/canonicalReviewApi', () => ({
  getReviewContext: mocks.getReviewContext,
  createReview: mocks.createReview,
  updateReview: mocks.updateReview,
}));

import { CanonicalTripReviewPage } from './CanonicalTripReviewPage';
import { CanonicalReviewApiError } from '../types/canonicalReview';

const reference = { kind: 'commerceBooking' as const, id: '9223372036854775807' };
const emptyContext = {
  reviewableRecord: reference, bookingStatus: 'Completed',
  subject: { kind: 'tour' as const, id: '4' },
  summary: { name: 'Hoi An', departureAtUtc: '2026-10-01T02:00:00Z', bookingReference: 'BK-1' },
  canSubmit: true, submitUnavailableReason: null, existingReviewKind: 'none' as const,
  review: null, editableFields: [],
  routePacing: { available: false, reason: null }, cspRating: { available: false, reason: null },
  poiRatings: { available: false, reason: null },
};
const existingReview = {
  kind: 'new' as const, reviewId: '8', reviewableRecord: reference,
  subject: { kind: 'tour' as const, id: '4' }, overallRating: 5, title: 'Great', content: 'Excellent',
  publishDisplayName: true, publicDisplayName: 'Traveler', publicationStatus: 'Published',
  createdAtUtc: '2026-10-01T02:00:00Z', editDeadlineUtc: '2026-10-08T02:00:00Z',
  updatedAtUtc: '2026-10-01T02:00:00Z', version: 'v1', media: [],
};

describe('CanonicalTripReviewPage', () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getReviewContext.mockResolvedValue(emptyContext);
    mocks.createReview.mockResolvedValue(existingReview);
  });

  it('offers star rating and Cancel, then returns to Trip History after create', async () => {
    render(<CanonicalTripReviewPage reference={reference} />);
    await screen.findByText('Hoi An');
    expect(screen.getByRole('link', { name: 'Hủy' }).getAttribute('href')).toBe('/account/trips');
    fireEvent.click(screen.getByRole('radio', { name: '5 sao' }));
    fireEvent.change(screen.getByLabelText('Tiêu đề đánh giá'), { target: { value: 'Great' } });
    fireEvent.change(screen.getByLabelText('Chia sẻ trải nghiệm'), { target: { value: 'Excellent' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gửi đánh giá' }));
    expect(await screen.findByText('Đã đăng đánh giá. Đang quay lại Lịch sử chuyến đi…')).toBeTruthy();
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/account/trips'));
  });

  it('loads and opens the existing review when create reports a duplicate', async () => {
    mocks.createReview.mockRejectedValue(new CanonicalReviewApiError(409, 'trip_review.duplicate'));
    mocks.getReviewContext.mockResolvedValueOnce(emptyContext).mockResolvedValueOnce({
      ...emptyContext, existingReviewKind: 'new', review: existingReview,
      canSubmit: false, editableFields: ['overallRating', 'title', 'content', 'publishDisplayName'],
    });
    render(<CanonicalTripReviewPage reference={reference} />);
    await screen.findByText('Hoi An');
    fireEvent.click(screen.getByRole('radio', { name: '5 sao' }));
    fireEvent.change(screen.getByLabelText('Tiêu đề đánh giá'), { target: { value: 'Great' } });
    fireEvent.change(screen.getByLabelText('Chia sẻ trải nghiệm'), { target: { value: 'Excellent' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gửi đánh giá' }));
    expect(await screen.findByText('Đánh giá đã tồn tại. Nội dung đánh giá hiện tại được hiển thị bên dưới.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cập nhật đánh giá' })).toBeTruthy();
    expect(mocks.createReview).toHaveBeenCalledTimes(1);
    expect(mocks.getReviewContext).toHaveBeenCalledTimes(2);
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('shows a safe recovery error when duplicate recovery GET fails', async () => {
    mocks.createReview.mockRejectedValue(new CanonicalReviewApiError(409, 'trip_review.duplicate'));
    mocks.getReviewContext.mockResolvedValueOnce(emptyContext).mockRejectedValueOnce(
      new CanonicalReviewApiError(503, 'MSG127'),
    );
    render(<CanonicalTripReviewPage reference={reference} />);
    await screen.findByText('Hoi An');
    fireEvent.click(screen.getByRole('radio', { name: '5 sao' }));
    fireEvent.change(screen.getByLabelText('Tiêu đề đánh giá'), { target: { value: 'Great' } });
    fireEvent.change(screen.getByLabelText('Chia sẻ trải nghiệm'), { target: { value: 'Excellent' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gửi đánh giá' }));
    expect(await screen.findByText('Không thể tải đánh giá hiện có. Vui lòng thử lại.')).toBeTruthy();
    expect(screen.queryByText('Đánh giá đã tồn tại. Nội dung đánh giá hiện tại được hiển thị bên dưới.')).toBeNull();
    expect(screen.queryByText('Hoi An')).toBeNull();
    expect(mocks.createReview).toHaveBeenCalledTimes(1);
    expect(mocks.getReviewContext).toHaveBeenCalledTimes(2);
  });

  it('rejects duplicate recovery when GET returns a malformed existing review', async () => {
    mocks.createReview.mockRejectedValue(new CanonicalReviewApiError(409, 'trip_review.duplicate'));
    mocks.getReviewContext.mockResolvedValueOnce(emptyContext).mockResolvedValueOnce({
      ...emptyContext,
      existingReviewKind: 'new',
      review: { kind: 'new' },
    });
    render(<CanonicalTripReviewPage reference={reference} />);
    await screen.findByText('Hoi An');
    fireEvent.click(screen.getByRole('radio', { name: '5 sao' }));
    fireEvent.change(screen.getByLabelText('Tiêu đề đánh giá'), { target: { value: 'Great' } });
    fireEvent.change(screen.getByLabelText('Chia sẻ trải nghiệm'), { target: { value: 'Excellent' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gửi đánh giá' }));
    expect(await screen.findByText('Không thể tải đánh giá hiện có. Vui lòng thử lại.')).toBeTruthy();
    expect(screen.queryByText('Đánh giá đã tồn tại. Nội dung đánh giá hiện tại được hiển thị bên dưới.')).toBeNull();
    expect(screen.queryByText('Hoi An')).toBeNull();
    expect(mocks.createReview).toHaveBeenCalledTimes(1);
    expect(mocks.getReviewContext).toHaveBeenCalledTimes(2);
  });

  it('updates in place without returning to Trip History', async () => {
    mocks.getReviewContext.mockResolvedValue({
      ...emptyContext, existingReviewKind: 'new', review: existingReview,
      canSubmit: false, editableFields: ['overallRating', 'title', 'content', 'publishDisplayName'],
    });
    mocks.updateReview.mockResolvedValue(existingReview);
    render(<CanonicalTripReviewPage reference={reference} />);
    await screen.findByRole('button', { name: 'Cập nhật đánh giá' });
    fireEvent.click(screen.getByRole('button', { name: 'Cập nhật đánh giá' }));
    expect(await screen.findByText('Đã cập nhật đánh giá.')).toBeTruthy();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it.each([
    ['trip_review.stale_version', 'Đánh giá này vừa được cập nhật ở nơi khác. Vui lòng tải lại trước khi lưu.'],
    ['trip_review.policy_rejected', 'Nội dung đánh giá vi phạm chính sách cộng đồng và không thể đăng.'],
    ['trip_review.policy_unavailable', 'Hệ thống kiểm duyệt nội dung tạm thời gián đoạn. Vui lòng thử lại.'],
  ])('renders safe copy for %s without navigation', async (code, copy) => {
    mocks.createReview.mockRejectedValue(new CanonicalReviewApiError(409, code));
    render(<CanonicalTripReviewPage reference={reference} />);
    await screen.findByText('Hoi An');
    fireEvent.click(screen.getByRole('radio', { name: '5 sao' }));
    fireEvent.change(screen.getByLabelText('Tiêu đề đánh giá'), { target: { value: 'Great' } });
    fireEvent.change(screen.getByLabelText('Chia sẻ trải nghiệm'), { target: { value: 'Excellent' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gửi đánh giá' }));
    expect(await screen.findByText(copy)).toBeTruthy();
    expect(screen.queryByText(code)).toBeNull();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('keeps an expired review read-only and Cancel does not submit', async () => {
    mocks.getReviewContext.mockResolvedValue({
      ...emptyContext, existingReviewKind: 'new', review: existingReview, canSubmit: false, editableFields: [],
    });
    render(<CanonicalTripReviewPage reference={reference} />);
    expect(await screen.findByText('Đã hết thời hạn 7 ngày chỉnh sửa. Đánh giá này hiện chỉ có thể xem.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Cập nhật đánh giá' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Hủy' }).getAttribute('href')).toBe('/account/trips');
    expect(mocks.createReview).not.toHaveBeenCalled();
    expect(mocks.updateReview).not.toHaveBeenCalled();
  });
});
