/**
 * Chuỗi tài nguyên tiếng Việt cho Kiểm duyệt Tour (Quản trị viên/Nhân viên).
 */
import type { tourModerationEn } from './en';

type DeepString<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends string
  ? string
  : T extends object
  ? { [K in keyof T]: DeepString<T[K]> }
  : T;

export type TourModerationResources = DeepString<typeof tourModerationEn>;

export const tourModerationVi: TourModerationResources = {
  metadata: {
    queueTitle: 'Các bài đăng tour chờ duyệt',
    detailTitle: 'Chi tiết nội dung & giá tour',
  },
  demoBanner: {
    label: 'Chế độ Demo',
    body: 'Các bài đăng tour mẫu được hiển thị để đánh giá giao diện. Quyết định phê duyệt được mô phỏng trong trình duyệt này và không gửi đến máy chủ.',
  },
  pendingIntegration: {
    title: 'Dịch vụ kiểm duyệt tour chưa được kết nối',
    queueBody:
      'Dịch vụ kiểm duyệt tour chưa khả dụng trong môi trường này, nên không thể tải danh sách bài đăng tour chờ duyệt và không thể ghi lại quyết định.',
    detailBody:
      'Dịch vụ kiểm duyệt tour chưa khả dụng trong môi trường này, nên không thể tải bài đăng tour này và không thể ghi lại quyết định.',
  },
  queue: {
    eyebrow: 'Kiểm duyệt tour',
    title: 'Các bài đăng tour chờ duyệt',
    subtitle: 'Các gói tour do Nhà điều hành tour gửi lên và đang chờ quyết định phê duyệt.',
    searchLabel: 'Tìm kiếm bài đăng tour chờ duyệt',
    searchPlaceholder: 'Tên tour hoặc nhà điều hành',
    searchButton: 'Tìm kiếm',
    resetButton: 'Đặt lại',
    listLabel: 'Danh sách bài đăng tour chờ duyệt',
    columns: {
      tour: 'Gói tour',
      operator: 'Nhà điều hành',
      submitted: 'Ngày gửi',
      departure: 'Khởi hành',
      price: 'Giá',
      action: 'Trạng thái và thao tác',
    },
    pendingStatus: 'Chờ duyệt',
    viewDetails: 'Xem chi tiết',
    viewDetailsFor: (tourName: string) => `Xem chi tiết cho ${tourName}`,
    emptyTitle: 'Không có tour chờ duyệt nào khớp với tiêu chí tìm kiếm.',
    emptyBody: 'Điều chỉnh tìm kiếm và thử lại, hoặc đặt lại bộ lọc.',
    totalCount: (count: number) => `${count} bài đăng tour chờ duyệt`,
  },
  pagination: {
    label: 'Các trang bài đăng tour chờ duyệt',
    previous: 'Trang trước',
    next: 'Trang sau',
    pageOf: (page: number, totalPages: number) => `Trang ${page} / ${totalPages}`,
  },
  detail: {
    backToQueue: 'Quay lại danh sách tour chờ duyệt',
    eyebrow: 'Kiểm duyệt nội dung và định giá tour',
    submittedOn: (date: string) => `Đã gửi vào ${date}`,
    operatorLabel: 'Nhà điều hành',
    locationLabel: 'Địa điểm',
    notFoundTitle: 'Không tìm thấy bài đăng tour',
    notFoundBody: 'Bài đăng tour này không tồn tại trong hàng đợi duyệt.',
    facts: {
      price: 'Giá từ',
      duration: 'Thời lượng',
      capacity: 'Sức chứa',
      departure: 'Khởi hành',
    },
    durationHours: (hours: number) => `${hours} giờ`,
    capacityTravelers: (count: number) => `Tối đa ${count} khách`,
    overviewTitle: 'Tổng quan',
    languagesLabel: 'Ngôn ngữ hỗ trợ',
    categoryLabel: 'Danh mục',
    imagesLabel: 'Hình ảnh đã gửi',
    includedTitle: 'Dịch vụ bao gồm',
    excludedTitle: 'Dịch vụ không bao gồm',
    cancellationTitle: 'Chính sách hủy tour',
    itineraryTitle: 'Lịch trình chi tiết',
    operatorCardTitle: 'Thông tin nhà điều hành',
  },
  decision: {
    title: 'Quyết định kiểm duyệt',
    checklistLegend: 'Tiêu chí đánh giá',
    checklistHint: 'Đánh dấu đạt cho từng tiêu chí sau khi đã kiểm tra nội dung gửi lên.',
    criteria: {
      contentCompleteness: 'Đầy đủ nội dung',
      imageAppropriateness: 'Hình ảnh phù hợp',
      pricePlausibility: 'Giá cả hợp lý',
      policyCompliance: 'Tuân thủ chính sách',
      itineraryFeasibility: 'Tính khả thi của lịch trình',
    },
    noteLabel: 'Ghi chú nội bộ người duyệt',
    noteHint: 'Tùy chọn. Chỉ hiển thị cho đội ngũ kiểm duyệt.',
    approveButton: 'Phê duyệt bài đăng tour',
    rejectButton: 'Từ chối bài đăng tour',
    checklistIncomplete: 'Cần đánh dấu đạt cho toàn bộ tiêu chí trước khi phê duyệt bài đăng tour này.',
    approvedResult:
      'Đã phê duyệt tour trong chế độ Demo. Không có thay đổi nào được gửi đến máy chủ và không có thông báo nào được chuyển đi.',
    rejectedResult:
      'Đã từ chối tour trong chế độ Demo. Không có thay đổi nào được gửi đến máy chủ và không có thông báo nào được chuyển đi.',
    recordedReasonLabel: 'Lý do (chỉ demo)',
  },
  approveDialog: {
    title: 'Phê duyệt bài đăng tour này?',
    description:
      'Trong chế độ Demo, việc phê duyệt chỉ được mô phỏng trên trình duyệt. Tour chưa được đăng công khai và nhà điều hành không nhận được thông báo.',
    confirm: 'Xác nhận phê duyệt',
    cancel: 'Hủy',
  },
  rejectDialog: {
    title: 'Từ chối bài đăng tour',
    description: 'Cung cấp lý do từ chối mô phỏng này. Không có tin nhắn nào được gửi tới nhà điều hành.',
    categoryLabel: 'Danh mục lý do',
    categoryPlaceholder: 'Chọn một danh mục',
    reasonLabel: 'Chi tiết lý do / Yêu cầu chỉnh sửa',
    reasonHint: 'Bắt buộc. Lý do này chỉ được ghi lại cho bản demo.',
    reasonRequired: 'Trường này là bắt buộc.',
    confirmRejection: 'Xác nhận từ chối',
    cancel: 'Hủy',
    confirmTitle: 'Xác nhận từ chối bài đăng tour này?',
    confirmDescription:
      'Trong chế độ Demo, việc từ chối chỉ được mô phỏng trên trình duyệt. Không có dữ liệu nào được lưu và nhà điều hành không nhận thông báo.',
    confirmReject: 'Từ chối bài đăng tour',
    back: 'Quay lại',
  },
  format: {
    currency: (amount: string) => `${amount} ₫`,
    unavailable: 'Chưa có thông tin',
  },
};
