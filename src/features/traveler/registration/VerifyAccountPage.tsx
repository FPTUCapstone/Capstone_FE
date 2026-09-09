import { AuthShell } from '@/components/layout/AuthShell';
import { VerifyAccountForm } from '@/features/traveler/registration/VerifyAccountForm';

type VerifyAccountPageProps = { deliveryFailed?: boolean; email?: string };

export function VerifyAccountPage({ deliveryFailed, email }: VerifyAccountPageProps) {
  return (
    <AuthShell
      singlePanel
      eyebrow="Account verification"
      title="Verify your account"
      description="Enter the verification code sent to the registered Email Address. Protected Traveler functions remain unavailable until verification succeeds."
    >
      <VerifyAccountForm email={email} deliveryFailed={deliveryFailed} />
    </AuthShell>
  );
}
