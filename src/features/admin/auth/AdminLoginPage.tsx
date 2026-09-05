import { SignInForm } from '@/components/auth/SignInForm';
import { AuthShell } from '@/components/layout/AuthShell';
import { ROUTES } from '@/lib/routes';

export function AdminLoginPage() {
  return (
    <AuthShell
      admin
      backHref={ROUTES.home}
      backLabel="Return to TripMate"
      eyebrow="TripMate Admin"
      title="Administrator Sign In"
      description="Authenticate to access the protected administration workspace."
    >
      <SignInForm admin />
    </AuthShell>
  );
}
