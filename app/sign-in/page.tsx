import type { Metadata } from 'next';

import { PublicSignInPage } from '@/features/public/auth/PublicSignInPage';

export const metadata: Metadata = { title: 'Sign In' };

export default function SignInPage() {
  return <PublicSignInPage />;
}
