import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ContractTemplatesScreen } from '@/features/admin/contract-templates/ContractTemplatesScreen';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = { title: 'Mẫu hợp đồng đối tác | TripMate' };
export default async function ContractTemplatesPage() {
  const session = verifyAdminSessionFromCookies(await cookies());
  if (!session) return redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.contractTemplates)}`);
  if (session.role !== 'Administrator') return <AdminAccessDeniedView requiredRole="Administrator" />;
  return <ContractTemplatesScreen />;
}
