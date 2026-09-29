import { AdminSignInForm } from '@/features/admin/auth/AdminSignInForm';
import { AuthShell } from '@/components/layout/AuthShell';
import { ROUTES } from '@/lib/routes';

interface AdminLoginPageProps {
  returnUrl?: string;
}

export function AdminLoginPage({ returnUrl }: AdminLoginPageProps) {
  return (
    <AuthShell
      admin
      backHref={ROUTES.home}
      backLabel="Return to TripMate"
      eyebrow="TripMate Admin"
      title="Administrator Sign In"
      description="Authenticate to access the protected administration workspace."
    >
      <AdminSignInForm returnUrl={returnUrl} />
    </AuthShell>
  );
}
