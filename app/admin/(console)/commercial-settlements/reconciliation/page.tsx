import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { CommissionReconciliationView } from '@/features/hotel-service-provider/components/w106/CommissionReconciliationView';
import { ToastProvider } from '@/features/hotel-service-provider/components/common/Toast';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: 'Đối soát hoa hồng đối tác | TripMate Staff',
  description: 'Kiểm tra giao dịch chuyển khoản hoa hồng của đối tác với sao kê ngân hàng và xác nhận thu tiền.',
};

export default async function CommissionReconciliationPage() {
  const session = verifyAdminSessionFromCookies(await cookies());
  if (!session) return redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.commissionReconciliation)}`);
  if (session.role !== 'Staff') return <AdminAccessDeniedView requiredRole="Staff" />;

  return (
    <ToastProvider>
      <CommissionReconciliationView />
    </ToastProvider>
  );
}
