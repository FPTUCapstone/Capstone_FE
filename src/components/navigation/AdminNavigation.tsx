import Link from 'next/link';

import { BrandLogo } from '@/components/brand/BrandLogo';
import { ROUTES } from '@/lib/routes';

export function AdminNavigation() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#314863] bg-[#00152a]/95 px-4 py-3 text-white shadow-md backdrop-blur-md md:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <Link href={ROUTES.admin.dashboard} aria-label="TripMate Admin Dashboard">
          <BrandLogo inverse />
        </Link>

        <nav className="flex items-center gap-1 rounded-xl border border-[#314863] bg-[#102a43] p-1" aria-label="Admin navigation">
          <Link
            href={ROUTES.admin.dashboard}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-[#d1e4ff] hover:bg-[#314863] hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            href={ROUTES.admin.tourReviews}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-[#d1e4ff] hover:bg-[#314863] hover:text-white"
          >
            Tour Reviews
          </Link>
        </nav>

        <Link
          href={ROUTES.admin.login}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#71f8e4] px-3 py-2 text-xs font-bold text-[#71f8e4] hover:bg-[#71f8e4] hover:text-[#00152a]"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          Login placeholder
        </Link>
      </div>
    </header>
  );
}
