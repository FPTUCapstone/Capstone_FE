import type { Metadata } from 'next';

import { PublicPasswordRecoveryPage } from '@/features/public/auth/PublicPasswordRecoveryPage';

export const metadata: Metadata = { title: 'Password Recovery' };

export default function ForgotPasswordPage() {
  return <PublicPasswordRecoveryPage />;
}
