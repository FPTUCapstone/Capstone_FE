import { PartnerContextPage } from '@/features/auth/routing/PartnerContextPage';
import { PartnerRouteGuard } from '@/features/auth/routing/PartnerRouteGuard';
export default function PartnerPage() { return <PartnerRouteGuard route="dashboard"><PartnerContextPage approvedArea /></PartnerRouteGuard>; }
