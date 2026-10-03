interface TourErrorStateProps {
  onRetry: () => void;
  message?: string;
}

export function TourErrorState({ onRetry, message }: TourErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center sm:p-12"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
        <span className="material-symbols-outlined text-3xl">error</span>
      </div>
      <h3 className="mb-2 text-lg font-bold text-slate-900">Không thể tải dữ liệu</h3>
      <p className="mb-6 max-w-md text-sm text-slate-600">
        {message ||
          'Không thể tải danh sách tour do lỗi hệ thống hoặc kết nối. Vui lòng thử lại sau giây lát (MSG127).'}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#007d6e] px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#006b5f]"
      >
        <span className="material-symbols-outlined text-base">refresh</span>
        <span>Thử lại</span>
      </button>
    </div>
  );
}

interface TourEmptyStateProps {
  onResetFilters?: () => void;
  hasFilters?: boolean;
}

export function TourEmptyState({ onResetFilters, hasFilters }: TourEmptyStateProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center sm:p-12"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-700">
        <span className="material-symbols-outlined text-3xl">travel_explore</span>
      </div>
      <h3 className="mb-2 text-lg font-bold text-slate-900">Không tìm thấy tour phù hợp</h3>
      <p className="mb-6 max-w-md text-sm text-slate-600">
        {hasFilters
          ? 'Không có tour nào khớp với bộ lọc và tiêu chí tìm kiếm của bạn (MSG64). Hãy thử nới lỏng khoảng giá hoặc chọn điểm đến khác.'
          : 'Không tìm thấy gói tour nào phù hợp (MSG64). Vui lòng quay lại sau hoặc thử lại với tiêu chí khác.'}
      </p>
      {hasFilters && onResetFilters ? (
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-xs transition hover:bg-slate-100 hover:text-[#007d6e]"
        >
          <span className="material-symbols-outlined text-base">restart_alt</span>
          <span>Xóa bộ lọc tìm kiếm</span>
        </button>
      ) : null}
    </div>
  );
}

export function TourListSkeleton() {
  return (
    <div
      role="status"
      aria-label="Đang tải danh sách tour..."
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs"
        >
          <div className="aspect-16/10 w-full bg-slate-200" />
          <div className="p-4 sm:p-5">
            <div className="mb-3 flex justify-between">
              <div className="h-4 w-24 rounded bg-slate-200" />
              <div className="h-4 w-16 rounded bg-slate-200" />
            </div>
            <div className="mb-2 h-5 w-full rounded bg-slate-200" />
            <div className="mb-4 h-5 w-3/4 rounded bg-slate-200" />
            <div className="mb-4 h-4 w-32 rounded bg-slate-200" />
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="h-6 w-24 rounded bg-slate-200" />
              <div className="h-8 w-20 rounded-xl bg-slate-200" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Đang tải danh sách tour...</span>
    </div>
  );
}
