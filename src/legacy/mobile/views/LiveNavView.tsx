import React, { useState, useEffect } from 'react';
import { ASSETS } from '@/data/mockData';
import { AppView } from '@/legacy/mobile/types';

interface LiveNavViewProps {
  onNavigate: (view: AppView) => void;
  onOpenSos: () => void;
}

export const LiveNavView: React.FC<LiveNavViewProps> = ({ onNavigate, onOpenSos }) => {
  const activeDestination: 'ho-guom' | 'van-mieu' = 'ho-guom';
  const [currentStep, setCurrentStep] = useState(1);
  const [distanceRemaining, setDistanceRemaining] = useState(1.2);
  const [minutesRemaining, setMinutesRemaining] = useState(8);

  useEffect(() => {
    const timer = setInterval(() => {
      setDistanceRemaining((prev) => (prev > 0.3 ? parseFloat((prev - 0.1).toFixed(1)) : 1.2));
      setMinutesRemaining((prev) => (prev > 2 ? prev - 1 : 8));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-65px)] bg-[#00152a] text-[#eff1f4] flex flex-col overflow-hidden pb-20 md:pb-0">
      {/* Background Interactive Map */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105 opacity-90"
        style={{ backgroundImage: `url('${ASSETS.hanoiNavMapBg}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#00152a]/70 via-transparent to-[#00152a]/80 pointer-events-none" />

      {/* Top Floating Control Bar */}
      <div className="relative z-20 px-4 pt-4 flex flex-col md:flex-row items-center justify-between gap-3 max-w-5xl mx-auto w-full">
        {/* Navigation Info Card */}
        <div className="bg-[#00152a]/90 backdrop-blur-md border border-[#314863] rounded-2xl p-4 shadow-xl flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 rounded-xl bg-[#006b5f] text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-2xl">navigation</span>
          </div>

          <div className="flex-1 min-w-[180px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#71f8e4] animate-ping" />
              <p className="text-xs font-semibold text-[#b0c9e8] uppercase tracking-wider">
                Đang dẫn đường
              </p>
            </div>
            <h2 className="text-lg font-bold text-white truncate">
              {activeDestination === 'ho-guom' ? 'Hồ Gươm' : 'Văn Miếu'}
            </h2>
            <p className="text-xs text-[#71f8e4] font-mono">
              {minutesRemaining} phút ({distanceRemaining} km) • Còn 2 ngã rẽ
            </p>
          </div>
        </div>

        {/* Quick Weather & SOS Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Weather Pill */}
          <div className="bg-[#00152a]/90 backdrop-blur-md border border-[#314863] px-3 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm">
            <span className="material-symbols-outlined text-[18px] text-[#ff7043]">sunny</span>
            Nắng ráo • 28°C
          </div>

          {/* Reroute Warning Shortcut */}
          <button
            onClick={() => onNavigate('reroute-proposal')}
            className="bg-[#102a43]/90 hover:bg-[#102a43] border border-[#ff7043] text-[#ffdad4] px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[18px] text-[#ff7043]">thunderstorm</span>
            Check Bão
          </button>

          {/* SOS Button */}
          <button
            onClick={onOpenSos}
            className="bg-[#ba1a1a] hover:bg-[#93000a] text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all"
          >
            <span className="material-symbols-outlined text-lg">emergency</span>
            SOS
          </button>
        </div>
      </div>

      {/* Map Center Dynamic Markers Overlay */}
      <div className="relative flex-1 flex items-center justify-center pointer-events-none z-10">
        {/* User GPS Location Marker */}
        <div className="absolute top-[48%] left-[46%] pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-[#006b5f]/40 animate-ping absolute" />
            <div className="w-8 h-8 rounded-full bg-[#006b5f] border-2 border-white text-white flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-base">my_location</span>
            </div>
          </div>
          <span className="mt-1 bg-[#00152a]/90 text-[10px] font-bold text-[#71f8e4] px-2 py-0.5 rounded-md border border-[#314863] shadow-xs">
            Bạn đang ở đây
          </span>
        </div>

        {/* Destination Target Marker */}
        <div className="absolute top-[32%] left-[64%] pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="w-9 h-9 rounded-full bg-[#ff7043] border-2 border-white text-white flex items-center justify-center shadow-lg animate-bounce">
            <span className="material-symbols-outlined text-base">flag</span>
          </div>
          <span className="mt-1 bg-[#00152a]/90 text-[10px] font-bold text-white px-2 py-0.5 rounded-md border border-[#314863] shadow-xs">
            Hồ Gươm (1.2 km)
          </span>
        </div>
      </div>

      {/* Bottom Floating Navigation Sheet */}
      <div className="relative z-20 max-w-3xl mx-auto w-full px-4 pb-6">
        <div className="bg-[#00152a]/95 backdrop-blur-lg border border-[#314863] rounded-2xl p-5 shadow-2xl">
          {/* Route Ribbon Timeline */}
          <div className="relative flex items-center justify-between mb-5 px-2">
            <div className="absolute left-6 right-6 top-1/2 h-[2px] bg-[#314863] -translate-y-1/2 z-0" />
            <div className="absolute left-6 w-[45%] top-1/2 h-[2px] bg-[#006b5f] -translate-y-1/2 z-0" />

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-[#006b5f] text-white flex items-center justify-center text-xs font-bold border-2 border-[#00152a] shadow-xs">
                <span className="material-symbols-outlined text-[14px]">check</span>
              </div>
              <span className="text-[11px] font-semibold text-white mt-1">Phố Cổ</span>
            </div>

            {/* Step 2 (Active) */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-[#ff7043] text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-md animate-pulse">
                <span className="material-symbols-outlined text-[16px]">icecream</span>
              </div>
              <span className="text-[11px] font-bold text-[#ffdad4] mt-1">Kem Tràng Tiền (14:15)</span>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center opacity-70">
              <div className="w-8 h-8 rounded-full bg-[#102a43] text-[#b0c9e8] flex items-center justify-center text-xs font-bold border-2 border-[#314863]">
                <span className="material-symbols-outlined text-[14px]">flag</span>
              </div>
              <span className="text-[11px] font-medium text-[#b0c9e8] mt-1">Hồ Gươm</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-[#314863]">
            <button
              onClick={() => onNavigate('reroute-proposal')}
              className="flex-1 bg-[#102a43] hover:bg-[#314863] text-[#ffdad4] py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-[#ff7043]/40"
            >
              <span className="material-symbols-outlined text-base text-[#ff7043]">alt_route</span>
              Tìm đường khác (Reroute)
            </button>

            <button
              onClick={() => {
                setCurrentStep((prev) => (prev === 1 ? 2 : 1));
                setDistanceRemaining(0.4);
                setMinutesRemaining(3);
              }}
              className="flex-1 bg-[#006b5f] hover:bg-[#005048] text-white py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-base">directions_walk</span>
              {currentStep === 1 ? 'Tiếp tục di chuyển' : 'Đã đến điểm dừng'}
            </button>

            <button
              onClick={() => onNavigate('traveler-home')}
              className="bg-transparent hover:bg-white/10 text-[#b0c9e8] py-3 px-4 rounded-xl text-xs font-semibold transition-colors text-center"
            >
              Kết thúc
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
