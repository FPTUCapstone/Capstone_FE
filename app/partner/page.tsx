import { PartnerRouteGuard } from '@/features/operator/access/PartnerRouteGuard';
import { OperatorDashboard } from '@/features/operator/dashboard/OperatorDashboard';
export default function PartnerPage() { return <PartnerRouteGuard route="dashboard"><OperatorDashboard /></PartnerRouteGuard>; }
