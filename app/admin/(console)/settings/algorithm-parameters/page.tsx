import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import { AlgorithmConfigForm } from '@/features/admin/algorithm-config/AlgorithmConfigForm';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { ADMIN_ACCESS_TOKEN_COOKIE, parseAdminRoleFromToken } from '@/lib/server/adminSession';

export const metadata: Metadata = { title: 'Algorithm Parameters' };

export default async function AlgorithmParametersPage() {
  let role: 'Administrator' | 'Staff' | null = null;
  try {
    const token = (await cookies()).get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
    role = parseAdminRoleFromToken(token);
  } catch {
    role = null;
  }

  if (role === 'Staff') {
    return <AdminAccessDeniedView />;
  }

  return <AlgorithmConfigForm />;
}
