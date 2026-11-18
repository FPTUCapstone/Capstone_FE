/**
 * Chuỗi tài nguyên tiếng Việt cho Xét duyệt Hồ sơ Đăng ký Nhà điều hành tour (Quản trị viên/Nhân viên).
 */
import type { tourOperatorApplicationEn } from './en';

type DeepString<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends string
  ? string
  : T extends object
  ? { [K in keyof T]: DeepString<T[K]> }
  : T;

export type TourOperatorApplicationResources = DeepString<typeof tourOperatorApplicationEn>;

export const tourOperatorApplicationVi: TourOperatorApplicationResources = {
  common: {
    notAvailable: 'Chưa có thông tin',
  },
  invalidId: {
    title: 'Mã hồ sơ không hợp lệ',
    body: 'Tham số hồ sơ được cung cấp không phải là mã định danh người dùng dạng số hợp lệ.',
  },
  header: {
    back: 'Quay lại Bảng quản trị',
    applicationNumber: (userId: number) => `Hồ sơ #${userId}`,
    fallbackTitle: (userId: number) => `Nhà điều hành #${userId}`,
    approve: 'Phê duyệt hồ sơ',
    reject: 'Từ chối hồ sơ',
    approvalBlocked: 'Cần có tài liệu Giấy phép kinh doanh trước khi phê duyệt.',
  },
  list: {
    eyebrow: 'Hàng đợi xét duyệt vận hành',
    title: 'Hồ sơ Đăng ký Nhà điều hành tour',
    subtitle:
      'Xem xét thẩm định, giấy phép kinh doanh và mã số thuế do Nhà điều hành tour gửi lên để được chứng nhận trên nền tảng.',
    allTab: 'Tất cả hồ sơ',
    pendingTab: 'Chờ duyệt',
    approvedTab: 'Đã duyệt',
    rejectedTab: 'Đã từ chối',
    searchAriaLabel: 'Tìm kiếm hồ sơ',
    searchPlaceholder: 'Tìm công ty, mã số thuế, mã hồ sơ…',
    tableAriaLabel: 'Hàng đợi hồ sơ đăng ký nhà điều hành tour',
    colId: 'Mã',
    colCompany: 'Hồ sơ pháp lý công ty',
    colTax: 'Mã số thuế',
    colPhone: 'Số điện thoại',
    colDate: 'Ngày gửi',
    colDocs: 'Tài liệu',
    colStatus: 'Trạng thái',
    colActions: 'Thao tác',
    emptyQueueTitle: 'Không có hồ sơ nhà điều hành nào trong hàng đợi',
    emptyQueueBody: 'Các hồ sơ sẽ hiển thị ở đây khi đối tác đăng ký tham gia.',
    docsCountLabel: (count: number) => `${count} tài liệu`,
    filesCount: (count: number) => `${count} tệp`,
    statusPending: 'Chờ duyệt',
    statusApproved: 'Đã phê duyệt',
    statusRejected: 'Đã từ chối',
    reviewAction: 'Xét duyệt',
    emptyNotice: 'Không tìm thấy hồ sơ nhà điều hành nào khớp với tiêu chí của bạn.',
    demoNoticeTitle: 'Bản xem trước giao diện • Bản ghi hàng đợi mẫu',
    demoNoticeBody:
      'Hiển thị danh sách mẫu phục vụ đánh giá UI/UX. Bộ lọc phía máy khách đang hoạt động; phân trang và thao tác thực tế chưa được kết nối trong chế độ này.',
  },
  status: {
    pending: 'Chờ phê duyệt',
    approved: 'Đã phê duyệt',
    rejected: 'Đã từ chối',
  },
  company: {
    title: 'Hồ sơ pháp lý công ty',
    userId: (userId: number) => `Mã người dùng: #${userId}`,
    companyName: 'Tên công ty',
    taxCode: 'Mã số thuế',
    businessLicense: 'Số giấy phép kinh doanh',
    contactPhone: 'Số điện thoại liên hệ',
    businessAddress: 'Địa chỉ trụ sở',
    reviewedBy: 'Người duyệt (Mã quản trị viên)',
    reviewedById: (reviewerId: number) => `#${reviewerId}`,
    reviewedAt: 'Thời gian xét duyệt',
    rejectionReason: 'Lý do từ chối',
  },
  documents: {
    title: 'Tài liệu xác minh đã gửi',
    count: (count: number) => `${count} tài liệu đã tải lên`,
    missingTitle: 'Thiếu tài liệu bắt buộc hoặc bị từ chối',
    missingBody: 'Việc phê duyệt yêu cầu phải có Giấy phép kinh doanh hợp lệ.',
    missingLicense: 'Thiếu tài liệu Giấy phép kinh doanh.',
    empty: 'Chưa có tài liệu xác minh nào được tải lên.',
    typeLabels: {
      BusinessLicense: 'Giấy phép kinh doanh',
      TaxCode: 'Chứng nhận mã số thuế',
    } as Record<string, string>,
    status: {
      submitted: 'Đã gửi',
      approved: 'Đã duyệt',
      rejected: 'Bị từ chối',
    },
    uploadedAt: (value: string) => `Đã tải lên: ${value}`,
    viewFile: 'Xem tệp',
    linkUnavailable: 'Liên kết tệp không khả dụng',
  },
  approve: {
    title: 'Phê duyệt hồ sơ',
    subtitle: 'Xác nhận kích hoạt tài khoản',
    blockedTitle: 'Bị chặn phê duyệt',
    blockedBody: 'Tài liệu Giấy phép kinh doanh bắt buộc đang bị thiếu hoặc đã bị từ chối.',
    question: (companyName: string) =>
      `Bạn có chắc chắn muốn phê duyệt hồ sơ Nhà điều hành tour cho ${companyName}?`,
    effects: [
      'Trạng thái tài khoản người dùng sẽ chuyển thành Hoạt động.',
      'Trạng thái xét duyệt nhà điều hành sẽ chuyển thành Đã duyệt.',
      'Các tài liệu đã gửi sẽ được đánh dấu là Đã phê duyệt.',
      'Một bản ghi nhật ký kiểm toán và thông báo kích hoạt sẽ được tạo tự động.',
    ],
    cancel: 'Hủy',
    confirm: 'Xác nhận phê duyệt',
    successFallback: (companyName: string) => `Đã phê duyệt Nhà điều hành tour "${companyName}".`,
  },
  reject: {
    title: 'Từ chối hồ sơ',
    subtitle: (companyName: string) => `Hồ sơ của "${companyName}"`,
    reasonLabel: 'Lý do từ chối',
    placeholder: 'Nhập lý do cụ thể để gửi cho người đăng ký (ví dụ: số giấy phép không hợp lệ hoặc tài liệu đã hết hạn).',
    counter: (length: number, max: number) => `${length} / ${max} ký tự`,
    visibilityNote: 'Người đăng ký sẽ nhìn thấy lý do này để bổ sung chỉnh sửa hồ sơ.',
    reasonRequired: 'Vui lòng nhập lý do từ chối.',
    reasonTooLong: (max: number) => `Lý do từ chối không được vượt quá ${max} ký tự.`,
    cancel: 'Hủy',
    confirm: 'Xác nhận từ chối',
    successFallback: (companyName: string) => `Đã từ chối hồ sơ của "${companyName}".`,
  },
  toast: {
    dismiss: 'Bỏ qua thông báo',
  },
  reconcile: {
    title: 'Cần làm mới chi tiết hồ sơ',
    body: 'Quyết định đã được ghi nhận nhưng không thể tải thông tin mới nhất. Vui lòng làm mới trước khi thực hiện thao tác tiếp theo.',
    retry: 'Làm mới hồ sơ',
  },
  errors: {
    loadTitle: 'Lỗi tải hồ sơ',
    retry: 'Thử tải lại',
    signIn: 'Đăng nhập lại',
    sessionExpired: 'Phiên làm việc quản trị của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.',
    forbidden: 'Bạn không có quyền truy cập vào chức năng này.',
    notFound: (userId: number) => `Không tìm thấy hồ sơ Nhà điều hành tour #${userId}.`,
    serviceUnavailable:
      'TripMate tạm thời không thể xử lý yêu cầu. Vui lòng kiểm tra kết nối và thử lại.',
    network: 'Không thể kết nối đến dịch vụ hồ sơ. Vui lòng thử lại.',
    unconfirmed:
      'Kết quả của quyết định này chưa được xác nhận. Vui lòng làm mới trang để kiểm tra trạng thái hiện tại.',
    unexpected: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.',
  },
};
