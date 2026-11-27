const messages: Record<string, string> = {
  'trip_review.invalid_input': 'Vui lòng kiểm tra lại thông tin đánh giá và thử lại.',
  'trip_review.not_found': 'Không tìm thấy đơn đặt chỗ này.',
  'trip_review.booking_not_found': 'Không tìm thấy đơn đặt chỗ này.',
  'trip_review.invalid_response': 'Dịch vụ đánh giá phản hồi không hợp lệ. Vui lòng thử lại.',
  'trip_review.forbidden': 'Bạn chỉ có thể đánh giá đơn đặt chỗ của chính mình.',
  'trip_review.booking_not_completed': 'Chỉ có thể gửi đánh giá sau khi chuyến đi đã hoàn thành.',
  'trip_review.duplicate': 'Đánh giá đã tồn tại. Nội dung đánh giá hiện tại được hiển thị bên dưới.',
  'trip_review.edit_expired': 'Đã hết thời hạn 7 ngày chỉnh sửa. Đánh giá này hiện chỉ có thể xem.',
  'trip_review.stale_version': 'Đánh giá này vừa được cập nhật ở nơi khác. Vui lòng tải lại trước khi lưu.',
  'trip_review.policy_rejected': 'Nội dung đánh giá vi phạm chính sách cộng đồng và không thể đăng.',
  'trip_review.policy_unavailable': 'Hệ thống kiểm duyệt nội dung tạm thời gián đoạn. Vui lòng thử lại.',
  'trip_review.unsupported_subject': 'Đơn đặt chỗ này không hỗ trợ gửi đánh giá.',
  'trip_review.unsupported_media_type': 'Chỉ hỗ trợ ảnh định dạng JPEG, PNG hoặc WebP.',
  'trip_review.body_too_large': 'Dung lượng ảnh đã chọn quá lớn.',
  UNAUTHENTICATED: 'Vui lòng đăng nhập đúng tài khoản đặt chỗ để tiếp tục.',
  FORBIDDEN: 'Bạn chỉ có thể đánh giá đơn đặt chỗ của chính mình.',
  MSG127: 'Chưa thể lưu đánh giá. Vui lòng thử lại.',
};

export function canonicalReviewMessage(code: string): string {
  return messages[code] ?? messages.MSG127;
}
