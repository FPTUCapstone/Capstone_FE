import type { Metadata } from 'next';
import { PartnerRouteGuard } from '@/features/operator/access/PartnerRouteGuard';
import { PageContentContainer } from '@/features/operator/common/components/PageContentContainer';
import { PartnerWorkspaceLayout } from '@/features/operator/common/components/PartnerWorkspaceLayout';
import { OperatorComplaintListScreen } from '@/features/operator/post-trip-complaints/OperatorComplaintListScreen';
export const metadata: Metadata = { title: 'Post-trip Complaints | TripMate Partner' };
export default function PostTripComplaintsPage() { return <PartnerRouteGuard route="dashboard"><PartnerWorkspaceLayout activeTab="complaints"><PageContentContainer><OperatorComplaintListScreen /></PageContentContainer></PartnerWorkspaceLayout></PartnerRouteGuard>; }
