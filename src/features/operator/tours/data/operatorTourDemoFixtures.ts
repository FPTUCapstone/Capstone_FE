import type { TourPackageDto } from '../types/tourLifecycle';

/**
 * Validates the strict environment gate for Tour Operator demo fixtures.
 * Demo fixtures are NEVER exposed in production environments.
 */
export function isTourDemoAllowedInCurrentEnv(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES === 'true';
}

export const DEMO_TOUR_BANA_HILLS: TourPackageDto = {
  id: 'tour-142',
  tourCode: 'TP-0142',
  operatorUserId: 101,
  title: 'Ba Na Hills full-day tour',
  destination: 'Đà Nẵng',
  category: 'Di sản & Thiên nhiên',
  durationDays: 1,
  basePrice: 1400000,
  childPrice: 700000,
  maxCapacity: 30,
  description:
    'Cáp treo lên đỉnh Bà Nà Hills, check-in Cầu Vàng nổi tiếng, Làng Pháp cổ kính và thưởng thức tiệc buffet trưa chuẩn vị.',
  inclusions: 'Vé cáp treo, bữa trưa buffet, xe đưa đón khách sạn, hướng dẫn viên.',
  exclusions: 'Vé bảo tàng sáp, trò chơi có thưởng tại Fantasy Park, chi phí cá nhân.',
  cancellationPolicy: 'Hoàn tiền 100% khi hủy trước ngày khởi hành ít nhất 24 giờ.',
  status: 'Approved',
  version: 2,
  itinerary: [
    {
      dayNo: 1,
      title: 'Hành trình khám phá Bà Nà trọn ngày',
      activities: [
        {
          id: 'act-1',
          time: '07:30',
          poiName: 'Đón khách tại khách sạn trung tâm Đà Nẵng',
          stayDurationMinutes: 30,
          transport: 'Xe du lịch',
          notes: 'Tập trung tại sảnh khách sạn đúng giờ.',
        },
        {
          id: 'act-2',
          time: '09:00',
          poiName: 'Cầu Vàng & Tuyến cáp treo Bà Nà',
          stayDurationMinutes: 120,
          transport: 'Đi bộ',
          notes: 'Ngắm cảnh mây núi và chụp ảnh.',
        },
        {
          id: 'act-3',
          time: '11:30',
          poiName: 'Buffet trưa tại Làng Pháp',
          stayDurationMinutes: 60,
          transport: 'Đi bộ',
          notes: 'Nhà hàng buffet quốc tế.',
        },
        {
          id: 'act-4',
          time: '14:00',
          poiName: 'Khu vui chơi Fantasy Park',
          stayDurationMinutes: 90,
          transport: 'Đi bộ',
          notes: 'Tham gia các trò chơi phiêu lưu.',
        },
      ],
    },
  ],
  schedules: [
    {
      id: 'sch-1',
      departureDate: '2026-10-10',
      returnDate: '2026-10-10',
      totalCapacity: 30,
      reservedCapacity: 28, // 28 confirmed bookings per Screen #42
      meetingPoint: '02 Nguyễn Văn Linh, Hải Châu, Đà Nẵng',
      status: 'Scheduled',
    },
    {
      id: 'sch-2',
      departureDate: '2026-10-17',
      returnDate: '2026-10-17',
      totalCapacity: 30,
      reservedCapacity: 12,
      meetingPoint: '02 Nguyễn Văn Linh, Hải Châu, Đà Nẵng',
      status: 'Scheduled',
    },
  ],
  media: [
    {
      id: 'med-1',
      url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80',
      caption: 'Cầu Vàng Bà Nà Hills',
      isPrimary: true,
    },
    {
      id: 'med-2',
      url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
      caption: 'Làng Pháp cổ kính',
      isPrimary: false,
    },
  ],
  createdAt: '2026-06-14T08:00:00Z',
  updatedAt: '2026-08-02T10:00:00Z',
  isDemo: true,
};

export const DEMO_TOUR_HOI_AN_EVENING: TourPackageDto = {
  id: 'tour-148',
  tourCode: 'TP-0148',
  operatorUserId: 101,
  title: 'Hội An lantern evening tour',
  destination: 'Hội An, Quảng Nam',
  category: 'Văn hóa & Ẩm thực',
  durationDays: 1,
  basePrice: 640000,
  childPrice: 320000,
  maxCapacity: 25,
  description:
    'Dạo phố cổ Hội An về đêm, trải nghiệm thả hoa đăng trên sông Hoài và thưởng thức đặc sản cao lầu, chè bắp phố Hội.',
  inclusions: 'Thuyền hoa đăng, vé tham quan phố cổ, hướng dẫn viên bản địa, bữa tối đặc sản.',
  exclusions: 'Chi phí mua sắm quà lưu niệm cá nhân.',
  cancellationPolicy: 'Hoàn tiền 100% nếu hủy trước 24 giờ. Không hoàn tiền sau thời gian này.',
  status: 'Draft',
  version: 1,
  itinerary: [
    {
      dayNo: 1,
      title: 'Đêm phố cổ lung linh sắc đèn lồng',
      activities: [
        {
          id: 'act-ha-1',
          time: '15:30',
          poiName: 'Khởi hành từ Đà Nẵng đi Hội An',
          stayDurationMinutes: 45,
          transport: 'Xe du lịch',
        },
        {
          id: 'act-ha-2',
          time: '16:30',
          poiName: 'Chùa Cầu & Nhà cổ Tấn Ký',
          stayDurationMinutes: 60,
          transport: 'Đi bộ',
        },
        {
          id: 'act-ha-3',
          time: '18:00',
          poiName: 'Bữa tối đặc sản Hội An',
          stayDurationMinutes: 60,
          transport: 'Đi bộ',
        },
        {
          id: 'act-ha-4',
          time: '19:15',
          poiName: 'Đi thuyền thả hoa đăng sông Hoài',
          stayDurationMinutes: 45,
          transport: 'Thuyền',
        },
        {
          id: 'act-ha-5',
          time: '20:15',
          poiName: 'Chợ đêm Nguyễn Hoàng & Mua sắm',
          stayDurationMinutes: 45,
          transport: 'Đi bộ',
        },
      ],
    },
  ],
  schedules: [
    {
      id: 'sch-ha-1',
      departureDate: '2026-10-12',
      returnDate: '2026-10-12',
      totalCapacity: 25,
      reservedCapacity: 0,
      meetingPoint: 'Cầu Rồng, Đà Nẵng',
      status: 'Scheduled',
    },
  ],
  media: [
    {
      id: 'med-ha-1',
      url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
      caption: 'Đèn lồng phố cổ Hội An',
      isPrimary: true,
    },
  ],
  createdAt: '2026-08-24T09:30:00Z',
  updatedAt: '2026-08-24T09:30:00Z',
  isDemo: true,
};

export const DEMO_TOUR_HUE_HERITAGE: TourPackageDto = {
  id: 'tour-89',
  tourCode: 'TP-0089',
  operatorUserId: 101,
  title: 'Huế Imperial City heritage tour',
  destination: 'Thừa Thiên Huế',
  category: 'Lịch sử & Di sản',
  durationDays: 1,
  basePrice: 950000,
  maxCapacity: 20,
  description: 'Thăm Đại Nội Huế, Chùa Thiên Mụ và Lăng Khải Định.',
  cancellationPolicy: 'Hủy trước 48 giờ hoàn 100%.',
  status: 'Pending',
  version: 1,
  itinerary: [
    {
      dayNo: 1,
      activities: [
        {
          id: 'act-hue-1',
          time: '08:00',
          poiName: 'Đại Nội Huế',
          stayDurationMinutes: 120,
          transport: 'Xe du lịch',
        },
      ],
    },
  ],
  schedules: [
    {
      id: 'sch-hue-1',
      departureDate: '2026-10-20',
      returnDate: '2026-10-20',
      totalCapacity: 20,
      reservedCapacity: 0,
      status: 'Scheduled',
    },
  ],
  media: [],
  createdAt: '2026-08-10T08:00:00Z',
  updatedAt: '2026-08-10T08:00:00Z',
  isDemo: true,
};

export const DEMO_TOUR_FOOD_TRAIL: TourPackageDto = {
  id: 'tour-55',
  tourCode: 'TP-0055',
  operatorUserId: 101,
  title: 'Da Nang Night Food Trail',
  destination: 'Đà Nẵng',
  category: 'Ẩm thực',
  durationDays: 1,
  basePrice: 450000,
  maxCapacity: 15,
  description: 'Trải nghiệm ẩm thực đêm Đà Nẵng: Mì Quảng, bánh xèo, hải sản.',
  cancellationPolicy: 'Hủy trước 12 giờ hoàn tiền.',
  status: 'Rejected',
  rejectionReason: 'Vui lòng bổ sung đầy đủ lịch trình chi tiết và địa điểm đón trả khách an toàn.',
  version: 1,
  itinerary: [
    {
      dayNo: 1,
      activities: [
        {
          id: 'act-food-1',
          time: '18:00',
          poiName: 'Chợ đêm Sơn Trà',
          stayDurationMinutes: 60,
          transport: 'Đi bộ',
        },
      ],
    },
  ],
  schedules: [
    {
      id: 'sch-food-1',
      departureDate: '2026-10-15',
      returnDate: '2026-10-15',
      totalCapacity: 15,
      reservedCapacity: 0,
      status: 'Scheduled',
    },
  ],
  media: [],
  createdAt: '2026-08-05T14:00:00Z',
  updatedAt: '2026-08-06T09:00:00Z',
  isDemo: true,
};

export const INITIAL_DEMO_TOURS: TourPackageDto[] = [
  DEMO_TOUR_BANA_HILLS,
  DEMO_TOUR_HOI_AN_EVENING,
  DEMO_TOUR_HUE_HERITAGE,
  DEMO_TOUR_FOOD_TRAIL,
];
