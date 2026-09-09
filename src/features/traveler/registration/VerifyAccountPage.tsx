import { AuthShell } from '@/components/layout/AuthShell';
import { VerifyAccountForm } from '@/features/traveler/registration/VerifyAccountForm';

type VerifyAccountPageProps = { email?: string };

export function VerifyAccountPage({ email }: VerifyAccountPageProps) {
  return (
    <AuthShell
      singlePanel
      eyebrow="Account verification"
      title="Verify your account"
      description="Enter the verification code sent to the registered Email Address. Protected Traveler functions remain unavailable until verification succeeds."
    >
      <VerifyAccountForm email={email} />
    </AuthShell>
  );
}
