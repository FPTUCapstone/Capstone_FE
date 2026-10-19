'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { PublicNavigation } from '@/components/navigation/PublicNavigation';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { ROUTES } from '@/lib/routes';
import { MockCheckoutView } from './MockCheckoutView';

export function MockCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, context } = useWebSession();

  useEffect(() => {
    if (status === 'restoring') return;

    if (status === 'unauthenticated') {
      const returnUrl = `/checkout/mock${
        searchParams.toString() ? `?${searchParams.toString()}` : ''
      }`;
      router.replace(`${ROUTES.signIn}?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [status, searchParams, router]);

  if (status === 'restoring') {
    return (
      <div className="flex min-h-screen flex-col bg-[#f8fafc]">
        <PublicNavigation />
        <main className="flex flex-1 items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <div
              className="h-9 w-9 animate-spin rounded-full border-3 border-[#007d6e] border-t-transparent"
              aria-hidden="true"
            />
            <p className="text-xs font-semibold text-slate-500">
              Đang xác thực thông tin tài khoản…
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (status === 'authenticated' && context && context.role !== 'Traveler') {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <PublicNavigation />
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 mb-4">
              <span className="material-symbols-outlined text-3xl">block</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              Tài khoản không thuộc phạm vi Giao dịch Du khách
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Cổng thanh toán chỉ áp dụng cho tài khoản Du khách (Traveler).
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={ROUTES.home}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Về Trang chủ
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <PublicNavigation />
      <main className="pb-16 pt-4">
        <MockCheckoutView />
      </main>
    </div>
  );
}
