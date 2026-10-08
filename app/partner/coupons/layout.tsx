import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { CouponRouteGuard } from '@/features/operator/coupons/guards/CouponRouteGuard';
import { couponEn } from '@/features/operator/coupons/resources/en';

export const metadata: Metadata = {
  title: `${couponEn.metadata.title} | TripMate`,
  description: couponEn.metadata.description,
};

export default function PartnerCouponsLayout({ children }: { children: ReactNode }) {
  return <CouponRouteGuard>{children}</CouponRouteGuard>;
}
