import { ROUTES } from '@/lib/routes';
import type { AdminDashboardModule, AdminModuleStatus } from './en';

export const adminDashboardVi = {
  metadataTitle: 'Tổng quan Quản trị',
  eyebrow: 'Không gian làm việc Quản trị viên',
  title: 'Tổng quan Quản trị',
  subtitle:
    'Truy cập các phân hệ quản trị dành cho Quản trị viên. Các phân hệ đang trong quá trình kết nối được liệt kê cùng trạng thái hiện tại.',
  readinessTitle: 'Chưa có số liệu mẫu nào được hiển thị',
  readinessBody:
    'Trang tổng quan này chỉ hiển thị liên kết trực tiếp khi phân hệ đã sẵn sàng. Các chỉ số nền tảng sẽ xuất hiện sau khi dịch vụ báo cáo được kết nối.',
  modulesHeading: 'Các phân hệ quản trị',
  openModuleLabel: 'Mở phân hệ',
  tabs: {
    overview: 'Tổng quan',
    analytics: 'Phân tích',
  },
  analyticsBadge: 'Mới',
  previewAnalyticsShow: 'Hiển thị bản xem trước phân tích nền tảng',
  previewAnalyticsHide: 'Ẩn bản xem trước phân tích nền tảng',
  statusLabels: {
    available: 'Sẵn sàng',
    pendingIntegration: 'Chờ tích hợp',
    pendingSpecification: 'Chờ đặc tả',
  } satisfies Record<AdminModuleStatus, string>,
  modules: [
    {
      id: 'system-configuration',
      title: 'Cấu hình Hệ thống',
      category: 'Tham số thuật toán',
      description:
        'Xem xét và cập nhật các tham số thuật toán lịch trình trong phạm vi cho phép.',
      icon: 'tune',
      status: 'available',
      href: ROUTES.admin.algorithmParameters,
      actionLabel: 'Mở cấu hình',
    },
    {
      id: 'audit-logs',
      title: 'Nhật ký Kiểm toán',
      category: 'Bảo mật và tuân thủ',
      description:
        'Tra cứu các sự kiện quản trị và hệ thống đã ghi nhận và kiểm tra chi tiết mục đã chọn.',
      icon: 'manage_search',
      status: 'available',
      href: ROUTES.admin.auditLogs,
      actionLabel: 'Mở nhật ký kiểm toán',
    },
    {
      id: 'statistical-reports',
      title: 'Báo cáo Thống kê',
      category: 'Báo cáo',
      description: 'Tạo và xuất các báo cáo thống kê cấp nền tảng.',
      icon: 'insights',
      status: 'pendingIntegration',
      availabilityNote: 'Phân hệ này chưa khả dụng trong bản dựng hiện tại.',
    },
    {
      id: 'payout-settlement',
      title: 'Quyết toán Chi trả',
      category: 'Nghiệp vụ tài chính',
      description:
        'Xác nhận quyết toán cuối cùng cho các khoản chi trả đủ điều kiện của Nhà điều hành tour sau khi đối soát.',
      icon: 'account_balance',
      status: 'pendingIntegration',
      availabilityNote: 'Đang chờ dịch vụ quyết toán chi trả.',
    },
    {
      id: 'platform-revenue',
      title: 'Doanh thu Nền tảng',
      category: 'Báo cáo tài chính',
      description:
        'Xem và xuất thông tin doanh thu toàn nền tảng. Phân hệ này độc lập với Báo cáo Thống kê.',
      icon: 'payments',
      status: 'pendingSpecification',
      availabilityNote: 'Đang chờ xác nhận đặc tả nghiệp vụ chức năng.',
    },
    {
      id: 'create-staff-account',
      title: 'Tạo Tài khoản Nhân viên',
      category: 'Tài khoản nội bộ',
      description: 'Tạo tài khoản Nhân viên nội bộ cho không gian quản trị.',
      icon: 'person_add',
      status: 'pendingSpecification',
      availabilityNote: 'Đang chờ xác nhận đặc tả nghiệp vụ chức năng.',
    },
  ] satisfies readonly AdminDashboardModule[],
} as const;
