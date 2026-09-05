import { AuthShell } from '@/components/layout/AuthShell';
import { VerifyAccountForm } from '@/features/traveler/registration/VerifyAccountForm';

type VerifyAccountPageProps = { email?: string };

export function VerifyAccountPage({ email }: VerifyAccountPageProps) {
  return (
    <AuthShell eyebrow="Account verification" title="One step before your journey begins." description="Confirm the code delivered to your Email Address to activate the pending Traveler account.">
      <VerifyAccountForm email={email} />
    </AuthShell>
  );
}
