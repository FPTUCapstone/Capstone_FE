import { PasswordRecoveryFlow } from '@/components/auth/PasswordRecoveryFlow';
import { AuthShell } from '@/components/layout/AuthShell';

export function PublicPasswordRecoveryPage() {
  return (
    <AuthShell
      eyebrow="Public password recovery"
      title="Recover your TripMate account."
      description="Request a reset code and create a new password within one focused, progressive Web flow."
    >
      <PasswordRecoveryFlow />
    </AuthShell>
  );
}
