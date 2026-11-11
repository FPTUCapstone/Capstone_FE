import type { Metadata } from 'next';
import { VerifyEmailHandler } from '@/features/auth/verification/VerifyEmailHandler';
import { VerificationPageShell } from '@/features/auth/verification/VerificationPageShell';
import { resolveVerificationFlow } from '@/features/auth/verification/verificationFlow';
import { OperatorMobileVerifyEmailHandler } from '@/features/operator/application/OperatorMobileVerifyEmailHandler';

export const metadata: Metadata = { title: 'Xác minh email' };

type PageProps = {
  searchParams: Promise<{
    mode?: string;
    oobCode?: string;
    apiKey?: string;
    flow?: string;
    continueUrl?: string;
  }>;
};

export default async function VerifyEmailRoute({ searchParams }: PageProps) {
  const { mode, oobCode, flow, continueUrl } = await searchParams;
  const verificationFlow = resolveVerificationFlow({ flow, continueUrl });

  return (
    <VerificationPageShell>
      {verificationFlow === 'operator-mobile' ? (
        <OperatorMobileVerifyEmailHandler mode={mode} oobCode={oobCode} />
      ) : (
        <VerifyEmailHandler mode={mode} oobCode={oobCode} flow={verificationFlow} />
      )}
    </VerificationPageShell>
  );
}
