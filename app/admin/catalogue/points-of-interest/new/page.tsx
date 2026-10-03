import type { Metadata } from 'next';
import { CreatePoiPage } from '@/features/admin/create-poi';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_ACCESS_TOKEN_COOKIE } from '@/lib/server/adminSession';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Create Point of Interest (POI) | TripMate Admin',
  description: 'UC-52: Admin interface to create and configure Points of Interest for TripMate catalog.',
};

export default async function NewPoiPage() {
  // Presence is only a navigation hint; BE verifies token, role and active account on every API call.
  if (!(await cookies()).get(ADMIN_ACCESS_TOKEN_COOKIE)?.value) redirect(ROUTES.admin.login);
  return <CreatePoiPage />;
}
