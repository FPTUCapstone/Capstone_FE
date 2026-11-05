'use client';

export interface NavSection {
  id: string;
  number: string;
  label: string;
  subtitle: string;
}

export const NAV_SECTIONS: NavSection[] = [
  { id: 'destinations', number: '01', label: 'Điểm Đến Biểu Tượng', subtitle: 'Đà Nẵng • Hội An • Huế' },
  { id: 'how-it-works', number: '02', label: 'Cách Thức Hoạt Động', subtitle: 'Lộ trình tối ưu CSP' },
  { id: 'tours', number: '03', label: 'Tour Bản Địa Chọn Lọc', subtitle: 'Bảo chứng an toàn' },
  { id: 'final-cta', number: '04', label: 'Khởi Hành Ngay', subtitle: 'Lên lịch trình thông minh' },
];

export interface EditorialSectionNavProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export function EditorialSectionNav({ activeSection, onNavigate }: EditorialSectionNavProps) {
  return (
    <aside
      aria-label="Mục lục bài viết"
      className="hidden min-[1360px]:block w-36 xl:w-40 2xl:w-44 shrink-0 sticky top-20 pt-16 pb-12 z-20 self-start"
    >
      <div className="pl-1">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-200/60">
          <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-slate-400">
            MỤC LỤC
          </span>
        </div>

        <nav className="relative space-y-4" aria-label="Mục lục hành trình">
          {/* Subtle vertical hairline track */}
          <div className="absolute left-[6px] top-2 bottom-2 w-[1px] bg-slate-200" aria-hidden="true" />

          {NAV_SECTIONS.map((sec) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => onNavigate(sec.id)}
                className="group relative flex items-start gap-2.5 w-full text-left transition-all cursor-pointer focus:outline-hidden"
                aria-current={isActive ? 'true' : undefined}
              >
                {/* Dot indicator */}
                <div
                  className={`relative z-10 mt-1 w-3 h-3 rounded-full border-2 transition-all flex items-center justify-center ${
                    isActive
                      ? 'bg-[#007d6e] border-white ring-2 ring-[#007d6e]/25 scale-110 shadow-xs'
                      : 'bg-[#f4f7fc] border-slate-300 group-hover:border-slate-400'
                  }`}
                  aria-hidden="true"
                >
                  {isActive && <div className="w-1 h-1 rounded-full bg-white" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`text-[10px] font-mono font-bold tracking-tight transition-colors ${
                        isActive ? 'text-[#007d6e]' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    >
                      {sec.number}
                    </span>
                    <span
                      className={`text-[11px] font-semibold tracking-tight transition-colors truncate ${
                        isActive ? 'text-[#00152a] font-bold' : 'text-slate-600 group-hover:text-slate-900'
                      }`}
                    >
                      {sec.label}
                    </span>
                  </div>
                  <p
                    className={`text-[9px] truncate mt-0.5 transition-colors ${
                      isActive ? 'text-[#007d6e]/80 font-medium' : 'text-slate-400'
                    }`}
                  >
                    {sec.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="mt-6 pt-3 border-t border-slate-200/60 text-[9px] text-slate-400">
          <p className="font-semibold text-slate-500 uppercase tracking-wider text-[8.5px] mb-0.5">TripMate Central</p>
          <p className="leading-tight">Khám phá di sản Miền Trung</p>
        </div>
      </div>
    </aside>
  );
}
