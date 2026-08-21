import React, { useState } from 'react';
import { ASSETS } from '@/data/mockData';
import { AppView } from '@/legacy/mobile/types';

interface RerouteProposalViewProps {
  onNavigate: (view: AppView) => void;
}

export const RerouteProposalView: React.FC<RerouteProposalViewProps> = ({ onNavigate }) => {
  const [accepted, setAccepted] = useState(false);

  const handleApply = () => {
    setAccepted(true);
    setTimeout(() => {
      onNavigate('live-nav');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#191c1e] pb-24 md:pb-12">
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Weather Alert Hero Banner */}
        <section className="bg-[#330000] text-white rounded-2xl p-6 md:p-8 mb-8 border border-[#e96755]/30 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#e96755]/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#ffdad4] text-[#872015] flex items-center justify-center shrink-0 shadow-md">
                <span className="material-symbols-outlined text-3xl">thunderstorm</span>
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 bg-[#ffdad6] text-[#93000a] text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-ping" />
                  Cảnh báo thời tiết Real-time
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  Phát hiện mưa lớn tại Đà Nẵng
                </h1>
                <p className="text-sm md:text-base text-[#ffdad4] mt-1">
                  Khu vực Bán đảo Sơn Trà đang có mưa to và gió giật 45 km/h. Hệ thống đề xuất chuyển sang các điểm tham quan trong nhà an toàn hơn.
                </p>
              </div>
            </div>

            <div className="bg-[#5a0000] border border-[#e96755]/40 rounded-xl px-4 py-3 shrink-0 text-center">
              <span className="text-xs text-[#ffdad4] block">Thời gian thay đổi</span>
              <span className="text-xl font-mono font-extrabold text-[#71f8e4]">+8 phút</span>
            </div>
          </div>
        </section>

        {/* 2-Column Comparison Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
          {/* Left Column: Old vs New Route */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Old Route Card (Strikethrough / Warning) */}
            <div className="bg-white border border-[#c3c6ce] rounded-2xl p-5 shadow-xs relative opacity-75">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[#74777e] uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#ba1a1a]">cancel</span>
                  Lộ trình cũ (Nguy cơ mưa gió)
                </span>
                <span className="text-xs font-semibold text-[#ba1a1a] bg-[#ffdad6] px-2.5 py-0.5 rounded-full">
                  Không khuyến nghị
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-[#f2f4f7] rounded-xl flex items-center justify-between line-through text-[#74777e]">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg text-[#74777e]">landscape</span>
                    <span className="text-sm font-semibold">1. Bán đảo Sơn Trà</span>
                  </div>
                  <span className="text-xs">14:00</span>
                </div>

                <div className="p-3 bg-[#f2f4f7] rounded-xl flex items-center justify-between line-through text-[#74777e]">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg text-[#74777e]">temple_buddhist</span>
                    <span className="text-sm font-semibold">2. Chùa Linh Ứng</span>
                  </div>
                  <span className="text-xs">15:30</span>
                </div>
              </div>
            </div>

            {/* Proposed Safe Route Card */}
            <div className="bg-white border-2 border-[#006b5f] rounded-2xl p-6 shadow-md relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[#006b5f] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  Lộ trình mới tối ưu an toàn
                </span>
                <span className="text-xs font-bold text-white bg-[#006b5f] px-3 py-1 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">bolt</span>
                  95% Match
                </span>
              </div>

              <div className="space-y-4">
                {/* Safe Node 1 */}
                <div className="p-4 bg-[#f7f9fc] rounded-xl border border-[#c3c6ce] flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#6df5e1]/30 text-[#006b5f] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl">museum</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#00152a]">
                        1. Bảo tàng Điêu khắc Chăm
                      </h3>
                      <p className="text-xs text-[#43474d] mt-0.5">
                        Không gian trưng bày trong nhà • Văn hóa lịch sử đặc sắc
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#00152a] bg-[#eceef1] px-2 py-1 rounded-md">
                    14:15
                  </span>
                </div>

                {/* Safe Node 2 */}
                <div className="p-4 bg-[#f7f9fc] rounded-xl border border-[#c3c6ce] flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#6df5e1]/30 text-[#006b5f] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl">storefront</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#00152a]">
                        2. Chợ Hàn (Khu Ẩm Thực Mái Che)
                      </h3>
                      <p className="text-xs text-[#43474d] mt-0.5">
                        Trải nghiệm đặc sản khô & mì Quảng truyền thống
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#00152a] bg-[#eceef1] px-2 py-1 rounded-md">
                    15:45
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-[#6df5e1]/20 rounded-xl border border-[#6df5e1] text-xs text-[#005048] font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Tối ưu hóa tránh hoàn toàn khu vực ngập úng đường ven biển.
              </div>
            </div>
          </div>

          {/* Right Column: Visual Radar Map Preview */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="relative bg-[#00152a] rounded-2xl border border-[#314863] overflow-hidden min-h-[380px] shadow-sm flex flex-col justify-between p-5">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-60"
                style={{ backgroundImage: `url('${ASSETS.daNangBridge}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#00152a] via-[#00152a]/60 to-[#00152a]/80" />

              {/* Storm Animation Circle */}
              <div className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full bg-[#ff7043]/30 animate-ping pointer-events-none" />

              <div className="relative z-10">
                <span className="bg-[#ba1a1a] text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                  Vùng mây dông • Sơn Trà
                </span>
                <p className="text-xs text-[#ffdad4] mt-2">
                  Vận tốc gió: 45 km/h • Lượng mưa: 65 mm/h
                </p>
              </div>

              <div className="relative z-10 bg-[#102a43]/90 backdrop-blur-md p-4 rounded-xl border border-[#314863]">
                <div className="flex items-center justify-between text-xs text-white mb-2">
                  <span className="font-semibold text-[#71f8e4]">Tuyến tránh bão được kích hoạt</span>
                  <span className="font-mono">An toàn 100%</span>
                </div>
                <div className="w-full h-2 bg-[#314863] rounded-full overflow-hidden">
                  <div className="w-full h-full bg-[#71f8e4] rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Decision Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4 border-t border-[#c3c6ce]">
          <button
            onClick={() => onNavigate('live-nav')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[#c3c6ce] text-[#43474d] hover:text-[#00152a] hover:bg-[#eceef1] text-xs font-bold transition-colors"
          >
            Giữ lộ trình cũ (Bỏ qua cảnh báo)
          </button>

          <button
            onClick={handleApply}
            className="w-full sm:w-auto bg-[#006b5f] hover:bg-[#005048] text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">
              {accepted ? 'done' : 'alt_route'}
            </span>
            {accepted ? 'Đang cập nhật GPS...' : 'Áp dụng lộ trình an toàn mới'}
          </button>
        </div>
      </main>
    </div>
  );
};
