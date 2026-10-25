/**
 * UC-29 copy. MSG numbers follow Report 3 (MSG138–MSG140 added by the UC-29 Backend spec §8); the text is the
 * Vietnamese rendering of the SRS message, worded for the Traveler who views the ticket.
 */
export const ticketMessages = {
  msg93: 'Vé QR đã mã hoá của bạn đã sẵn sàng. Hãy xuất trình mã này tại điểm tập trung.',
  msg95: (checkedInAt: string) => `Vé QR này đã được dùng để check-in lúc ${checkedInAt}.`,
  msg98: (departureDate: string) => `Vé này chỉ có hiệu lực trong ngày khởi hành: ${departureDate}.`,
  msg126: 'Bạn không có quyền truy cập chức năng này.',
  msg127: 'TripMate tạm thời không thể xử lý yêu cầu của bạn. Vui lòng kiểm tra kết nối và thử lại.',
  msg138: 'Vé điện tử sẽ có sau khi thanh toán của đơn đặt tour được xác nhận.',
  msg139: (bookingCode: string) =>
    `Vé điện tử này đã bị huỷ cùng đơn đặt tour ${bookingCode} và không thể dùng để check-in.`,
  msg140: (departureDate: string) => `Vé điện tử này đã hết hạn sau ngày khởi hành ${departureDate}.`,
  signIn: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để xem vé điện tử.',
  notFound: 'Không tìm thấy vé điện tử.',
  staleQr: 'Mã QR đang hiển thị có thể đã ngừng hoạt động. Hãy tải lại vé khi có kết nối.',
  refreshConfirm: 'Mã QR hiện tại sẽ ngừng hoạt động. Tiếp tục?',
  offline: 'Đang mất kết nối mạng — chưa thể làm mới mã QR.',
  meetingPointMissing: 'Chưa cập nhật',
  validityNote: (departureDate: string) => `Vé chỉ có hiệu lực trong ngày khởi hành ${departureDate}.`,
  status: {
    NotYetActive: 'Chưa đến ngày sử dụng',
    Valid: 'Có hiệu lực',
    Used: 'Đã sử dụng',
    Cancelled: 'Đã huỷ',
    Expired: 'Đã hết hạn',
  },
} as const;
