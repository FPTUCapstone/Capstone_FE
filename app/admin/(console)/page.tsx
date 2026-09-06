import type { Metadata } from 'next';

import { AdminDashboard } from '@/features/admin/dashboard/AdminDashboard';

export const metadata: Metadata = {
  title: 'Admin Portal',
};

export default function AdminConsolePage() {
  return <AdminDashboard />;
}
