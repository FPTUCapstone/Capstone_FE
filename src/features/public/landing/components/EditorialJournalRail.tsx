/* eslint-disable @next/next/no-img-element */
'use client';

import { CENTRAL_DESTINATIONS } from '@/data/landingData';

export interface EditorialJournalRailProps {
  activeCity: 'danang' | 'hoian' | 'hue';
  onSelectCity: (city: 'danang' | 'hoian' | 'hue') => void;
}

export function EditorialJournalRail({ activeCity, onSelectCity }: EditorialJournalRailProps) {
  const hoianData = CENTRAL_DESTINATIONS.find((d) => d.id === 'hoian');
  const hueData = CENTRAL_DESTINATIONS.find((d) => d.id === 'hue');

  function handleSelect(city: 'danang' | 'hoian' | 'hue') {
    onSelectCity(city);
    const destEl = document.getElementById('destinations');
    if (destEl) {
      destEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <aside
      aria-label="Sổ tay điểm đến Miền Trung"
      className="hidden 2xl:block w-48 2xl:w-52 shrink-0 sticky top-20 pt-16 pb-12 z-20 self-start"
    >
      <div className="pr-1 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
          <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-slate-400">
            SỔ TAY DU HÀNH
          </span>
          <span className="text-[8.5px] font-semibold text-teal-800 bg-teal-50/80 px-1.5 py-0.5 rounded-full border border-teal-200/50">
            Tuyển chọn
          </span>
        </div>

        {/* Card 1: Hội An */}
        <button
          type="button"
          onClick={() => handleSelect('hoian')}
          aria-label="Xem sổ tay Hội An Hoài Cổ"
          className={`group block w-full text-left rounded-xl overflow-hidden border transition-all cursor-pointer bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007d6e] focus-visible:ring-2 focus-visible:ring-[#007d6e] focus-visible:ring-offset-2 ${
            activeCity === 'hoian'
              ? 'border-[#007d6e] ring-2 ring-[#007d6e]/20'
              : 'border-slate-200/80 hover:border-teal-300'
          }`}
        >
          <div className="relative h-24 w-full overflow-hidden bg-slate-100">
            <img
              src={hoianData?.image}
              alt="Hội An Phố Cổ"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute top-2 left-2 bg-[#00152a]/80 backdrop-blur-xs text-white text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full">
              Di sản UNESCO
            </div>
          </div>
          <div className="p-2.5">
            <div className="flex items-center justify-between gap-1">
              <h4 className="text-[11px] font-bold text-[#00152a] group-hover:text-[#007d6e] transition-colors">
                Hội An Hoài Cổ
              </h4>
              <span className="text-[9px] font-semibold text-[#007d6e] flex items-center gap-0.5">
                Khám phá →
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-slate-500 line-clamp-2 leading-snug">
              Đèn lồng hoa đăng sông Hoài và thương cảng cổ kính.
            </p>
          </div>
        </button>

        {/* Card 2: Cố Đô Huế */}
        <button
          type="button"
          onClick={() => handleSelect('hue')}
          aria-label="Xem sổ tay Cố Đô Huế"
          className={`group block w-full text-left rounded-xl overflow-hidden border transition-all cursor-pointer bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007d6e] focus-visible:ring-2 focus-visible:ring-[#007d6e] focus-visible:ring-offset-2 ${
            activeCity === 'hue'
              ? 'border-[#007d6e] ring-2 ring-[#007d6e]/20'
              : 'border-slate-200/80 hover:border-teal-300'
          }`}
        >
          <div className="relative h-24 w-full overflow-hidden bg-slate-100">
            <img
              src={hueData?.image}
              alt="Cố Đô Huế"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute top-2 left-2 bg-[#00152a]/80 backdrop-blur-xs text-white text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full">
              Cố đô Ngàn năm
            </div>
          </div>
          <div className="p-2.5">
            <div className="flex items-center justify-between gap-1">
              <h4 className="text-[11px] font-bold text-[#00152a] group-hover:text-[#007d6e] transition-colors">
                Cố Đô Huế
              </h4>
              <span className="text-[9px] font-semibold text-[#007d6e] flex items-center gap-0.5">
                Khám phá →
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-slate-500 line-clamp-2 leading-snug">
              Kinh đô lịch sử tráng lệ bên dòng sông Hương thơ mộng.
            </p>
          </div>
        </button>

        {/* Editorial Quote */}
        <div className="p-2.5 rounded-lg bg-slate-100/70 border border-slate-200/60 text-[9px] text-slate-500 italic leading-relaxed">
          &ldquo;Mỗi điểm đến tại Miền Trung là một thanh âm văn hóa riêng biệt. Nhấp chọn để đồng bộ thông tin lộ trình.&rdquo;
        </div>
      </div>
    </aside>
  );
}
