import type { TourDetailDto, TourRecommendationDto } from '../types/tour';

/**
 * EXPLICIT DEMO FIXTURES (DEMO_ONLY)
 *
 * Notice:
 * These fixtures are strictly for development, design preview, and automated testing
 * of UC-25 (Tour Recommendations) and UC-26 (Tour Details) while Backend integration
 * remains in PENDING_BE_INTEGRATION status.
 *
 * In production mode, the application NEVER silently falls back to these fixtures.
 * They are only accessible via explicit opt-in (e.g. ?demo=1 or demoRecommendations=true).
 */

export const DEMO_TOUR_DETAIL_HOI_AN: TourDetailDto = {
  tourId: '9007199254740995',
  title: 'Hành Trình Di Sản Phố Cổ Hội An & Rừng Dừa Bảy Mẫu 2N1Đ',
  description:
    'Khám phá vẻ đẹp cổ kính trường tồn của thương cảng Hội An qua từng góc phố đèn lồng lung linh, trải nghiệm chèo thuyền thúng len lỏi giữa rừng dừa Bảy Mẫu bạt ngàn và thưởng thức ẩm thực đặc sản xứ Quảng đậm đà phong vị bản địa.',
  destinations: ['Đà Nẵng', 'Hội An'],
  operatorName: 'Endpoint Travel Miền Trung',
  operatorContact: 'hotro@endpointtravel.vn | 1900 6868',
  durationDays: 2,
  basePrice: 800000,
  currency: 'VND',
  aggregateRating: 4.8,
  reviewCount: 36,
  images: [
    'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
  ],
  inclusions: [
    'Xe du lịch đời mới máy lạnh đưa đón khứ hồi từ trung tâm Đà Nẵng',
    '01 đêm lưu trú khách sạn boutique 4 sao tại trung tâm Hội An (2 khách/phòng)',
    'Vé tham quan tất cả các điểm: Phố Cổ Hội An, Rừng Dừa Bảy Mẫu, Chùa Cầu',
    'Vé chèo thuyền thúng và xem biểu diễn lắc thúng nghệ thuật',
    '03 bữa ăn chính đặc sản địa phương (Cao lầu, Cơm gà Hội An, Bánh vạc)',
    '01 bữa sáng buffet tại khách sạn',
    'Hướng dẫn viên bản địa am hiểu văn hóa lịch sử theo suốt tuyến',
    'Bảo hiểm du lịch mức bồi thường tối đa 50.000.000 VNĐ/vụ',
    'Nước suối và khăn lạnh tiêu chuẩn 2 chai/ngày',
  ],
  exclusions: [
    'Chi phí cá nhân ngoài chương trình (giặt ủi, đồ uống gọi thêm trong bữa ăn)',
    'Tiền tip cho lái xe và hướng dẫn viên (tùy tâm)',
    'Thuế VAT 8% (nếu yêu cầu xuất hóa đơn đỏ)',
  ],
  cancellationPolicy:
    'Hủy trước ngày khởi hành 07 ngày: Hoàn tiền 100%. Hủy từ 03 đến 06 ngày trước khởi hành: Phí hủy 50% tổng giá trị tour. Hủy trong vòng 48 giờ trước giờ khởi hành: Không hoàn lại tiền cọc hoặc thanh toán.',
  meetingPoint: '01 Đường 2 Tháng 9, Quận Hải Châu, TP. Đà Nẵng (Bảo tàng Điêu khắc Chăm)',
  schedules: [
    {
      scheduleId: '9007199254740997',
      tourId: '9007199254740995',
      startDatetime: '2026-10-15T07:30:00Z',
      endDatetime: '2026-10-16T17:30:00Z',
      totalCapacity: 15,
      reservedCapacity: 4,
      remainingSlots: 11,
      price: 800000,
      currency: 'VND',
      status: 'Available',
    },
    {
      scheduleId: '9007199254740998',
      tourId: '9007199254740995',
      startDatetime: '2026-10-22T07:30:00Z',
      endDatetime: '2026-10-23T17:30:00Z',
      totalCapacity: 15,
      reservedCapacity: 15,
      remainingSlots: 0,
      price: 800000,
      currency: 'VND',
      status: 'SoldOut',
    },
  ],
  itinerary: [
    {
      dayNumber: 1,
      title: 'Đà Nẵng – Rừng Dừa Bảy Mẫu Cẩm Thanh – Phố Cổ Hội An Lung Linh Sắc Màu',
      description:
        'Xe đón quý khách tại điểm hẹn khởi hành đi Cẩm Thanh. Trải nghiệm thuyền thúng, học quăng chài bắt cá và hòa mình vào thiên nhiên sông nước.',
      activities: [
        '08:00 – Đón khách tại Đà Nẵng, khởi hành đi Hội An.',
        '09:30 – Check-in Rừng dừa Bảy Mẫu, trải nghiệm ngồi thuyền thúng và biểu diễn xoay thúng.',
        '12:00 – Thưởng thức bữa trưa đậm vị dân dã tại nhà hàng sinh thái.',
        '14:00 – Nhận phòng khách sạn, nghỉ ngơi thư giãn.',
        '16:00 – Tản bộ khám phá Hội An: Chùa Cầu, Nhà cổ Tấn Ký, Hội quán Phúc Kiến.',
        '18:30 – Ăn tối đặc sản Hội An, ngắm phố cổ về đêm và thả hoa đăng trên sông Hoài.',
      ],
      meals: 'Trưa, Tối',
    },
    {
      dayNumber: 2,
      title: 'Làng Gốm Thanh Hà – Chợ Hội An – Trở về Đà Nẵng',
      description:
        'Trải nghiệm nặn gốm truyền thống cùng nghệ nhân Thanh Hà, mua sắm đặc sản làm quà tại chợ Hội An trước khi xe đưa về lại điểm hẹn ban đầu.',
      activities: [
        '07:00 – Ăn sáng buffet tại khách sạn, làm thủ tục trả phòng.',
        '08:30 – Ghé thăm Làng gốm Thanh Hà hơn 500 năm tuổi, tự tay làm sản phẩm gốm lưu niệm.',
        '10:30 – Tự do dạo Chợ Hội An, mua bánh ít lá gai, mè xửng, tương ớt phố Hội.',
        '12:00 – Bữa trưa nhẹ với Cao lầu hoặc Cơm gà.',
        '14:00 – Xe đưa quý khách về điểm đón ban đầu tại Đà Nẵng. Kết thúc chương trình.',
      ],
      meals: 'Sáng, Trưa',
    },
  ],
  reviews: [
    {
      reviewId: 'rev-01',
      authorName: 'Trần Minh Quân',
      rating: 5,
      comment:
        'Tour tổ chức cực kỳ chuyên nghiệp, xe đưa đón đúng giờ và HDV rất nhiệt tình chia sẻ những giai thoại thú vị về phố cổ!',
      createdAt: '2026-09-18T10:15:00Z',
    },
    {
      reviewId: 'rev-02',
      authorName: 'Lê Thảo My',
      rating: 4.5,
      comment:
        'Rất thích trải nghiệm chèo thuyền thúng ở Cẩm Thanh. Khách sạn sạch sẽ, đồ ăn ngon và đầy đặn.',
      createdAt: '2026-09-12T14:40:00Z',
    },
  ],
  isDemo: true,
};

export const DEMO_RECOMMENDED_TOURS: TourRecommendationDto[] = [
  {
    tour: {
      tourId: '9007199254740995',
      title: 'Hành Trình Di Sản Phố Cổ Hội An & Rừng Dừa Bảy Mẫu 2N1Đ',
      destinations: ['Đà Nẵng', 'Hội An'],
      operatorName: 'Endpoint Travel Miền Trung',
      durationDays: 2,
      basePrice: 800000,
      currency: 'VND',
      representativeScheduleId: '9007199254740997',
      departureAtUtc: '2026-10-15T07:30:00Z',
      availabilityStatus: 'Available',
      remainingSlots: 11,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80',
    },
    matchingScore: 94,
    matchingReasons: [
      'Phù hợp với sở thích Văn hóa, Di sản & Ẩm thực của bạn',
      'Thời lượng 2 ngày khớp với khoảng thời gian dự định',
      'Được 96% du khách có hồ sơ tương tự đánh giá 5 sao',
    ],
  },
  {
    tour: {
      tourId: '9007199254740996',
      title: 'Tour Chinh Phục Đỉnh Bà Nà Hills & Cầu Vàng Huyền Thoại',
      destinations: ['Đà Nẵng'],
      operatorName: 'Sơn Trà Eco Travel',
      durationDays: 1,
      basePrice: 1250000,
      currency: 'VND',
      representativeScheduleId: '9007199254740999',
      departureAtUtc: '2026-10-18T08:00:00Z',
      availabilityStatus: 'Available',
      remainingSlots: 8,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80',
    },
    matchingScore: 88,
    matchingReasons: [
      'Phù hợp phong cách du lịch Chụp ảnh & Thư giãn gia đình',
      'Tuyến điểm tối ưu tránh thời tiết mưa mù',
    ],
  },
];
