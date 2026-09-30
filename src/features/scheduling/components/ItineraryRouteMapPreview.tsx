'use client';

import { SchedulingResponseDto } from '../types/schedulingTypes';

interface ItineraryRouteMapPreviewProps {
  itinerary: SchedulingResponseDto;
}

export function ItineraryRouteMapPreview({ itinerary }: ItineraryRouteMapPreviewProps) {
  return (
    <div className="space-y-4">
      {/* Route Map Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="border-b border-slate-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-[#007d6e]">
                map
              </span>
              <h3 className="text-sm font-bold text-slate-900">Sơ đồ cung đường tối ưu</h3>
            </div>
            <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-[#007d6e]">
              Miền Trung / Đà Nẵng
            </span>
          </div>
        </div>

        {/* Visual Map Representation */}
        <div className="relative flex h-52 w-full flex-col justify-between bg-gradient-to-br from-slate-100 via-teal-50/30 to-blue-50/50 p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Tọa độ trung tâm: 16.0544, 108.2022</span>
            <span className="flex items-center gap-1 text-[#007d6e]">
              <span className="material-symbols-outlined text-xs">navigation</span>
              Lộ trình khép kín
            </span>
          </div>

          {/* Connected Stop Nodes Visualizer */}
          <div className="my-auto flex items-center justify-between px-2">
            {itinerary.items.slice(0, 5).map((item, idx) => (
              <div key={item.sequenceNo || idx} className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-xs ${
                    item.itemKind === 'Rest'
                      ? 'border-2 border-white bg-amber-500 text-white'
                      : 'border-2 border-white bg-[#007d6e] text-white'
                  }`}
                  title={item.poiName || undefined}
                >
                  {item.sequenceNo}
                </div>
                <span className="mt-1 max-w-[64px] truncate text-center text-[10px] font-medium text-slate-700">
                  {item.poiName?.split(' ')[0]}...
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Bán kính hoạt động: 10 km</span>
            <span>Khoảng cách di chuyển được tối ưu tối đa</span>
          </div>
        </div>
      </div>

      {/* Mobile App Sync / Live Navigation Note (UC-13 Mobile Feature) */}
      <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <span className="material-symbols-outlined text-xl">smartphone</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-sky-950 sm:text-sm">
              Điều hướng trực tiếp trên ứng dụng di động
            </h4>
            <p className="mt-1 text-xs text-sky-800">
              Tính năng dẫn đường GPS thời gian thực (UC-13) và Cảnh báo thay đổi lộ trình (UC-14)
              được tối ưu hóa độc quyền trên ứng dụng <strong>TripMate Flutter Mobile</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
