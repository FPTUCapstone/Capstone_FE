export const adminStaffVi = {
  login: {
    backLabel: 'Quay lại TripMate',
    eyebrow: 'Quản trị hệ thống TripMate',
    title: 'Đăng nhập Cổng Quản trị',
    description:
      'Đăng nhập bằng tài khoản Quản trị viên hoặc Nhân viên được ủy quyền để truy cập không gian quản trị.',
    emailLabel: 'Địa chỉ Email',
    emailPlaceholder: 'staff@tripmate.com',
    passwordLabel: 'Mật khẩu',
    passwordPlaceholder: 'Nhập mật khẩu',
    forgotPassword: 'Quên mật khẩu?',
    submitButton: 'Đăng nhập',
    footerNote:
      'Đăng nhập bằng tài khoản Quản trị viên hoặc Nhân viên đang hoạt động. Bạn sẽ được yêu cầu đăng nhập lại khi phiên làm việc hết hạn.',
    invalidEmailError: 'Vui lòng nhập địa chỉ email hợp lệ.',
    requiredFieldError: 'Trường này là bắt buộc.',
    unavailableError: 'Hệ thống đăng nhập tạm thời không khả dụng. Vui lòng thử lại sau.',
    connectionError: 'Không thể kết nối. Vui lòng kiểm tra đường truyền và thử lại.',
    logoutError: 'Không thể đăng xuất khỏi không gian quản trị. Vui lòng thử lại.',
  },
  navigation: {
    brandAriaLabel: 'Không gian Quản trị TripMate',
    navAriaLabel: 'Điều hướng quản trị',
    adminDashboard: 'Tổng quan hệ thống',
    staffDashboard: 'Khu vực nhân viên',
    tourReviews: 'Duyệt tour du lịch',
    createPoi: 'Danh mục điểm tham quan',
    statisticalReports: 'Báo cáo thống kê',
    algorithmSettings: 'Cấu hình thuật toán',
    auditLogs: 'Nhật ký kiểm toán',
    securityLabel: 'Bảo mật',
    securityTitle: 'Đổi mật khẩu tài khoản quản trị',
    roleBadgeAdmin: 'Quản trị viên',
    roleBadgeStaff: 'Nhân viên',
  },
  accessDenied: {
    eyebrow: 'Mô-đun Quản trị Giới hạn',
    title: 'Yêu cầu Quyền Quản trị viên',
    description:
      'Tài khoản Nhân viên của bạn không có quyền xem mô-đun quản trị hệ thống này. Vui lòng quay lại Bảng Vận hành Nhân viên để tiếp tục làm việc.',
    returnToStaffButton: 'Quay lại Khu vực Nhân viên',
    returnToAdminSignInButton: 'Chuyển đổi Tài khoản Quản trị',
  },
  staffAccessDenied: {
    eyebrow: 'Mô-đun Nhân viên Giới hạn',
    title: 'Yêu cầu Quyền Nhân viên',
    description:
      'Hàng đợi duyệt thanh toán này dành riêng cho Nhân viên. Việc xử lý quyết toán của Quản trị viên được cung cấp riêng.',
    poiDescription: 'Hàng đợi duyệt điểm tham quan này dành riêng cho Nhân viên.',
  },
} as const;

export type AdminStaffViResources = typeof adminStaffVi;
