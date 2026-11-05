import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AcknowledgeReviewForm } from '../AcknowledgeReviewForm';
import type { WeatherSafetyReview } from '../../types';

const pendingReview: WeatherSafetyReview = {
  id: 15,
  tourScheduleId: 50,
  tourId: 200,
  tourTitle: 'Tour Cù Lao Chàm',
  scheduleStartAtUtc: '2026-11-04T01:00:00Z',
  scheduleEndAtUtc: '2026-11-04T09:00:00Z',
  scheduleStatus: 'Scheduled',
  provider: 'Tomorrow.io',
  providerEventId: 'tomorrow-storm-99',
  eventType: 'TropicalStorm',
  severity: 'Severe',
  description: 'Bão đổ bộ',
  validFromUtc: null,
  validToUtc: null,
  originalAuthority: null,
  officialVietnamRiskLevel: 3,
  verifiedDirective: null,
  affectedAreaSummary: null,
  isWithdrawn: false,
  status: 'PendingAcknowledgement',
  urgentNoticeSentAtUtc: '2026-11-03T10:00:00Z',
  acknowledgementDeadlineUtc: '2026-11-03T12:00:00Z',
  acknowledgedAtUtc: null,
  acknowledgedByOperatorId: null,
  escalatedAtUtc: null,
  escalationContact: null,
  immediateInstructions: null,
  createdAtUtc: '2026-11-03T10:00:00Z',
};

const acknowledgedReview: WeatherSafetyReview = {
  ...pendingReview,
  status: 'Acknowledged',
  acknowledgedAtUtc: '2026-11-03T11:15:00Z',
  acknowledgedByOperatorId: 42,
  immediateInstructions: 'Đã thông báo cho trưởng đoàn lưu ý trú bão',
};

describe('AcknowledgeReviewForm', () => {
  it('allows entering notes and submitting acknowledge', async () => {
    const onAcknowledge = vi.fn().mockResolvedValue(undefined);
    render(<AcknowledgeReviewForm review={pendingReview} onAcknowledge={onAcknowledge} />);

    const textarea = screen.getByLabelText('Internal acknowledgement note');
    fireEvent.change(textarea, { target: { value: 'Đã nắm thông tin và theo dõi tình hình' } });

    const submitBtn = screen.getByRole('button', { name: /Đã xem cảnh báo/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onAcknowledge).toHaveBeenCalledWith('Đã nắm thông tin và theo dõi tình hình');
    });
  });

  it('renders read-only state when review is already Acknowledged', () => {
    render(<AcknowledgeReviewForm review={acknowledgedReview} onAcknowledge={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /Đã xem cảnh báo/i })).toBeNull();
    expect(screen.getByText(/Đã thông báo cho trưởng đoàn lưu ý trú bão/i)).toBeDefined();
    expect(screen.getByText(/Đã xác nhận lúc/i)).toBeDefined();
  });

  it('presents the note as internal and not sent to Travelers', async () => {
    const onAcknowledge = vi.fn().mockResolvedValue(undefined);
    render(<AcknowledgeReviewForm review={pendingReview} onAcknowledge={onAcknowledge} />);

    const note = screen.getByLabelText('Internal acknowledgement note');
    expect(document.getElementById(note.getAttribute('aria-describedby') ?? '')?.textContent).toBe(
      'This note is recorded for the Operator workflow and is not sent to Travelers. Add Traveler safety instructions when cancelling or stopping the tour.'
    );
    expect(screen.queryByText(/Chỉ dẫn tức thời/i)).toBeNull();

    fireEvent.change(note, { target: { value: '  Watching the storm  ' } });
    fireEvent.click(screen.getByRole('button', { name: /Đã xem cảnh báo/i }));
    await waitFor(() => expect(onAcknowledge).toHaveBeenCalledWith('Watching the storm'));
  });

  it('calls a saved note internal once acknowledged', () => {
    render(<AcknowledgeReviewForm review={acknowledgedReview} onAcknowledge={vi.fn()} />);

    expect(screen.getByText('Internal acknowledgement note')).toBeDefined();
    expect(screen.queryByText(/Chỉ dẫn tức thời/i)).toBeNull();
  });

  it('shows a review closed before anyone acknowledged it without inventing a time', () => {
    render(
      <AcknowledgeReviewForm
        review={{ ...pendingReview, status: 'Closed', immediateInstructions: 'weather.system_reason' }}
        onAcknowledge={vi.fn()}
      />
    );

    expect(screen.getByText('Hồ sơ đã đóng')).toBeDefined();
    expect(screen.queryByText('weather.system_reason')).toBeNull();
    expect(screen.queryByText(/N\/A/)).toBeNull();
    expect(screen.queryByText(/giữ nguyên/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /Đã xem cảnh báo/i })).toBeNull();
  });

  it('enforces 1000 character limit on instructions', () => {
    render(<AcknowledgeReviewForm review={pendingReview} onAcknowledge={vi.fn()} />);
    const textarea = screen.getByLabelText('Internal acknowledgement note') as HTMLTextAreaElement;
    expect(textarea.maxLength).toBe(1000);
  });
});
