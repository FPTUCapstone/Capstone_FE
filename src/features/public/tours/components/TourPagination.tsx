interface TourPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (nextPage: number) => void;
  copy?: TourPaginationCopy;
}

interface TourPaginationCopy {
  navigation: string;
  previous: string;
  previousShort: string;
  next: string;
  nextShort: string;
  goToPage: (page: number) => string;
  page: (page: number) => string;
}

const legacyCopy: TourPaginationCopy = {
  navigation: 'Phân trang danh sách tour', previous: 'Trang trước', previousShort: 'Trước',
  next: 'Trang tiếp theo', nextShort: 'Sau', goToPage: (page) => `Đến trang ${page}`, page: (page) => `Trang ${page}`,
};

export function TourPagination({ page, totalPages, onPageChange, copy = legacyCopy }: TourPaginationProps) {
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
      aria-label={copy.navigation}
      className="mt-8 flex items-center justify-center gap-1 sm:gap-2"
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label={copy.previous}
        className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="material-symbols-outlined text-sm">chevron_left</span>
        <span className="hidden sm:inline sm:ml-1">{copy.previousShort}</span>
      </button>

      {start > 1 && (
        <>
          <button
            type="button"
            onClick={() => onPageChange(1)}
            aria-label={copy.goToPage(1)}
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
            aria-label={copy.page(p)}
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
            aria-label={copy.goToPage(totalPages)}
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
        aria-label={copy.next}
        className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="hidden sm:inline sm:mr-1">{copy.nextShort}</span>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
      </button>
    </nav>
  );
}
