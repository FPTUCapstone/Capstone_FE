/**
 * Chuỗi tài nguyên tiếng Việt dùng chung cho Không gian làm việc Nhà điều hành tour.
 */
import type { operatorCommonEn } from './en';

type DeepString<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends string
  ? string
  : T extends object
  ? { [K in keyof T]: DeepString<T[K]> }
  : T;

export type OperatorCommonResources = DeepString<typeof operatorCommonEn>;

export const operatorCommonVi: OperatorCommonResources = {
  navigation: {
    dashboard: 'Bảng điều khiển',
    tours: 'Gói tour',
    coupons: 'Mã giảm giá',
    bookings: 'Đơn đặt tour',
    revenue: 'Doanh thu',
    payouts: 'Quyết toán',
    profile: 'Hồ sơ doanh nghiệp',
    settings: 'Cài đặt tài khoản',
    comingSoon: 'Sắp ra mắt',
    operationsSection: 'Quản lý vận hành',
    accountSection: 'Tài khoản đối tác',
    servicesSection: 'Dịch vụ & Vận hành',
    defaultOperatorTitle: 'Nhà điều hành tour',
    verifiedPartnerBadge: 'Đối tác đã xác thực',
    featureInDevelopment: 'Tính năng này hiện đang được phát triển',
    workspaceNavAria: 'Điều hướng không gian đối tác',
    openMenuAria: 'Mở menu điều hướng',
    closeMenuAria: 'Đóng menu điều hướng',
    demoBadge: 'Bản dùng thử',
  },
  logout: {
    button: 'Đăng xuất',
    confirmTitle: 'Xác nhận đăng xuất',
    confirmMessage: 'Bạn có chắc chắn muốn đăng xuất khỏi TripMate?',
    cancelButton: 'Hủy',
    confirmButton: 'Đăng xuất',
    loading: 'Đang đăng xuất...',
    errorMessage: 'Không thể kết thúc phiên đăng nhập. Vui lòng thử lại.',
    dialogAriaTitle: 'Xác nhận đăng xuất',
    dialogAriaDesc: 'Bạn có chắc chắn muốn đăng xuất khỏi TripMate?',
  },
  accessibility: {
    closeDialog: 'Đóng hộp thoại',
  },
  statuses: {
    approved: 'Đã duyệt',
    confirmed: 'Đã xác nhận',
    settled: 'Đã quyết toán',
    active: 'Đang hoạt động',
    pending: 'Chờ duyệt',
    pendingReview: 'Chờ duyệt',
    draft: 'Bản nháp',
    open: 'Đang mở',
    closed: 'Đã đóng',
    inactive: 'Ngưng hoạt động',
    rejected: 'Bị từ chối',
    cancelled: 'Đã hủy',
  },
};

export const operatorVi = operatorCommonVi;
