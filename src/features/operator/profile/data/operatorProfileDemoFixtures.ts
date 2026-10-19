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
 *
 * Sourced directly from Report 3 Screen #76 (Tour Operator Profile mockup):
 * - Company Name: Han River Travel Co., Ltd
 * - Tax Code: 0401998877 (Read-only, BR-08)
 * - Business Licence Number: 48-0123/2020/TCDL-GP LHQT (Read-only, BR-08)
 * - Business Email: contact@hanrivertravel.vn
 * - Business Phone: 0236 388 1234
 * - Head Office Address: 02 Nguyễn Văn Linh, Hải Châu, Đà Nẵng
 * - Company Description: Licensed inbound operator running day tours around Da Nang, Hoi An and Ba Na Hills since 2015.
 * - Website: https://hanrivertravel.vn
 * - Approval Status: Approved (Read-only)
 */
export const DEMO_OPERATOR_PROFILE: OperatorProfileDto = {
  userId: 1048,
  businessName: 'Han River Travel Co., Ltd',
  businessDescription:
    'Licensed inbound operator running day tours around Da Nang, Hoi An and Ba Na Hills since 2015.',
  businessAddress: '02 Nguyễn Văn Linh, Hải Châu, Đà Nẵng',
  contactPhone: '0236 388 1234',
  contactEmail: 'contact@hanrivertravel.vn',
  website: 'https://hanrivertravel.vn',
  businessLicenceNumber: '48-0123/2020/TCDL-GP LHQT',
  taxCode: '0401998877',
  approvalStatus: 'Approved',
  accountEmail: 'operator.hanriver@tripmate.vn',
  isDemo: true,
};
