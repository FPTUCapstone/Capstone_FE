'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ChangePasswordForm } from '@/features/account/security/ChangePasswordForm';
import { ROUTES } from '@/lib/routes';

export function AdminChangePasswordView() {
  const router = useRouter();

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-semibold text-[#59616B]">
        <Link href={ROUTES.admin.dashboard} className="hover:text-[#006B5F] hover:underline">
          Admin Console
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-[#00152A]">Bảo mật &amp; Đổi mật khẩu</span>
      </nav>

      <ChangePasswordForm
        userDisplay={{
          name: 'Administrator',
          email: 'admin@tripmate.vn',
          role: 'Administrator',
        }}
        onCancel={() => router.push(ROUTES.admin.dashboard)}
        onUnauthorized={() => {
          router.replace(ROUTES.admin.login);
        }}
      />
    </main>
  );
}
