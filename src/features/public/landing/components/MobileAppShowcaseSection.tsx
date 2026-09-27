import { ScrollReveal } from '@/components/ui/ScrollReveal';

export function MobileAppShowcaseSection() {
  return (
    <section id="mobile-app" className="scroll-mt-20 py-16 sm:py-24 bg-white px-4 sm:px-8 border-b border-slate-200">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left: Mobile App Visual Device Frame */}
          <div className="lg:col-span-5 flex justify-center">
            <ScrollReveal animation="zoom-in" delay={150} duration={800}>
              <div className="relative w-[300px] sm:w-[320px] rounded-[3rem] border-8 border-slate-900 bg-slate-900 p-2 shadow-2xl shadow-slate-900/30 animate-float-gentle card-hover-lift">
                {/* Camera Notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 h-5 w-28 rounded-full bg-slate-800 z-20" />
                
                {/* Screen Container */}
                <div className="rounded-[2.4rem] overflow-hidden bg-slate-50 text-slate-900 flex flex-col min-h-[580px]">
                  
                  {/* Status bar */}
                  <div className="bg-[#00152a] text-white px-6 pt-5 pb-3 flex items-center justify-between text-[11px] font-bold">
                    <span>09:41</span>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs">signal_cellular_4_bar</span>
                      <span className="material-symbols-outlined text-xs">wifi</span>
                      <span className="material-symbols-outlined text-xs">battery_full</span>
                    </div>
                  </div>

                  {/* App Bar */}
                  <div className="bg-[#00152a] text-white px-5 pb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-teal-300 uppercase font-bold tracking-wider">Đang di chuyển • Đà Nẵng</p>
                      <h4 className="text-sm font-black">Chuyến đi 1 Ngày Tối Ưu</h4>
                    </div>
                    <span className="material-symbols-outlined text-teal-300">navigation</span>
                  </div>

                  {/* Active Map Card */}
                  <div className="p-4 flex-1 flex flex-col gap-3">
                    <div className="relative aspect-video rounded-2xl bg-teal-900 text-white p-3 overflow-hidden flex flex-col justify-between shadow-xs">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="bg-emerald-500/80 px-2 py-0.5 rounded-full font-bold">GPS Live</span>
                        <span>Offline Mode Sẵn sàng</span>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-300">Điểm tiếp theo:</p>
                        <p className="text-xs font-bold">Bán đảo Sơn Trà (Cách 4.2 km)</p>
                      </div>
                    </div>

                    {/* Dynamic QR Ticket Drawer Preview */}
                    <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-2xl text-secondary">qr_code_2</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Dynamic QR E-Ticket</p>
                        <p className="text-[10px] text-slate-400">Tự làm mới mỗi 30s • Chống chụp màn hình</p>
                      </div>
                    </div>

                    {/* Group Member Sharing */}
                    <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900">Nhóm &ldquo;Khám phá Hội An&rdquo;</p>
                        <p className="text-[10px] text-slate-400">4 thành viên đang chia sẻ vị trí</p>
                      </div>
                      <span className="material-symbols-outlined text-secondary text-lg">groups</span>
                    </div>
                  </div>

                  {/* Bottom Tab Bar */}
                  <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between text-slate-400 text-xs">
                    <span className="material-symbols-outlined text-secondary font-bold">home</span>
                    <span className="material-symbols-outlined">map</span>
                    <span className="material-symbols-outlined">confirmation_number</span>
                    <span className="material-symbols-outlined">person</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right: Architecture & In-Trip Features */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <ScrollReveal animation="fade-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#9edbd2] bg-teal-50 px-3.5 py-1.5 text-xs font-black uppercase tracking-widest text-[#007d6e] w-fit">
                <span className="material-symbols-outlined text-base">smartphone</span>
                <span>Ứng Dụng Di Động Thông Minh (iOS &amp; Android)</span>
              </div>

              <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black text-[#00152a] tracking-tight leading-[1.15]">
                Ứng dụng Di động TripMate: <span className="text-[#007d6e]">Người bạn đồng hành</span> trên từng cung đường
              </h2>

              <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                Trong khi phiên bản Web giúp bạn dễ dàng lên kế hoạch và tìm kiếm tour trên màn hình lớn, ứng dụng Di động (hỗ trợ iOS &amp; Android) 
                được tối ưu cho trải nghiệm thực tế trên đường với các tiện ích ngoại tuyến thông minh và bảo mật cao.
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
              <ScrollReveal animation="fade-left" delay={100}>
                <div className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#007d6e] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined">cloud_sync</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Bản đồ Ngoại tuyến (Offline Maps)</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Tự động tải trước dữ liệu lịch trình và bản đồ chi tiết để sử dụng mượt mà ngay cả khi mất sóng di động.</p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal animation="fade-left" delay={180}>
                <div className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#007d6e] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined">near_me</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Dẫn đường GPS Turn-by-Turn</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Chỉ dẫn chuyển hướng bằng giọng nói, tự động phát hiện sai làn hoặc lệch lộ trình để nhắc nhở tức thì.</p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal animation="fade-left" delay={260}>
                <div className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#007d6e] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined">share_location</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Chia sẻ Vị trí Nhóm An toàn</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Định vị các thành viên trong nhóm trên bản đồ chung, cảnh báo khi có người tụt lại phía sau.</p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal animation="fade-left" delay={340}>
                <div className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#007d6e] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined">qr_code_2</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Ví Vé Điện tử Dynamic QR</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Xuất trình vé ngay trên màn hình khóa, hỗ trợ quét check-in siêu tốc không cần kết nối mạng.</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

