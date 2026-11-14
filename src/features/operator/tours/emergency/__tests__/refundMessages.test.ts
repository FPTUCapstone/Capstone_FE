import { describe, it, expect } from 'vitest';
import { refundNotice, refundResultMessage } from '../refundMessages';
import type { EmergencyTourActionResponse } from '../types';

const cancelled: EmergencyTourActionResponse = {
  operationId: 1,
  tourScheduleId: 20,
  action: 'CancelBeforeDeparture',
  scheduleStatus: 'Cancelled',
  affectedBookingCount: 3,
  committedAtUtc: '2026-11-02T12:00:00Z',
};

const stopped: EmergencyTourActionResponse = {
  ...cancelled,
  action: 'EmergencyStopActive',
  scheduleStatus: 'EmergencyStopped',
};

describe('refund messages', () => {
  it('explains the refund for each emergency action before it is confirmed', () => {
    expect(refundNotice('CancelBeforeDeparture')).toBe(
      'Mỗi booking đã thanh toán sẽ được hoàn 100% số tiền đã trả. Booking chưa thanh toán không phát sinh hoàn tiền.'
    );
    expect(refundNotice('EmergencyStopActive')).toBe(
      'Booking đã thanh toán sẽ được TripMate xem xét hoàn phần dịch vụ chưa thực hiện.'
    );
    expect(refundNotice('None')).toBeNull();
  });

  it('counts the refund requests created by a cancellation', () => {
    expect(refundResultMessage({ ...cancelled, refundsSubmitted: 2 })).toBe('Đã tạo 2 yêu cầu hoàn tiền.');
    expect(refundResultMessage({ ...cancelled, refundsSubmitted: 0 })).toBe('Đã tạo 0 yêu cầu hoàn tiền.');
  });

  it('says paid bookings went to TripMate for review after an emergency stop', () => {
    expect(refundResultMessage({ ...stopped, refundsSubmitted: 0 })).toBe(
      'Các booking đã thanh toán đã được chuyển cho TripMate xem xét hoàn tiền.'
    );
  });

  it('says nothing about refunds when the Backend does not report them', () => {
    expect(refundResultMessage(cancelled)).toBeNull();
    expect(refundResultMessage(stopped)).toBeNull();
  });
});
