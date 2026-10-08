import type { Metadata } from 'next';

import { PartnerShell } from '@/components/layout/PartnerShell';
import { PartnerRouteGuard } from '@/features/auth/routing/PartnerRouteGuard';
import { CreateCouponForm } from '@/features/operator/coupons/components/CreateCouponForm';

export const metadata: Metadata = { title: 'Create coupon' };

export default function CreateCouponPage() {
  return <PartnerRouteGuard route="couponCreate"><PartnerShell title="Create a coupon" description="Offer a clear discount on the approved tours you choose. Customers can use it only during the dates you set."><CreateCouponForm /></PartnerShell></PartnerRouteGuard>;
}
