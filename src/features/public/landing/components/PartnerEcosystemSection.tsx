import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export function PartnerEcosystemSection() {
  return (
    <section id="partner" className="scroll-mt-20 py-16 sm:py-24 bg-[#00152a] text-white px-4 sm:px-8 border-b border-slate-800">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left: Narrative & Value Proposition */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <ScrollReveal animation="fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/10 px-3.5 py-1.5 text-xs font-black uppercase tracking-widest text-teal-300 w-fit">
                <span className="material-symbols-outlined text-base">storefront</span>
                <span>Dành Cho Đơn Vị Lữ Hành &amp; Tour Operators</span>
              </div>
              
              <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.15]">
                Số hóa Tour &amp; Tiếp cận <span className="text-teal-300">Khách du lịch Tự túc (FIT)</span>
              </h2>
              
              <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                Hơn 70% doanh nghiệp lữ hành vừa và nhỏ tại Đà Nẵng, Hội An đang gặp khó khăn vì quản lý đơn thủ công qua tin nhắn và chịu chiết khấu cao từ các sàn OTA quốc tế. 
                TripMate Partner cung cấp bộ công cụ vận hành hoàn chỉnh với <strong>0% chi phí khởi tạo</strong>.
              </p>
            </ScrollReveal>

            {/* Key Operator Capabilities */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
              <ScrollReveal animation="fade-up" delay={100}>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 card-hover-lift h-full">
                  <span className="material-symbols-outlined text-2xl text-teal-300">qr_code_scanner</span>
                  <h4 className="font-bold text-sm text-white mt-2">QR Mobile Scanner Check-in</h4>
                  <p className="text-xs text-slate-400 mt-1">Quét vé điện tử QR động tại điểm đón chỉ mất 1 giây, chống vé giả tuyệt đối và tiết kiệm thời gian đón khách.</p>
                </div>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={180}>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 card-hover-lift h-full">
                  <span className="material-symbols-outlined text-2xl text-amber-300">account_balance_wallet</span>
                  <h4 className="font-bold text-sm text-white mt-2">Đối soát Payout Tự động</h4>
                  <p className="text-xs text-slate-400 mt-1">Quyết toán minh bạch, đối soát tự động và rút tiền nhanh chóng về tài khoản ngân hàng định kỳ.</p>
                </div>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={260}>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 card-hover-lift h-full">
                  <span className="material-symbols-outlined text-2xl text-sky-300">inventory_2</span>
                  <h4 className="font-bold text-sm text-white mt-2">Quản lý Gói Tour &amp; Coupon</h4>
                  <p className="text-xs text-slate-400 mt-1">Đăng tour, mở bán vé theo khung ngày và phát hành mã giảm giá kích cầu linh hoạt.</p>
                </div>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={340}>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 card-hover-lift h-full">
                  <span className="material-symbols-outlined text-2xl text-emerald-300">monitoring</span>
                  <h4 className="font-bold text-sm text-white mt-2">Báo cáo Doanh thu Trực quan</h4>
                  <p className="text-xs text-slate-400 mt-1">Theo dõi lượt booking, tỉ lệ lấp đầy chỗ và biểu đồ tài chính thời gian thực trực quan.</p>
                </div>
              </ScrollReveal>
            </div>

            {/* Action Buttons */}
            <ScrollReveal animation="fade-up" delay={300}>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href={ROUTES.partner.register}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-400 hover:bg-teal-300 px-6 py-3 text-sm font-black text-[#00152a] shadow-lg shadow-teal-400/20 transition-all cursor-pointer active:scale-95"
                >
                  <span>Đăng ký Trở thành Tour Operator</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </Link>
                <Link
                  href={ROUTES.partner.application}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 px-6 py-3 text-sm font-bold text-white transition-all cursor-pointer"
                >
                  <span>Tra cứu Hồ sơ Đăng ký</span>
                </Link>
              </div>
            </ScrollReveal>
          </div>

          {/* Right: Interactive Operator Dashboard Teaser */}
          <div className="lg:col-span-6">
            <ScrollReveal animation="fade-left" delay={200} duration={800}>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-5 card-hover-lift">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-400/20 text-teal-300 flex items-center justify-center font-bold">
                    TM
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Bảng điều khiển Đối tác (Operator Console)</h3>
                    <p className="text-xs text-slate-400">Danang Green Travel • Verified Operator</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  Hoạt động
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[11px] text-slate-400 font-medium">Đơn đặt tuần này</p>
                  <p className="text-lg font-black text-white mt-0.5">48 Đơn</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[11px] text-slate-400 font-medium">Doanh thu Escrow</p>
                  <p className="text-lg font-black text-teal-300 mt-0.5">26.4M</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[11px] text-slate-400 font-medium">Tỉ lệ Check-in</p>
                  <p className="text-lg font-black text-emerald-400 mt-0.5">99.2%</p>
                </div>
              </div>

              {/* Live Manifest Item */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Đơn tour gần nhất chờ đón khách</span>
                <div className="p-3 rounded-xl bg-white/10 border border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">#TRP-8829 • Tour Bán Đảo Sơn Trà</p>
                    <p className="text-[11px] text-slate-300">Khách: Michael Brown (2 pax) • Đón lúc 15:30</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-teal-400/20 text-teal-300 font-bold text-[10px]">
                    Sẵn sàng quét QR
                  </span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 text-center">
                Hệ thống xét duyệt hồ sơ đối tác tự động và hoàn tất thẩm định trong 24 giờ làm việc.
              </div>
              </div>
            </ScrollReveal>
          </div>

        </div>
      </div>
    </section>
  );
}
