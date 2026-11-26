'use client';

export function WeatherPageSkeleton() {
  return (
    <div className="space-y-5 animate-pulse" aria-label="Đang tải dữ liệu dự báo thời tiết" role="status">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="h-80 rounded-3xl bg-[#103B39]/20 lg:col-span-7" />
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:col-span-5">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-36 rounded-2xl border border-[#DCE2DD] bg-white/80" />
          ))}
        </div>
      </div>

      <div className="h-72 rounded-3xl border border-[#DCE2DD] bg-white/80" />
      <div className="h-64 rounded-3xl border border-[#DCE2DD] bg-white/80" />
    </div>
  );
}

interface WeatherErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function WeatherErrorState({ message, onRetry }: WeatherErrorStateProps) {
  return (
    <div
      role="alert"
      className="mx-auto max-w-xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-xs"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
        <span className="material-symbols-outlined text-2xl" aria-hidden="true">
          cloud_off
        </span>
      </div>
      <h2 className="mt-4 text-lg font-black text-[#1C2928]">
        Không thể tải dự báo thời tiết
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-[#5B6E69]">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#174B4A] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#103B39]"
      >
        <span className="material-symbols-outlined text-sm" aria-hidden="true">
          refresh
        </span>
        <span>Thử tải lại</span>
      </button>
    </div>
  );
}
