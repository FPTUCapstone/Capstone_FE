import type { Metadata } from 'next';

import { AdminDashboard } from '@/features/admin/dashboard/AdminDashboard';
import { adminDashboardEn } from '@/features/admin/dashboard/resources/en';

export const metadata: Metadata = {
  title: adminDashboardEn.metadataTitle,
};

export default function AdminConsolePage() {
  return <AdminDashboard />;
}
