// Chuỗi tạm (UC-41): chờ Lead/PO gán MSG chính thức, đồng bộ với mã BE tạm.
export const cancellationMessages = {
  title: 'Hủy booking',
  refundLabel: 'Số tiền hoàn dự kiến',
  refundPending: 'Đang chờ xử lý hoàn tiền',
  noRefund: 'Không hoàn tiền',
  reasonLabel: 'Lý do (tùy chọn)',
  confirmLabel: 'Tôi xác nhận hủy booking và chấp nhận mức hoàn trên',
  confirm: 'Xác nhận hủy',
  close: 'Đóng',
  loading: 'Đang tải thông tin hủy…',
  cancelled: 'Booking đã được hủy.',
  failed: 'Không thể hủy booking lúc này. Vui lòng thử lại.',
} as const;
