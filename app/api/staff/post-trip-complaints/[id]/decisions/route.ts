import { proxyStaffComplaints } from '@/features/admin/staff-complaints/staffComplaintsProxy';
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) { return proxyStaffComplaints(request, (await context.params).id, 'decisions'); }
