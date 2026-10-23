'use client';

import { ScrollReveal } from '@/components/ui/ScrollReveal';

const ANCHOR_LINKS = [
  { id: 'planning', label: 'Công nghệ Lập lịch CSP', icon: 'route' },
  { id: 'weather', label: 'Ứng phó Thời tiết', icon: 'thunderstorm' },
  { id: 'mobile', label: 'Ứng dụng Di động', icon: 'smartphone' },
  { id: 'partner', label: 'Hệ sinh thái Đối tác', icon: 'handshake' },
  { id: 'faq', label: 'Hỏi đáp Thường gặp', icon: 'help_outline' },
];

export function AboutHero() {
  function handleJump(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <section className="relative overflow-hidden bg-[#00152a] text-white pt-16 pb-20 sm:pt-20 sm:pb-24 border-b border-slate-800">
      {/* Background Subtle Gradient & Ambience */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 right-1/4 w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute bottom-0 -left-20 w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8">
        {/* Editorial Eyebrow */}
        <ScrollReveal animation="fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/15 px-3.5 py-1 text-xs font-bold text-teal-300 backdrop-blur-md mb-5">
            <span className="material-symbols-outlined text-sm" aria-hidden="true">
              auto_awesome
            </span>
            <span>Về TripMate • Nền tảng Du lịch Thông minh Miền Trung</span>
          </div>
        </ScrollReveal>

        {/* Main Headline & Intro */}
        <ScrollReveal animation="fade-up" delay={80}>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12] max-w-4xl text-balance">
            Hành Trình Thông Minh Từ Trái Tim Miền Trung
          </h1>
        </ScrollReveal>

        <ScrollReveal animation="fade-up" delay={160}>
          <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed text-pretty">
            TripMate ra đời với sứ mệnh mang đến trải nghiệm du lịch trọn vẹn và an tâm cho du khách tại
            Đà Nẵng, Hội An và Cố Đô Huế. Chúng tôi kết hợp kho dữ liệu văn hóa bản địa đã kiểm duyệt với
            các thuật toán tối ưu hóa lịch trình và cơ chế đồng hành thông minh.
          </p>
        </ScrollReveal>

        {/* 3 Value Pillars */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5 pt-10 border-t border-slate-800/80">
          <ScrollReveal animation="fade-up" delay={220}>
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="material-symbols-outlined text-2xl text-teal-400 mb-2 block" aria-hidden="true">
                verified
              </span>
              <h3 className="text-base font-bold text-white mb-1">Dữ liệu Chuẩn xác</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tất cả điểm đến, giờ mở cửa và thông tin tour đều được thẩm định trực tiếp với các đơn vị vận hành.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={280}>
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="material-symbols-outlined text-2xl text-teal-400 mb-2 block" aria-hidden="true">
                psychology
              </span>
              <h3 className="text-base font-bold text-white mb-1">Thuật toán Tối ưu</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tự động cân bằng thời gian di chuyển, ngân sách và sở thích cá nhân thông qua bài toán thỏa mãn ràng buộc (CSP).
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={340}>
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="material-symbols-outlined text-2xl text-teal-400 mb-2 block" aria-hidden="true">
                shield
              </span>
              <h3 className="text-base font-bold text-white mb-1">Bảo đảm Minh bạch</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Chính sách bảo chứng ký quỹ và quy trình đối tác minh bạch, đặt quyền lợi của du khách và nhà lữ hành lên hàng đầu.
              </p>
            </div>
          </ScrollReveal>
        </div>

        {/* In-page Anchor Navigation Pill Bar */}
        <ScrollReveal animation="fade-up" delay={400}>
          <div className="mt-12 pt-8 border-t border-slate-800/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
              Mục lục chuyên đề:
            </span>
            <nav aria-label="Mục lục trang Về TripMate" className="flex flex-wrap items-center gap-2">
              {ANCHOR_LINKS.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleJump(item.id);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-[#007d6e] text-white text-xs font-semibold border border-white/15 transition-all cursor-pointer backdrop-blur-xs hover:border-teal-400"
                >
                  <span className="material-symbols-outlined text-sm text-teal-300" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
