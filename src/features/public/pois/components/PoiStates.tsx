export function PoiListSkeleton() {
  return (
    <div className="space-y-5" aria-label="Đang tải địa điểm" aria-busy="true">
      {[0, 1, 2].map((item) => (
        <div key={item} className="animate-pulse overflow-hidden rounded-3xl border border-[#dfe6e9] bg-white">
          <div className="aspect-[16/7] bg-[#e4e9eb]" />
          <div className="space-y-3 p-5">
            <div className="h-6 w-2/3 rounded bg-[#e4e9eb]" />
            <div className="h-4 w-5/6 rounded bg-[#edf0f1]" />
            <div className="h-11 rounded-xl bg-[#edf0f1]" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface EmptyStateProps {
  onReset: () => void;
}

export function PoiEmptyState({ onReset }: EmptyStateProps) {
  return (
    <div className="rounded-[28px] border border-dashed border-[#bfcdd2] bg-white px-5 py-14 text-center">
      <span className="text-4xl" aria-hidden="true">⌕</span>
      <h2 className="mt-4 text-2xl font-black text-[#00152a]">Không tìm thấy địa điểm phù hợp</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#5c6970]">Không có điểm tham quan nào khớp với từ khóa hoặc bộ lọc hiện tại.</p>
      <button type="button" onClick={onReset} className="mt-6 min-h-11 rounded-xl bg-[#007d6e] px-5 text-sm font-bold text-white hover:bg-[#006b5f]">
        Đặt lại tìm kiếm và bộ lọc
      </button>
    </div>
  );
}

interface ErrorStateProps {
  onRetry: () => void;
}

export function PoiErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="rounded-[28px] border border-[#f3c7c3] bg-[#fff5f3] px-5 py-14 text-center">
      <span className="text-4xl text-[#b42318]" aria-hidden="true">!</span>
      <h2 className="mt-4 text-2xl font-black text-[#7a1b14]">Không thể tải danh sách địa điểm</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#7a403c]">Máy chủ khám phá đang gián đoạn hoặc thiết bị mất kết nối mạng.</p>
      <button type="button" onClick={onRetry} className="mt-6 min-h-11 rounded-xl bg-[#b42318] px-5 text-sm font-bold text-white hover:bg-[#8f1912]">
        Thử lại kết nối
      </button>
    </div>
  );
}
