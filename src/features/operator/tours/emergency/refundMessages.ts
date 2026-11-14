import type { EmergencyTourActionResponse } from './types';

const CANCEL_REFUND_NOTICE =
  'Mỗi booking đã thanh toán sẽ được hoàn 100% số tiền đã trả. Booking chưa thanh toán không phát sinh hoàn tiền.';
const STOP_REFUND_NOTICE = 'Booking đã thanh toán sẽ được TripMate xem xét hoàn phần dịch vụ chưa thực hiện.';
const STOP_REFUND_RESULT = 'Các booking đã thanh toán đã được chuyển cho TripMate xem xét hoàn tiền.';

/** What happens to paid bookings, shown before the Operator confirms the action. */
export function refundNotice(action: string): string | null {
  if (action === 'CancelBeforeDeparture') return CANCEL_REFUND_NOTICE;
  if (action === 'EmergencyStopActive') return STOP_REFUND_NOTICE;
  return null;
}

/** What the Backend did about refunds; null when an older Backend does not report it. */
export function refundResultMessage(result: EmergencyTourActionResponse): string | null {
  if (result.refundsSubmitted === undefined) return null;
  if (result.action === 'CancelBeforeDeparture') return `Đã tạo ${result.refundsSubmitted} yêu cầu hoàn tiền.`;
  if (result.action === 'EmergencyStopActive') return STOP_REFUND_RESULT;
  return null;
}
