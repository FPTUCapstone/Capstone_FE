/**
 * Common Vietnamese resource strings for the Traveler Account workspace.
 */
export const accountCommonVi = {
  navigation: {
    workspaceNavAria: 'Điều hướng tài khoản',
    tabs: {
      profile: 'Hồ sơ cá nhân',
      preferences: 'Sở thích du lịch',
      security: 'Bảo mật & Mật khẩu',
      trips: 'Chuyến đi của tôi',
      complaints: 'Khiếu nại của tôi',
    },
  },
} as const;

export type AccountCommonViResources = typeof accountCommonVi;
