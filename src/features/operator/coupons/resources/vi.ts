import type { couponEn } from './en';

type DeepString<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends string
  ? string
  : T extends object
  ? { [K in keyof T]: DeepString<T[K]> }
  : T;

export type CouponResources = DeepString<typeof couponEn>;

export const couponVi: CouponResources = {
  metadata: {
    title: 'Quản lý Mã Giảm Giá | Không gian Nhà Điều Hành Tour',
    description: 'Tạo và quản lý các mã giảm giá và chiến dịch khuyến mãi cho gói tour.',
  },
  list: {
    title: 'Quản lý Mã Giảm Giá',
    description: 'Tạo và quản lý các mã khuyến mãi cho các gói tour của bạn.',
    createButton: 'Tạo mã giảm giá',
    kpi: {
      total: 'Tổng số mã',
      totalSubtext: 'Trên tất cả trạng thái',
      active: 'Mã đang hoạt động',
      activeSubtext: 'Sẵn sàng áp dụng khi đặt tour',
      redemptions: 'Lượt sử dụng hoàn tất',
      redemptionsSubtext: 'Đơn đặt tour đã hoàn thành',
      occupied: 'Số lượt đang giữ chỗ',
      occupiedSubtext: 'Đơn chờ thanh toán và đã thanh toán',
    },
    filterTabs: {
      all: 'Tất cả',
      active: 'Đang hoạt động',
      scheduled: 'Lên lịch trước',
      inactive: 'Ngưng áp dụng',
      ariaLabel: 'Bộ lọc trạng thái mã giảm giá',
    },
    table: {
      codeAndName: 'Mã & Tên chiến dịch',
      discount: 'Mức giảm',
      usageProgress: 'Tiến độ sử dụng',
      validityPeriod: 'Thời hạn áp dụng',
      scope: 'Phạm vi tour',
      status: 'Trạng thái',
      actions: 'Thao tác',
      usagesCount: '{count} đã dùng',
      usagesLimit: 'tối đa {limit}',
      occupiedCount: '{count} đang giữ',
      unlimited: 'Không giới hạn',
      allTours: 'Tất cả gói tour',
      toursCount: '{count} gói tour',
      editAction: 'Chỉnh sửa',
    },
    pagination: {
      showing: 'Hiển thị {start} đến {end} trên tổng số {total} mã',
      previous: 'Trang trước',
      next: 'Trang sau',
      page: 'Trang {current} / {total}',
    },
    empty: {
      title: 'Không tìm thấy mã giảm giá',
      description: 'Không có mã giảm giá nào phù hợp với bộ lọc đã chọn.',
    },
    authorizationRequired: 'Chỉ nhà điều hành tour đã được duyệt mới có quyền quản lý mã giảm giá.',
    loadError: 'Không thể tải danh sách mã giảm giá.',
    retry: 'Thử lại',
    banners: {
      productionTitle: 'Chế độ Production — PENDING_BE_INTEGRATION',
      productionBody:
        'Các điểm cuối quản lý mã giảm giá backend đang trong quá trình tích hợp. Không gian hoạt động ở chế độ đọc an toàn, không có dữ liệu giả lập hay mất mát trạng thái.',
    },
  },
  statuses: {
    active: 'Đang hoạt động',
    scheduled: 'Lên lịch trước',
    inactive: 'Ngưng áp dụng',
    expired: 'Đã hết hạn',
    unknown: 'Không xác định',
  },
  create: {
    title: 'Tạo mã giảm giá',
    subtitle: 'Thiết lập điều kiện giảm giá và các gói tour áp dụng cho du khách.',
    backAria: 'Quay lại danh sách mã giảm giá',
    sections: {
      general: 'Thông tin chung',
      discount: 'Điều khoản giảm giá',
      validity: 'Thời hạn áp dụng & Giới hạn',
      scope: 'Phạm vi gói tour áp dụng',
    },
    fields: {
      couponCode: 'Mã giảm giá',
      couponCodePlaceholder: 'Ví dụ: HE2026',
      couponCodeHelp: 'Mã chữ in hoa và chữ số độc nhất để du khách nhập khi thanh toán.',
      name: 'Tên chiến dịch',
      namePlaceholder: 'Ví dụ: Khuyến mãi đầu hè',
      nameHelp: 'Tên hiển thị nội bộ mô tả chiến dịch khuyến mãi.',
      discountType: 'Hình thức giảm giá',
      discountTypePercentage: 'Theo phần trăm (%)',
      discountTypeFlat: 'Số tiền cố định (VNĐ)',
      discountValue: 'Giá trị giảm',
      discountValuePercentageHelp: 'Nhập tỷ lệ phần trăm từ 1 đến 100.',
      discountValueFlatHelp: 'Nhập số tiền giảm cố định bằng VNĐ.',
      maxDiscountAmount: 'Số tiền giảm tối đa (VNĐ)',
      maxDiscountAmountPlaceholder: 'Hạn mức tối đa (để trống nếu không giới hạn)',
      maxDiscountAmountHelp: 'Mức giảm tối đa áp dụng khi chọn giảm theo tỷ lệ phần trăm.',
      minSpend: 'Chi tiêu tối thiểu (VNĐ)',
      minSpendPlaceholder: '0',
      minSpendHelp: 'Giá trị đơn tour tối thiểu trước khi áp dụng mã giảm giá.',
      usageLimit: 'Tổng lượt sử dụng tối đa',
      usageLimitHelp: 'Tổng số lần mã này có thể được sử dụng bởi tất cả du khách.',
      usageLimitPerTraveler: 'Lượt dùng tối đa mỗi du khách',
      usageLimitPerTravelerPlaceholder: '1',
      usageLimitPerTravelerHelp: 'Số lần tối đa mà một tài khoản du khách có thể áp dụng mã này.',
      validFrom: 'Hiệu lực từ ngày',
      validTo: 'Hiệu lực đến ngày',
      appliesToAllTours: 'Áp dụng cho tất cả các gói tour thuộc quyền sở hữu của bạn',
      selectSpecificTours: 'Chọn các gói tour cụ thể',
      selectedToursCount: 'Đã chọn {count} tour',
      noEligibleToursTitle: 'Không có tour đủ điều kiện',
      noEligibleToursHelp:
        'Cần có ít nhất một gói tour đủ điều kiện thuộc sở hữu của bạn để tạo hoặc cập nhật mã giảm giá.',
    },
    actions: {
      cancel: 'Hủy',
      submit: 'Tạo mã giảm giá',
      submitting: 'Đang tạo mã giảm giá...',
    },
    notices: {
      productionPending:
        'Lưu trữ mã giảm giá phía Backend đang trong quá trình phát triển (PENDING_BE_INTEGRATION). Mã giảm giá chưa thể lưu vào cơ sở dữ liệu production trực tiếp.',
      success: 'Tạo mã giảm giá thành công.',
      genericError: 'Không thể tạo mã giảm giá. Vui lòng kiểm tra lại các trường thông tin.',
    },
  },
  update: {
    title: 'Chỉnh sửa mã giảm giá {code}',
    subtitle: 'Cập nhật quy tắc khuyến mãi và các gói tour áp dụng.',
    backAria: 'Quay lại danh sách mã giảm giá',
    couponCodeNote: 'Mã giảm giá không thể thay đổi sau khi đã tạo.',
    statusAction: {
      activate: 'Kích hoạt lại mã',
      deactivate: 'Ngưng kích hoạt mã',
      expiredBlocked: 'Mã đã hết hạn — Không thể kích hoạt lại',
    },
    actions: {
      sectionTitle: 'Thao tác',
      cancel: 'Hủy',
      save: 'Lưu thay đổi',
      saving: 'Đang lưu thay đổi...',
      reloadLatest: 'Tải lại mã mới nhất và hủy bỏ bản nháp này',
    },
    formAriaLabel: 'Cập nhật mã giảm giá',
    readOnly: 'chỉ đọc',
    discountTypeLabel: 'Hình thức giảm giá',
    timezone: 'Asia/Ho_Chi_Minh',
    metrics: {
      occupied: 'Lượt đang giữ chỗ',
      limitMaximum: 'trên tối đa {limit}',
      remaining: 'Lượt còn lại',
      available: 'lượt sẵn sàng sử dụng',
      from: 'từ {date}',
      unlimited: 'Không giới hạn',
    },
    usage: {
      unlimited: 'Không giới hạn',
      unlimitedPerTraveler: 'Không giới hạn mỗi du khách',
      occupiedMinimum:
        'Tối thiểu {count} lượt đang giữ. Các đơn chờ thanh toán nếu hết hạn sẽ hoàn trả lại lượt.',
      redeemedMinimum: 'Tối thiểu {count} đơn đã hoàn tất áp dụng mã.',
      currentlyFull:
        'Mã này hiện không còn lượt sử dụng trống. Lượt có thể được giải phóng nếu đơn chờ thanh toán hết hạn hoặc bị hủy.',
    },
    scopeSelection:
      'Đã chọn {count} tour đủ điều kiện. Các tour mới chỉ được áp dụng khi bạn cập nhật lại mã này.',
    bookingPreservation: {
      title: 'Bảo lưu mức giảm của các đơn đặt tour hiện tại',
      occupied:
        'Các đơn chờ thanh toán và đã thanh toán sẽ giữ các lượt này. Thay đổi điều khoản mã chỉ ảnh hưởng đến các đơn đặt mới trong tương lai.',
      redeemed:
        '{count} đơn đặt của khách hàng đã sử dụng mã này. Mức giảm giá đã áp dụng trước đó giữ nguyên không đổi.',
    },
    notices: {
      success: 'Cập nhật mã giảm giá thành công.',
      statusSuccess: 'Cập nhật trạng thái mã thành công.',
      genericError: 'Không thể cập nhật mã giảm giá. Vui lòng kiểm tra lại các trường thông tin.',
      expiredExtension:
        'Đã cập nhật mã giảm giá. Hãy kích hoạt riêng trước khi du khách có thể sử dụng.',
    },
  },
  dialog: {
    deactivateTitle: 'Ngưng kích hoạt mã {code}?',
    activateTitle: 'Kích hoạt lại mã {code}?',
    deactivateDesc:
      'Mã sẽ chuyển sang trạng thái Ngưng áp dụng và không còn được áp dụng cho các đơn đặt mới.',
    deactivateNotice:
      'Lưu ý: {count} đơn đặt của du khách đã sử dụng mã này. Các mức giảm giá đã áp dụng trước đó giữ nguyên.',
    activateDesc:
      'Mã sẽ chuyển sang trạng thái Hoạt động (hoặc Đã lên lịch tùy theo ngày) và du khách có thể tiếp tục sử dụng khi thanh toán.',
    cancelBtn: 'Hủy',
    confirmDeactivate: 'Xác nhận ngưng kích hoạt',
    confirmActivate: 'Xác nhận kích hoạt lại',
    processing: 'Đang xử lý...',
  },
  errors: {
    requiredField: 'Trường này là bắt buộc.',
    requiredSummary: 'Vui lòng điền đầy đủ các trường bắt buộc.',
    duplicateCode: 'Mã giảm giá đã tồn tại trong hệ thống.',
    invalidNumeric:
      'Giá trị giảm giá, giới hạn lượt dùng hoặc mức chi tiêu tối thiểu phải là số dương hợp lệ.',
    invalidPercentage: 'Tỷ lệ giảm giá theo phần trăm không được vượt quá 100%.',
    usageLimitBelowCount: 'Giới hạn sử dụng không thể thấp hơn số lượt đã được sử dụng thực tế.',
    invalidValidityPeriod:
      'Thời hạn áp dụng không hợp lệ. Ngày bắt đầu không được sau ngày kết thúc, và ngày kết thúc không thể trong quá khứ.',
    expiredReactivationBlocked:
      'Không thể kích hoạt lại mã đã hết hạn. Vui lòng cập nhật lại ngày kết thúc trước khi kích hoạt.',
    unauthorizedTourScope:
      'Các tour đã chọn chứa gói tour không thuộc quyền sở hữu của bạn.',
    noEligibleTours:
      'Không có tour đủ điều kiện. Cần ít nhất một gói tour thuộc sở hữu của bạn để cấu hình mã giảm giá.',
    unauthorizedOwner:
      'Từ chối truy cập. Bạn chỉ có thể xem và quản lý mã giảm giá cho tài khoản điều hành tour của chính mình.',
    selectAtLeastOneTour: 'Vui lòng chọn ít nhất một gói tour hoặc áp dụng cho tất cả các tour.',
    systemError: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.',
    notFound: 'Không tìm thấy mã giảm giá được yêu cầu.',
    pendingBe: 'Tính năng này đang chờ tích hợp Backend.',
    invalidVietnamDateTime: 'Nhập ngày giờ hợp lệ theo múi giờ Việt Nam.',
  },
  page: {
    loadingList: 'Đang tải danh sách mã giảm giá...',
    loadingForm: 'Đang tải biểu mẫu mã giảm giá...',
    loadingDetails: 'Đang tải chi tiết mã giảm giá...',
    loadingDefault: 'Đang tải...',
    unauthorizedTitle: 'Từ chối Truy cập',
    notFoundTitle: 'Không tìm thấy mã giảm giá',
    unableToLoadTitle: 'Không thể tải mã giảm giá',
    backToList: 'Quay lại danh sách mã giảm giá',
    requestedId: 'Mã định danh được yêu cầu: {id}',
  },
};
