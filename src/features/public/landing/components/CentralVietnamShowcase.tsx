'use client';

import { CENTRAL_DESTINATIONS } from '@/data/landingData';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export function CentralVietnamShowcase() {
  function handleSelectCity(cityId: string) {
    window.dispatchEvent(new CustomEvent('tripmate:select-city', { detail: cityId }));
    const section = document.getElementById('csp-simulator');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <section id="destinations" className="scroll-mt-20 py-16 sm:py-24 bg-white px-4 sm:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#9edbd2] bg-teal-50 px-3.5 py-1.5 text-xs font-black uppercase tracking-widest text-[#007d6e] mb-3">
                <span className="material-symbols-outlined text-base">location_on</span>
                <span>Điểm Đến Hàng Đầu Miền Trung</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#00152a] tracking-tight">
                Khám phá Ba Điểm Đến Biểu Tượng <span className="text-[#007d6e]">Miền Trung</span>
              </h2>
              <p className="mt-3 text-slate-500 text-sm sm:text-base max-w-2xl leading-relaxed">
                Hệ sinh thái điểm đến phong phú tại Đà Nẵng, Hội An và Cố Đô Huế với hơn 120 địa danh được xác thực thông tin, 
                tọa độ chuẩn xác, giờ hoạt động thực tế và khung giờ ngắm hoàng hôn lý tưởng.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500">Hơn 126 POIs đã kiểm duyệt</span>
            </div>
          </div>
        </ScrollReveal>

        {/* Destination Cards Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {CENTRAL_DESTINATIONS.map((dest, index) => (
            <ScrollReveal
              key={dest.id}
              animation="fade-up"
              delay={index * 150}
              duration={750}
            >
              <div
                className="group relative h-full rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-xl hover:border-teal-300 card-hover-lift transition-all duration-300 flex flex-col cursor-pointer"
                onClick={() => handleSelectCity(dest.id)}
              >
              {/* Card Image & Header */}
              <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Badge on Top */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/90 text-slate-900 backdrop-blur-md shadow-xs">
                    {dest.badge}
                  </span>
                </div>

                {/* Weather pill on top right */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-black/50 text-white backdrop-blur-md">
                  <span className="material-symbols-outlined text-sm text-amber-300">wb_sunny</span>
                  <span>{dest.temp}</span>
                </div>

                {/* City Name on Bottom of Image */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-2xl font-black text-white">{dest.name}</h3>
                  <p className="text-xs text-slate-200 font-medium mt-0.5">{dest.tagline}</p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                <div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {dest.description}
                  </p>

                  {/* Top POIs List */}
                  <div className="mt-5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                      Điểm đến tiêu biểu:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {dest.topPois.map((poi) => (
                        <span
                          key={poi}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium hover:bg-teal-50 hover:text-[#007d6e] transition-colors"
                        >
                          {poi}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer Stats & Link */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-[#007d6e]">pin_drop</span>
                      {dest.poisCount} POIs
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-[#007d6e]">confirmation_number</span>
                      {dest.toursCount} Tours
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectCity(dest.id);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#007d6e] group-hover:translate-x-1 transition-transform cursor-pointer"
                  >
                    <span>Lập lịch CSP</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
