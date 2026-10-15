'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ChangePasswordForm } from '@/features/account/security/ChangePasswordForm';
import { ROUTES } from '@/lib/routes';

import { createAdminChangePasswordCapability } from './adminChangePasswordCapability';

export function AdminChangePasswordView() {
  const router = useRouter();
  const capability = createAdminChangePasswordCapability();

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-semibold text-[#59616B]">
        <Link href={ROUTES.admin.dashboard} className="hover:text-[#006B5F] hover:underline">
          Administration Workspace
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-[#00152A]">Bảo mật &amp; Đổi mật khẩu</span>
      </nav>

      <ChangePasswordForm
        capability={capability}
        onCancel={() => router.push(ROUTES.admin.dashboard)}
        onSessionExpired={() => router.replace(ROUTES.admin.login)}
      />
    </main>
  );
}
