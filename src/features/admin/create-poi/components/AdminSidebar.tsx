import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

export function AdminSidebar({ onSignOut, disabled }: { onSignOut: () => void; disabled: boolean }) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#102a43] text-white z-50 flex flex-col justify-between shadow-md">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 bg-[#00152a]/40 border-b border-white/5">
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white leading-none">TripMate</span>
            <span className="text-[10px] uppercase tracking-widest text-slate-300 mt-1">Admin Console</span>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-4 space-y-1 text-xs">
          <div className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Core</div>
          <Link
            href={ROUTES.admin.dashboard}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-all font-medium"
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span>Dashboard</span>
          </Link>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer transition-all font-medium">
            <span className="material-symbols-outlined text-[20px]">people</span>
            <span>Users</span>
          </div>

          <div className="px-3 pb-1 pt-4 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Inventory</div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 px-3 py-2 text-white font-semibold">
              <span className="material-symbols-outlined text-[20px]">library_books</span>
              <span>Catalogue</span>
            </div>
            <div className="pl-8 pr-2 space-y-1">
              <Link
                href={ROUTES.admin.createPoi}
                className="flex items-center justify-between px-3 py-2 transition-all bg-[#006b5f] text-white font-semibold rounded-lg shadow-xs"
              >
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6df5e1]"></span>
                  Points of Interest
                </span>
              </Link>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer transition-all">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  Tours
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer transition-all">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  Categories
                </span>
              </div>
            </div>
          </div>

          <div className="px-3 pb-1 pt-4 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Operations</div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 px-3 py-2 text-slate-300">
              <span className="material-symbols-outlined text-[20px]">alt_route</span>
              <span>Operations</span>
            </div>
            <div className="pl-8 pr-2 space-y-1">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                <span>Tracking</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                <span>Approvals</span>
              </div>
            </div>
          </div>

          <div className="px-3 pb-1 pt-4 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Configuration</div>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer transition-all font-medium">
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span>System</span>
          </div>
        </nav>
      </div>

      {/* Profile Footer */}
      <div className="p-4 bg-[#00152a]/30 flex items-center justify-between gap-2 border-t border-white/5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#00152a] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-[18px]">person</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-white truncate">Administrator</span>
            <span className="text-[10px] text-slate-300 truncate">Admin workspace</span>
          </div>
        </div>
        <button type="button" onClick={onSignOut} disabled={disabled} aria-label="Sign out of administration" className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50">
          <span className="material-symbols-outlined text-[20px]">logout</span>
        </button>
      </div>
    </aside>
  );
}
