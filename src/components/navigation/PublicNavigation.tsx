import Link from 'next/link';

import { BrandLogo } from '@/components/brand/BrandLogo';
import { ROUTES } from '@/lib/routes';

export function PublicNavigation() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#c3c6ce] bg-[#f7f9fc]/95 px-4 py-3 shadow-xs backdrop-blur-md md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href={ROUTES.home} aria-label="TripMate Landing Page">
          <BrandLogo />
        </Link>
        <nav className="flex items-center gap-2" aria-label="Public navigation">
          <Link
            href="#features"
            className="hidden rounded-lg px-3 py-2 text-xs font-semibold text-[#43474d] hover:bg-[#eceef1] sm:inline-flex"
          >
            Công nghệ
          </Link>
          <Link
            href={ROUTES.admin.login}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#00152a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#102a43]"
          >
            <span className="material-symbols-outlined text-base">admin_panel_settings</span>
            Admin Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
