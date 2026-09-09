import type { Metadata } from 'next';
import { AuthShell } from '@/components/layout/AuthShell';
import { VerifyEmailHandler } from '@/features/traveler/registration/VerifyEmailHandler';

export const metadata: Metadata = { title: 'Verify Email - TripMate' };

type PageProps = {
  searchParams: Promise<{
    mode?: string;
    oobCode?: string;
    apiKey?: string;
  }>;
};

export default async function VerifyEmailRoute({ searchParams }: PageProps) {
  const { mode, oobCode } = await searchParams;

  return (
    <AuthShell
      eyebrow="Email Verification"
      title="Completing your account verification"
      description="Verifying your registered email address with TripMate."
    >
      <VerifyEmailHandler mode={mode} oobCode={oobCode} />
    </AuthShell>
  );
}
