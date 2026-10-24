import { VerifyAccountForm } from './VerifyAccountForm';
import { VerificationPageShell } from './VerificationPageShell';

type VerifyAccountPageProps = { deliveryFailed?: boolean; email?: string; flow?: string };

export function VerifyAccountPage({ deliveryFailed, email, flow }: VerifyAccountPageProps) {
  return (
    <VerificationPageShell>
      <VerifyAccountForm email={email} deliveryFailed={deliveryFailed} flow={flow} />
    </VerificationPageShell>
  );
}
