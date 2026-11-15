import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';
import { FirstPasswordView } from '@/features/auth/session/FirstPasswordView';

export const metadata = { title: 'Change Temporary Password | TripMate Administration' };
export default async function AdminFirstPasswordPage() {
  const session = verifyAdminSessionFromCookies(await cookies());
  if (!session) redirect('/admin/login');
  const destination = session.role === 'Staff' ? '/admin/staff' : '/admin';
  if (!session.mustChangePassword) redirect(destination);
  return <FirstPasswordView administration destination={destination} />;
}
