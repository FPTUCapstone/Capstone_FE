import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ContractTemplateEditor } from '@/features/admin/contract-templates/ContractTemplateEditor';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = { title: 'Chi tiết mẫu hợp đồng | TripMate' };
export default async function ContractTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const session = verifyAdminSessionFromCookies(await cookies());
  const { id } = await params;
  if (!session) return redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.contractTemplate(id))}`);
  if (session.role !== 'Administrator') return <AdminAccessDeniedView requiredRole="Administrator" />;
  if (!/^\d+$/.test(id)) return <p role="alert" className="p-6">Không tìm thấy mẫu hợp đồng.</p>;
  return <ContractTemplateEditor id={id} />;
}
