import type { Metadata } from 'next';
import { PartnerRouteGuard } from '@/features/operator/access/PartnerRouteGuard';
import { OperatorContractPage } from '@/features/operator/contracts/OperatorContractPage';

export const metadata: Metadata = { title: 'Hợp đồng đối tác TripMate' };
export default function PartnerContractPage() { return <PartnerRouteGuard route="contract"><OperatorContractPage /></PartnerRouteGuard>; }
