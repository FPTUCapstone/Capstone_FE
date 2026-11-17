import type { Metadata } from 'next';
import { PartnerRouteGuard } from '@/features/operator/access/PartnerRouteGuard';
import { PageContentContainer } from '@/features/operator/common/components/PageContentContainer';
import { PartnerWorkspaceLayout } from '@/features/operator/common/components/PartnerWorkspaceLayout';
import { OperatorComplaintDetailScreen } from '@/features/operator/post-trip-complaints/OperatorComplaintDetailScreen';
export const metadata: Metadata = { title: 'Respond to Complaint | TripMate Partner' };
export default async function PostTripComplaintPage({ params }: { params: Promise<{ complaintId: string }> }) { const id = Number((await params).complaintId); return <PartnerRouteGuard route="dashboard"><PartnerWorkspaceLayout activeTab="complaints"><PageContentContainer>{Number.isSafeInteger(id) && id > 0 ? <OperatorComplaintDetailScreen complaintId={id} /> : <main className="p-8">Invalid complaint ID.</main>}</PageContentContainer></PartnerWorkspaceLayout></PartnerRouteGuard>; }
