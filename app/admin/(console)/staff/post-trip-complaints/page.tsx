import type { Metadata } from 'next';
import { StaffComplaintListScreen } from '@/features/admin/staff-complaints/StaffComplaintListScreen';
export const metadata: Metadata = { title: 'Khiếu nại sau tour | TripMate Staff' };
export default function StaffComplaintListPage() { return <StaffComplaintListScreen />; }
