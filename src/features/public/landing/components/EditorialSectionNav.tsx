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
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#DCE2DD]">
          <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-[#5B6E69]">
            MỤC LỤC
          </span>
        </div>

        <nav className="relative space-y-4" aria-label="Mục lục hành trình">
          {/* Subtle vertical hairline track */}
          <div className="absolute left-[6px] top-2 bottom-2 w-[1px] bg-[#DCE2DD]" aria-hidden="true" />

          {NAV_SECTIONS.map((sec) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => onNavigate(sec.id)}
                className="group relative flex items-start gap-2.5 w-full text-left transition-all cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#103B39] focus-visible:ring-2 focus-visible:ring-[#103B39] focus-visible:ring-offset-2"
                aria-current={isActive ? 'true' : undefined}
              >
                {/* Dot indicator */}
                <div
                  className={`relative z-10 mt-1 w-3 h-3 rounded-full border-2 transition-all flex items-center justify-center ${
                    isActive
                      ? 'bg-[#174B4A] border-white ring-2 ring-[#174B4A]/25 scale-110 shadow-xs'
                      : 'bg-[#F7F5EF] border-[#DCE2DD] group-hover:border-[#5B6E69]'
                  }`}
                  aria-hidden="true"
                >
                  {isActive && <div className="w-1 h-1 rounded-full bg-white" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`text-[10px] font-mono font-bold tracking-tight transition-colors ${
                        isActive ? 'text-[#174B4A]' : 'text-[#5B6E69] group-hover:text-[#1C2928]'
                      }`}
                    >
                      {sec.number}
                    </span>
                    <span
                      className={`text-[11px] font-semibold tracking-tight transition-colors truncate ${
                        isActive ? 'text-[#1C2928] font-bold' : 'text-[#5B6E69] group-hover:text-[#1C2928]'
                      }`}
                    >
                      {sec.label}
                    </span>
                  </div>
                  <p
                    className={`text-[9px] truncate mt-0.5 transition-colors ${
                      isActive ? 'text-[#174B4A]/80 font-medium' : 'text-[#5B6E69]'
                    }`}
                  >
                    {sec.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="mt-6 pt-3 border-t border-[#DCE2DD] text-[9px] text-[#5B6E69]">
          <p className="font-semibold text-[#1C2928] uppercase tracking-wider text-[8.5px] mb-0.5">TripMate Central</p>
          <p className="leading-tight">Khám phá di sản Miền Trung</p>
        </div>
      </div>
    </aside>
  );
}
