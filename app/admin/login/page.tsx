import type { Metadata } from 'next';

import { AdminLoginPage } from '@/features/admin/auth/AdminLoginPage';

export const metadata: Metadata = { title: 'Admin Login' };

export default function AdminLoginRoute() {
  return <AdminLoginPage />;
}
