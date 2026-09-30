'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { PublicNavigation } from '@/components/navigation/PublicNavigation';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { ROUTES } from '@/lib/routes';

import { ChangePasswordForm } from './ChangePasswordForm';

export function ChangePasswordPage() {
  const router = useRouter();
  const { status, context } = useWebSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.account.security)}`);
    }
  }, [status, router]);

  if (status === 'restoring') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F6F7]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-3 border-[#006B5F] border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold text-[#59616B]">Đang tải thông tin tài khoản…</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !context) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F3F6F7] text-[#00152A]" lang="vi">
      <PublicNavigation />

      <main className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-semibold text-[#59616B]">
          <Link href={ROUTES.home} className="hover:text-[#006B5F] hover:underline">
            Trang chủ
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-[#00152A]">Bảo mật &amp; Mật khẩu</span>
        </nav>

        {/* Change Password Card */}
        <ChangePasswordForm
          userDisplay={{
            name: context.fullName,
            email: context.email,
            role: context.role,
          }}
          onCancel={() => router.push(ROUTES.home)}
          onUnauthorized={() => {
            router.replace(`${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.account.security)}`);
          }}
        />
      </main>
    </div>
  );
}
