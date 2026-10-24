import type { Metadata } from "next";

import { PublicSignInPage } from '@/features/public/auth/PublicSignInPage';

export const metadata: Metadata = { title: "Đăng nhập" };

interface SignInPageProps {
  searchParams: Promise<{ returnUrl?: string | string[] }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { returnUrl } = await searchParams;
  return <PublicSignInPage returnUrl={typeof returnUrl === "string" ? returnUrl : undefined} />;
}
