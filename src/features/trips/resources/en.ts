/**
 * Centralized Vietnamese user-facing copy for Traveler Trip History (UC-32)
 * and Trip Review (UC-33) across BFF, services, pages, components, and dialogs (CR-09).
 */
export const tripReviewEn = {
  bff: {
    notImplementedTitle: 'Chưa hỗ trợ',
    tripHistoryPendingDetail:
      'Dịch vụ lịch sử chuyến đi đang chờ hoàn tất kết nối máy chủ.',
    tripReviewPendingDetail:
      'Tính năng gửi đánh giá đang chờ kết nối API máy chủ nên chưa thể lưu đánh giá.',
  },

  errors: {
    systemError:
      'TripMate tạm thời chưa thể xử lý yêu cầu. Vui lòng kiểm tra kết nối và thử lại.',
    tripByIdNotFound: (tripId: string) =>
      `Không tìm thấy chuyến đi #${tripId}.`,
    tripNotFoundOrForbidden: (tripId: string) =>
      `Chuyến đi #${tripId} không tồn tại hoặc bạn không có quyền xem.`,
    reviewTripNotFound: 'Không tìm thấy chuyến đi cần đánh giá.',
    tripHistoryAccessDenied:
      'Bạn không có quyền truy cập lịch sử chuyến đi này.',
    tripDetailAccessDenied:
      'Bạn không có quyền xem chi tiết chuyến đi này.',
    tripRecordUnavailable: 'Chuyến đi này không còn tồn tại.',
    reviewAccessDenied:
      'Bạn không có quyền đánh giá chuyến đi này.',
  },

  reviewPage: {
    pendingTitle: 'Dịch vụ đánh giá đang chờ kết nối máy chủ',
    pendingDetail:
      'Dịch vụ lịch sử chuyến đi và đánh giá đang trong quá trình hoàn tất tích hợp.',
    notFoundTitle: 'Không tìm thấy chuyến đi',
    forbiddenTitle: 'Không có quyền truy cập',
    networkErrorTitle: 'Lỗi kết nối máy chủ',
  },

  metadata: {
    tripHistoryTitle: 'Lịch sử chuyến đi | TripMate',
    tripHistoryDescription:
      'Xem lại các tour đã đặt, lịch trình đã đi, vé điện tử và đánh giá của bạn trên TripMate.',
    tripReviewTitle: 'Đánh giá chuyến đi | TripMate',
    tripReviewDescription:
      'Chia sẻ đánh giá và trải nghiệm chuyến đi của bạn trên TripMate.',
  },

  demo: {
    badgeLabel: 'XEM THỬ',
    tripHistoryBannerPrefix: 'Chế độ xem thử:',
    tripHistoryBannerText:
      'Đang hiển thị dữ liệu chuyến đi mẫu để xem trước giao diện và luồng thao tác.',
    tripReviewBannerPrefix: 'Chế độ xem thử:',
    tripReviewBannerText: (tripId: string) =>
      `Đánh giá mẫu cho chuyến đi (${tripId}).`,
    photoLocalPreviewNotice:
      'Ảnh chỉ hiển thị xem trước cục bộ trong chế độ xem thử và không được tải lên máy chủ.',
  },

  tripHistory: {
    loadingAccount: 'Đang tải thông tin tài khoản…',
    breadcrumbHome: 'Trang chủ',
    breadcrumbAccount: 'Tài khoản',
    breadcrumbTrips: 'Lịch sử chuyến đi',
    pageTitle: 'Lịch sử chuyến đi',
    pageSubtitle:
      'Xem lại các tour đã đặt, lịch trình đã đi, vé điện tử và đánh giá của bạn.',
    tabs: {
      upcoming: 'Sắp tới',
      completed: 'Đã hoàn thành',
      cancelled: 'Đã hủy',
    },
    summary: {
      headingBadge: 'Tổng quan chuyến đi',
      completedTripsCount: (count: number) => `${count} chuyến đã hoàn thành`,
      distanceLabel: 'Tổng quãng đường',
      visitedPoisLabel: 'địa điểm đã ghé',
    },
    filters: {
      typePrefix: 'Loại',
      fromLabel: 'Từ ngày',
      toLabel: 'đến',
      allTypes: 'Tất cả chuyến đi',
      tourBooking: 'Tour đã đặt',
      selfPlannedItinerary: 'Lịch trình tự lập',
    },
    error: {
      title: 'Không thể tải dữ liệu',
    },
    empty: {
      title: 'Chưa có chuyến đi nào',
      description: 'Không có chuyến đi nào phù hợp với bộ lọc hiện tại.',
    },
    showingPrefix: 'Hiển thị',
    showingSeparator: '/',
    showingSuffix: 'chuyến đi',
    timezoneNotice: 'Giờ Việt Nam (GMT+7)',
    statusLabels: {
      Completed: 'Đã hoàn thành',
      Confirmed: 'Đã xác nhận',
      PendingPayment: 'Chờ thanh toán',
      Cancelled: 'Đã hủy',
      RefundPending: 'Đang hoàn tiền',
      RefundDisputed: 'Tranh chấp hoàn tiền',
      Refunded: 'Đã hoàn tiền',
      PartiallyRefunded: 'Hoàn tiền một phần',
      Expired: 'Đã hết hạn',
      Interrupted: 'Đã dừng vì an toàn',
      Active: 'Đã lên lịch',
    } as Record<string, string>,
    refundStatusLabels: {
      Pending: 'Đang chờ',
      Processing: 'Đang xử lý',
      RetryPending: 'Đang xử lý',
      ManualReview: 'Đang xem xét',
      AwaitingRecipient: 'Chờ cung cấp tài khoản nhận',
      AwaitingTransfer: 'Chờ nhà điều hành chuyển khoản',
      AwaitingTravelerConfirmation: 'Chờ xác nhận nhận tiền',
      Disputed: 'Đang tranh chấp',
      Completed: 'Đã hoàn tiền',
      Processed: 'Đã hoàn tiền',
      Failed: 'Thất bại',
      Rejected: 'Từ chối',
    } as Record<string, string>,
    card: {
      typeTour: 'Tour',
      typeItinerary: 'Lịch trình',
      participantCount: (count: number) => `${count} hành khách`,
      visitedOf: (visited: number, total: number) => `Đã ghé ${visited}/${total} điểm`,
      departureDate: (formattedDate: string) => `Khởi hành ${formattedDate}`,
      stopsCount: (count: number) => `${count} điểm dừng`,
      distanceTravelled: (km: number) => ` · ${km} km đã đi`,
      bookingCode: (code: string) => `Mã đặt chỗ ${code}`,
      participants: (summary: string) => `Hành khách: ${summary}`,
      refundStatus: (status: string) => `Hoàn tiền: ${status}`,
    },
  },

  tripReview: {
    loadingTrip: 'Đang tải thông tin chuyến đi…',
    breadcrumbHome: 'Trang chủ',
    breadcrumbTrips: 'Lịch sử chuyến đi',
    breadcrumbReview: 'Đánh giá chuyến đi',
    badgeCode: 'Đánh giá',
    badgeLabel: 'Trải nghiệm chuyến đi',
    pageTitle: 'Đánh giá chuyến đi',
    pageSubtitle:
      'Chia sẻ trải nghiệm thực tế của bạn để giúp cộng đồng du lịch TripMate có thêm thông tin hữu ích.',
    notCompletedTitle: 'Chuyến đi chưa hoàn thành',
    notCompletedDetail:
      'Bạn chỉ có thể gửi đánh giá sau khi chuyến đi đã hoàn thành.',
    alreadyReviewedTitle: 'Chuyến đi này đã được đánh giá',
    alreadyReviewedDetail: (rating?: number) =>
      rating
        ? `Bạn đã gửi đánh giá cho chuyến đi này (${rating} sao).`
        : 'Bạn đã gửi đánh giá cho chuyến đi này.',
    completedOn: (formattedDate: string) => `Hoàn thành ngày ${formattedDate}`,
    stopsCount: (count: number) => `${count} điểm dừng`,
    distanceTravelled: (km: number) => `${km} km đã đi`,
    selfPlannedFallback: 'Lịch trình tự lập',
    defaultTourTypeLabel: 'Tour địa phương',
    bookedTourSummary: (operatorName: string, bookingRef: string) =>
      `${operatorName} · Mã đặt chỗ: ${bookingRef}`,
    submittedTitle: 'Đã gửi đánh giá!',
    demoSubmitSuccess:
      'Cảm ơn bạn đã chia sẻ! Đánh giá đã được ghi nhận (Chế độ xem thử).',
    submitSuccess:
      'Cảm ơn bạn đã chia sẻ! Đánh giá của bạn đã được đăng thành công.',
    pendingSaveTitle: 'Tính năng lưu đánh giá đang chờ kích hoạt',
    pendingSaveHint:
      'Giao diện và kiểm tra hợp lệ (số sao, độ dài, ảnh đính kèm) đã sẵn sàng.',
    ratingSectionTitle: 'Mức độ hài lòng của bạn',
    ratingSectionSubtitle:
      'Nhấp hoặc dùng phím mũi tên để chọn mức đánh giá từ 1 đến 5 sao',
    ratingLabels: {
      1: '1/5 · Không hài lòng',
      2: '2/5 · Cần cải thiện',
      3: '3/5 · Tạm ổn',
      4: '4/5 · Rất hài lòng',
      5: '5/5 · Tuyệt vời',
    } as Record<number, string>,
    noStarSelected: 'Chưa chọn số sao',
    titleLabel: 'Tiêu đề đánh giá',
    characterCount: (current: number, max: number) =>
      `${current} / ${max} ký tự`,
    titlePlaceholder:
      'Tóm tắt ngắn gọn trải nghiệm của bạn (VD: Chuyến đi rất đáng nhớ)',
    pacingSectionTitle: 'Nhịp độ lịch trình & phân bổ điểm dừng',
    pacingSectionSubtitle:
      'Đánh giá nhịp độ di chuyển của lịch trình (Không bắt buộc)',
    pacingOptions: {
      tight: 'Hơi gấp',
      well_paced: 'Vừa sức',
      loose: 'Khá thảnh thơi',
    },
    poiFeedbackTitle: 'Phản hồi nhanh các điểm đã ghé',
    poiFeedbackSubtitle:
      'Bạn có muốn gợi ý các điểm này cho du khách khác không? (Không bắt buộc)',
    optionalBadge: 'Không bắt buộc',
    poiStopSubtitle: 'Điểm dừng trong lịch trình',
    commentLabel: 'Chia sẻ trải nghiệm',
    commentPlaceholder:
      'Chia sẻ chi tiết về lịch trình, hướng dẫn viên, ẩm thực, phương tiện di chuyển... (Tối đa 500 ký tự)',
    commentExceeded: (extra: number) =>
      `Vượt quá ${extra} ký tự cho phép.`,
    commentMaxHint: 'Tối đa 500 ký tự.',
    photosSectionTitle: 'Ảnh chuyến đi',
    photosPendingNotice:
      'Tính năng tải ảnh đánh giá đang chờ kích hoạt lưu trữ máy chủ và tạm khóa.',
    photosOptionalTitle: 'Ảnh thực tế (không bắt buộc)',
    photosCountBadge: (count: number, max: number) =>
      `${count}/${max} ảnh`,
    photosHelperText:
      'Đính kèm những khoảnh khắc đáng nhớ (Tối đa 5 ảnh, mỗi ảnh dưới 5 MB).',
    photoUnder5Mb: '(Dưới 5 MB)',
    privacyTitle: 'Hiển thị tên của bạn',
    privacyPublicHint:
      'Đánh giá sẽ hiển thị công khai kèm tên tài khoản của bạn.',
    privacyInitialsHint:
      'Đánh giá sẽ hiển thị ẩn danh bằng chữ viết tắt để bảo vệ quyền riêng tư.',
  },

  validation: {
    invalidDateRange:
      'Khoảng ngày không hợp lệ. Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.',
    ratingRequired:
      'Vui lòng chọn số sao đánh giá (từ 1 đến 5 sao) trước khi gửi.',
    titleRequired: 'Vui lòng nhập tiêu đề đánh giá.',
    titleMaxLength: 'Tiêu đề đánh giá không được vượt quá 150 ký tự.',
    commentRequired: 'Vui lòng nhập nội dung đánh giá.',
    commentMaxLength: 'Nội dung đánh giá không được vượt quá 500 ký tự.',
    photosMaxCount: (max: number) => `Bạn chỉ có thể đính kèm tối đa ${max} ảnh.`,
    photosInvalidType: 'Ảnh phải có định dạng JPG, PNG hoặc WEBP.',
    photosMaxSize: (fileName: string) =>
      `Ảnh "${fileName}" vượt quá giới hạn tối đa 5 MB.`,
  },

  actions: {
    retry: 'Thử lại',
    planSmartItinerary: 'Lập lịch trình thông minh',
    exploreLocalTours: 'Khám phá tour địa phương',
    close: 'Đóng',
    viewItinerary: 'Mở lịch trình',
    viewDetails: 'Xem chi tiết',
    viewETicket: 'Xem vé điện tử',
    writeReview: 'Viết đánh giá',
    viewReview: 'Xem đánh giá',
    refundDetails: 'Theo dõi hoàn tiền',
    backToTrips: 'Quay lại Lịch sử chuyến đi',
    cancelLater: 'Hủy',
    submittingReview: 'Đang gửi đánh giá…',
    submitReview: 'Gửi đánh giá',
    addPhoto: '+ Thêm ảnh',
    like: 'Thích',
  },

  accessibility: {
    breadcrumbAria: 'Đường dẫn điều hướng',
    tripSummaryAria: 'Thống kê lịch sử chuyến đi',
    tripTypeFilterLabel: 'Loại chuyến đi',
    fromDateAria: 'Từ ngày',
    toDateAria: 'Đến ngày',
    loadingTripsAria: 'Đang tải danh sách chuyến đi',
    paginationNavAria: 'Phân trang danh sách chuyến đi',
    previousPageAria: 'Trang trước',
    nextPageAria: 'Trang sau',
    closeDialogAria: 'Đóng',
    starRatingGroupAria: 'Đánh giá mức độ hài lòng',
    starRadioAria: (star: number) => `${star} sao`,
    uploadPhotosAria: 'Tải lên ảnh chuyến đi',
    tripPhotoAlt: (index: number) => `Ảnh chuyến đi ${index}`,
    removePhotoAria: (fileName: string) => `Xóa ảnh ${fileName}`,
    addPhotoAria: 'Thêm ảnh chuyến đi',
    likeStopAria: (stop: string) => `Thích ${stop}`,
    dislikeStopAria: (stop: string) => `Không thích ${stop}`,
  },

  dialogs: {
    refundDetails: {
      title: 'Thông tin hoàn tiền',
      bookingCodeLabel: 'Mã đặt chỗ',
      statusLabel: 'Trạng thái',
      refundAmountLabel: 'Số tiền hoàn',
      refundChannelLabel: 'Kênh hoàn tiền',
      cancelledAtLabel: 'Ngày hủy',
    },
    tripDetail: {
      loading: 'Đang tải chi tiết chuyến đi…',
      tourHeading: 'Thông tin tour',
      destinationLabel: 'Điểm đến',
      scheduleHeading: 'Lịch trình khởi hành',
      startsLabel: 'Thời gian khởi hành',
      endsLabel: 'Thời gian kết thúc',
      meetingPointLabel: 'Điểm đón',
      participantsHeading: 'Hành khách',
      adults: (count: number) => `${count} người lớn`,
      children: (count: number) => `${count} trẻ em`,
      infants: (count: number) => `${count} em bé`,
      cancellationHeading: 'Thông tin hủy đơn',
      cancellationReasonLabel: 'Lý do',
      refundHeading: 'Thông tin hoàn tiền',
      channelUnavailable: 'Chưa có thông tin',
      stopsHeading: 'Các điểm dừng',
      stopStatus: {
        Reached: 'Đã ghé',
        Skipped: 'Đã bỏ qua',
        Pending: 'Chưa ghé',
      },
      reachedAt: (formattedDateTime: string) => `Đến lúc ${formattedDateTime}`,
      skippedAt: (formattedDateTime: string) => `Bỏ qua lúc ${formattedDateTime}`,
      plannedWindow: (from: string, to: string) => `Dự kiến ${from}–${to}`,
      sessionHeading: 'Phiên hành trình',
      sessionStartedLabel: 'Bắt đầu',
      sessionEndedLabel: 'Kết thúc',
      sessionReasonLabel: 'Kết quả',
      completionReasons: {
        RouteFinished: 'Hoàn tất lộ trình',
        TravelerStopped: 'Bạn đã dừng chuyến đi',
        Expired: 'Tự động kết thúc khi hết thời gian',
      } as Record<string, string>,
    },
  },

  pagination: {
    pagePrefix: 'Trang',
    pageSeparator: '/',
    totalTripsSuffix: (totalCount: number) => `(${totalCount} chuyến đi)`,
    previous: 'Trước',
    next: 'Tiếp',
  },
} as const;
