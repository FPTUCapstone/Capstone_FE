import type { postTripComplaintEn } from './en';

type DeepString<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends string
  ? string
  : T extends object
  ? { [K in keyof T]: DeepString<T[K]> }
  : T;

export type PostTripComplaintResources = DeepString<typeof postTripComplaintEn>;

export const postTripComplaintVi: PostTripComplaintResources = {
  title: 'Gửi khiếu nại sau chuyến đi',
  subtitle: 'Hãy cho chúng tôi biết điều gì đã xảy ra. TripMate sẽ chuyển khiếu nại của bạn đến nhà điều hành tour.',
  context: { booking: 'Mã đặt chỗ', tourEnded: 'Chuyến đi kết thúc lúc', deadline: 'Hạn chót gửi khiếu nại' },
  category: 'Danh mục lý do',
  detail: 'Chi tiết lý do',
  detailHint: (used: number) => `${used}/2000 ký tự`,
  evidence: 'Tài liệu bằng chứng',
  evidenceHint: 'Tùy chọn. Tệp JPG, PNG, WebP hoặc PDF; tối đa 5 tệp, 10 MB mỗi tệp, tổng cộng không quá 30 MB.',
  chooseEvidence: 'Chọn tệp',
  removeEvidence: (name: string) => `Xóa ${name}`,
  submit: 'Gửi khiếu nại',
  submitting: 'Đang gửi khiếu nại…',
  cancel: 'Hủy',
  retry: 'Thử lại',
  loading: 'Đang tải chi tiết khiếu nại…',
  existingTitle: 'Khiếu nại đã được gửi',
  outcomeTitle: 'Khiếu nại không khả dụng',
  status: 'Trạng thái',
  submittedAt: 'Đã gửi lúc',
  responseDeadline: 'Hạn phản hồi của nhà điều hành',
  evidenceList: 'Bằng chứng đã gửi',
  downloadEvidence: (name: string) => `Tải xuống ${name}`,
  addEvidence: 'Bổ sung bằng chứng một lần',
  addingEvidence: 'Đang bổ sung bằng chứng…',
  evidenceAmendmentHint: 'Bạn có thể bổ sung bằng chứng một lần trước hạn chót ban đầu. Chi tiết khiếu nại và thời hạn không thay đổi.',
  evidenceAmendmentSuccess: 'Bổ sung bằng chứng thành công.',
  categories: {
    ItineraryNotAsAdvertised: 'Lịch trình không đúng như quảng cáo',
    ServiceQuality: 'Chất lượng dịch vụ không đạt yêu cầu',
    GuideOrStaffConduct: 'Thái độ của hướng dẫn viên hoặc nhân viên',
    SafetyIssue: 'Vấn đề an toàn',
    ScheduleChangeOrDelay: 'Thay đổi lịch trình hoặc chậm trễ',
    Other: 'Lý do khác',
  },
  errors: {
    requiredCategory: 'Vui lòng chọn một danh mục lý do.',
    requiredDetail: 'Vui lòng nhập chi tiết khiếu nại.',
    detailTooLong: 'Chi tiết khiếu nại phải từ 2.000 ký tự trở xuống.',
    evidenceLimit: 'Bạn có thể đính kèm tối đa 5 tệp, mỗi tệp tối đa 10 MB và tổng dung lượng không quá 30 MB.',
    evidenceType: 'Chỉ chấp nhận các tệp JPG, PNG, WebP và PDF.',
    windowClosed: 'Thời hạn gửi khiếu nại đã kết thúc. Khiếu nại phải được gửi trong vòng 3 ngày sau khi tour kết thúc.',
    alreadyExists: 'Đã tồn tại khiếu nại cho đơn đặt tour này.',
    storageUnavailable: 'Khiếu nại của bạn chưa được ghi nhận. Vui lòng thử lại.',
    accessDenied: 'Bạn không có quyền truy cập vào đơn đặt tour này.',
    unavailable: 'Chi tiết khiếu nại không khả dụng. Vui lòng thử lại.',
    evidenceAmendmentUnavailable: 'Không thể bổ sung thêm bằng chứng cho khiếu nại này nữa.',
  },
  success: 'Khiếu nại của bạn đã được gửi thành công.',
};
