import { proxyStaffComplaints } from '@/features/admin/staff-complaints/staffComplaintsProxy';
export const dynamic = 'force-dynamic';
export async function GET(request: Request, context: { params: Promise<{ id: string; evidenceId: string }> }) {
  const { id, evidenceId } = await context.params;
  return proxyStaffComplaints(request, id, 'evidence', evidenceId);
}
