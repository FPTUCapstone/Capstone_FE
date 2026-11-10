import type { Metadata } from 'next';

import { PartnerRouteGuard } from '@/features/operator/access/PartnerRouteGuard';
import { PayoutSettlementHistoryScreen } from '@/features/operator/payout-settlements/PayoutSettlementHistoryScreen';

export const metadata: Metadata = {
  title: 'Payout Settlement History | TripMate Partner',
  description: 'Your scheduled and settled payouts, per booking.',
};

export default function PayoutSettlementHistoryPage() {
  return (
    <PartnerRouteGuard route="dashboard">
      <PayoutSettlementHistoryScreen />
    </PartnerRouteGuard>
  );
}
