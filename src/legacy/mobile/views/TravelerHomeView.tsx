import React from 'react';
import { ASSETS, defaultUser } from '@/data/mockData';
import { AppView } from '@/legacy/mobile/types';

interface TravelerHomeViewProps {
  onNavigate: (view: AppView) => void;
}

export const TravelerHomeView: React.FC<TravelerHomeViewProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#1C2928] pb-24 md:pb-12">
      <main className="max-w-4xl mx-auto px-4 md:px-8 pt-6 md:pt-10">
        {/* Header Section */}
        <header className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1C2928] tracking-tight mb-1">
              Chào bạn, {defaultUser.name}!
            </h1>
            <p className="text-sm md:text-base text-[#5B6E69] flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[20px] text-[#174B4A]">partly_cloudy_day</span>
              {defaultUser.location}, {defaultUser.temp}, {defaultUser.weatherDesc}
            </p>
          </div>
          <div 
            onClick={() => onNavigate('plan-trip')}
            className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md cursor-pointer hover:ring-2 hover:ring-[#174B4A] transition-all"
          >
            <div
              role="img"
              aria-label="User Profile"
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url('${defaultUser.avatar}')` }}
            />
          </div>
        </header>

        {/* Active Trip Node (Level 2 Elevation with Route Ribbon) */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2928] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#174B4A]">route</span>
              Hành trình hiện tại
            </h2>
            <span className="text-xs font-semibold text-[#174B4A] bg-[#6df5e1]/30 px-2.5 py-1 rounded-full">
              GPS Active
            </span>
          </div>

          <div className="flex items-stretch gap-4">
            {/* Route Ribbon Axis */}
            <div className="w-[4px] bg-[#DCE2DD] rounded-full relative flex flex-col items-center mt-2 shrink-0">
              <div className="w-3 h-3 rounded-full bg-[#174B4A] absolute -top-1" />
              <div className="w-full h-1/2 bg-[#174B4A] rounded-t-full" />
              <div className="w-4 h-4 rounded-full bg-[#B96D4C] absolute top-1/2 -translate-y-1/2 pulse-coral border-2 border-white" />
              <div className="w-3 h-3 rounded-full border-2 border-[#DCE2DD] bg-[#F7F5EF] absolute -bottom-1" />
            </div>

            {/* Active Journey Card */}
            <div 
              onClick={() => onNavigate('live-nav')}
              className="flex-1 bg-white rounded-2xl border-l-4 border-l-[#B96D4C] border-t border-r border-b border-[#DCE2DD] shadow-[0_8px_24px_rgba(255,112,67,0.12)] p-5 relative overflow-hidden cursor-pointer hover:shadow-lg transition-all"
            >
              <div className="absolute right-0 top-0 opacity-5 pointer-events-none">
                <span className="material-symbols-outlined text-[140px] text-[#1C2928]">map</span>
              </div>

              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-[#B96D4C] uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#B96D4C] animate-ping" />
                  Đang diễn ra
                </span>
                <span className="bg-[#103B39] text-[#b0c9e8] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  Hà Nội
                </span>
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-[#1C2928] mb-3">
                Hành trình Phố Cổ
              </h3>

              {/* Next Step Box */}
              <div className="p-3.5 bg-[#F7F5EF] rounded-xl border border-[#DCE2DD] flex justify-between items-center hover:bg-[#e6e8eb] transition-colors">
                <div>
                  <p className="text-xs text-[#5B6E69] mb-0.5 font-medium">Điểm đến tiếp theo • 10:30</p>
                  <p className="text-base font-bold text-[#1C2928]">Đền Ngọc Sơn</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#174B4A] text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-lg">navigation</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Primary Action Button */}
        <div className="flex justify-center mb-10">
          <button
            onClick={() => onNavigate('plan-trip')}
            className="bg-[#B96D4C] hover:bg-[#f4511e] text-white px-8 py-3.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all transform active:scale-98"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Lên kế hoạch chuyến đi
          </button>
        </div>

        {/* Suggestions Grid */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2928]">Gợi ý điểm đến</h2>
            <button 
              onClick={() => onNavigate('suggested-itinerary')}
              className="text-sm font-semibold text-[#174B4A] hover:underline"
            >
              Xem tất cả
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* POI Card 1: Hoan Kiem */}
            <div
              onClick={() => onNavigate('suggested-itinerary')}
              className="bg-white border border-[#DCE2DD] rounded-2xl overflow-hidden group cursor-pointer hover:border-[#174B4A] hover:shadow-md transition-all relative"
            >
              <div className="h-44 bg-[#DCE2DD] relative overflow-hidden">
                <div
                  className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                  style={{ backgroundImage: `url('${ASSETS.hoanKiemSunrise}')` }}
                />
                <div className="absolute top-3 left-3 bg-[#103B39]/90 backdrop-blur-xs text-white font-mono text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <span className="material-symbols-outlined text-[14px] text-[#B96D4C]">bolt</span>
                  98% Match
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-[#1C2928] mb-1 group-hover:text-[#174B4A] transition-colors">
                  Hồ Hoàn Kiếm
                </h3>
                <p className="text-sm text-[#5B6E69] leading-relaxed line-clamp-2">
                  Biểu tượng lịch sử giữa lòng thủ đô, không gian tĩnh lặng và cổ kính với Tháp Rùa huyền thoại.
                </p>
              </div>
            </div>

            {/* POI Card 2: Dong Xuan */}
            <div
              onClick={() => onNavigate('suggested-itinerary')}
              className="bg-white border border-[#DCE2DD] rounded-2xl overflow-hidden group cursor-pointer hover:border-[#174B4A] hover:shadow-md transition-all relative"
            >
              <div className="h-44 bg-[#DCE2DD] relative overflow-hidden">
                <div
                  className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                  style={{ backgroundImage: `url('${ASSETS.dongXuanMarket}')` }}
                />
                <div className="absolute top-3 left-3 bg-[#103B39]/90 backdrop-blur-xs text-white font-mono text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <span className="material-symbols-outlined text-[14px] text-[#B96D4C]">bolt</span>
                  92% Match
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-[#1C2928] mb-1 group-hover:text-[#174B4A] transition-colors">
                  Chợ Đồng Xuân
                </h3>
                <p className="text-sm text-[#5B6E69] leading-relaxed line-clamp-2">
                  Khu chợ sầm uất nhất phố cổ, thiên đường ẩm thực đường phố và quà lưu niệm truyền thống.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
