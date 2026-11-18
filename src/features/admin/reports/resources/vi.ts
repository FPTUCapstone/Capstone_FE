import type { statisticalReportsEn } from './en';

type DeepString<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends string
  ? string
  : T extends object
  ? { [K in keyof T]: DeepString<T[K]> }
  : T;

export type StatisticalReportsResources = DeepString<typeof statisticalReportsEn>;

export const statisticalReportsVi: StatisticalReportsResources = {
  metadata: {
    title: 'Báo cáo thống kê | Bảng quản trị TripMate',
    description:
      'Tạo và xuất báo cáo thống kê tổng hợp nền tảng từ các kỳ báo cáo đã đóng.',
  },
  navigation: {
    brandAriaLabel: 'Bảng quản trị TripMate',
    navAriaLabel: 'Điều hướng quản trị',
    dashboard: 'Bảng điều khiển',
    tourReviews: 'Kiểm duyệt Tour',
    statisticalReports: 'Báo cáo thống kê',
    algorithmSettings: 'Cài đặt thuật toán',
    auditLogs: 'Nhật ký kiểm toán',
    securityLabel: 'Bảo mật',
    securityTitle: 'Đổi mật khẩu quản trị viên',
    logoutError: 'Không thể đăng xuất khỏi không gian quản trị. Vui lòng thử lại.',
  },
  accessDenied: {
    eyebrow: 'Chỉ dành cho Quản trị viên',
    title: 'Hạn chế truy cập',
    message: 'Bạn không có quyền truy cập vào chức năng này.',
    detail:
      'Chỉ phiên làm việc của Quản trị viên đang hoạt động mới có thể tạo và xuất báo cáo thống kê nền tảng.',
    unverifiedSessionNotice:
      'Phiên quản trị của bạn không thể xác thực với máy chủ. Vui lòng đăng nhập lại bằng tài khoản Quản trị viên hợp lệ.',
    returnToSignIn: 'Quay lại Đăng nhập Quản trị viên',
    returnToDashboard: 'Quay lại Không gian làm việc',
  },
  header: {
    eyebrow: 'Quản trị Nền tảng & Trí tuệ Doanh nghiệp',
    title: 'Báo cáo thống kê',
    subtitle:
      'Tạo và xuất thống kê nền tảng tổng hợp từ các kỳ báo cáo đã hoàn thành và đã đóng trên toàn TripMate.',
    timezoneBadge: 'Múi giờ: Asia/Ho_Chi_Minh (dd/MM/yyyy)',
    currencyBadge: 'Đơn vị tiền tệ: VND',
  },
  modeBanner: {
    demoModeHeading: 'Không gian làm việc dữ liệu mẫu Demo (?demo=1)',
    productionBadge: 'DỮ LIỆU KỲ ĐÃ ĐÓNG TRỰC TIẾP',
  },
  criteriaForm: {
    sectionTitle: 'Tiêu chí báo cáo & Chọn kỳ',
    sectionDescription:
      'Chọn loại báo cáo, kỳ đã đóng và các bộ lọc tùy chọn, sau đó chọn Tạo báo cáo.',
    reportTypeLegend: 'Loại báo cáo (Bắt buộc)',
    reportTypeSelectLabel: 'Loại báo cáo',
    reportTypePlaceholder: 'Chọn một loại báo cáo...',
    periodGranularityLegend: 'Chu kỳ báo cáo (Bắt buộc)',
    periodSelectLabel: 'Kỳ báo cáo (Bắt buộc)',
    periodPlaceholder: 'Chọn kỳ báo cáo...',
    optionalFiltersHeading: 'Bộ lọc tùy chọn',
    operatorFilterLabel: 'Nhà điều hành tour',
    destinationFilterLabel: 'Điểm đến',
    bookingTypeFilterLabel: 'Loại đơn đặt',
    generateButton: 'Tạo báo cáo',
    cancelButton: 'Hủy',
    draftModifiedNotice:
      'Tiêu chí nháp đã được chỉnh sửa. Báo cáo đang hiển thị bên dưới vẫn phản ánh các tiêu chí đã tạo trước đó cho đến khi bạn chọn Tạo báo cáo lại.',
    draftResetAnnouncement:
      'Tiêu chí báo cáo nháp đã được đặt lại về cấu hình áp dụng gần nhất.',
    simulationHeading: 'Điều khiển mô phỏng lỗi Demo',
    simulateGenerationErrorLabel: 'Mô phỏng lỗi hệ thống/mạng ở lần Tạo báo cáo tiếp theo',
    simulateExportErrorLabel: 'Mô phỏng lỗi tạo tệp ở lần Xuất tệp tiếp theo',
  },
  reportTypes: {
    USER_GROWTH: {
      label: 'Tăng trưởng người dùng',
      description: 'Lượt đăng ký mới, tài khoản đã kích hoạt, du khách và nhà điều hành mới.',
    },
    BOOKING_VOLUME: {
      label: 'Khối lượng đặt chỗ',
      description: 'Đơn đặt hoàn thành, đã xác nhận và đã hoàn tiền trên các tour và dịch vụ.',
    },
    PLATFORM_REVENUE: {
      label: 'Doanh thu nền tảng',
      description:
        'Tổng giá trị đặt chỗ đã xác nhận và hoàn thành sau khi trừ hoàn tiền tính bằng VND.',
    },
    OPERATOR_PERFORMANCE: {
      label: 'Hiệu quả Nhà điều hành tour',
      description: 'Chuyến khởi hành hoàn tất, tỷ lệ hoàn thành và khối lượng đặt chỗ quyết toán.',
    },
    DESTINATION_POPULARITY: {
      label: 'Độ phổ biến của điểm đến',
      description: 'Điểm đến được ghé thăm nhiều nhất, điểm xuất hiện trong lịch trình và nhu cầu của khách.',
    },
  },
  granularities: {
    CLOSED_MONTH: 'Tháng đã đóng',
    CLOSED_QUARTER: 'Quý đã đóng',
    CLOSED_YEAR: 'Năm đã đóng',
  },
  periods: {
    production: {
      '2026-09': 'Tháng 9/2026 (01/09/2026 – 30/09/2026)',
      '2026-08': 'Tháng 8/2026 (01/08/2026 – 31/08/2026)',
      '2026-07': 'Tháng 7/2026 (01/07/2026 – 31/07/2026)',
      '2026-Q3': 'Quý 3/2026 (01/07/2026 – 30/09/2026)',
      '2026-Q2': 'Quý 2/2026 (01/04/2026 – 30/06/2026)',
      '2025': 'Năm tài chính 2025 (01/01/2025 – 31/12/2025)',
      '2024': 'Năm tài chính 2024 (01/01/2024 – 31/12/2024)',
    },
    demo: {
      '2026-09': 'Tháng 9/2026 (01/09/2026 – 30/09/2026 • Dữ liệu mẫu đã đóng)',
      '2026-08': 'Tháng 8/2026 (01/08/2026 – 31/08/2026 • Dữ liệu mẫu đã đóng)',
      '2026-07': 'Tháng 7/2026 (01/07/2026 – 31/07/2026 • Dữ liệu mẫu đã đóng)',
      '2026-10-OPEN': 'Tháng 10/2026 (01/10/2026 – Hiện tại • Mẫu tháng đang mở)',
      '2026-Q3': 'Quý 3/2026 (01/07/2026 – 30/09/2026 • Dữ liệu mẫu đã đóng)',
      '2026-Q2': 'Quý 2/2026 (01/04/2026 – 30/06/2026 • Dữ liệu mẫu đã đóng)',
      '2026-Q4-OPEN': 'Quý 4/2026 (01/10/2026 – Hiện tại • Mẫu quý đang mở)',
      '2025': 'Năm tài chính 2025 (01/01/2025 – 31/12/2025 • Dữ liệu mẫu đã đóng)',
      '2024': 'Năm tài chính 2024 (01/01/2024 – 31/12/2024 • Dữ liệu mẫu đã đóng)',
      '2026-OPEN': 'Năm tài chính 2026 (01/01/2026 – Hiện tại • Mẫu năm đang mở)',
    },
  },
  units: {
    vndSuffix: '₫',
  },
  filters: {
    allOperatorsLabel: 'Tất cả nhà điều hành tour',
    allDestinationsLabel: 'Tất cả điểm đến',
    loadErrorMessage:
      'Không thể tải danh sách Nhà điều hành và Điểm đến. Chỉ có "Tất cả" khả dụng cho đến khi tải xong.',
    demoOperators: {
      'OP-101': 'Hành trình Di sản Miền Trung',
      'OP-102': 'Khám phá Biển Đà Nẵng',
      'OP-103': 'Du lịch Sinh thái Cao nguyên',
      'OP-104': 'Tour Thủ công Mekong (Kỳ không có hoạt động)',
    },
    demoDestinations: {
      'DEST-DAD': 'Đà Nẵng',
      'DEST-HOI': 'Hội An',
      'DEST-HUE': 'Huế',
      'DEST-DLI': 'Đà Lạt',
      'DEST-VCS': 'Côn Đảo (Chưa có hoạt động)',
    },
    bookingTypes: {
      ALL: 'Tất cả loại đặt chỗ',
      TOUR_PACKAGE: 'Đặt gói tour',
      COMMERCIAL_SERVICE: 'Đặt dịch vụ thương mại',
    },
  },
  validation: {
    requiredField: 'Trường này là bắt buộc.',
    openPeriodRejected:
      'Kỳ đã chọn chưa được đóng. Báo cáo thống kê chỉ có thể được tạo và xuất từ một kỳ đã đóng để các số liệu không bị thay đổi sau khi xuất.',
  },
  states: {
    idleTitle: 'Sẵn sàng tạo báo cáo thống kê',
    idleDescription:
      'Cấu hình loại báo cáo, kỳ đã đóng và các bộ lọc tùy chọn ở trên, sau đó chọn Tạo báo cáo để xem số liệu tổng hợp và biểu đồ.',
    loadingTitle: 'Đang tạo báo cáo thống kê',
    loadingDescription:
      'TripMate đang đọc dữ liệu ảnh chụp bất biến cho kỳ đã đóng được chọn.',
    noDataTitle: 'Không có dữ liệu thống kê',
    noDataMessage: 'Không tìm thấy bản ghi nào khớp với tiêu chí của bạn.',
    noDataDescription:
      'Loại báo cáo, kỳ đã đóng và các bộ lọc của bạn vẫn được giữ nguyên ở trên để bạn có thể điều chỉnh phạm vi lọc và tạo lại.',
    generationErrorTitle: 'Không thể tổng hợp báo cáo thống kê',
    generationErrorMessage:
      'TripMate tạm thời không thể xử lý yêu cầu. Vui lòng kiểm tra kết nối mạng và thử lại.',
    retryGenerateButton: 'Thử lại tạo báo cáo',
  },
  results: {
    appliedHeaderTitle: 'Kết quả báo cáo đã tạo',
    demoWatermarkBadge: 'BỘ DỮ LIỆU THỐNG KÊ DEMO',
    appliedCriteriaSummaryLabel: 'Phạm vi báo cáo đã áp dụng',
    appliedPeriodPrefix: 'Kỳ:',
    appliedOperatorPrefix: 'Nhà điều hành:',
    appliedDestinationPrefix: 'Điểm đến:',
    appliedBookingTypePrefix: 'Loại đặt chỗ:',
    periodWindowLabel: 'Khoảng thời gian kỳ đã đóng',
    generatedTimestampLabel: 'Thời gian tạo',
    summarySectionTitle: 'Số liệu thống kê tổng hợp',
    revenueFormulaTitle: 'Chi tiết tính toán Doanh thu nền tảng (VND)',
    revenueFormulaNote:
      'Được tính từ các đơn đặt đã xác nhận và hoàn thành, sau khi trừ các khoản hoàn tiền trong ảnh chụp kỳ đã đóng.',
    confirmedGrossLabel: 'Tổng tiền đặt chỗ đã xác nhận',
    completedGrossLabel: 'Tổng tiền đặt chỗ đã hoàn thành',
    recordedRefundsLabel: 'Trừ các khoản hoàn tiền',
    netPlatformRevenueLabel: 'Doanh thu thuần nền tảng',
    chartSectionTitle: 'Tổng quan phân bổ',
    chartSvgAriaLabel: 'Biểu đồ thanh ngang của các phân đoạn báo cáo theo tỷ trọng',
    shareOfTotalSuffix: 'trong tổng số của kỳ',
  },
  reportTemplates: {
    emptyTableHeaders: [
      'Phân đoạn',
      'Chỉ số chính',
      'Chỉ số phụ',
      'Trạng thái / Tỷ trọng',
    ] as const,
    PLATFORM_REVENUE: {
      chartUnitLabel: 'Doanh thu thuần (VND)',
      tableHeaders: [
        'Phân đoạn doanh thu',
        'Tổng xác nhận + hoàn thành (VND)',
        'Hoàn tiền đã ghi nhận (VND)',
        'Doanh thu thuần (VND)',
      ] as const,
      segmentSecondaryLabel: 'Thuần xác nhận + hoàn thành',
      segments: {
        culturalHeritage: 'Tour Văn hóa & Di sản',
        coastalIsland: 'Gói Tour Biển & Đảo',
        highlandEco: 'Trải nghiệm Sinh thái Cao nguyên',
      },
      metrics: {
        netPlatformRevenue: {
          label: 'Doanh thu thuần nền tảng',
          contextNote: 'Đơn đặt đã xác nhận + hoàn thành trừ đi hoàn tiền (Demo)',
        },
        confirmedGross: {
          label: 'Tổng tiền đơn đã xác nhận',
          contextNote: 'Quyết toán đơn đặt đã xác nhận trong kỳ',
        },
        completedGross: {
          label: 'Tổng tiền đơn đã hoàn thành',
          contextNote: 'Quyết toán các chuyến đi và tour đã hoàn thành',
        },
        recordedRefunds: {
          label: 'Hoàn tiền đã khấu trừ',
          contextNote: 'Các khoản hoàn trả cho du khách đã xử lý trong kỳ',
        },
      },
    },
    USER_GROWTH: {
      chartUnitLabel: 'Tài khoản đăng ký',
      tableHeaders: [
        'Kênh đăng ký',
        'Tài khoản mới',
        'Tài khoản kích hoạt',
        'Tỷ trọng trong kỳ',
      ] as const,
      segmentSecondaryLabel: 'Tài khoản đã xác thực',
      segments: {
        directWeb: 'Đăng ký trực tiếp qua Web',
        mobileApp: 'Đăng ký qua Ứng dụng di động',
        partnerReferral: 'Đăng ký qua Đối tác & Giới thiệu',
      },
      metrics: {
        totalNewAccounts: {
          label: 'Tổng số lượt đăng ký mới',
          contextNote: 'Tổng hợp đăng ký Du khách và Nhà điều hành tour (Demo)',
        },
        newTravelers: {
          label: 'Tài khoản Du khách mới',
          contextNote: 'Du khách đăng ký trong kỳ đã đóng',
        },
        newOperators: {
          label: 'Tài khoản Nhà điều hành mới',
          contextNote: 'Đối tác mới gia nhập nền tảng trong kỳ',
        },
        verifiedActive: {
          label: 'Tài khoản đã xác thực hoạt động',
          contextNote: 'Đã hoàn tất xác thực email và kích hoạt trạng thái',
        },
      },
    },
    BOOKING_VOLUME: {
      chartUnitLabel: 'Số lượng đơn đặt',
      tableHeaders: [
        'Phân loại trạng thái đơn',
        'Số lượng đơn',
        'Giá trị tương ứng (VND)',
        'Trạng thái quyết toán',
      ] as const,
      segments: {
        completed: 'Đơn đặt đã hoàn thành',
        confirmed: 'Đơn đặt đã xác nhận',
        cancelledRefunded: 'Đã hủy & Hoàn tiền',
      },
      settlementStates: {
        fulfilled: 'Đã hoàn tất',
        activeConfirmed: 'Đã xác nhận hoạt động',
        refundRecorded: 'Đã ghi nhận hoàn tiền',
      },
      metrics: {
        totalBookings: {
          label: 'Tổng số đơn đã ghi nhận',
          contextNote: 'Tất cả giao dịch đặt chỗ trong kỳ đã đóng (Demo)',
        },
        completedBookings: {
          label: 'Đơn đặt đã hoàn thành',
          contextNote: 'Các chuyến khởi hành và dịch vụ đã hoàn tất',
        },
        confirmedBookings: {
          label: 'Đơn đặt đã xác nhận',
          contextNote: 'Đơn đặt đã thanh toán và lên lịch',
        },
        settledBookingValue: {
          label: 'Giá trị đặt chỗ quyết toán thuần',
          contextNote: 'Giá trị đặt chỗ tính bằng VND sau khi trừ hoàn tiền',
        },
      },
    },
    OPERATOR_PERFORMANCE: {
      chartUnitLabel: 'Khối lượng quyết toán thuần (VND)',
      tableHeaders: [
        'Nhà điều hành tour',
        'Chuyến khởi hành hoàn tất',
        'Tỷ lệ hoàn thành',
        'Khối lượng quyết toán thuần (VND)',
      ] as const,
      completionSuffix: 'Hoàn thành',
      segments: {
        op101: 'Hành trình Di sản Miền Trung',
        op102: 'Khám phá Biển Đà Nẵng',
        op103: 'Du lịch Sinh thái Cao nguyên',
      },
      metrics: {
        activeOperators: {
          label: 'Nhà điều hành được đánh giá',
          contextNote: 'Các nhà điều hành được duyệt trong phạm vi báo cáo (Demo)',
        },
        fulfilledDepartures: {
          label: 'Chuyến khởi hành đã hoàn tất',
          contextNote: 'Khởi hành hoàn tất không có sự cố vận hành',
        },
        completionRate: {
          label: 'Tỷ lệ hoàn thành trung bình',
          contextNote: 'Tỷ lệ giữa các chuyến hoàn thành so với lịch trình',
        },
        operatorNetRevenue: {
          label: 'Khối lượng tour quyết toán thuần',
          contextNote: 'Đơn xác nhận + hoàn thành sau khi trừ hoàn tiền',
        },
      },
    },
    DESTINATION_POPULARITY: {
      chartUnitLabel: 'Lượt khách hoàn thành chuyến thăm',
      tableHeaders: [
        'Điểm đến',
        'Lượt khách ghé thăm',
        'Số lần trong lịch trình',
        'Doanh thu thuần liên quan (VND)',
      ] as const,
      segments: {
        daNang: 'Đà Nẵng',
        hoiAn: 'Hội An',
        hue: 'Huế',
        daLat: 'Đà Lạt',
      },
      metrics: {
        completedVisits: {
          label: 'Lượt khách ghé thăm hoàn tất',
          contextNote: 'Lượt tham quan điểm du lịch đã xác thực (Demo)',
        },
        itineraryInclusions: {
          label: 'Số lần xuất hiện trong lịch trình',
          contextNote: 'Số lần các điểm thuộc địa danh được lên lịch trong tour',
        },
        topDestination: {
          label: 'Điểm đến dẫn đầu',
          contextNote: 'Điểm đến có tỷ trọng đơn đặt và lịch trình cao nhất',
        },
        associatedRevenue: {
          label: 'Giá trị đặt chỗ thuần liên quan',
          contextNote: 'Đơn xác nhận + hoàn thành sau khi trừ hoàn tiền',
        },
      },
    },
  },
  exportArtifact: {
    fileNamePrefix: 'DEMO-TripMate',
    watermarkHeader: '[DEMO FIXTURE EXPORT — NOT PRODUCTION ACCOUNTING DATA]',
    reportTypePrefix: 'Loại báo cáo',
    closedPeriodPrefix: 'Kỳ đã đóng',
    appliedFiltersPrefix: 'Bộ lọc đã áp dụng',
    operatorKeyLabel: 'Nhà điều hành',
    destinationKeyLabel: 'Điểm đến',
    bookingTypeKeyLabel: 'Loại đặt chỗ',
    exportFormatPrefix: 'Định dạng xuất',
    exportedDatePrefix: 'Ngày xuất (Asia/Ho_Chi_Minh)',
    sectionDivider: '---',
    columnSeparator: ' | ',
    auditRecordPrefix: 'DEMO Audit Record: StatisticalReportExported',
    auditPreviewPrefix: 'DEMO Preview Record: StatisticalReportPreviewed',
    auditReportTypeKey: 'ReportType',
    auditPeriodKey: 'Period',
    auditFormatKey: 'Format',
    auditDateKey: 'Date',
  },
  exportPanel: {
    sectionTitle: 'Xuất báo cáo thống kê',
    sectionDescription:
      'Tải xuống báo cáo kỳ đã đóng dưới dạng CSV hoặc Excel. Dữ liệu xuất dùng chung ảnh chụp máy chủ với báo cáo hiển thị.',
    formatLegend: 'Định dạng xuất',
    formatSelectLabel: 'Định dạng xuất',
    formats: {
      CSV: 'CSV (.csv)',
      EXCEL: 'Excel (.xlsx)',
    },
    exportButton: 'Xuất tệp',
    previewButton: 'Xem trước định dạng',
    retryExportButton: 'Thử lại xuất tệp',
    disabledNoGeneratedReportReason:
      'Tạo một báo cáo hợp lệ cho kỳ đã đóng với các bản ghi có sẵn trước khi xuất.',
    exportSuccessTitle: 'Bắt đầu tải tệp báo cáo',
    exportSuccessMessage:
      'Tệp báo cáo thống kê CSV đã được tạo từ kết quả đang hiển thị và được tải xuống thiết bị của bạn.',
    previewOnlyTitle: 'Chỉ xem trước trong Demo',
    previewOnlyMessage:
      'Chế độ Demo không hỗ trợ tạo tệp Excel. Không có tệp nào được tải; vui lòng chọn CSV (.csv) để tải tệp thật trong Demo.',
    previewOnlyBadge: 'CHỈ XEM TRƯỚC — KHÔNG TẢI TỆP',
    exportErrorTitle: 'Tạo tệp xuất thất bại',
    exportErrorMessage:
      'Hiện tại không thể tạo tệp báo cáo. Kết quả báo cáo đang hiển thị vẫn được giữ nguyên; vui lòng thử lại.',
    demoFileBadge: 'TẢI TỆP DEMO CSV — KHÔNG PHẢI DỮ LIỆU KẾ TOÁN THỰC',
    fileNameLabel: 'Tệp đã tải',
    targetFormatLabel: 'Định dạng Demo yêu cầu',
    auditEntryLabel: 'Xem trước nhật ký kiểm toán đã ghi',
    previewHeading: 'Xem trước nội dung tệp đã xuất',
  },
};
