export type UserAccountRole = 'Traveler' | 'Tour Operator';
export type UserAccountStatus = 'Active' | 'Locked' | 'Pending';

export interface UserAccountItem {
  id: number;
  name: string;
  organization?: string;
  verified?: boolean;
  email: string;
  phone: string;
  role: UserAccountRole;
  createdAt: string;
  status: UserAccountStatus;
  statusDetail?: string;
  avatarUrl?: string;
}

export interface UserAccountKpiStats {
  totalAccounts: number;
  activeGrowthPercentage: number;
  tourOperators: number;
  tourOperatorsDetail: string;
  lockedAccounts: number;
  lockedRatePercentage: number;
  pendingVerification: number;
  pendingDetail: string;
}
