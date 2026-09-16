'use client';

import { useState } from 'react';
import { WEATHER_SCENARIOS } from '@/data/landingData';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export function WeatherReroutingSection() {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<number>(0);
  const [isRerouted, setIsRerouted] = useState(false);

  const scenario = WEATHER_SCENARIOS[selectedScenarioIndex];

  function handleSelectScenario(index: number) {
    setSelectedScenarioIndex(index);
    setIsRerouted(false);
  }

  function handleToggle() {
    setIsRerouted(!isRerouted);
  }

  return (
    <section id="weather-rerouting" className="scroll-mt-20 py-16 sm:py-24 bg-[#00152a] text-white px-4 sm:px-8 relative overflow-hidden border-b border-slate-800">
      {/* Ambient background lights */}
      <div className="absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -right-40 bottom-1/4 h-96 w-96 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl relative z-10">
        
        {/* Section Header */}
        <ScrollReveal animation="fade-up">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3.5 py-1.5 text-xs font-black uppercase tracking-widest text-sky-300 mb-4 shadow-xs">
              <span className="material-symbols-outlined text-base animate-pulse">thunderstorm</span>
              <span>Trợ Lý Giám Sát Thời Tiết &amp; Cứu Nguy Lộ Trình</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              Không còn nỗi lo <span className="text-sky-300">bị dầm mưa hay ngập lụt</span> giữa chuyến đi
            </h2>
            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              Trợ lý hành trình TripMate liên tục theo dõi trạm khí tượng và tọa độ di chuyển thời gian thực.
              Khi phát hiện mưa lớn (&gt;7mm/h), dông sét hoặc triều cường ngập úng, hệ thống tự động quét và đề xuất điểm tham quan trong nhà an toàn trong bán kính 3km chỉ sau 3 giây.
            </p>
          </div>
        </ScrollReveal>

        {/* Interactive Workspace */}
        <ScrollReveal animation="fade-up" delay={150}>
          <div className="mt-12 max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          
          {/* Scenario Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm text-sky-300">warning_amber</span>
              <span>Chọn Kịch bản Gián đoạn:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {WEATHER_SCENARIOS.map((sc, idx) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleSelectScenario(idx)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    selectedScenarioIndex === idx
                      ? 'bg-sky-400 text-slate-950 shadow-md scale-[1.02]'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  <span>{sc.tabLabel}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-black/20 rounded font-normal">
                    {sc.incidentTime}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Scenario Action Bar */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/10 border border-white/10">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                isRerouted ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30' : 'bg-rose-500/20 text-rose-400 border border-rose-400/30 animate-pulse'
              }`}>
                <span className="material-symbols-outlined text-2xl">{isRerouted ? 'verified' : 'crisis_alert'}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                    {scenario.severityBadge}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300">
                    {scenario.location}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {scenario.alertHeadline}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggle}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 shrink-0 ${
                isRerouted
                  ? 'bg-teal-400 text-slate-950 hover:bg-teal-300 shadow-teal-400/20'
                  : 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/30 animate-bounce'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {isRerouted ? 'restart_alt' : 'bolt'}
              </span>
              <span>{isRerouted ? 'Xem lộ trình gián đoạn' : 'Kích hoạt FSM Cứu nguy (Đổi lịch)'}</span>
            </button>
          </div>

          {/* FSM Engine Event Log Ticker */}
          <div className="my-5 p-4 rounded-2xl bg-black/50 border border-white/10 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400 pb-2 mb-3 border-b border-white/10 text-[11px]">
              <span className="flex items-center gap-2 text-teal-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                FSM Real-time Monitor Stream
              </span>
              <span className="font-bold text-xs">
                Trạng thái:{' '}
                <span className={isRerouted ? 'text-teal-400' : 'text-rose-400'}>
                  {isRerouted ? 'STATE_NEW_ITINERARY_ACCEPTED ✓' : 'STATE_WEATHER_ALERT (DISRUPTION)'}
                </span>
              </span>
            </div>
            <div className="space-y-2 text-[11px] text-slate-300">
              {scenario.fsmLogs.map((log) => {
                if (log.type === 'resolved' && !isRerouted) return null;
                const colorClass =
                  log.type === 'alert'
                    ? 'text-slate-400'
                    : log.type === 'state'
                    ? 'text-amber-300'
                    : log.type === 'engine'
                    ? 'text-sky-300'
                    : 'text-teal-300 font-bold';

                return (
                  <p key={log.time} className={`${colorClass} flex items-start gap-2`}>
                    <span className="text-slate-500 shrink-0">[{log.time}]</span>
                    <span>{log.message}</span>
                  </p>
                );
              })}
              {!isRerouted && (
                <p className="text-rose-300/80 italic flex items-center gap-1.5 animate-pulse">
                  <span className="material-symbols-outlined text-xs">hourglass_empty</span>
                  <span>Đang chờ du khách bấm &ldquo;Kích hoạt FSM Cứu nguy&rdquo; để tự động thay thế điểm dừng an toàn...</span>
                </p>
              )}
            </div>
          </div>

          {/* Before and After Route Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Original Card */}
            <div className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
              isRerouted
                ? 'border-white/10 bg-white/5 opacity-50 scale-95'
                : 'border-rose-400/50 bg-rose-500/10 shadow-lg shadow-rose-500/10'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                    Lộ trình Gốc (Bị gián đoạn)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500 text-white">
                    {scenario.originalActivity.badgeText}
                  </span>
                </div>
                <h4 className="text-base font-bold text-white">
                  {scenario.originalActivity.time}: {scenario.originalActivity.title}
                </h4>
                <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                  {scenario.originalActivity.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span>Mức độ rủi ro: <strong>{scenario.originalActivity.riskLevel}</strong></span>
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">dangerous</span>
                  Cần hủy điểm
                </span>
              </div>
            </div>

            {/* Rerouted Card */}
            <div className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
              isRerouted
                ? 'border-teal-400/80 bg-teal-500/15 shadow-2xl shadow-teal-500/20 scale-[1.02]'
                : 'border-white/10 bg-white/5 opacity-70'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                    Đề xuất FSM Cứu nguy (Điểm trú mưa an toàn)
                  </span>
                  {isRerouted && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-400 text-slate-950 font-bold">
                      Tối ưu trong 2.8s ✓
                    </span>
                  )}
                </div>
                <h4 className="text-base font-bold text-white">
                  {scenario.reroutedActivity.time}: {scenario.reroutedActivity.title}
                </h4>
                <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                  {scenario.reroutedActivity.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-teal-400/20 text-teal-200 border border-teal-400/30">
                    {scenario.reroutedActivity.indoorFeature}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/10 text-slate-300">
                    {scenario.reroutedActivity.openingHours}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span className="text-teal-300 font-medium">{scenario.reroutedActivity.distance}</span>
                <span className="text-teal-300 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  {scenario.reroutedActivity.safetyScore}
                </span>
              </div>
            </div>

          </div>

          {/* Bottom Note */}
          <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center gap-3">
            <span className="material-symbols-outlined text-teal-300 text-xl shrink-0">info</span>
            <p>
              Chỉ với một chạm xác nhận, hệ thống sẽ tự động cập nhật bản đồ chỉ đường GPS và đồng bộ lại các khung giờ tham quan tiếp theo, giúp kỳ nghỉ của bạn luôn trọn vẹn và an toàn tuyệt đối.
            </p>
          </div>

        </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
