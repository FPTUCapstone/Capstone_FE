import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

interface AdminHeaderProps {
  onSave?: () => void;
  onCancel?: () => void;
  submitting?: boolean;
  saveDisabled?: boolean;
}

export function AdminHeader({ onSave, onCancel, submitting, saveDisabled }: AdminHeaderProps) {
  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white/90 backdrop-blur-xl shadow-xs z-40 flex items-center justify-between px-4 sm:px-6 md:px-8 border-b border-slate-200">
      {/* Left: Breadcrumbs & Badge */}
      <div className="flex items-center gap-3">
        <nav aria-label="Top Breadcrumb" className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href={ROUTES.admin.dashboard} className="hover:text-slate-900 transition-colors">
            Catalogue
          </Link>
          <span>/</span>
          <span className="hover:text-slate-900 transition-colors">Points of Interest</span>
          <span>/</span>
          <span className="text-slate-900 font-semibold">New POI</span>
        </nav>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
          Draft
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saveDisabled || submitting}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#006b5f] text-white hover:bg-[#006b5f]/90 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">save</span>
          <span>{submitting ? 'Saving...' : 'Save POI'}</span>
        </button>
        <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>
        <div className="w-8 h-8 rounded-full bg-[#00152a] flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-[18px]">person</span>
        </div>
      </div>
    </header>
  );
}
