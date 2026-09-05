import { SignInForm } from '@/components/auth/SignInForm';
import { AuthShell } from '@/components/layout/AuthShell';
import { ROUTES } from '@/lib/routes';

export function PublicSignInPage() {
  return (
    <AuthShell
      backHref={ROUTES.home}
      backLabel="Return to Landing Page"
      eyebrow="Public authentication"
      title="Continue planning Central Vietnam."
      description="Sign in to the approved Traveler or Tour Operator Web experience. Pending and Rejected Tour Operators continue to Application Status after authentication."
    >
      <SignInForm />
    </AuthShell>
  );
}
