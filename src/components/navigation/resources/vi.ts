/**
 * Shared Vietnamese resource strings for PublicNavigation.
 */
export const publicNavigationVi = {
  brandAria: 'Trang chủ TripMate',
  navAria: 'Điều hướng công khai',
  links: {
    explore: 'Khám phá',
    destinations: 'Điểm đến',
    smartItinerary: 'Lập lịch trình',
    myItineraries: 'Lịch trình của tôi',
    weatherRerouting: 'Cứu nguy thời tiết',
    localTours: 'Tour du lịch',
    forPartners: 'Dành cho đối tác',
  },
  account: {
    profileAria: 'Tài khoản và hồ sơ',
    restoringAria: 'Đang khôi phục phiên làm việc',
    restoringSrText: 'Đang khôi phục phiên làm việc…',
    register: 'Đăng ký',
    signIn: 'Đăng nhập',
    partnerWorkspace: 'Quản lý đối tác',
    partnerProfile: 'Hồ sơ doanh nghiệp',
    partnerApplication: 'Hồ sơ đối tác',
    partnerMenuAria: 'Menu tài khoản đối tác',
    logOut: 'Đăng xuất',
    operatorRoleBadge: 'Đối tác',
  },
  drawer: {
    openAria: 'Mở menu điều hướng',
    closeAria: 'Đóng menu',
    title: 'Menu',
    navAria: 'Menu điều hướng di động',
    poisDesc: 'Kho danh thắng & toạ độ danh lam',
    planDesc: 'Tối ưu nhịp sinh học & lịch trình',
    toursDesc: 'Trải nghiệm có kiểm duyệt & bảo chứng',
    weatherDesc: 'Cứu nguy lộ trình khi mưa bão',
    destinationsDesc: 'Khám phá Đà Nẵng, Hội An, Huế',
    myItinerariesDesc: 'Hành trình đã lưu',
    partnerDesc: 'Cổng đăng ký & Quản trị đối tác',
  },
} as const;

export type PublicNavigationViResources = typeof publicNavigationVi;
