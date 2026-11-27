import type { Metadata } from 'next';
import { PartnerRouteGuard } from '@/features/operator/access/PartnerRouteGuard';
import { PartnerWorkspaceLayout } from '@/features/operator/common/components/PartnerWorkspaceLayout';
import { PageContentContainer } from '@/features/operator/common/components/PageContentContainer';
import { PaymentSettingsScreen } from '@/features/operator/payment-settings/PaymentSettingsScreen';

export const metadata: Metadata = { title: 'Kết nối thanh toán payOS | TripMate' };
export default function PaymentSettingsPage() {
  return <PartnerRouteGuard route="paymentSettings"><PartnerWorkspaceLayout activeTab="paymentSettings"><PageContentContainer><PaymentSettingsScreen /></PageContentContainer></PartnerWorkspaceLayout></PartnerRouteGuard>;
}
