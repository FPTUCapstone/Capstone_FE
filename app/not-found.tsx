import Link from 'next/link';

import { BrandLogo } from '@/components/brand/BrandLogo';
import { ROUTES } from '@/lib/routes';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F5EF] px-4">
      <div className="max-w-lg text-center">
        <div className="mb-8 flex justify-center">
          <BrandLogo />
        </div>
        <p className="font-mono text-sm font-bold text-[#174B4A]">404</p>
        <h1 className="mt-2 text-4xl font-extrabold text-[#1C2928]">Không tìm thấy trang</h1>
        <p className="mt-3 text-sm text-[#5B6E69]">Đường dẫn này chưa tồn tại trong TripMate Web.</p>
        <Link
          href={ROUTES.home}
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#174B4A] px-5 py-3 text-sm font-bold text-white"
        >
          Về Landing Page
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </Link>
      </div>
    </main>
  );
}
