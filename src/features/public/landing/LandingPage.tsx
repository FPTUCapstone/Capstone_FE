import Link from 'next/link';

import { PublicNavigation } from '@/components/navigation/PublicNavigation';
import { ASSETS } from '@/data/mockData';
import { ROUTES } from '@/lib/routes';

export function LandingPage() {
  return (
    <>
      <PublicNavigation />
      <div className="min-h-screen bg-[#f7f9fc] text-[#191c1e] flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 pb-20 md:pb-28 px-4 md:px-12 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6df5e1]/30 text-[#006b5f] font-semibold text-xs mb-6 border border-[#6df5e1]">
              <span className="material-symbols-outlined text-[16px] text-[#006b5f]">explore</span>
              Atlas Du Lịch Thông Minh Thế Hệ Mới
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#00152a] tracking-tight leading-tight mb-6">
              Plan intelligently. <br />
              <span className="text-[#006b5f]">Travel confidently.</span> <br />
              Adapt as you go.
            </h1>
            
            <p className="text-lg md:text-xl text-[#43474d] mb-8 max-w-lg leading-relaxed">
              Bản đồ du lịch thông minh kết hợp độ chính xác của hệ thống kiểm soát hành trình trực tiếp với linh hồn của một nhật ký du lịch. Xây dựng tuyến đường tối ưu của bạn qua Việt Nam.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#features"
                className="bg-[#ff7043] hover:bg-[#f4511e] text-white px-8 py-3.5 rounded-xl font-semibold text-base transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                Bắt đầu hành trình
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </a>

              <a
                href="#features"
                className="bg-transparent border-2 border-[#006b5f] text-[#006b5f] hover:bg-[#6df5e1]/20 px-6 py-3 rounded-xl font-semibold text-base transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">navigation</span>
                Xem Demo Live Nav
              </a>
            </div>
          </div>

          {/* Hero Visual: Route Ribbon Interactive Mockup */}
          <div className="relative h-[540px] bg-[#f2f4f7] rounded-2xl border border-[#e0e3e6] overflow-hidden shadow-sm flex flex-col p-6 z-10">
            {/* Faux Map Background */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 z-0"
              style={{ backgroundImage: `url('${ASSETS.topoVietnamBg}')` }}
            />
            
            <div className="relative z-10 flex items-center justify-between mb-4 bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-[#c3c6ce]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#006b5f] animate-pulse" />
                <span className="text-xs font-bold text-[#00152a] uppercase tracking-wider">Hành trình xuyên Việt</span>
              </div>
              <span className="text-xs font-semibold text-[#006b5f] bg-[#6df5e1]/40 px-2.5 py-0.5 rounded-full">
                3 chặng • 95% Match
              </span>
            </div>

            <div className="relative z-10 flex-grow flex flex-col ml-4 md:ml-8 mt-2 justify-around">
              {/* The Ribbon Line */}
              <div className="absolute left-[11px] top-6 bottom-10 w-[4px] bg-[#c3c6ce] border-l border-dashed border-[#74777e]/40 z-0" />
              <div className="absolute left-[11px] top-6 h-[40%] w-[4px] bg-[#006b5f] rounded-t-full z-0" />

              {/* Node 1: Completed */}
              <div className="relative flex gap-5 group items-start">
                <div className="w-6 h-6 rounded-full bg-[#006b5f] border-4 border-[#f7f9fc] z-10 shrink-0 flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[12px] text-white font-bold">check</span>
                </div>
                <div className="bg-white border border-[#c3c6ce] rounded-xl p-4 w-full shadow-xs hover:border-[#006b5f] transition-all">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-base text-[#00152a]">Hà Nội</h3>
                    <span className="text-xs font-semibold text-[#006b5f] bg-[#6df5e1]/30 px-2.5 py-0.5 rounded-full">
                      Completed
                    </span>
                  </div>
                  <p className="text-sm text-[#43474d]">Phố Cổ & Hoàn Kiếm • 4 điểm tham quan</p>
                </div>
              </div>

              {/* Node 2: Active */}
              <div className="relative flex gap-5 group items-start">
                <div className="w-6 h-6 rounded-full bg-white border-4 border-[#ff7043] z-10 shrink-0 shadow-[0_0_12px_rgba(255,112,67,0.6)] pulse-coral" />
                <div className="bg-white border-l-4 border-l-[#ff7043] border-t border-r border-b border-[#c3c6ce] rounded-xl p-4 w-full shadow-md">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-base text-[#00152a]">Hội An</h3>
                    <span className="text-xs font-semibold text-white bg-[#ff7043] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">location_on</span> Live
                    </span>
                  </div>
                  <p className="text-sm text-[#43474d] mb-3">Phố lồng đèn về đêm & Chùa Cầu</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-xs font-semibold text-[#00152a] bg-[#eceef1] hover:bg-[#e0e3e6] transition-colors px-3 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px] text-[#006b5f]">map</span>
                      Xem bản đồ trực tiếp
                    </button>
                    <button
                      type="button"
                      className="text-xs font-semibold text-[#ba1a1a] bg-[#ffdad6] hover:bg-[#ffdad6]/80 transition-colors px-3 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">warning</span>
                      Check thời tiết
                    </button>
                  </div>
                </div>
              </div>

              {/* Node 3: Planned */}
              <div className="relative flex gap-5 group items-start opacity-75 hover:opacity-100 transition-opacity">
                <div className="w-6 h-6 rounded-full bg-[#f7f9fc] border-2 border-[#74777e] z-10 shrink-0" />
                <div className="bg-white border border-[#c3c6ce] rounded-xl p-4 w-full">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-base text-[#00152a]">Đà Nẵng</h3>
                    <span className="text-xs font-semibold text-[#74777e] bg-[#e6e8eb] px-2.5 py-0.5 rounded-full">
                      Planned
                    </span>
                  </div>
                  <p className="text-sm text-[#43474d]">Bà Nà Hills & Cầu Rồng • Ngày mai</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="scroll-mt-20 py-20 bg-[#f2f4f7] px-4 md:px-12 border-t border-[#e0e3e6]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[#00152a] tracking-tight mb-3">
              Công nghệ dẫn lối hành trình
            </h2>
            <p className="text-base text-[#43474d]">
              Hệ thống kết hợp thuật toán tối ưu hóa ràng buộc CSP và phản ứng thời gian thực để mang lại trải nghiệm du lịch trọn vẹn nhất.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
            {/* Feature 1: CSP Planning */}
            <div
              className="md:col-span-2 bg-white rounded-2xl border border-[#c3c6ce] p-8 flex flex-col justify-between relative overflow-hidden group hover:border-[#006b5f] transition-all shadow-xs"
            >
              <div className="z-10 max-w-lg">
                <div className="w-12 h-12 rounded-xl bg-[#6df5e1]/30 text-[#006b5f] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-2xl">account_tree</span>
                </div>
                <h3 className="text-2xl font-bold text-[#00152a] mb-2">
                  Lập kế hoạch thông minh (CSP)
                </h3>
                <p className="text-[#43474d] text-base leading-relaxed">
                  Hệ thống tối ưu hóa lộ trình dựa trên Ràng Buộc (Constraint Satisfaction Problem), tự động sắp xếp điểm đến để tiết kiệm thời gian và chi phí di chuyển nhất.
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm font-semibold text-[#006b5f] group-hover:translate-x-1 transition-transform">
                <span>Khám phá thuật toán đề xuất</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </div>
            </div>

            {/* Feature 2: Real-time adaptation */}
            <div
              className="bg-[#00152a] text-white rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden hover:ring-2 hover:ring-[#ff7043] transition-all shadow-md"
            >
              <div className="z-10">
                <div className="w-12 h-12 rounded-xl bg-white/10 text-[#71f8e4] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-2xl">dynamic_feed</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Thích ứng Real-time
                </h3>
                <p className="text-[#b0c9e8] text-sm leading-relaxed">
                  Tự động đề xuất lộ trình thay thế an toàn khi có thay đổi thời tiết cực đoan hoặc sự cố giao thông.
                </p>
              </div>

              <div className="mt-4 bg-[#102a43] rounded-xl p-3.5 border border-[#314863]">
                <div className="flex items-center gap-2 text-[#ffdad6] text-xs font-bold mb-1">
                  <span className="material-symbols-outlined text-[16px] text-[#ff7043]">warning</span>
                  Mưa lớn phía trước
                </div>
                <div className="text-white text-xs opacity-90">
                  Rerouting qua hầm đèo Hải Vân...
                </div>
              </div>
            </div>

            {/* Feature 3: TripMatch */}
            <div className="md:col-span-3 bg-white rounded-2xl border border-[#c3c6ce] p-8 flex flex-col md:flex-row gap-8 items-center justify-between shadow-xs">
              <div className="flex-1 max-w-xl">
                <div className="w-12 h-12 rounded-xl bg-[#ffdad4] text-[#872015] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-2xl">radar</span>
                </div>
                <h3 className="text-2xl font-bold text-[#00152a] mb-2">
                  Khám phá Tour (TripMatch)
                </h3>
                <p className="text-[#43474d] text-base mb-6 leading-relaxed">
                  Đánh giá độ phù hợp của từng tour với sở thích cá nhân của bạn thông qua điểm TripMatch chuẩn xác theo từng cá tính du lịch.
                </p>
                <div className="flex gap-4">
                  <a
                    href="#features"
                    className="border-2 border-[#006b5f] text-[#006b5f] hover:bg-[#6df5e1]/20 font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
                  >
                    Xem danh sách Tour
                  </a>
                  <Link
                    href={ROUTES.admin.tourReview('demo')}
                    className="text-[#43474d] hover:text-[#00152a] text-sm font-semibold flex items-center gap-1.5"
                  >
                    <span>Xem quy trình kiểm duyệt</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </Link>
                </div>
              </div>

              {/* Visual Card */}
              <div className="flex-1 flex justify-center w-full">
                <div className="bg-[#f7f9fc] rounded-2xl p-5 flex items-center gap-4 border border-[#c3c6ce] shadow-sm w-full max-w-md hover:border-[#006b5f] transition-all">
                  <div
                    className="w-20 h-20 rounded-xl bg-cover bg-center shrink-0 border border-[#e0e3e6]"
                    style={{ backgroundImage: `url('${ASSETS.hueFoodPho}')` }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="inline-block text-[11px] font-semibold text-[#006b5f] bg-[#6df5e1]/30 px-2 py-0.5 rounded-md mb-1">
                      Ẩm thực miền Trung
                    </div>
                    <h4 className="text-[#00152a] text-base font-bold truncate">Tour Ẩm Thực Huế</h4>
                    <p className="text-xs text-[#43474d]">3 ngày 2 đêm • Hướng dẫn viên bản địa</p>
                  </div>
                  <div className="bg-[#00152a] text-white text-sm font-mono font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shrink-0">
                    94%
                    <span className="material-symbols-outlined text-[16px] text-[#71f8e4]">radar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center bg-[#e0e3e6] border-t border-[#c3c6ce] mt-auto text-sm text-[#43474d]">
        <div className="font-bold text-lg text-[#00152a] mb-4 md:mb-0 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#006b5f]">route</span>
          TripMate
        </div>
        <div className="text-xs mb-4 md:mb-0 text-center">
          © 2026 TripMate Technologies. Intelligent Travel Atlas.
        </div>
        <div className="flex gap-6 text-xs font-medium">
          <Link href={ROUTES.admin.login} className="hover:text-[#006b5f] transition-colors">Admin Login</Link>
          <Link href={ROUTES.admin.dashboard} className="hover:text-[#006b5f] transition-colors">Admin Command</Link>
        </div>
      </footer>
      </div>
    </>
  );
}
