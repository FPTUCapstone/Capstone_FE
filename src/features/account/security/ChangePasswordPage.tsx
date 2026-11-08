'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { PublicNavigation } from '@/components/navigation/PublicNavigation';
import { AccountWorkspaceNav } from '@/features/account/common/AccountWorkspaceNav';
import { useAccountWorkspace } from '@/features/account/common/AccountWorkspaceContext';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { ROUTES } from '@/lib/routes';

import { ChangePasswordForm } from './ChangePasswordForm';
import { createWebChangePasswordCapability } from './webChangePasswordCapability';

export function ChangePasswordPage() {
  const router = useRouter();
  const { isInsideShell } = useAccountWorkspace();
  const { status, context } = useWebSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.account.security)}`);
    } else if (status === 'authenticated' && context?.role === 'Administrator') {
      router.replace(ROUTES.admin.accountSecurity);
    }
  }, [status, context, router]);

  if (status === 'restoring') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F5EF]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-3 border-[#174B4A] border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold text-[#5B6E69]">Đang tải thông tin tài khoản…</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !context || context.role === 'Administrator') {
    return null;
  }

  const content = (
    <>
      {!isInsideShell && (
        <>
          <PublicNavigation />
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-semibold text-[#5B6E69]">
            <Link href={ROUTES.home} className="hover:text-[#174B4A] hover:underline">
              Trang chủ
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#1C2928]">Bảo mật &amp; Mật khẩu</span>
          </nav>
        </>
      )}

      {/* Account Workspace Navigation Tabs (suppressed automatically inside shell) */}
      <AccountWorkspaceNav activeTab="security" />

      {/* Change Password Card */}
      <ChangePasswordForm
        capability={createWebChangePasswordCapability()}
        userDisplay={{
          name: context.fullName,
          email: context.email,
          role: context.role,
        }}
        onCancel={() => router.push(ROUTES.home)}
        onSessionExpired={() =>
          router.replace(`${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.account.security)}`)
        }
      />
    </>
  );

  if (isInsideShell) {
    return <div className="w-full">{content}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#1C2928]" lang="vi">
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {content}
      </main>
    </div>
  );
}
