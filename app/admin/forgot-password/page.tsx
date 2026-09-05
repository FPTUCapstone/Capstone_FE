import type { Metadata } from 'next';

import { AdminPasswordRecoveryPage } from '@/features/admin/auth/AdminPasswordRecoveryPage';

export const metadata: Metadata = { title: 'Admin Password Recovery' };

export default function AdminForgotPasswordPage() {
  return <AdminPasswordRecoveryPage />;
}
