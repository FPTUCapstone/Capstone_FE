import type { Metadata } from 'next';
import { PostTripComplaintPage } from '@/features/complaints/submit/components/PostTripComplaintPage';

export const metadata: Metadata = { title: 'Submit post-trip complaint | TripMate', description: 'Submit a complaint about a completed TripMate tour booking.' };
export default async function ComplaintPage({ params }: { params: Promise<{ id: string }> }) { return <PostTripComplaintPage bookingId={(await params).id} />; }
