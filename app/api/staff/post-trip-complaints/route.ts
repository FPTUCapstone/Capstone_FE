import { proxyStaffComplaints } from '@/features/admin/staff-complaints/staffComplaintsProxy';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) { return proxyStaffComplaints(request); }
