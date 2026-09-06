import { PasswordRecoveryFlow } from '@/components/auth/PasswordRecoveryFlow';
import { AuthShell } from '@/components/layout/AuthShell';

export function AdminPasswordRecoveryPage() {
  return (
    <AuthShell
      admin
      eyebrow="Admin Portal security"
      title="Admin Password Recovery"
      description="Recover administrator access through the approved reset-code flow."
    >
      <PasswordRecoveryFlow admin />
    </AuthShell>
  );
}
