interface TourPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (nextPage: number) => void;
}

export function TourPagination({ page, totalPages, onPageChange }: TourPaginationProps) {
  if (totalPages <= 1) return null;

  // Window of max 5 pages
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, Math.max(page + 2, 5));
  const pages: number[] = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav
      aria-label="Phân trang danh sách tour"
      className="mt-8 flex items-center justify-center gap-1 sm:gap-2"
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Trang trước"
        className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="material-symbols-outlined text-sm">chevron_left</span>
        <span className="hidden sm:inline sm:ml-1">Trước</span>
      </button>

      {start > 1 && (
        <>
          <button
            type="button"
            onClick={() => onPageChange(1)}
            aria-label="Đến trang 1"
            className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
          >
            1
          </button>
          {start > 2 && <span className="px-1 text-slate-400">…</span>}
        </>
      )}

      {pages.map((p) => {
        const isActive = p === page;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-label={`Trang ${p}`}
            aria-current={isActive ? 'page' : undefined}
            className={`h-9 w-9 rounded-xl text-xs font-bold transition shadow-xs ${
              isActive
                ? 'bg-[#007d6e] text-white shadow-teal-700/20'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {p}
          </button>
        );
      })}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-slate-400">…</span>}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            aria-label={`Đến trang ${totalPages}`}
            className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Trang tiếp theo"
        className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="hidden sm:inline sm:mr-1">Sau</span>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
      </button>
    </nav>
  );
}
