export interface DestinationHighlight {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  weather: string;
  temp: string;
  poisCount: number;
  toursCount: number;
  image: string;
  description: string;
  topPois: string[];
  accentColor: string;
}

export interface CspPresetItem {
  time: string;
  title: string;
  category: string;
  duration: string;
  openingHours: string;
  constraintNote: string;
  icon: string;
  tag: string;
}

export interface CspPreset {
  cityId: string;
  cityName: string;
  pace: string;
  totalDuration: string;
  totalPois: number;
  feasibilityScore: number;
  sunsetEvent: string;
  schedule: CspPresetItem[];
}

export interface VerifiedTour {
  id: string;
  title: string;
  operator: string;
  operatorBadge: string;
  city: string;
  price: string;
  originalPrice?: string;
  duration: string;
  rating: number;
  reviewCount: number;
  aiMatchScore: number;
  image: string;
  highlights: string[];
  tag: string;
}

export interface FeatureComparison {
  feature: string;
  description: string;
  tripmate: string;
  googleMaps: string;
  tripAdvisor: string;
  klook: string;
}

export interface WeatherScenario {
  id: string;
  city: string;
  tabLabel: string;
  location: string;
  severityBadge: string;
  incidentTime: string;
  alertHeadline: string;
  weatherDetails: string;
  originalActivity: {
    time: string;
    title: string;
    description: string;
    riskLevel: string;
    badgeText: string;
  };
  reroutedActivity: {
    time: string;
    title: string;
    description: string;
    distance: string;
    indoorFeature: string;
    openingHours: string;
    safetyScore: string;
  };
  fsmLogs: {
    time: string;
    type: 'alert' | 'state' | 'engine' | 'resolved';
    message: string;
  }[];
}


export const CENTRAL_DESTINATIONS: DestinationHighlight[] = [
  {
    id: 'danang',
    name: 'Đà Nẵng',
    tagline: 'Thành phố Biển & Những Cây Cầu Biểu Tượng',
    badge: 'Tâm điểm Miền Trung',
    weather: 'Nắng nhẹ • Biển êm',
    temp: '28°C',
    poisCount: 48,
    toursCount: 18,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSsQeV_BefjZ5QiBZ3PmO-CDVT3IBy5NXfoZ2VHn0M58mlOxXhD9GRDIkIWHrTt3kfJMoxkQj7H_KtkjV1X-FklLOtTQWnZ8G2tgGNAZtjmPLf6Gb0sD4jzcK6xC6sEKHZZH6R2a9sAuExeiHmokXHQRUKZvySbdk51tmeQVI8hAKaFh9BXdO6733zhohdI_FJTSGah_gvVppbxkDUlnE-LbiGEP_woNGqE00KWQfAejQA0kQjrl4',
    description: 'Nổi bật với Bãi biển Mỹ Khê top thế giới, Bán đảo Sơn Trà nguyên sơ, danh thắng Ngũ Hành Sơn huyền bí và Cầu Rồng phun lửa ấn tượng.',
    topPois: ['Bán đảo Sơn Trà & Chùa Linh Ứng', 'Bãi biển Mỹ Khê', 'Cầu Rồng & Sông Hàn', 'Ngũ Hành Sơn', 'Bảo tàng Điêu khắc Chăm'],
    accentColor: '#007d6e',
  },
  {
    id: 'hoian',
    name: 'Hội An',
    tagline: 'Di Sản Văn Hóa Thế Giới & Phố Cổ Đèn Lồng',
    badge: 'Di sản UNESCO',
    weather: 'Mát mẻ • Gió nhẹ',
    temp: '29°C',
    poisCount: 36,
    toursCount: 14,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTerZgbvmAXswccfESZeuJuWp4SDcxQBYD3V2y_faDAANthMPtHEqT9PBTXMyymEBFncjvOZpGpYPVKh5cqW7ZnKCyvtmlgxmPRXXYdbnWQ2-tD3We8VoDVCUXYS6JI_pi5_bHJa8WS5YefC6mTyiWoO-nq7kNZslYheOsY2gsx-zkrTvob1nPXlVtHfZ55jPzkiUhnhK-odHavZT19lyo-munVOvsXghbFO_6Oc23dCrGYew37tM',
    description: 'Bảo tàng sống động của kiến trúc thương cảng châu Á thế kỷ 17. Trải nghiệm thả đèn hoa đăng sông Hoài, chèo thuyền thúng Rừng dừa Bảy Mẫu và ẩm thực Cao lầu.',
    topPois: ['Chùa Cầu & Phố cổ Hội An', 'Rừng dừa Bảy Mẫu Cẩm Thanh', 'Làng gốm Thanh Hà', 'Biển An Bàng', 'Chợ đêm Nguyễn Hoàng'],
    accentColor: '#d97706',
  },
  {
    id: 'hue',
    name: 'Cố Đô Huế',
    tagline: 'Quần Thể Di Tích Triều Nguyễn & Ẩm Thực Cung Đình',
    badge: 'Cố đô Ngàn năm',
    weather: 'Dịu mát • Mây rải rác',
    temp: '27°C',
    poisCount: 42,
    toursCount: 12,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvlzZ40Hx7i1FbtOob_foIQBimfPh5rFUCt3BvN5X9Sj0NS5BD1p3_b6kRz-pSG5J75nVfmuqFGTuOx0Av1FCTy0pkHzqa2XdsaSHA4j-WpoISWpmBTm7xVFCpW35bHqj0E8xN1uZ7UCbsW8qAsVX5g4fwvyjOD-y-3igiwtWpSiN60kLSSHJjmWT1MP6fuXzHBdvQwDfgzrhodjxwqBgNJKu7O2LUDP7FpsStnwwjI7iW9c-kmJk',
    description: 'Kinh đô lịch sử tráng lệ bên dòng sông Hương hiền hòa, nơi lưu giữ tinh hoa nhã nhạc cung đình, lăng tẩm hoàng gia và di sản ẩm thực phong phú bậc nhất.',
    topPois: ['Đại Nội Hoàng thành Huế', 'Lăng Khải Định & Lăng Tự Đức', 'Chùa Thiên Mụ', 'Sông Hương & Nghe Ca Huế', 'Chợ Đông Ba'],
    accentColor: '#7c3aed',
  },
];

export const CSP_PRESETS: Record<string, CspPreset> = {
  danang: {
    cityId: 'danang',
    cityName: 'Đà Nẵng',
    pace: 'Cân bằng (Balanced)',
    totalDuration: '10.5 giờ',
    totalPois: 5,
    feasibilityScore: 98,
    sunsetEvent: 'Hoàng hôn Sơn Trà lúc 17:45 (Tối ưu điểm dừng)',
    schedule: [
      {
        time: '08:00 - 10:00',
        title: 'Danh thắng Ngũ Hành Sơn',
        category: 'Di tích & Thiên nhiên',
        duration: '2h00',
        openingHours: '07:00 - 17:30',
        constraintNote: 'Ưu tiên buổi sáng nhiệt độ mát mẻ (26°C), tránh nắng trưa.',
        icon: 'landscape',
        tag: 'Thiên nhiên',
      },
      {
        time: '10:30 - 11:30',
        title: 'Bảo tàng Điêu khắc Chăm',
        category: 'Văn hóa & Lịch sử',
        duration: '1h00',
        openingHours: '07:30 - 17:00',
        constraintNote: 'Địa điểm trong nhà có điều hòa, tối ưu trung chuyển về trung tâm.',
        icon: 'account_balance',
        tag: 'Văn hóa',
      },
      {
        time: '12:00 - 13:30',
        title: 'Ẩm thực: Mì Quảng Ếch Bếp Trang',
        category: 'Nghỉ ngơi & Ăn trưa',
        duration: '1h30',
        openingHours: '06:30 - 22:00',
        constraintNote: 'Ràng buộc thời gian ăn trưa chuẩn sinh học, buffer di chuyển 15p.',
        icon: 'restaurant',
        tag: 'Ẩm thực',
      },
      {
        time: '15:30 - 18:00',
        title: 'Bán đảo Sơn Trà & Chùa Linh Ứng',
        category: 'Ngắm cảnh & Hoàng hôn',
        duration: '2h30',
        openingHours: 'Mở cả ngày',
        constraintNote: 'CSP xếp điểm này khớp sự kiện thiên văn: Ngắm hoàng hôn lúc 17:45.',
        icon: 'wb_twilight',
        tag: 'Hoàng hôn',
      },
      {
        time: '19:30 - 21:00',
        title: 'Cầu Rồng & Dạo mát Bờ Đông Sông Hàn',
        category: 'Check-in biểu tượng',
        duration: '1h30',
        openingHours: 'Tự do (21h phun lửa cuối tuần)',
        constraintNote: 'Sắp xếp cuối ngày để thuận tiện kết thúc chuyến đi và di chuyển về khách sạn.',
        icon: 'attractions',
        tag: 'Về đêm',
      },
    ],
  },
  hoian: {
    cityId: 'hoian',
    cityName: 'Hội An',
    pace: 'Thong thả (Relaxed)',
    totalDuration: '9.0 giờ',
    totalPois: 4,
    feasibilityScore: 96,
    sunsetEvent: 'Hoàng hôn Sông Hoài lúc 17:35',
    schedule: [
      {
        time: '08:30 - 10:30',
        title: 'Rừng dừa Bảy Mẫu Cẩm Thanh',
        category: 'Sinh thái & Trải nghiệm',
        duration: '2h00',
        openingHours: '07:00 - 17:30',
        constraintNote: 'Chèo thuyền thúng buổi sáng nước trong và thủy triều thuận lợi.',
        icon: 'sailing',
        tag: 'Sinh thái',
      },
      {
        time: '11:15 - 12:30',
        title: 'Bánh Mì Phượng & Cao lầu Phố Hội',
        category: 'Ẩm thực di sản',
        duration: '1h15',
        openingHours: '07:00 - 21:00',
        constraintNote: 'Điểm ăn trưa nổi tiếng cách Rừng dừa 12 phút di chuyển.',
        icon: 'fastfood',
        tag: 'Ẩm thực',
      },
      {
        time: '13:30 - 15:30',
        title: 'Làng gốm Thanh Hà',
        category: 'Làng nghề truyền thống',
        duration: '2h00',
        openingHours: '08:00 - 17:00',
        constraintNote: 'Không gian workshop râm mát, trải nghiệm tự chuốt gốm thủ công.',
        icon: 'handyman',
        tag: 'Làng nghề',
      },
      {
        time: '16:30 - 19:30',
        title: 'Phố cổ Hội An & Thả đèn Hoa Đăng Sông Hoài',
        category: 'Di sản & Ánh sáng',
        duration: '3h00',
        openingHours: 'Phố đi bộ từ 15:00',
        constraintNote: 'Khớp khung giờ phố cổ lên đèn lồng và đi thuyền thả hoa đăng.',
        icon: 'festival',
        tag: 'Di sản',
      },
    ],
  },
  hue: {
    cityId: 'hue',
    cityName: 'Cố Đô Huế',
    pace: 'Khám phá (Explorer)',
    totalDuration: '10.0 giờ',
    totalPois: 5,
    feasibilityScore: 97,
    sunsetEvent: 'Hoàng hôn Đồi Vọng Cảnh / Chùa Thiên Mụ lúc 17:40',
    schedule: [
      {
        time: '08:00 - 10:30',
        title: 'Quần thể Di tích Đại Nội Hoàng Thành',
        category: 'Di tích Lịch sử',
        duration: '2h30',
        openingHours: '07:00 - 17:30',
        constraintNote: 'Tham quan Ngọ Môn, Điện Thái Hòa sáng sớm tránh nhiệt độ cao.',
        icon: 'account_balance',
        tag: 'Lịch sử',
      },
      {
        time: '11:00 - 12:30',
        title: 'Bún Bò Huế Mụ Rơi & Bánh Nậm Lọc',
        category: 'Ẩm thực Cố đô',
        duration: '1h30',
        openingHours: '07:00 - 19:00',
        constraintNote: 'Trải nghiệm hương vị bản địa cách Hoàng thành 8 phút.',
        icon: 'restaurant',
        tag: 'Ẩm thực',
      },
      {
        time: '13:30 - 15:00',
        title: 'Chùa Thiên Mụ & Thuyền Rồng Sông Hương',
        category: 'Tâm linh & Danh thắng',
        duration: '1h30',
        openingHours: 'Mở cửa cả ngày',
        constraintNote: 'Hành trình thuyền rồng đón gió mát ven sông Hương.',
        icon: 'temple_buddhist',
        tag: 'Tâm linh',
      },
      {
        time: '15:30 - 17:30',
        title: 'Lăng Khải Định (Ứng Lăng)',
        category: 'Kiến trúc Cung đình',
        duration: '2h00',
        openingHours: '07:30 - 17:30',
        constraintNote: 'Chiêm ngưỡng kiến trúc khảm sành sứ độc nhất trước giờ đóng cửa.',
        icon: 'domain',
        tag: 'Kiến trúc',
      },
      {
        time: '18:30 - 20:00',
        title: 'Chợ Đêm Đông Ba & Thưởng thức Chè Cung Đình',
        category: 'Chợ truyền thống',
        duration: '1h30',
        openingHours: '06:00 - 22:00',
        constraintNote: 'Mua sắm đặc sản mắm, nón bài thơ và thử chè bột lọc heo quay.',
        icon: 'storefront',
        tag: 'Chợ đêm',
      },
    ],
  },
};

export const WEATHER_SCENARIOS: WeatherScenario[] = [
  {
    id: 'danang-storm',
    city: 'danang',
    tabLabel: 'Đà Nẵng (Mỹ Khê)',
    location: 'Bãi biển Mỹ Khê & Bán đảo Sơn Trà',
    severityBadge: 'Mưa dông lớn >14mm/h',
    incidentTime: '14:30',
    alertHeadline: '14:30 - Mưa dông lớn (14.2 mm/h) ập tới Bãi biển Mỹ Khê',
    weatherDetails: 'Gió giật cấp 6, sóng biển cao 2.5m, tầm nhìn dưới 500m. Nguy cơ sét đánh ngoài bãi cát.',
    originalActivity: {
      time: '14:30 - 16:30',
      title: 'Tắm biển & Thể thao nước Bãi biển Mỹ Khê',
      description: 'Khu vực bãi biển hở, sóng biển động mạnh, mưa xối xả. Hệ thống đánh giá tiếp tục ở ngoài trời là không an toàn.',
      riskLevel: 'Cực kỳ nguy hiểm',
      badgeText: 'Nguy cơ sấm sét bãi biển',
    },
    reroutedActivity: {
      time: '14:30 - 16:30',
      title: 'Bảo tàng Điêu khắc Chăm Đà Nẵng',
      description: 'Không gian trưng bày cổ vật Champa lớn nhất thế giới, toàn bộ phòng triển lãm có mái che kín gió, khuôn viên yên bình.',
      distance: 'Cách 1.8km (5 phút di chuyển)',
      indoorFeature: 'Không gian triển lãm trong nhà 100%',
      openingHours: 'Mở cửa đến 17:30',
      safetyScore: '100% Khô ráo & An toàn',
    },
    fsmLogs: [
      { time: '14:30:00', type: 'alert', message: 'Trạm khí tượng Sơn Trà: Ghi nhận lượng mưa 14.2 mm/h > ngưỡng cảnh báo 7 mm/h.' },
      { time: '14:30:01', type: 'state', message: 'FSM chuyển trạng thái: STATE_ACTIVE_TRIP -> INCIDENT_WEATHER_ALERT.' },
      { time: '14:30:02', type: 'engine', message: 'Kích hoạt Rerouting Engine: Lọc 18 POI văn hóa/triển lãm trong nhà có mái che trong bán kính 3km.' },
      { time: '14:30:03', type: 'resolved', message: 'Lựa chọn tối ưu: Bảo tàng Điêu khắc Chăm (Khô ráo, cách 1.8km, mở đến 17:30) ✓ Đã cập nhật!' },
    ],
  },
  {
    id: 'hoian-flood',
    city: 'hoian',
    tabLabel: 'Hội An (Sông Hoài)',
    location: 'Đường Bạch Đằng & Phố cổ ven sông',
    severityBadge: 'Ngập triều cường +0.4m',
    incidentTime: '15:45',
    alertHeadline: '15:45 - Triều cường dâng cao ngập tuyến đường ven Sông Hoài',
    weatherDetails: 'Thủy triều sông Thu Bồn dâng vượt báo động 1, đường đi bộ Bạch Đằng và cầu ngói bị hạn chế lưu thông.',
    originalActivity: {
      time: '15:45 - 17:30',
      title: 'Đi bộ chụp ảnh phố cổ & Thả hoa đăng ven sông Hoài',
      description: 'Mặt đường ngập nước từ 20-40cm, các hàng quán ven sông đóng cửa chống ngập, không thể thả đèn an toàn.',
      riskLevel: 'Ngập úng & Hạn chế di chuyển',
      badgeText: 'Ngập triều cường cục bộ',
    },
    reroutedActivity: {
      time: '15:45 - 17:30',
      title: 'Xưởng gốm làng Thanh Hà & Bảo tàng Đất nung',
      description: 'Khu công viên đất nung và xưởng thủ công nằm trên nền đất cao ráo, trải nghiệm tự chuốt gốm trong nhà ấm cúng.',
      distance: 'Cách 2.2km (7 phút di chuyển)',
      indoorFeature: 'Workshop có mái che & nhà trưng bày cao tầng',
      openingHours: 'Mở cửa đến 18:00',
      safetyScore: '100% Không bị ngập úng',
    },
    fsmLogs: [
      { time: '15:45:00', type: 'alert', message: 'Cảm biến thủy triều Sông Hoài: Mực nước dâng +0.42m gây ngập đường ven sông.' },
      { time: '15:45:01', type: 'state', message: 'FSM chuyển trạng thái: STATE_ACTIVE_TRIP -> INCIDENT_FLOOD_ALERT.' },
      { time: '15:45:02', type: 'engine', message: 'Kích hoạt Rerouting Engine: Tìm điểm thủ công truyền thống không bị ngập úng.' },
      { time: '15:45:03', type: 'resolved', message: 'Lựa chọn tối ưu: Công viên đất nung & Làng gốm Thanh Hà (Cách 2.2km, địa hình cao ráo) ✓ Đã cập nhật!' },
    ],
  },
  {
    id: 'hue-thunder',
    city: 'hue',
    tabLabel: 'Cố Đô Huế (Đại Nội)',
    location: 'Sân Đại Triều Miếu & Ngọ Môn',
    severityBadge: 'Dông sét nhiệt đới',
    incidentTime: '14:00',
    alertHeadline: '14:00 - Cảnh báo dông sét cực đoan tại Quần thể Đại Nội',
    weatherDetails: 'Đám mây đối lưu nhiệt đới phát triển nhanh trên thượng nguồn sông Hương, cảnh báo phóng điện khí quyển.',
    originalActivity: {
      time: '14:00 - 15:30',
      title: 'Tham quan sân ngoài trời Điện Thái Hòa & Kỳ Đài',
      description: 'Không gian quảng trường trống trải rất nguy hiểm khi có sấm sét, sân gạch lát cổ dễ trơn trượt.',
      riskLevel: 'Nguy cơ sét đánh ngoài trời',
      badgeText: 'Sấm sét diện rộng',
    },
    reroutedActivity: {
      time: '14:00 - 15:30',
      title: 'Bảo tàng Cổ vật Cung đình Huế (Điện Long An)',
      description: 'Tòa cung điện bằng gỗ lim cổ kính tuyệt mỹ, hệ thống thu lôi đạt chuẩn, bảo tồn hàng ngàn bảo vật triều Nguyễn.',
      distance: 'Cách 500m (Đi bộ có hành lang che)',
      indoorFeature: 'Kiến trúc gỗ lim kiên cố, hoàn toàn trong nhà',
      openingHours: 'Mở cửa đến 17:30',
      safetyScore: '100% Trú ẩn di sản an toàn',
    },
    fsmLogs: [
      { time: '14:00:00', type: 'alert', message: 'Trạm cảnh báo sấm sét Cố Đô: Phát hiện sét trong bán kính 2.5km quanh Kỳ Đài.' },
      { time: '14:00:01', type: 'state', message: 'FSM chuyển trạng thái: STATE_ACTIVE_TRIP -> INCIDENT_LIGHTNING_HAZARD.' },
      { time: '14:00:02', type: 'engine', message: 'Kích hoạt Rerouting Engine: Định tuyến vào bảo tàng/cung điện kiên cố gần nhất.' },
      { time: '14:00:03', type: 'resolved', message: 'Lựa chọn tối ưu: Bảo tàng Cổ vật Cung đình Huế (Cách 500m, an toàn tuyệt đối) ✓ Đã cập nhật!' },
    ],
  },
];

export const VERIFIED_TOURS: VerifiedTour[] = [
  {
    id: 'tour-dn-01',
    title: 'Tour Bán Đảo Sơn Trà: Lặn Ngắm San Hô & Hoàng Hôn Bãi Bụt',
    operator: 'Danang Green Travel',
    operatorBadge: 'Verified Partner ★',
    city: 'Đà Nẵng',
    price: '550.000đ',
    originalPrice: '690.000đ',
    duration: '4.5 giờ',
    rating: 4.9,
    reviewCount: 128,
    aiMatchScore: 96,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvQhPFR13r5IPAmTJ8qELZlJ8OtpnWg1TgDouF6aGXjlpvEbDVecNILx3YEEQZWrjuWZMrjt4F0135DvADS_DjY8avxb0MFAc-z3Y2gWvjHrdc-I8IqAXtcsbls8NOLBuDumrIdvkATk8rwRr-XeaneTr04i4H8xJJ6lL-HdfQAxAWMgRDxe79oVVMx6kJvHQNBL0vvMuUqezZDWWtVYhBnXcOZXJYlrWMxOneVow5JXfjXq_ZouQ',
    highlights: ['Bảo hiểm trọn gói', 'Dynamic QR Ticket', 'Cano cao tốc & kính lặn', 'Hướng dẫn viên bản địa'],
    tag: 'Bán chạy nhất',
  },
  {
    id: 'tour-ha-01',
    title: 'Trải Nghiệm Rừng Dừa Bảy Mẫu & Đi Thuyền Thả Hoa Đăng Phố Cổ',
    operator: 'Hoi An Eco Heritage',
    operatorBadge: 'Verified Partner ★',
    city: 'Hội An',
    price: '420.000đ',
    originalPrice: '520.000đ',
    duration: '5.0 giờ',
    rating: 5.0,
    reviewCount: 210,
    aiMatchScore: 95,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTerZgbvmAXswccfESZeuJuWp4SDcxQBYD3V2y_faDAANthMPtHEqT9PBTXMyymEBFncjvOZpGpYPVKh5cqW7ZnKCyvtmlgxmPRXXYdbnWQ2-tD3We8VoDVCUXYS6JI_pi5_bHJa8WS5YefC6mTyiWoO-nq7kNZslYheOsY2gsx-zkrTvob1nPXlVtHfZ55jPzkiUhnhK-odHavZT19lyo-munVOvsXghbFO_6Oc23dCrGYew37tM',
    highlights: ['Biểu diễn múa thúng', 'Thả đèn hoa đăng sông Hoài', 'Thưởng thức trà thảo mộc Mót', 'Check-in tức thì bằng QR'],
    tag: 'Đặc sắc văn hóa',
  },
  {
    id: 'tour-hue-01',
    title: 'Di Sản Cố Đô Huế: Đại Nội, Lăng Khải Định & Du Thuyền Ca Huế',
    operator: 'Huế Heritage Discovery',
    operatorBadge: 'Verified Partner ★',
    city: 'Huế',
    price: '680.000đ',
    originalPrice: '790.000đ',
    duration: '6.0 giờ',
    rating: 4.8,
    reviewCount: 86,
    aiMatchScore: 92,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvlzZ40Hx7i1FbtOob_foIQBimfPh5rFUCt3BvN5X9Sj0NS5BD1p3_b6kRz-pSG5J75nVfmuqFGTuOx0Av1FCTy0pkHzqa2XdsaSHA4j-WpoISWpmBTm7xVFCpW35bHqj0E8xN1uZ7UCbsW8qAsVX5g4fwvyjOD-y-3igiwtWpSiN60kLSSHJjmWT1MP6fuXzHBdvQwDfgzrhodjxwqBgNJKu7O2LUDP7FpsStnwwjI7iW9c-kmJk',
    highlights: ['Vé vào cổng Đại Nội', 'Thuyền rồng sông Hương', 'Nghe ca Huế truyền thống', 'Thuyết minh viên chuyên nghiệp'],
    tag: 'Tour di sản',
  },
  {
    id: 'tour-dn-02',
    title: 'Food Tour Đà Nẵng Về Đêm: Khám Phá Ẩm Thực Chợ Cồn & Phố Ăn Vặt',
    operator: 'Taste of Da Nang',
    operatorBadge: 'Verified Partner ★',
    city: 'Đà Nẵng',
    price: '380.000đ',
    originalPrice: '450.000đ',
    duration: '3.0 giờ',
    rating: 4.9,
    reviewCount: 94,
    aiMatchScore: 89,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_d8ZDvnb-DHqTvEowePFerSaSc1Gq0XofTEi5D5XZ9WFEXjRVnNeQHIbdAD0zkh4qFUTJOH35SiKdTlVeSoWw1VJ25wAGsGAy7IzSUEy2KTgh_Mlz_tIu4IDhEEMn_qqR0K-RJ2rIzoiPe8ylfCdVetk-x28pFxazFK4Ni9VHyaeAihGMrMYASNDacCMdW_G2OdZ5tUX7W1CxXL-v6HHA2a0rzwH6qGS0WE1kSEIqmwBXU52_rao',
    highlights: ['Thử 7 món đặc sản', 'Xe đưa đón phố cổ', 'Ăn vặt Cầu Rồng', 'Nhóm nhỏ tối đa 8 khách'],
    tag: 'Ẩm thực đường phố',
  },
];

export const COMPARISON_DATA: FeatureComparison[] = [
  {
    feature: 'Tự động tối ưu lịch trình 1 ngày (CSP Engine)',
    description: 'Tính toán giải bài toán thỏa mãn ràng buộc (thời gian mở/đóng cửa, sự kiện hoàng hôn, ngân sách).',
    tripmate: 'Có (Thuật toán CSP tối ưu trong 3s)',
    googleMaps: 'Không (Chỉ tìm đường theo thứ tự người dùng nhập)',
    tripAdvisor: 'Không (Chỉ bookmark lưu danh sách tĩnh)',
    klook: 'Không (Chỉ bán tour đóng gói cố định)',
  },
  {
    feature: 'Cứu nguy thời tiết & FSM Rerouting tức thì',
    description: 'Phát hiện mưa giông (>7mm/h) hoặc kẹt xe, tự động đề xuất đổi điểm tham quan trong nhà < 3km.',
    tripmate: 'Có (FSM phản hồi sau 3 giây)',
    googleMaps: 'Không (Chỉ cảnh báo tắc đường giao thông)',
    tripAdvisor: 'Không (Không hỗ trợ khi đang đi)',
    klook: 'Không (Không hỗ trợ đổi điểm do thời tiết)',
  },
  {
    feature: 'Tích hợp sự kiện thiên văn (Bình minh/Hoàng hôn)',
    description: 'Thuật toán tự động sắp xếp điểm ngắm hoàng hôn khớp chính xác khung giờ vàng trong ngày.',
    tripmate: 'Có (Tích hợp API thiên văn thực tế)',
    googleMaps: 'Không hỗ trợ',
    tripAdvisor: 'Không hỗ trợ',
    klook: 'Không hỗ trợ',
  },
  {
    feature: 'Vé điện tử Dynamic QR Code chống giả mạo',
    description: 'Mã QR động tự làm mới định kỳ trên ứng dụng, quét check-in bằng mobile scanner của đối tác.',
    tripmate: 'Có (Dynamic QR mã hóa)',
    googleMaps: 'Không có vé',
    tripAdvisor: 'Vé đối tác ngoài',
    klook: 'Mã QR tĩnh / PDF voucher',
  },
  {
    feature: 'Thanh toán ký quỹ (Escrow) & Hoàn tiền bão lũ',
    description: 'Bảo vệ nguồn tiền du khách, hoàn trả 100% tự động khi có thiên tai hoặc hủy tour khẩn cấp.',
    tripmate: 'Có (Hợp đồng Escrow bảo vệ 2 chiều)',
    googleMaps: 'Không áp dụng',
    tripAdvisor: 'Quy trình đối tác ngoài',
    klook: 'Xét duyệt thủ công 7 - 14 ngày',
  },
];

export const FAQS = [
  {
    q: 'TripMate khác gì so với Google Maps hay TripAdvisor?',
    a: 'Google Maps chỉ dẫn đường theo thứ tự bạn tự nhập, còn TripAdvisor chỉ là nơi đọc review. TripMate là nền tảng thông minh đầu tiên tại Việt Nam áp dụng thuật toán tối ưu ràng buộc (CSP) để tự động sắp xếp một ngày du lịch hoàn hảo dựa trên giờ mở cửa của các điểm, thời gian di chuyển thực tế và cả thời điểm mặt trời lặn, đồng thời cứu nguy đổi lịch trình tức thì khi gặp thời tiết xấu.',
  },
  {
    q: 'Thuật toán CSP giải quyết vấn đề gì cho chuyến đi?',
    a: 'Trong thực tế, du khách thường tốn 4-8 giờ tra cứu để ghép lịch trình và dễ gặp sự cố: đến nơi thì bảo tàng đóng cửa, phải chạy ngược đường, hoặc bị dầm mưa lúc trưa chiều. Thuật toán CSP (Constraint Satisfaction Problem) của TripMate giải quyết đồng thời hàng chục biến số ràng buộc trong vài giây để đưa ra phương án khả thi và tiết kiệm sức nhất.',
  },
  {
    q: 'Tính năng cứu nguy thời tiết FSM hoạt động như thế nào?',
    a: 'Khi du khách đang di chuyển, hệ thống FSM (Finite State Machine) liên tục giám sát tọa độ và trạm thời tiết. Nếu phát hiện mưa to (>7mm/h) hoặc giông lốc, hệ thống sẽ lập tức cảnh báo và tự động quét các điểm tham quan văn hóa / bảo tàng / café trong nhà trong bán kính dưới 3km để đề xuất điều chỉnh lộ trình chỉ trong 3 giây.',
  },
  {
    q: 'Chính sách hoàn tiền khi tour bị hủy do bão lũ thời tiết ra sao?',
    a: 'Theo chính sách bảo vệ quyền lợi du khách của TripMate, khi xảy ra thiên tai hoặc bão lũ khiến Tour Operator phải tuyên bố hủy chuyến khẩn cấp, hệ thống TripMate sẽ tự động kích hoạt hoàn tiền 100% qua cơ chế tài khoản ký quỹ (Escrow) minh bạch mà du khách không cần phải làm đơn khiếu nại phức tạp.',
  },
  {
    q: 'Ứng dụng Web và Ứng dụng Mobile hỗ trợ khác nhau như thế nào?',
    a: 'TripMate hoạt động đồng bộ trên 2 nền tảng: Phiên bản Web tối ưu cho việc nghiên cứu, lập kế hoạch chi tiết trên màn hình lớn và đặt dịch vụ; trong khi Ứng dụng Di động (hỗ trợ iOS & Android) là bạn đồng hành trên đường với tính năng Bản đồ ngoại tuyến (Offline), dẫn đường GPS, ví vé điện tử QR động và kết nối nhóm du lịch.',
  },
];
