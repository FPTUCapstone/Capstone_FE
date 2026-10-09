import type { Metadata } from 'next';
import { OperatorApplicationStatusPage } from '@/features/operator/application/OperatorApplicationStatusPage';
import { PartnerRouteGuard } from '@/features/auth/routing/PartnerRouteGuard';
export const metadata: Metadata = { title: 'Operator Application Status' };
export default function PartnerApplicationPage() { return <PartnerRouteGuard route="application"><OperatorApplicationStatusPage /></PartnerRouteGuard>; }
