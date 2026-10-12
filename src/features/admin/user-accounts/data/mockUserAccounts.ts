import type { UserAccountItem, UserAccountKpiStats } from '../types/userAccount';

export const mockUserAccountKpiStats: UserAccountKpiStats = {
  totalAccounts: 1248,
  activeGrowthPercentage: 12,
  tourOperators: 68,
  tourOperatorsDetail: '32 international & domestic units',
  lockedAccounts: 14,
  lockedRatePercentage: 1.12,
  pendingVerification: 5,
  pendingDetail: 'Requires review within 24h',
};

export const mockUserAccountsList: UserAccountItem[] = [
  {
    id: 4402,
    name: 'Nguyễn Văn Nam',
    organization: 'Hanoi Heritage Travel Co., Ltd',
    verified: true,
    email: 'nam.nguyen@hanoicheritage.vn',
    phone: '0912 345 678',
    role: 'Tour Operator',
    createdAt: '14/02/2026',
    status: 'Active',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCF7zlUZpBx2JuX8ZaZd0-VML4Ga3EI5SHcDSNtWKhsvwzptdoyG5BxbiK5VTwTTBaQiG_TC71tjTbxRCq-BlH-Oz2sBX5ne5fitqlIFVRTbFkxuPYCf81Om7Ye47MNH4kdBsulvyRtClqm8aPfsjhJL98U09YvfjILas6IevrXfNUlKLTrgqlCyBF7EUNFMdVMl8wblQ0TNRWXZITbTQQEd2hsVnR4EoX9xoCuY6ej-LJnVeh6IFw',
  },
  {
    id: 2091,
    name: 'Trần Văn B',
    email: 'tranvanb.travel@gmail.com',
    phone: '0988 765 432',
    role: 'Traveler',
    createdAt: '28/01/2026',
    status: 'Locked',
    statusDetail: 'Policy violation',
  },
  {
    id: 3108,
    name: 'Lê Thị Thanh Hương',
    organization: 'Danang Eco Tours JSC',
    verified: true,
    email: 'huong.danang@ecotours.com',
    phone: '0905 112 233',
    role: 'Tour Operator',
    createdAt: '02/03/2026',
    status: 'Active',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDCmPr7Depi32e31Mb4Q-5XO5Uu5aqGQMFJrNIqITwA0lZoJDpnzl8IAQ0CrGzrFZO1OMokODj_6f9byiPzPxvgfV1vKYr8PUi2LJ1nsqIa1FDZRsWgcCux2Es5NnOmuyaMF4WkogAnMRMvKS9fvOLyKeJKGfLlN-JVXTyWJ5md91kU3oRk9CIpM1hAJ0APfI6pAGMQKCZP1oM45Jz0DatwjitL_Yu7RVhwTVgpbghJwlmI15XNiIk',
  },
  {
    id: 5519,
    name: 'Phạm Quốc Hưng',
    organization: 'ID #USR-5519 • Unverified KYC',
    email: 'quochung.pham92@outlook.com',
    phone: '0934 998 811',
    role: 'Traveler',
    createdAt: '10/03/2026',
    status: 'Pending',
    statusDetail: 'Pending phone verification',
  },
  {
    id: 1104,
    name: 'Công ty Lữ hành Quốc tế Saigontour',
    organization: 'International License: #79-014/2022',
    verified: true,
    email: 'booking@saigontour-central.vn',
    phone: '028 3822 5599',
    role: 'Tour Operator',
    createdAt: '19/12/2025',
    status: 'Active',
  },
];
