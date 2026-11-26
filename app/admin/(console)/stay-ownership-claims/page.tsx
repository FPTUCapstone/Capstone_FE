import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { StaffStayClaims } from '@/features/stays/StayOwnership';

export default async function ClaimsPage() {
  const session = verifyAdminSessionFromCookies(await cookies());
  if (!session) redirect('/admin/login');
  if (session.role !== 'Staff') return <AdminAccessDeniedView />;
  if (session.mustChangePassword) redirect('/admin/first-password');
  return <StaffStayClaims />;
}
