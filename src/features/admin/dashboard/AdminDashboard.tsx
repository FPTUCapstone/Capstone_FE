import Link from 'next/link';

import { adminTourReviews } from '@/data/adminTourQueue';
import { ASSETS } from '@/data/mockData';
import { ROUTES } from '@/lib/routes';

export function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[#00152a] text-[#eff1f4] pb-24 md:pb-12">
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#314863]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#71f8e4] animate-ping" />
              <span className="text-xs font-mono font-bold text-[#71f8e4] uppercase tracking-wider">
                Administrator workspace
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Quản Trị Hệ Thống Toàn Quốc
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#102a43] px-3.5 py-2 rounded-xl border border-[#314863]">
              <div className="w-7 h-7 rounded-full bg-cover bg-center border border-white" style={{ backgroundImage: `url('${ASSETS.adminAvatar}')` }} />
              <span className="text-xs font-bold text-white">Super Admin</span>
            </div>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {/* KPI 1 */}
          <div className="bg-[#102a43] border border-[#314863] rounded-2xl p-5 shadow-md">
            <p className="text-xs text-[#b0c9e8] uppercase tracking-wider mb-1">Travelers</p>
            <h3 className="text-2xl md:text-3xl font-mono font-extrabold text-white">2,450</h3>
            <p className="text-xs text-[#71f8e4] font-semibold mt-1 flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              +12% tháng này
            </p>
          </div>

          {/* KPI 2 */}
          <div className="bg-[#102a43] border border-[#314863] rounded-2xl p-5 shadow-md">
            <p className="text-xs text-[#b0c9e8] uppercase tracking-wider mb-1">Operators</p>
            <h3 className="text-2xl md:text-3xl font-mono font-extrabold text-white">142</h3>
            <p className="text-xs text-[#b0c9e8] mt-1">Đang hoạt động trên 8 tỉnh</p>
          </div>

          {/* KPI 3 */}
          <Link
            href={ROUTES.admin.tourReviews}
            className="bg-[#102a43] border border-[#ff7043] rounded-2xl p-5 shadow-md cursor-pointer hover:bg-[#314863] transition-colors"
          >
            <div className="flex justify-between items-start">
              <p className="text-xs text-[#ffdad4] uppercase tracking-wider mb-1">Pending Tours</p>
              <span className="w-2 h-2 rounded-full bg-[#ff7043] animate-ping" />
            </div>
            <h3 className="text-2xl md:text-3xl font-mono font-extrabold text-[#ff7043]">
              {adminTourReviews.length}
            </h3>
            <p className="text-xs text-[#ffdad4] mt-1 underline">Cần kiểm duyệt ngay &rarr;</p>
          </Link>

          {/* KPI 4 */}
          <div className="bg-[#102a43] border border-[#314863] rounded-2xl p-5 shadow-md">
            <p className="text-xs text-[#b0c9e8] uppercase tracking-wider mb-1">Bookings Today</p>
            <h3 className="text-2xl md:text-3xl font-mono font-extrabold text-white">412</h3>
            <p className="text-xs text-[#71f8e4] mt-1">Tỷ lệ hoàn thành 98.4%</p>
          </div>
        </div>

        {/* System Alert Notification Banner */}
        <div
          className="bg-[#5a0000] border border-[#e96755] rounded-2xl p-4 mb-8 flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-[#ff7043]">warning</span>
            <div>
              <h4 className="text-sm font-bold text-white">Cảnh báo hệ thống: 3 Tour tự động Reroute</h4>
              <p className="text-xs text-[#ffdad4]">Khu vực miền Trung có mưa dông. Hệ thống CSP đã kích hoạt tuyến đường an toàn.</p>
            </div>
          </div>
          <span className="hidden text-xs font-bold text-[#ffdad4] sm:inline">Cảnh báo mô phỏng</span>
        </div>

        {/* Main Grid: Interactive Map + Pending Approval Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Interactive Map Visual */}
          <div className="lg:col-span-8 bg-[#102a43] rounded-2xl border border-[#314863] overflow-hidden min-h-[460px] flex flex-col relative shadow-md">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-70"
              style={{ backgroundImage: `url('${ASSETS.vietnamCommandMapDark}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#00152a] via-transparent to-[#00152a]/60 pointer-events-none" />

            <div className="relative z-10 p-5 flex items-center justify-between">
              <span className="text-xs font-bold text-white bg-[#00152a]/80 px-3 py-1.5 rounded-xl border border-[#314863] flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#71f8e4]">public</span>
                Bản Đồ Hành Trình Trực Tuyến
              </span>
              <span className="text-xs text-[#b0c9e8]">528 đoàn đang di chuyển</span>
            </div>

            {/* Map Hotspot Pins */}
            <div className="relative z-10 flex-1 flex items-center justify-center pointer-events-none">
              {/* Pin Hanoi */}
              <div className="absolute top-[28%] left-[48%]">
                <div className="w-4 h-4 rounded-full bg-[#71f8e4] border-2 border-white shadow-lg pulse-marker" />
                <span className="text-[10px] font-bold text-white bg-[#00152a]/90 px-1.5 py-0.5 rounded shadow-xs ml-2">
                  Hà Nội (184 tours)
                </span>
              </div>

              {/* Pin Da Nang */}
              <div className="absolute top-[48%] left-[54%]">
                <div className="w-4 h-4 rounded-full bg-[#ff7043] border-2 border-white shadow-lg pulse-coral" />
                <span className="text-[10px] font-bold text-[#ffdad4] bg-[#5a0000]/90 px-1.5 py-0.5 rounded shadow-xs ml-2">
                  Đà Nẵng (Mưa bão)
                </span>
              </div>

              {/* Pin HCMC */}
              <div className="absolute top-[72%] left-[49%]">
                <div className="w-4 h-4 rounded-full bg-[#71f8e4] border-2 border-white shadow-lg pulse-marker" />
                <span className="text-[10px] font-bold text-white bg-[#00152a]/90 px-1.5 py-0.5 rounded shadow-xs ml-2">
                  TP.HCM (210 tours)
                </span>
              </div>
            </div>
          </div>

          {/* Pending Queue Column */}
          <div className="lg:col-span-4 bg-[#102a43] rounded-2xl border border-[#314863] p-5 shadow-md flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#71f8e4]">rule</span>
                Hàng đợi kiểm duyệt
              </h3>
              <span className="text-xs text-[#ff7043] font-bold">{adminTourReviews.length} tour mẫu</span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
              {adminTourReviews.slice(0, 3).map((review) => (
                <Link
                  key={review.id}
                  href={ROUTES.admin.tourReview(review.id)}
                  className="cursor-pointer rounded-xl border border-[#314863] bg-[#00152a] p-3.5 transition-all hover:border-[#71f8e4] hover:bg-[#00152a]/80"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#71f8e4]">{review.operatorName}</span>
                    <span className="text-[10px] text-[#b0c9e8]">{review.submittedTime}</span>
                  </div>
                  <h4 className="mb-1 text-sm font-bold text-white">{review.tourName}</h4>
                  <div className="flex items-center justify-between text-xs text-[#b0c9e8]">
                    <span>
                      {review.price} • {review.duration}
                    </span>
                    <span className="font-bold text-[#ff7043]">
                      {review.status === 'pending' ? 'Cần duyệt' : review.status} &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <Link
              href={ROUTES.admin.tourReviews}
              className="mt-4 w-full bg-[#006b5f] hover:bg-[#005048] text-white py-2.5 rounded-xl text-xs font-bold transition-colors"
            >
              Mở trang duyệt chi tiết
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
