'use client';

import { useState, useEffect, useRef } from 'react';
import { CSP_PRESETS } from '@/data/landingData';
import { ROUTES } from '@/lib/routes';
import Link from 'next/link';
import { EditorialTextReveal } from '@/components/ui/ScrollReveal';

interface CspSimulatorSectionProps {
  selectedCity?: 'danang' | 'hoian' | 'hue';
  onCityChange?: (city: 'danang' | 'hoian' | 'hue') => void;
}

export function CspSimulatorSection({
  selectedCity: propCity,
  onCityChange: propOnCityChange,
}: CspSimulatorSectionProps) {
  const [internalCity, setInternalCity] = useState<'danang' | 'hoian' | 'hue'>('danang');
  const [selectedPace, setSelectedPace] = useState<'relaxed' | 'balanced' | 'fast'>('balanced');
  const [isSolving, setIsSolving] = useState(false);
  const [solvingStep, setSolvingStep] = useState(0);
  const [expandedNodes, setExpandedNodes] = useState<number[]>([0]);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  const activeCity = propCity ?? internalCity;
  const currentPreset = CSP_PRESETS[activeCity] || CSP_PRESETS.danang;

  useEffect(() => {
    function handleExternalCitySelect(e: Event) {
      const customEvent = e as CustomEvent<string>;
      const city = customEvent.detail;
      if (city === 'danang' || city === 'hoian' || city === 'hue') {
        if (propOnCityChange) {
          propOnCityChange(city);
        } else {
          setInternalCity(city);
        }
        runSolverAnimation();
        const section = document.getElementById('csp-simulator');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }

    window.addEventListener('tripmate:select-city', handleExternalCitySelect);
    return () => window.removeEventListener('tripmate:select-city', handleExternalCitySelect);
  }, [propOnCityChange]);

  function handleCityChange(city: 'danang' | 'hoian' | 'hue') {
    if (city === activeCity && !isSolving) return;
    if (propOnCityChange) {
      propOnCityChange(city);
    } else {
      setInternalCity(city);
    }
    runSolverAnimation();
  }

  function handlePaceChange(pace: 'relaxed' | 'balanced' | 'fast') {
    if (pace === selectedPace && !isSolving) return;
    setSelectedPace(pace);
    runSolverAnimation();
  }

  function toggleNode(index: number) {
    setExpandedNodes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }

  function toggleAllNodes() {
    if (expandedNodes.length === currentPreset.schedule.length) {
      setExpandedNodes([]);
    } else {
      setExpandedNodes(currentPreset.schedule.map((_, i) => i));
    }
  }

  function runSolverAnimation() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setIsSolving(true);
    setSolvingStep(1);
    const t1 = setTimeout(() => setSolvingStep(2), 350);
    const t2 = setTimeout(() => setSolvingStep(3), 700);
    const t3 = setTimeout(() => {
      setIsSolving(false);
      setSolvingStep(0);
    }, 1000);
    timersRef.current.push(t1, t2, t3);
  }

  // Filter or limit nodes depending on selected pace
  const displayedSchedule =
    selectedPace === 'relaxed'
      ? currentPreset.schedule.slice(0, 3)
      : selectedPace === 'balanced'
      ? currentPreset.schedule.slice(0, 4)
      : currentPreset.schedule;

  return (
    <section id="csp-simulator" className="scroll-mt-20 py-10 sm:py-14 lg:py-16 bg-[#FAFAF8] px-4 sm:px-8 border-b border-stone-200 relative overflow-hidden">
      {/* 1. Ambient Celestial & Algorithm Glow Orbs */}
      <div className="absolute top-1/4 -right-28 w-[450px] h-[450px] rounded-full bg-gradient-to-bl from-[#007D6E]/12 via-teal-400/5 to-transparent blur-3xl pointer-events-none animate-orb-1" />
      <div className="absolute bottom-10 -left-20 w-[420px] h-[420px] rounded-full bg-gradient-to-tr from-[#D97706]/12 via-amber-400/5 to-transparent blur-3xl pointer-events-none animate-orb-2" />

      {/* 2. Subtle GIS Coordinate Dot Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#004D40_0.75px,transparent_0.75px)] [background-size:28px_28px] opacity-[0.035] pointer-events-none" />

      <div className="mx-auto max-w-7xl relative z-10">
        {/* Section Header: Editorial Stagger Hierarchy */}
        <div className="text-center max-w-3xl mx-auto">
          <EditorialTextReveal delay={40} duration={400}>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#007d6e] mb-2.5">
              <span className="material-symbols-outlined text-sm" aria-hidden="true">
                alt_route
              </span>
              <span>Công nghệ tối ưu lịch trình thông minh</span>
            </div>
          </EditorialTextReveal>

          <EditorialTextReveal delay={120} duration={480}>
            <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-[#121E28] tracking-tight">
              Lập Kế Hoạch 1 Ngày Hoàn Hảo cùng TripMate
            </h2>
          </EditorialTextReveal>

          <EditorialTextReveal delay={200} duration={480}>
            <p className="mt-2.5 text-slate-600 text-sm sm:text-base leading-relaxed text-pretty">
              Hệ thống phân tích lịch trình thông minh: Tự động cân đối giờ mở cửa của từng điểm đến,
              tránh nắng gắt buổi trưa, bắt trọn khoảnh khắc hoàng hôn biển và tối ưu thời gian di chuyển.
            </p>
          </EditorialTextReveal>
        </div>

        {/* Interactive Workspace Container */}
        <EditorialTextReveal delay={260} duration={550}>
          <div className="relative mt-8 group/workspace">
            {/* Dynamic Soft Ambient Glow standing behind the CSP parameter workspace */}
            <div className="absolute -inset-3 sm:-inset-4 rounded-3xl bg-gradient-to-r from-teal-500/18 via-sky-400/12 to-amber-500/15 blur-2xl pointer-events-none opacity-45 group-hover/workspace:opacity-75 transition-opacity duration-700 animate-orb-2" />

            <div className="relative z-10 bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs">
            {/* Controls Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              {/* City Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 mr-1">
                  Điểm đến:
                </span>
                <button
                  type="button"
                  onClick={() => handleCityChange('danang')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 btn-press ${
                    activeCity === 'danang'
                      ? 'bg-[#007d6e] text-white shadow-xs scale-[1.02]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">waves</span>
                  <span>Đà Nẵng</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCityChange('hoian')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 btn-press ${
                    activeCity === 'hoian'
                      ? 'bg-[#d97706] text-white shadow-xs scale-[1.02]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">festival</span>
                  <span>Hội An</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCityChange('hue')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 btn-press ${
                    activeCity === 'hue'
                      ? 'bg-[#7c3aed] text-white shadow-xs scale-[1.02]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">account_balance</span>
                  <span>Cố Đô Huế</span>
                </button>
              </div>

              {/* Pace Selector & Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handlePaceChange('relaxed')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      selectedPace === 'relaxed'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Thong thả
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePaceChange('balanced')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      selectedPace === 'balanced'
                        ? 'bg-white text-[#007d6e] shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Cân bằng
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePaceChange('fast')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      selectedPace === 'fast'
                        ? 'bg-white text-purple-700 shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Khám phá tối đa
                  </button>
                </div>

                {/* Re-solve trigger */}
                <button
                  type="button"
                  onClick={runSolverAnimation}
                  disabled={isSolving}
                  className="px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50 text-[#007d6e] hover:bg-teal-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 btn-press"
                >
                  <span className={`material-symbols-outlined text-sm ${isSolving ? 'animate-spin' : ''}`}>
                    sync
                  </span>
                  <span>{isSolving ? 'Đang tối ưu lịch trình...' : 'Chạy lại'}</span>
                </button>

                {/* Toggle all */}
                <button
                  type="button"
                  onClick={toggleAllNodes}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-medium transition cursor-pointer"
                >
                  {expandedNodes.length === displayedSchedule.length ? 'Thu gọn' : 'Chi tiết'}
                </button>
              </div>
            </div>

            {/* Dynamic CSP Solver Progress Bar */}
            {isSolving && (
              <div className="my-4 p-4 rounded-xl bg-teal-50 border border-teal-200 flex flex-col gap-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs font-bold text-[#007d6e]">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#007d6e] animate-ping" />
                    {solvingStep === 1 && 'Bước 1: Nạp danh mục điểm đến, kiểm tra giờ mở cửa và khoảng cách di chuyển...'}
                    {solvingStep === 2 && 'Bước 2: Cân đối khung giờ hoàng hôn & giảm thiểu nắng trưa...'}
                    {solvingStep === 3 && 'Bước 3: Hoàn tất lịch trình 1 ngày tối ưu theo nhịp độ!'}
                  </span>
                  <span>{solvingStep * 33}%</span>
                </div>
                <div className="w-full h-1.5 bg-teal-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#007d6e] transition-all duration-300"
                    style={{ width: `${solvingStep * 33}%` }}
                  />
                </div>
              </div>
            )}

            {/* Astronomical Constraint Banner */}
            <div className="relative my-5 group/banner">
              {/* Soft twilight colored glow behind the banner */}
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-teal-500/22 via-sky-400/15 to-amber-500/20 blur-xl opacity-40 pointer-events-none animate-orb-1" />
              <div className="relative z-10 p-4 rounded-xl bg-[#111C24] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 border border-teal-400/20">
                  <span className="material-symbols-outlined text-base">wb_twilight</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-teal-300">
                    Ràng buộc thiên văn &amp; Thời khắc hoàng hôn
                  </p>
                  <p className="text-sm font-semibold text-slate-100 mt-0.5">{currentPreset.sunsetEvent}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/15 border border-teal-400/25 text-teal-200">
                  <span className="material-symbols-outlined text-teal-400 text-sm">verified</span>
                  <span>Độ tương thích: <strong className="text-white font-bold">Tối ưu</strong></span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-slate-200">
                  <strong className="text-teal-300 font-bold">{displayedSchedule.length}</strong> điểm dừng
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-slate-200">
                  <strong className="text-amber-300 font-bold">
                    {selectedPace === 'relaxed' ? '6.5 giờ' : selectedPace === 'balanced' ? '8.5 giờ' : currentPreset.totalDuration}
                  </strong>{' '}
                  tổng thời gian
                </span>
              </div>
            </div>
            </div>

            {/* Timeline Nodes */}
            <div className={`space-y-3.5 transition-all duration-300 ${isSolving ? 'opacity-30 blur-[1px]' : 'opacity-100'}`}>
              {displayedSchedule.map((item, index) => {
                const isExpanded = expandedNodes.includes(index);
                return (
                  <div
                    key={item.title}
                    onClick={() => toggleNode(index)}
                    style={{
                      animationDelay: `${index * 80}ms`,
                      animationDuration: '400ms',
                      animationFillMode: 'both',
                    }}
                    className={`group rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden animate-in fade-in slide-in-from-bottom-2 ${
                      isExpanded
                        ? 'border-[#007d6e] bg-white shadow-md'
                        : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      {/* Left Icon & Information */}
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-2xl border flex items-center justify-center font-bold text-sm shadow-xs transition-colors shrink-0 overflow-hidden ${
                            isExpanded
                              ? 'bg-[#007d6e] text-white border-[#007d6e]'
                              : 'bg-white border-slate-200 text-[#007d6e] group-hover:bg-[#007d6e] group-hover:text-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg select-none">{item.icon}</span>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-xs font-mono font-bold text-[#007d6e] bg-teal-50/90 px-2 py-0.5 rounded-md border border-teal-200/60 shadow-2xs">
                              {item.time}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/50">
                              {item.duration}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200/50">
                              {item.tag}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-[#00152a] group-hover:text-[#007d6e] transition-colors">
                            {item.title}
                          </h4>
                        </div>
                      </div>

                      {/* Right summary & Chevron */}
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="text-xs text-slate-500 hidden md:block">
                          Giờ mở cửa: <strong>{item.openingHours}</strong>
                        </span>
                        <span
                          className={`material-symbols-outlined text-slate-400 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-[#007d6e]' : ''
                          }`}
                        >
                          expand_more
                        </span>
                      </div>
                    </div>

                    {/* Expanded Detail Drawer */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-teal-50/20 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
                        <div className="flex items-start gap-2 max-w-xl">
                          <span className="material-symbols-outlined text-base text-[#007d6e] shrink-0 mt-0.5">
                            psychology
                          </span>
                          <p>
                            <strong className="text-slate-900">Lý do tối ưu:</strong>{' '}
                            {item.constraintNote}
                          </p>
                        </div>
                        <div className="text-[11px] text-slate-400 sm:text-right shrink-0">
                          Buffer di chuyển: {selectedPace === 'relaxed' ? '30 phút' : '15-20 phút'} ✓
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Call to Action */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500">
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[#007d6e]">check_circle</span>
                <span>Lịch trình đã tự động loại trừ tắc đường và đảm bảo thời gian dự phòng an toàn.</span>
              </p>
              <Link
                href={ROUTES.tours}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#007d6e] hover:text-teal-800 hover:underline cursor-pointer"
              >
                <span>Xem các tour có sẵn cùng tuyến</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>
          </div>
        </EditorialTextReveal>
      </div>
    </section>
  );
}
