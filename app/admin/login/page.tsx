import type { Metadata } from 'next';
import Link from 'next/link';

import { BrandLogo } from '@/components/brand/BrandLogo';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Admin Login',
};

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-[#00152a] px-4 py-12 text-[#eff1f4]">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <Link href={ROUTES.home} className="mb-10 text-white" aria-label="Về trang chủ TripMate">
          <BrandLogo inverse />
        </Link>

        <section className="w-full rounded-3xl border border-[#314863] bg-[#102a43] p-7 shadow-2xl">
          <div className="mb-6">
            <span className="mb-3 inline-flex rounded-full bg-[#6df5e1]/15 px-3 py-1 text-xs font-bold text-[#71f8e4]">
              Administrator Web
            </span>
            <h1 className="text-3xl font-extrabold text-white">Đăng nhập quản trị</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#b0c9e8]">
              Giao diện đăng nhập đang là placeholder. Authentication sẽ được kết nối ở giai đoạn tiếp theo.
            </p>
          </div>

          <form className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#b0c9e8]">
              Email quản trị
              <input
                type="email"
                name="email"
                placeholder="admin@tripmate.vn"
                disabled
                className="mt-1.5 w-full rounded-xl border border-[#314863] bg-[#00152a] px-4 py-3 text-sm text-white opacity-80 outline-none"
              />
            </label>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#b0c9e8]">
              Mật khẩu
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                disabled
                className="mt-1.5 w-full rounded-xl border border-[#314863] bg-[#00152a] px-4 py-3 text-sm text-white opacity-80 outline-none"
              />
            </label>
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-xl bg-[#006b5f] py-3 text-sm font-bold text-white opacity-70"
            >
              Đăng nhập — sắp kết nối
            </button>
          </form>

          <Link
            href={ROUTES.admin.dashboard}
            className="mt-5 flex items-center justify-center gap-1 text-xs font-semibold text-[#71f8e4] hover:underline"
          >
            Xem Admin UI prototype
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
