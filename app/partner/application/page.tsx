import type { Metadata } from 'next';
import { PartnerContextPage } from '@/features/auth/routing/PartnerContextPage';
import { PartnerRouteGuard } from '@/features/auth/routing/PartnerRouteGuard';
export const metadata: Metadata = { title: 'Operator Application Status' };
export default function PartnerApplicationPage() { return <PartnerRouteGuard route="application"><PartnerContextPage /></PartnerRouteGuard>; }
