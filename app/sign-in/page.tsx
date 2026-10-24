import type { Metadata } from "next";

import { PublicSignInPage } from '@/features/public/auth/PublicSignInPage';

export const metadata: Metadata = { title: "Đăng nhập" };

export default function SignInPage() {
  return <PublicSignInPage />;
}
