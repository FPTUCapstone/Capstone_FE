import type { OperatorProfileDto } from '../types/operatorProfile';

/**
 * Production environment gate for Operator Profile demo fixtures.
 * Strictly requires non-production environment AND explicit NEXT_PUBLIC_ENABLE_DEMO_FIXTURES === 'true'.
 * Production environment ALWAYS wins (returns false).
 */
export function isOperatorDemoAllowedInCurrentEnv(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES === 'true'
  );
}

/**
 * EXPLICIT DEMO FIXTURE (DEMO_ONLY)
 */
export const DEMO_OPERATOR_PROFILE: OperatorProfileDto = {
  userId: 1048,
  businessName: 'Han River Travel Co., Ltd',
  businessDescription:
    'Licensed inbound operator running day tours around Da Nang, Hoi An and Ba Na Hills since 2015.',
  businessAddress: '02 Nguyễn Văn Linh, Hải Châu, Đà Nẵng',
  contactPhone: '0905388123',
  contactEmail: 'contact@hanrivertravel.vn',
  website: 'https://hanrivertravel.vn',
  businessLicenceNumber: '48-0123/2020/TCDL-GP LHQT',
  taxCode: '0401998877',
  approvalStatus: 'Approved',
  accountEmail: 'operator.hanriver@tripmate.vn',
  isDemo: true,
};
