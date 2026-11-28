import { proxyStaffComplaints } from '@/features/admin/staff-complaints/staffComplaintsProxy';
export const dynamic = 'force-dynamic';
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) { return proxyStaffComplaints(request, (await context.params).id); }
