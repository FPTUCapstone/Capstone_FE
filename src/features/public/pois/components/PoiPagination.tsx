import { buildPageItems } from '../utils/poiPresentation';

interface PoiPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PoiPagination({ page, totalPages, onPageChange }: PoiPaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Phân trang địa điểm">
      <button
        type="button"
        className="min-h-11 rounded-xl border border-[#ced9dd] bg-white px-4 text-sm font-bold text-[#29404a] disabled:cursor-not-allowed disabled:opacity-45"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Trước
      </button>
      {buildPageItems(page, totalPages).map((item, index) =>
        item === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="px-1 text-[#6b777e]" aria-hidden="true">…</span>
        ) : (
          <button
            key={item}
            type="button"
            aria-current={item === page ? 'page' : undefined}
            className={`min-h-11 min-w-11 rounded-xl text-sm font-extrabold ${
              item === page ? 'bg-[#007d6e] text-white' : 'border border-[#ced9dd] bg-white text-[#29404a]'
            }`}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        className="min-h-11 rounded-xl border border-[#ced9dd] bg-white px-4 text-sm font-bold text-[#29404a] disabled:cursor-not-allowed disabled:opacity-45"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Sau
      </button>
    </nav>
  );
}
