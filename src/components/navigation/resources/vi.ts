/**
 * Shared Vietnamese resource strings for PublicNavigation.
 * Aligns with publicNavigationEn structure for seamless localization.
 */
export const publicNavigationVi = {
  brandAria: 'Trang chủ TripMate',
  navAria: 'Điều hướng công cộng',
  links: {
    explore: 'Điểm đến',
    destinations: 'Điểm đến',
    smartItinerary: 'Lập lịch trình',
    myItineraries: 'Lịch trình của tôi',
    weatherRerouting: 'Cứu nguy thời tiết',
    localTours: 'Tour du lịch',
    forPartners: 'Dành cho đối tác',
  },
  account: {
    profileAria: 'Tài khoản và hồ sơ',
    restoringAria: 'Đang khôi phục phiên',
    restoringSrText: 'Đang khôi phục phiên…',
    register: 'Đăng ký',
    signIn: 'Đăng nhập',
    quickPlan: 'Lên kế hoạch ngay',
    mobilePlan: 'Lập lịch',
  },
  drawer: {
    openAria: 'Mở menu điều hướng',
    closeAria: 'Đóng menu',
    title: 'Menu',
    navAria: 'Menu điều hướng',
    poisDesc: 'Kho danh thắng & tọa độ danh lam',
    planDesc: 'Tối ưu nhịp sinh học & giờ mở cửa',
    toursDesc: 'Trải nghiệm có kiểm duyệt & bảo chứng',
    myItinerariesDesc: 'Hành trình đã lưu',
    partnerDesc: 'Cổng đăng ký & Quản trị lữ hành',
  },
} as const;

export type PublicNavigationViResources = typeof publicNavigationVi;
