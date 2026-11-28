import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { AdminPaymentChannelsScreen } from '@/features/admin/operator-payment-channels/AdminPaymentChannelsScreen';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = { title: 'Kênh thanh toán đối tác | TripMate Admin' };
export default async function OperatorPaymentChannelsPage() {
  const session = verifyAdminSessionFromCookies(await cookies());
  if (!session) return redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.operatorPaymentChannels)}`);
  if (session.role !== 'Administrator') return <AdminAccessDeniedView requiredRole="Administrator" />;
  return <AdminPaymentChannelsScreen />;
}
