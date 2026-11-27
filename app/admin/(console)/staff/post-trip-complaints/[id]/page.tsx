import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StaffComplaintDetailScreen } from '@/features/admin/staff-complaints/StaffComplaintDetailScreen';
export const metadata: Metadata = { title: 'Xem xét khiếu nại | TripMate Staff' };
export default async function StaffComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) notFound();
  return <StaffComplaintDetailScreen id={id} />;
}
