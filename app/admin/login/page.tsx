import type { Metadata } from 'next';

import { AdminLoginPage } from '@/features/admin/auth/AdminLoginPage';

export const metadata: Metadata = { title: 'Admin Login' };

interface AdminLoginRouteProps {
  searchParams: Promise<{ returnUrl?: string | string[] }>;
}

export default async function AdminLoginRoute({ searchParams }: AdminLoginRouteProps) {
  const { returnUrl } = await searchParams;
  return <AdminLoginPage returnUrl={typeof returnUrl === 'string' ? returnUrl : undefined} />;
}
