import BrandLogo from './BrandLogo';

const featureCards = [
  {
    icon: 'route',
    title: 'Lịch trình thông minh',
    desc: 'CSP Engine tối ưu giờ đi',
    iconBg: 'bg-brand-teal/30',
    position: 'top-0 left-0 animate-float-1',
  },
  {
    icon: 'thunderstorm',
    title: 'Cảnh báo thời tiết',
    desc: 'Tự động điều chỉnh kế hoạch',
    iconBg: 'bg-brand-coral/30',
    position: 'top-16 right-0 animate-float-2',
  },
  {
    icon: 'groups',
    title: 'Đồng hành nhóm',
    desc: 'Chia sẻ vị trí GPS thời gian thực',
    iconBg: 'bg-brand-brightTeal/40',
    position: 'bottom-0 left-12 animate-float-3',
  },
];

const stats = [
  { value: '120+', label: 'Điểm đến nổi bật', color: 'text-brand-brightTeal' },
  { value: '15K+', label: 'Traveler đang dùng', color: 'text-brand-brightTeal' },
  { value: '4.9★', label: 'Đánh giá trung bình', color: 'text-brand-coral' },
];

export default function HeroPanel() {
  return (
    <aside className="relative hidden lg:flex lg:sticky lg:top-0 lg:h-screen hero-bg text-white overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-60" />
      <div className="absolute -top-32 -right-24 w-[420px] h-[420px] bg-brand-teal/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-16 w-[360px] h-[360px] bg-brand-coral/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
        {/* Brand Header */}
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/15">
            <BrandLogo size={24} />
          </div>
          <span className="text-2xl font-extrabold tracking-tight">TripMate</span>
        </div>

        {/* Main Hero Content */}
        <div className="space-y-10 max-w-xl">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold tracking-wide backdrop-blur-sm">
              <span className="material-symbols-outlined text-[16px] text-brand-brightTeal">
                auto_awesome
              </span>
              HÀNH TRÌNH THÔNG MINH CHO NGƯỜI VIỆT
            </span>
            <h1 className="text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight">
              Lên kế hoạch <span className="text-brand-brightTeal">du lịch</span> chỉ trong vài phút.
            </h1>
            <p className="text-lg text-white/75 leading-relaxed max-w-md">
              Công cụ dành riêng cho traveler Việt — tối ưu lịch trình, khám phá điểm đến và đồng hành cùng bạn trên mọi chuyến đi.
            </p>
          </div>

          {/* Floating feature cards */}
          <div className="relative h-56">
            {featureCards.map((card) => (
              <div
                key={card.title}
                className={`absolute w-72 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 shadow-2xl ${card.position}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                    <span className="material-symbols-outlined text-white text-[22px]">{card.icon}</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold">{card.title}</div>
                    <div className="text-xs text-white/60">{card.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer stats */}
        <div className="grid grid-cols-3 gap-6 max-w-lg">
          {stats.map((s) => (
            <div key={s.label}>
              <div className={`text-3xl font-extrabold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-white/65 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
