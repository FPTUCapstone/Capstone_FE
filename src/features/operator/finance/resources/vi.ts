/**
 * Chuỗi tài nguyên tiếng Việt cho Không gian Tài chính Nhà điều hành tour (UC-44, UC-45, UC-46).
 */
import type { financeEn } from './en';

type DeepString<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends string
  ? string
  : T extends object
  ? { [K in keyof T]: DeepString<T[K]> }
  : T;

export type FinanceResources = DeepString<typeof financeEn>;

export const financeVi: FinanceResources = {
  nav: {
    brandTitle: 'TripMate',
    roleBadge: 'Nhà điều hành',
    demoBadge: 'Bản dùng thử',
    verifiedPartner: 'Đối tác đã xác thực',
    dashboard: 'Bảng điều khiển',
    tours: 'Gói tour',
    coupons: 'Mã giảm giá',
    bookings: 'Đơn đặt tour',
    revenue: 'Doanh thu & Phân tích',
    payouts: 'Quyết toán thanh toán',
    signOut: 'Đăng xuất',
  },

  revenue: {
    formulaDecisionStatus: 'SETTLED_PAYOUT_MODEL_APPROVED_2026_11_14',
    title: 'Doanh thu & Phân tích',
    subtitle:
      'Theo dõi giá trị đặt tour, phí ước tính, hoàn tiền đã xử lý và các khoản thanh toán đã quyết toán vào tài khoản của bạn.',
    demoNoticeTitle: 'Đang bật chế độ Tài chính Demo',
    demoNoticeDesc:
      'Các chỉ số tài chính hiển thị dưới đây là dữ liệu mẫu phục vụ kiểm thử giao diện. Báo cáo thực tế sử dụng sổ cái quyết toán máy chủ.',
    pendingNoticeTitle: 'Đang chờ kết nối máy chủ',
    refreshBtn: 'Làm mới',
    tourFiltersLoading: 'Đang tải bộ lọc tour…',
    tourFiltersError: 'Không thể tải bộ lọc tour. Vui lòng thử lại.',
    retryTourFiltersBtn: 'Thử lại bộ lọc tour',
    lastUpdatedPrefix: 'Cập nhật lúc',
    lastUpdatedNever: 'Chưa được tải',

    filters: {
      title: 'Tiêu chí lọc',
      startDate: 'Từ ngày',
      endDate: 'Đến ngày',
      granularity: 'Chu kỳ phân tích',
      granularityDaily: 'Theo ngày',
      granularityWeekly: 'Theo tuần',
      granularityMonthly: 'Theo tháng',
      tourPackage: 'Gói tour',
      allTours: 'Tất cả gói tour',
      applyBtn: 'Áp dụng bộ lọc',
      resetBtn: 'Đặt lại',
      exportBtn: 'Xuất báo cáo',
    },

    summary: {
      grossRevenue: 'Tổng giá trị đặt chỗ',
      grossRevenueHelp: 'Thanh toán của du khách đã xác thực do TripMate tạm giữ',
      platformCommission: 'Phí hoa hồng nền tảng dự tính',
      platformCommissionHelp: 'Phí nền tảng ước tính (tỷ lệ {rate}%)',
      netAmount: 'Thực nhận quyết toán',
      netAmountHelp: 'Số tiền đã chuyển khoản vào tài khoản, sau khi trừ các khoản hoàn trả đã xác nhận',
      totalBookings: 'Tổng số đơn đặt',
      totalBookingsHelp: 'Đơn đặt của khách hàng đã xác nhận và đã hoàn thành',
      totalParticipants: 'Tổng số lượt khách',
      totalParticipantsHelp: 'Tổng số du khách trong các đơn đặt hợp lệ',
      refundedAmount: 'Hoàn tiền cho khách',
      refundedAmountHelp: 'Số tiền hoàn trả cho du khách trong giai đoạn này',
    },

    settlement: {
      title: 'Chi tiết quyết toán',
      subtitle: 'Giá trị đơn đặt mang tính tham khảo; số tiền quyết toán phản ánh số tiền thực tế đã chuyển cho bạn.',
      grossRevenue: 'Tổng giá trị đặt tour',
      discountsGiven: 'Giảm giá đã áp dụng',
      paymentsReceived: 'Thanh toán đã nhận',
      refundedAmount: 'Hoàn tiền cho khách',
      netSales: 'Doanh thu thuần',
      platformCommission: 'Hoa hồng nền tảng',
      netPayout: 'Thực nhận quyết toán',
      formulaHint: 'Chỉ bao gồm các khoản quyết toán có trạng thái Đã quyết toán, trừ đi các khoản ngân hàng hoàn trả đã được TripMate xác nhận.',
    },

    chart: {
      title: 'Xu hướng doanh thu',
      subtitle: 'Doanh thu, hoàn tiền và thu nhập thực nhận trong khoảng thời gian đã chọn.',
      emptyChart: 'Không có dữ liệu doanh thu nào trong biểu đồ cho giai đoạn này.',
      toggleTable: 'Chuyển đổi bảng dữ liệu biểu đồ',
      periodHeader: 'Khoảng thời gian',
      grossHeader: 'Tổng doanh thu',
      refundsHeader: 'Hoàn tiền',
      netHeader: 'Thực nhận',
      bookingsHeader: 'Đơn đặt',
      ariaChartLabel: 'Biểu đồ xu hướng doanh thu trong khoảng thời gian đã chọn',
    },

    detailTable: {
      title: 'Chi tiết theo gói tour',
      subtitle: 'Phân tích tài chính được tổng hợp theo từng gói tour.',
      colTour: 'Gói tour',
      colBookings: 'Đơn đặt',
      colParticipants: 'Số khách',
      colGross: 'Tổng doanh thu',
      colRefunded: 'Đã hoàn tiền',
      colCommission: 'Hoa hồng',
      colNet: 'Thực nhận',
      empty: 'Không có gói tour nào phát sinh doanh thu trong tiêu chí đã chọn.',
      showingRange: 'Đang hiển thị {start} đến {end} trong tổng số {total} gói tour',
      pageIndicator: 'Trang {page} / {totalPages}',
      prevBtn: 'Trước',
      nextBtn: 'Sau',
    },
  },

  exportDialog: {
    title: 'Xuất báo cáo doanh thu',
    subtitle:
      'Tải xuống báo cáo tài chính khớp với bộ lọc hiện tại để phục vụ kế toán và đối soát.',
    closeDialogAria: 'Đóng hộp thoại',
    appliedSummaryTitle: 'Tóm tắt bộ lọc đã áp dụng',
    filterPeriod: 'Khoảng thời gian',
    filterGranularity: 'Chu kỳ',
    filterTour: 'Phạm vi tour',
    allToursLabel: 'Tất cả gói tour',
    formatLabel: 'Định dạng tệp xuất',
    formatXlsxOnly: 'Bảng tính Excel (.xlsx)',
    demoNotSupportedNotice:
      'Tính năng xuất tệp yêu cầu kết nối máy chủ thực tế và không khả dụng khi xem trước với dữ liệu Demo.',
    scopeLabel: 'Phạm vi nội dung',
    scopeSummary: 'Chỉ số tổng quan',
    scopeSummaryHelp: 'Chỉ bao gồm các thẻ chỉ số tóm tắt',
    scopeDetailed: 'Tổng quan và chi tiết gói tour',
    scopeDetailedHelp:
      'Bao gồm các chỉ số tóm tắt và bảng kê chi tiết từng tour',
    exportBtn: 'Xuất tệp',
    exportingBtn: 'Đang tạo tệp xuất…',
    cancelBtn: 'Hủy',
    closeBtn: 'Đóng',
    queuedTitle: 'Đã đưa vào hàng đợi xuất',
    queuedDesc:
      'Báo cáo này có dung lượng lớn và đang được xử lý ngầm. Vui lòng kiểm tra Lịch sử xuất tệp bên dưới khi hoàn tất.',
  },

  exportHistory: {
    title: 'Lịch sử xuất tệp',
    subtitle: 'Các lượt xuất báo cáo doanh thu gần đây của bạn, mới nhất xếp trước.',
    refreshBtn: 'Làm mới lịch sử',
    colRequested: 'Thời gian yêu cầu',
    colStatus: 'Trạng thái',
    colExpires: 'Hết hạn vào',
    colActions: 'Thao tác',
    statusQueued: 'Đang chờ',
    statusProcessing: 'Đang xử lý',
    statusReady: 'Sẵn sàng',
    statusFailed: 'Thất bại',
    statusExpired: 'Đã hết hạn',
    downloadBtn: 'Tải về',
    downloadingBtn: 'Đang tải…',
    retryBtn: 'Thử lại',
    empty: 'Chưa có tệp xuất nào. Sử dụng nút Xuất báo cáo ở trên để tạo.',
  },

  payouts: {
    title: 'Tài khoản ngân hàng thụ hưởng',
    subtitle: 'Quản lý tài khoản ngân hàng nhận tiền chuyển khoản quyết toán hàng ngày tự động.',
    demoNoticeTitle: 'Đang bật chế độ Quyết toán Demo',
    demoNoticeDesc:
      'Tài khoản ngân hàng bên dưới hoạt động trên dữ liệu mẫu để kiểm thử. Các chỉnh sửa cục bộ không lưu vào môi trường thực.',

    bank: {
      title: 'Tài khoản ngân hàng thụ hưởng',
      subtitle: 'Tài khoản ngân hàng được cấu hình để nhận các khoản chuyển tiền tự động.',
      accountHolder: 'Chủ tài khoản',
      bankName: 'Tên ngân hàng',
      accountNumber: 'Số tài khoản',
      notSet: 'Chưa thiết lập',
      editBtn: 'Chỉnh sửa tài khoản',
      saveBtn: 'Lưu thông tin ngân hàng',
      cancelBtn: 'Hủy',
      savedSuccess: 'Cập nhật thông tin ngân hàng thụ hưởng thành công.',
      accountNumberPlaceholder: 'Nhập số tài khoản mới',
    },
  },

  messages: {
    MSG01: 'Vui lòng điền đầy đủ tất cả các trường bắt buộc.',
    MSG29: 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.',
    MSG115: 'Tạo báo cáo doanh thu thành công.',
    MSG116: 'Xuất báo cáo doanh thu thành công.',
    MSG117: 'Tạo tệp xuất thất bại. Vui lòng thử lại.',
    MSG126: 'Truy cập bị từ chối. Bạn chỉ có thể xem và quản lý dữ liệu tài chính thuộc các tour của mình.',
    MSG127: 'Đã xảy ra lỗi hệ thống ngoài dự kiến. Vui lòng thử lại yêu cầu của bạn.',
    MSG128: 'Không có dữ liệu tài chính nào khớp với tiêu chí đã chọn.',
    MSG129: 'Thao tác đã hoàn thành thành công.',
    MSG106: 'Quá trình tải về bị gián đoạn. Tệp vẫn có sẵn trong lịch sử xuất.',
    PENDING_BE_INTEGRATION:
      'Dịch vụ tài chính và quyết toán đang chờ kết nối Backend API. Không có dữ liệu tài chính giả lập trong môi trường thực tế.',
    BACKEND_INTEGRATION_PENDING: 'Đang chờ kết nối Backend',
    DEMO_ASYNC_EXPORT_SIMULATION:
      'Chỉ là mô phỏng giao diện Demo. Không có tác vụ xuất ngầm nào được tạo và không có thông báo nào được gửi.',
  },
};
