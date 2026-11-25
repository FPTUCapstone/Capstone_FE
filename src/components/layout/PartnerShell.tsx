import Link from 'next/link';
import type { ReactNode } from 'react';

import { BrandLogo } from '@/components/brand/BrandLogo';
import { PageHeader } from '@/components/layout/PageHeader';
import { ROUTES } from '@/lib/routes';

type PartnerShellProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export function PartnerShell({ children, description, title }: PartnerShellProps) {
  return (
    <main className="min-h-screen bg-[#F7F5EF] text-[#1C2928]">
      <header className="border-b border-[#DCE2DD] bg-white px-4 py-3 sm:px-8 sm:py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 sm:gap-4">
          <Link href={ROUTES.home} aria-label="Trang chủ TripMate">
            <BrandLogo context="partner" />
          </Link>
          <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold" aria-label="Điều hướng đối tác">
            <Link href={ROUTES.partner.application} className="rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-[#174B4A] hover:bg-[#E8F0EA]">
              Trạng thái hồ sơ
            </Link>
            <Link href={ROUTES.partner.createCoupon} className="rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-[#174B4A] hover:bg-[#E8F0EA]">
              Tạo mã giảm giá
            </Link>
            <Link href={ROUTES.signIn} className="rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-[#1C2928] hover:bg-[#DCE2DD]">
              Đăng nhập
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-8 sm:py-6">
        <PageHeader
          className="mb-6"
          eyebrow="Cổng thông tin đối tác"
          title={title}
          description={description}
        />
        {children}
      </div>
    </main>
  );
}
