import { redirect } from 'next/navigation';

import { safeAdminReturnPath } from '@/features/auth/routing/signInReturnUrl';
import { ROUTES } from '@/lib/routes';

interface AdminLoginRouteProps {
  searchParams: Promise<{ returnUrl?: string | string[] }>;
}

// Administrators and Staff sign in at /sign-in like every other role. A safe administration
// returnUrl is forwarded; the role check happens after sign-in.
export default async function AdminLoginRoute({ searchParams }: AdminLoginRouteProps) {
  const { returnUrl } = await searchParams;
  const safeReturnPath = safeAdminReturnPath(returnUrl);
  redirect(safeReturnPath ? `${ROUTES.signIn}?returnUrl=${encodeURIComponent(safeReturnPath)}` : ROUTES.signIn);
}
