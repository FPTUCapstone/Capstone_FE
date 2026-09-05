import type { Metadata } from 'next';

import { VerifyAccountPage } from '@/features/traveler/registration/VerifyAccountPage';

export const metadata: Metadata = { title: 'Verify Account' };

type PageProps = { searchParams: Promise<{ email?: string }> };

export default async function VerifyAccountRoute({ searchParams }: PageProps) {
  const { email } = await searchParams;
  return <VerifyAccountPage email={email} />;
}
