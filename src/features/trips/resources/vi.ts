/**
 * Chuỗi tài nguyên tiếng Việt cho Lịch sử chuyến đi và Đánh giá chuyến đi của Du khách (UC-32, UC-33).
 */
import type { tripReviewEn } from './en';

type DeepString<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends string
  ? string
  : T extends object
  ? { [K in keyof T]: DeepString<T[K]> }
  : T;

export type TripReviewResources = DeepString<typeof tripReviewEn>;

export const tripReviewVi: TripReviewResources = {
  bff: {
    notImplementedTitle: 'Chưa triển khai',
    tripHistoryPendingDetail:
      'Dịch vụ lịch sử chuyến đi đang chờ kết nối backend.',
    tripReviewPendingDetail:
      'Tính năng gửi đánh giá chuyến đi đang chờ kết nối Backend API. Đánh giá chưa thể lưu vào môi trường thực.',
  },

  errors: {
    systemError:
      'TripMate tạm thời không thể xử lý yêu cầu của bạn. Vui lòng kiểm tra kết nối và thử lại.',
    tripByIdNotFound: (tripId: string) =>
      `Không tìm thấy chuyến đi #${tripId}.`,
    tripNotFoundOrForbidden: (tripId: string) =>
      `Chuyến đi #${tripId} không tồn tại hoặc bạn không có quyền xem chuyến đi này.`,
    reviewTripNotFound: 'Không tìm thấy chuyến đi cần đánh giá.',
    tripHistoryAccessDenied:
      'Bạn không có quyền truy cập vào lịch sử chuyến đi này.',
    tripDetailAccessDenied:
      'Bạn không có quyền xem chuyến đi này.',
    tripRecordUnavailable: 'Chuyến đi này hiện không còn khả dụng.',
    reviewAccessDenied:
      'Bạn không có quyền đánh giá chuyến đi này.',
  },

  reviewPage: {
    pendingTitle: 'Dịch vụ đánh giá chuyến đi đang chờ kết nối backend',
    pendingDetail:
      'Dịch vụ lịch sử và đánh giá chuyến đi đang chờ kết nối backend.',
    notFoundTitle: 'Không tìm thấy chuyến đi',
    forbiddenTitle: 'Truy cập bị từ chối',
    networkErrorTitle: 'Lỗi kết nối máy chủ',
  },

  metadata: {
    tripHistoryTitle: 'Chuyến đi của tôi | TripMate',
    tripHistoryDescription:
      'Xem và quản lý các tour đã đặt và lịch trình tự lập trên TripMate.',
    tripReviewTitle: 'Đánh giá chuyến đi | TripMate',
    tripReviewDescription:
      'Chia sẻ đánh giá và cảm nhận về chuyến đi của bạn trên TripMate.',
  },

  demo: {
    badgeLabel: 'CHỈ DÙNG DEMO',
    tripHistoryBannerPrefix: 'Xem trước DEMO:',
    tripHistoryBannerText:
      'Dữ liệu chuyến đi mẫu được hiển thị để xem trước thiết kế và quy trình.',
    tripReviewBannerPrefix: 'Xem trước DEMO:',
    tripReviewBannerText: (tripId: string) =>
      `Đánh giá chuyến đi mẫu (${tripId}).`,
    photoLocalPreviewNotice:
      'Hình ảnh chỉ được xem trước cục bộ trong chế độ demo và không được tải lên máy chủ.',
  },

  tripHistory: {
    loadingAccount: 'Đang tải thông tin tài khoản…',
    breadcrumbHome: 'Trang chủ',
    breadcrumbAccount: 'Tài khoản của tôi',
    breadcrumbTrips: 'Chuyến đi của tôi',
    pageTitle: 'Chuyến đi của tôi',
    pageSubtitle:
      'Xem lại các tour đã đặt và lịch trình tự lên kế hoạch cùng TripMate.',
    tabs: {
      upcoming: 'Sắp tới',
      completed: 'Đã hoàn thành',
      cancelled: 'Đã hủy / Hoàn tiền',
    },
    summary: {
      headingBadge: 'Tổng quan chuyến đi',
      completedTripsCount: (count: number) => `${count} Chuyến đi đã hoàn thành`,
      distanceLabel: 'Tổng quãng đường',
      visitedPoisLabel: 'Điểm dừng đã ghé',
    },
    filters: {
      allTypes: 'Tất cả loại chuyến đi',
      tourBooking: 'Tour đã đặt',
      selfPlannedItinerary: 'Lịch trình tự lập',
    },
    error: {
      title: 'Không thể tải dữ liệu',
    },
    empty: {
      title: 'Không tìm thấy chuyến đi nào',
      description: 'Không có chuyến đi nào khớp với bộ lọc hiện tại của bạn.',
    },
    showingPrefix: 'Đang hiển thị',
    showingSeparator: '/',
    showingSuffix: 'chuyến đi',
    timezoneNotice: 'Thời gian hiển thị theo múi giờ GMT+7 (Asia/Ho_Chi_Minh)',
    statusLabels: {
      Completed: 'Đã hoàn thành',
      Confirmed: 'Đã xác nhận',
      PendingPayment: 'Chờ thanh toán',
      Cancelled: 'Đã hủy',
      Expired: 'Hết hạn',
      Interrupted: 'Đã dừng vì an toàn',
      Active: 'Đã lên lịch',
    } as Record<string, string>,
    refundStatusLabels: {
      Pending: 'Chờ xử lý',
      Processing: 'Đang xử lý',
      RetryPending: 'Đang xử lý',
      ManualReview: 'Đang xét duyệt',
      Processed: 'Đã hoàn tiền',
      Failed: 'Thất bại',
      Rejected: 'Bị từ chối',
    } as Record<string, string>,
    card: {
      participantCount: (count: number) => `${count} khách`,
      visitedOf: (visited: number, total: number) => `Đã ghé ${visited}/${total}`,
      departureDate: (formattedDate: string) => `Khởi hành: ${formattedDate}`,
      stopsCount: (count: number) => `${count} Điểm dừng`,
      distanceTravelled: (km: number) => ` • ${km} km đã đi`,
      bookingCode: (code: string) => `Mã: ${code}`,
      participants: (summary: string) => `Số khách: ${summary}`,
      refundStatus: (status: string) => `Hoàn tiền: ${status}`,
    },
  },

  tripReview: {
    loadingTrip: 'Đang tải thông tin chuyến đi…',
    breadcrumbHome: 'Trang chủ',
    breadcrumbTrips: 'Chuyến đi của tôi',
    breadcrumbReview: 'Đánh giá chuyến đi',
    badgeCode: 'UC-33',
    badgeLabel: 'Đánh giá & Phản hồi',
    pageTitle: 'Đánh giá chuyến đi',
    pageSubtitle:
      'Phản hồi của bạn giúp cộng đồng du khách TripMate có những hành trình tuyệt vời hơn.',
    notCompletedTitle: 'Chuyến đi chưa hoàn thành',
    notCompletedDetail:
      'Bạn chỉ có thể gửi đánh giá cho những chuyến đi đã hoàn thành.',
    alreadyReviewedTitle: 'Chuyến đi này đã được đánh giá',
    alreadyReviewedDetail: (rating?: number) =>
      rating
        ? `Bạn đã gửi đánh giá cho chuyến đi này (${rating} sao).`
        : 'Bạn đã gửi đánh giá cho chuyến đi này.',
    completedOn: (formattedDate: string) => `Hoàn thành vào ${formattedDate}`,
    stopsCount: (count: number) => `${count} Điểm dừng`,
    distanceTravelled: (km: number) => `${km} km đã đi`,
    selfPlannedFallback: 'Lịch trình tự lập',
    defaultTourTypeLabel: 'Tour địa phương',
    bookedTourSummary: (operatorName: string, bookingRef: string) =>
      `${operatorName} • Mã đặt chỗ: ${bookingRef}`,
    submittedTitle: 'Đã gửi đánh giá!',
    demoSubmitSuccess:
      'Cảm ơn phản hồi của bạn! Đánh giá đã được xuất bản (Xem trước DEMO).',
    submitSuccess:
      'Cảm ơn phản hồi của bạn! Đánh giá của bạn đã được xuất bản thành công.',
    pendingSaveTitle: 'Dịch vụ lưu đánh giá đang chờ kích hoạt',
    pendingSaveHint:
      'Giao diện đánh giá và các quy tắc kiểm tra tính hợp lệ (độ dài, số sao, hình ảnh) đã sẵn sàng.',
    ratingSectionTitle: 'Trải nghiệm tổng thể chuyến đi',
    ratingSectionSubtitle:
      'Nhấp hoặc dùng phím mũi tên để chọn mức độ hài lòng (1 đến 5 sao)',
    ratingLabels: {
      1: 'Rất không hài lòng! 1/5 sao',
      2: 'Cần cải thiện! 2/5 sao',
      3: 'Tạm hài lòng! 3/5 sao',
      4: 'Rất tốt! 4/5 sao',
      5: 'Tuyệt vời! 5/5 sao',
    } as Record<number, string>,
    noStarSelected: 'Chưa chọn mức sao',
    titleLabel: 'Tiêu đề đánh giá',
    characterCount: (current: number, max: number) => `${current} / ${max} ký tự`,
    titlePlaceholder:
      'Tóm tắt ngắn gọn trải nghiệm của bạn (ví dụ: Chuyến đi tuyệt vời)',
    pacingSectionTitle: 'Nhịp độ lịch trình & Phân bổ điểm dừng',
    pacingSectionSubtitle:
      'Đánh giá tốc độ di chuyển và tính hợp lý của lịch trình (Tùy chọn)',
    pacingOptions: {
      tight: 'Quá gấp gáp',
      well_paced: 'Hợp lý, vừa vặn',
      loose: 'Khá thư thả',
    },
    poiFeedbackTitle: 'Đánh giá nhanh các điểm dừng đã ghé',
    poiFeedbackSubtitle:
      'Bạn có muốn giới thiệu các điểm dừng này cho du khách khác không? (Tùy chọn)',
    optionalBadge: 'Tùy chọn',
    poiStopSubtitle: 'Điểm dừng trong lịch trình',
    commentLabel: 'Nội dung đánh giá chi tiết',
    commentPlaceholder:
      'Chia sẻ chi tiết cảm nghĩ của bạn về chuyến đi, hướng dẫn viên, đồ ăn, phương tiện di chuyển... (Tối đa 500 ký tự)',
    commentExceeded: (extra: number) =>
      `Vượt quá ${extra} ký tự cho phép.`,
    commentMaxHint: 'Tối đa 500 ký tự.',
    photosSectionTitle: 'Hình ảnh chuyến đi',
    photosPendingNotice:
      'Đính kèm hình ảnh đang chờ kích hoạt lưu trữ máy chủ và tạm thời chưa khả dụng trong môi trường thực.',
    photosOptionalTitle: 'Hình ảnh chuyến đi (Tùy chọn)',
    photosCountBadge: (count: number, max: number) => `${count}/${max} ảnh`,
    photosHelperText:
      'Đính kèm những khoảnh khắc đáng nhớ trong chuyến đi (Tối đa 5 ảnh, dưới 5MB mỗi ảnh).',
    photoUnder5Mb: '(Dưới 5MB)',
    privacyTitle: 'Hiển thị kèm họ và tên của tôi',
    privacyPublicHint:
      'Đánh giá của bạn sẽ hiển thị công khai kèm theo tên tài khoản của bạn.',
    privacyInitialsHint:
      'Đánh giá của bạn sẽ hiển thị công khai dưới dạng chữ cái viết tắt (ví dụ: N.V.A.) để bảo vệ quyền riêng tư.',
  },

  validation: {
    invalidDateRange:
      'Khoảng ngày không hợp lệ. Ngày bắt đầu phải trước hoặc cùng ngày kết thúc.',
    ratingRequired:
      'Vui lòng chọn số sao đánh giá (1 đến 5 sao) trước khi gửi.',
    titleRequired: 'Vui lòng nhập tiêu đề đánh giá.',
    titleMaxLength: 'Tiêu đề đánh giá không được vượt quá 150 ký tự.',
    commentRequired: 'Vui lòng nhập nội dung đánh giá.',
    commentMaxLength: 'Nội dung đánh giá không được vượt quá 500 ký tự.',
    photosMaxCount: (max: number) => `Bạn có thể đính kèm tối đa ${max} ảnh.`,
    photosInvalidType: 'Ảnh phải có định dạng JPG, PNG hoặc WEBP.',
    photosMaxSize: (fileName: string) =>
      `Ảnh "${fileName}" vượt quá giới hạn dung lượng 5MB.`,
  },

  actions: {
    retry: 'Thử lại',
    planSmartItinerary: 'Lên lịch trình thông minh',
    exploreLocalTours: 'Khám phá Tour địa phương',
    close: 'Đóng',
    viewItinerary: 'Xem lịch trình',
    viewDetails: 'Xem chi tiết',
    viewETicket: 'Xem vé điện tử',
    writeReview: 'Viết đánh giá',
    viewReview: 'Xem đánh giá',
    refundDetails: 'Chi tiết hoàn tiền',
    backToTrips: 'Quay lại Chuyến đi của tôi',
    cancelLater: 'Hủy / Để sau',
    submittingReview: 'Đang gửi đánh giá…',
    submitReview: 'Gửi đánh giá',
    addPhoto: '+ Thêm ảnh',
    like: 'Thích',
  },

  accessibility: {
    breadcrumbAria: 'Đường dẫn điều hướng',
    tripSummaryAria: 'Thống kê tổng quan chuyến đi',
    tripTypeFilterLabel: 'Loại chuyến đi',
    fromDateAria: 'Từ ngày',
    toDateAria: 'Đến ngày',
    loadingTripsAria: 'Đang tải danh sách chuyến đi',
    paginationNavAria: 'Phân trang danh sách chuyến đi',
    previousPageAria: 'Trang trước',
    nextPageAria: 'Trang sau',
    closeDialogAria: 'Đóng',
    starRatingGroupAria: 'Đánh giá mức sao trải nghiệm',
    starRadioAria: (star: number) => `${star} sao`,
    uploadPhotosAria: 'Tải ảnh chuyến đi lên',
    tripPhotoAlt: (index: number) => `Ảnh chuyến đi ${index}`,
    removePhotoAria: (fileName: string) => `Xóa ảnh ${fileName}`,
    addPhotoAria: 'Thêm ảnh chuyến đi',
    likeStopAria: (stop: string) => `Thích ${stop}`,
    dislikeStopAria: (stop: string) => `Không thích ${stop}`,
  },

  dialogs: {
    refundDetails: {
      title: 'Thông tin hoàn tiền chuyến đi',
      bookingCodeLabel: 'Mã đặt chỗ:',
      statusLabel: 'Trạng thái:',
      refundAmountLabel: 'Số tiền hoàn lại:',
      refundChannelLabel: 'Kênh hoàn tiền:',
      cancelledAtLabel: 'Thời gian hủy:',
    },
    tripDetail: {
      loading: 'Đang tải chi tiết chuyến đi…',
      tourHeading: 'Gói tour',
      destinationLabel: 'Điểm đến',
      scheduleHeading: 'Lịch trình',
      startsLabel: 'Bắt đầu',
      endsLabel: 'Kết thúc',
      meetingPointLabel: 'Điểm tập trung',
      participantsHeading: 'Số khách tham gia',
      adults: (count: number) => `${count} người lớn`,
      children: (count: number) => `${count} trẻ em`,
      infants: (count: number) => `${count} trẻ sơ sinh`,
      cancellationHeading: 'Hủy đơn',
      cancellationReasonLabel: 'Lý do',
      refundHeading: 'Hoàn tiền',
      channelUnavailable: 'Chưa có thông tin',
      stopsHeading: 'Điểm dừng',
      stopStatus: {
        Reached: 'Đã ghé thăm',
        Skipped: 'Đã bỏ qua',
        Pending: 'Chưa ghé thăm',
      },
      reachedAt: (formattedDateTime: string) => `Đã đến ${formattedDateTime}`,
      skippedAt: (formattedDateTime: string) => `Đã bỏ qua ${formattedDateTime}`,
      plannedWindow: (from: string, to: string) => `Kế hoạch ${from}–${to}`,
      sessionHeading: 'Phiên chuyến đi',
      sessionStartedLabel: 'Bắt đầu lúc',
      sessionEndedLabel: 'Kết thúc lúc',
      sessionReasonLabel: 'Lý do kết thúc',
      completionReasons: {
        RouteFinished: 'Đã hoàn thành toàn bộ lộ trình',
        TravelerStopped: 'Bạn đã chủ động kết thúc',
        Expired: 'Tự động kết thúc khi hết thời gian chuyến đi',
      } as Record<string, string>,
    },
  },

  pagination: {
    pagePrefix: 'Trang',
    pageSeparator: '/',
    totalTripsSuffix: (totalCount: number) => `(tổng cộng ${totalCount} chuyến)`,
    previous: 'Trước',
    next: 'Sau',
  },
};
