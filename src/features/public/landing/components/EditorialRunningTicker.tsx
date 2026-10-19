'use client';

import React from 'react';

const CULTURAL_ITEMS = [
  { city: 'ĐÀ NẴNG', highlight: 'Bán đảo Sơn Trà 05:30 Bình Minh', icon: 'wb_twilight' },
  { city: 'ĐÀ NẴNG', highlight: 'Cầu Rồng Phun Lửa Cuối Tuần 21:00', icon: 'local_fire_department' },
  { city: 'ĐÀ NẴNG', highlight: 'Bãi biển Mỹ Khê Top Thế Giới', icon: 'waves' },
  { city: 'HỘI AN', highlight: 'Di Sản Văn Hóa Thế Giới UNESCO', icon: 'award_star' },
  { city: 'HỘI AN', highlight: 'Thả Đèn Hoa Đăng Sông Hoài 18:00', icon: 'festival' },
  { city: 'HỘI AN', highlight: 'Rừng Dừa Bảy Mẫu Cẩm Thanh', icon: 'sailing' },
  { city: 'CỐ ĐÔ HUẾ', highlight: 'Đại Nội Hoàng Thành Triều Nguyễn', icon: 'account_balance' },
  { city: 'CỐ ĐÔ HUẾ', highlight: 'Nhã Nhạc Cung Đình UNESCO', icon: 'music_note' },
  { city: 'CỐ ĐÔ HUẾ', highlight: 'Hoàng Hôn Sông Hương & Chùa Thiên Mụ', icon: 'temple_buddhist' },
];

const TECH_DATA_ITEMS = [
  { tag: 'GIS CHUẨN HÓA', desc: 'Tọa độ thực 16.0544° N, 108.2022° E', icon: 'pin_drop' },
  { tag: 'TỐI ƯU LỊCH TRÌNH', desc: 'Tự động cân đối giờ mở cửa & nhịp nắng', icon: 'alt_route' },
  { tag: 'WEATHER MONITOR', desc: 'Phát hiện mưa bão & đề xuất điểm trú mưa trong 3km', icon: 'thunderstorm' },
  { tag: 'KÝ QUỸ ESCROW', desc: 'Bảo chứng quyền lợi du khách 100%', icon: 'shield' },
  { tag: 'DYNAMIC QR', desc: 'Vé điện tử tự làm mới chống vé giả', icon: 'qr_code_scanner' },
  { tag: 'OPERATOR NETWORK', desc: 'Mạng lưới đối tác bản địa đã thẩm định giấy phép', icon: 'verified' },
];

export function EditorialRunningTicker() {
  return (
    <div
      className="relative z-20 bg-[#0B1522] border-y border-[#1E2E42] text-white py-2.5 overflow-hidden select-none group shadow-sm"
      aria-label="TripMate Live Radar & Cultural Highlights"
    >
      {/* Left/Right Gradient Fades */}
      <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-28 bg-gradient-to-r from-[#0B1522] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-28 bg-gradient-to-l from-[#0B1522] to-transparent z-10 pointer-events-none" />

      {/* Floating Badge (Left) */}
      <div className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 items-center gap-2 px-3 py-1 rounded-full bg-[#112338]/90 border border-teal-500/30 shadow-md backdrop-blur-md">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-300">
          Live Atlas
        </span>
      </div>

      <div className="space-y-1.5 lg:pl-32">
        {/* Stream 1: Cultural & Destination Highlights (Moving Left) */}
        <div className="overflow-hidden flex">
          <div className="animate-marquee-left flex shrink-0 items-center gap-6 text-xs text-slate-200">
            {/* Render 4x for continuous seamless loop on ultra-wide viewports */}
            {[...CULTURAL_ITEMS, ...CULTURAL_ITEMS, ...CULTURAL_ITEMS, ...CULTURAL_ITEMS].map((item, idx) => (
              <div
                key={`cult-${idx}`}
                className="flex items-center gap-2 whitespace-nowrap px-2 py-0.5 rounded-md hover:bg-white/5 transition-colors cursor-default"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                <span className="text-[10px] font-mono font-bold tracking-wider text-teal-300 uppercase px-1.5 py-0.2 bg-teal-950/60 rounded border border-teal-800/50">
                  {item.city}
                </span>
                <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs text-amber-300" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.highlight}</span>
                </span>
                <span className="text-slate-600 ml-2">✦</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stream 2: Technology & Verified Guarantees (Moving Right) */}
        <div className="overflow-hidden flex">
          <div className="animate-marquee-right flex shrink-0 items-center gap-6 text-xs text-slate-300">
            {/* Render 4x for continuous seamless loop on ultra-wide viewports */}
            {[...TECH_DATA_ITEMS, ...TECH_DATA_ITEMS, ...TECH_DATA_ITEMS, ...TECH_DATA_ITEMS].map((item, idx) => (
              <div
                key={`tech-${idx}`}
                className="flex items-center gap-2 whitespace-nowrap px-2 py-0.5 rounded-md hover:bg-white/5 transition-colors cursor-default"
              >
                <span className="text-slate-600 mr-1">◈</span>
                <span className="text-[10px] font-mono font-bold tracking-wider text-amber-300 uppercase px-1.5 py-0.2 bg-amber-950/40 rounded border border-amber-800/40">
                  {item.tag}
                </span>
                <span className="text-[11px] text-slate-300 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-teal-400" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.desc}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
