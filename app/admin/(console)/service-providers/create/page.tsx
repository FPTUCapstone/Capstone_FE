import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';
import { AccountProvisioningForm } from '@/features/hotel-service-provider/components/AccountProvisioningForm';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';

export default async function CreateAccountPage() {
  const session = verifyAdminSessionFromCookies(await cookies());
  if (!session) redirect('/admin/login');
  if (session.role !== 'Staff') return <AdminAccessDeniedView />;
  if (session.mustChangePassword) redirect('/admin/first-password');
  return <AccountProvisioningForm kind="provider" />;
}
