'use client';

interface JourneyCanvasProps {
  activeCity: 'danang' | 'hoian' | 'hue';
  onSelectCity: (city: 'danang' | 'hoian' | 'hue') => void;
}

export function JourneyCanvas({ activeCity, onSelectCity }: JourneyCanvasProps) {
  const cities = [
    {
      id: 'hue' as const,
      name: 'Cố Đô Huế',
      tagline: 'Đại Nội • Lăng tẩm • Sông Hương',
      icon: 'account_balance',
      accent: 'text-purple-300',
      activeBorder: 'border-purple-400/60 bg-purple-500/15',
    },
    {
      id: 'danang' as const,
      name: 'Đà Nẵng',
      tagline: 'Biển Mỹ Khê • Sơn Trà • Cầu Rồng',
      icon: 'waves',
      accent: 'text-teal-300',
      activeBorder: 'border-teal-400/60 bg-teal-500/15',
    },
    {
      id: 'hoian' as const,
      name: 'Hội An',
      tagline: 'Phố Cổ Đèn Lồng • Rừng Dừa Bảy Mẫu',
      icon: 'festival',
      accent: 'text-amber-300',
      activeBorder: 'border-amber-400/60 bg-amber-500/15',
    },
  ];

  return (
    <div className="relative min-h-[460px] sm:min-h-[500px] overflow-hidden rounded-[2.5rem] bg-[#00152a] p-6 text-white shadow-2xl border border-white/10 flex flex-col justify-between select-none">
      {/* Ambient background glows */}
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      {/* Background SVG Travel Route Spine */}
      <svg
        className="absolute inset-0 h-full w-full pointer-events-none opacity-30"
        viewBox="0 0 460 480"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M 120 70 C 190 120, 270 170, 230 240 C 190 310, 260 380, 320 420"
          stroke="#71F8E4"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="6 8"
          className="animate-route-draw"
        />
        {/* Subtle topographic contour accents */}
        <circle cx="120" cy="70" r="4" fill="#A855F7" />
        <circle cx="230" cy="240" r="5" fill="#14B8A6" />
        <circle cx="320" cy="420" r="4" fill="#F59E0B" />
      </svg>

      {/* Canvas Top Bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">
            Hành lang du lịch Miền Trung
          </span>
          <h3 className="text-lg font-black tracking-tight text-white mt-0.5">
            Huế • Đà Nẵng • Hội An
          </h3>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-teal-500/15 border border-teal-400/30 px-3 py-1 text-[11px] font-bold text-teal-300">
          <span className="h-2 w-2 rounded-full bg-teal-400 animate-waypoint-beacon" />
          <span>Tối ưu CSP</span>
        </div>
      </div>

      {/* Floating Contextual Card 1: Sunset golden hour (Astronomical constraint) */}
      <div className="relative z-10 my-2 self-end max-w-[260px] rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-md shadow-lg animate-ambient-float">
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
            <span className="material-symbols-outlined text-base">wb_twilight</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
              Khung giờ hoàng hôn
            </p>
            <p className="text-xs font-semibold text-white leading-snug">
              Bắt trọn hoàng hôn Sơn Trà &amp; Sông Hoài lúc 17:45
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Destination Waypoint Cards */}
      <div className="relative z-10 space-y-2.5 my-3">
        {cities.map((city) => {
          const isActive = activeCity === city.id;
          return (
            <button
              key={city.id}
              type="button"
              onClick={() => onSelectCity(city.id)}
              className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer group btn-press ${
                isActive
                  ? `${city.activeBorder} shadow-lg shadow-black/20`
                  : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
                    isActive ? 'bg-white/20' : 'bg-white/10'
                  }`}
                >
                  <span className={`material-symbols-outlined text-lg ${city.accent}`}>
                    {city.icon}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{city.name}</span>
                    {isActive && (
                      <span className="material-symbols-outlined text-xs text-teal-300">check</span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-300 line-clamp-1">{city.tagline}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-slate-300 group-hover:text-white transition-colors">
                Chọn
              </span>
            </button>
          );
        })}
      </div>

      {/* Floating Contextual Card 2: Constraint balance */}
      <div className="relative z-10 my-1 self-start max-w-[280px] rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-md shadow-lg animate-ambient-float [animation-delay:2s]">
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300">
            <span className="material-symbols-outlined text-base">psychology</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
              Cân bằng đa ràng buộc
            </p>
            <p className="text-xs font-semibold text-white leading-snug">
              Tránh nắng gắt buổi trưa • Khớp giờ mở cửa điểm đến
            </p>
          </div>
        </div>
      </div>

      {/* Canvas Footer Status */}
      <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-teal-300">map</span>
          <span>Hệ tọa độ GIS chuẩn hóa</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-teal-300">verified_user</span>
          <span>Bảo chứng Escrow an toàn</span>
        </span>
      </div>
    </div>
  );
}
