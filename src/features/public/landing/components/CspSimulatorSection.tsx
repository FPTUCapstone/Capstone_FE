'use client';

import { useState, useEffect } from 'react';
import { CSP_PRESETS } from '@/data/landingData';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export function CspSimulatorSection() {
  const [selectedCity, setSelectedCity] = useState<'danang' | 'hoian' | 'hue'>('danang');
  const [selectedPace, setSelectedPace] = useState<'relaxed' | 'balanced' | 'fast'>('balanced');
  const [isSolving, setIsSolving] = useState(false);
  const [solvingStep, setSolvingStep] = useState(0);
  const [expandedNodes, setExpandedNodes] = useState<number[]>([0]);

  const currentPreset = CSP_PRESETS[selectedCity];

  useEffect(() => {
    function handleExternalCitySelect(e: Event) {
      const customEvent = e as CustomEvent<string>;
      const city = customEvent.detail;
      if (city === 'danang' || city === 'hoian' || city === 'hue') {
        setSelectedCity(city);
        runSolverAnimation();
        const section = document.getElementById('csp-simulator');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }

    window.addEventListener('tripmate:select-city', handleExternalCitySelect);
    return () => window.removeEventListener('tripmate:select-city', handleExternalCitySelect);
  }, []);

  function handleCityChange(city: 'danang' | 'hoian' | 'hue') {
    if (city === selectedCity && !isSolving) return;
    setSelectedCity(city);
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
    setIsSolving(true);
    setSolvingStep(1);
    setTimeout(() => setSolvingStep(2), 350);
    setTimeout(() => setSolvingStep(3), 700);
    setTimeout(() => {
      setIsSolving(false);
      setSolvingStep(0);
    }, 1000);
  }

  // Filter or limit nodes depending on selected pace
  const displayedSchedule =
    selectedPace === 'relaxed'
      ? currentPreset.schedule.slice(0, 3)
      : selectedPace === 'balanced'
      ? currentPreset.schedule.slice(0, 4)
      : currentPreset.schedule;

  return (
    <section id="csp-simulator" className="scroll-mt-20 py-16 sm:py-24 bg-gradient-to-b from-[#f4f7fc] via-white to-[#f4f7fc] px-4 sm:px-8 border-b border-slate-200 relative">
      <div className="mx-auto max-w-7xl">
        
        {/* Section Header */}
        <ScrollReveal animation="fade-up">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#9edbd2] bg-teal-50 px-3.5 py-1.5 text-xs font-black uppercase tracking-widest text-[#007d6e] mb-4 shadow-xs">
              <span className="material-symbols-outlined text-base">route</span>
              <span>Công Nghệ Lập Lịch Trình Tối Ưu Độc Quyền</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#00152a] tracking-tight">
              Lập Kế Hoạch 1 Ngày Hoàn Hảo với <span className="text-[#007d6e]">Công Nghệ Tối Ưu CSP</span>
            </h2>
            <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
              Thuật toán giải bài toán thỏa mãn đa ràng buộc (CSP) thông minh: Tự động cân đối giờ mở cửa của từng điểm đến, 
              tránh nắng gắt buổi trưa, bắt trọn khoảnh khắc hoàng hôn biển tuyệt đẹp và tối ưu thời gian di chuyển.
            </p>
          </div>
        </ScrollReveal>

        {/* Interactive Workspace Container */}
        <ScrollReveal animation="fade-up" delay={150}>
          <div className="mt-10 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          
          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-slate-100">
            {/* City Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Điểm đến:</span>
              <button
                type="button"
                onClick={() => handleCityChange('danang')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  selectedCity === 'danang'
                    ? 'bg-[#007d6e] text-white shadow-md shadow-teal-700/25 scale-[1.02]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-sm">waves</span>
                <span>Đà Nẵng</span>
              </button>
              <button
                type="button"
                onClick={() => handleCityChange('hoian')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  selectedCity === 'hoian'
                    ? 'bg-[#d97706] text-white shadow-md shadow-amber-700/25 scale-[1.02]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-sm">festival</span>
                <span>Hội An</span>
              </button>
              <button
                type="button"
                onClick={() => handleCityChange('hue')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  selectedCity === 'hue'
                    ? 'bg-[#7c3aed] text-white shadow-md shadow-purple-700/25 scale-[1.02]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-sm">account_balance</span>
                <span>Cố Đô Huế</span>
              </button>
            </div>

            {/* Pace Selector & Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => handlePaceChange('relaxed')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedPace === 'relaxed'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Thong thả
                </button>
                <button
                  type="button"
                  onClick={() => handlePaceChange('balanced')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedPace === 'balanced'
                      ? 'bg-white text-[#007d6e] shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Cân bằng
                </button>
                <button
                  type="button"
                  onClick={() => handlePaceChange('fast')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedPace === 'fast'
                      ? 'bg-white text-purple-700 shadow-xs'
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
                className="px-3.5 py-2 rounded-xl border border-teal-200 bg-teal-50 text-[#007d6e] hover:bg-teal-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-sm ${isSolving ? 'animate-spin' : ''}`}>
                  sync
                </span>
                <span>{isSolving ? 'Đang giải CSP...' : 'Chạy lại'}</span>
              </button>

              {/* Toggle all */}
              <button
                type="button"
                onClick={toggleAllNodes}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-medium transition cursor-pointer"
              >
                {expandedNodes.length === displayedSchedule.length ? 'Thu gọn' : 'Chi tiết'}
              </button>
            </div>
          </div>

          {/* Dynamic CSP Solver Progress Bar */}
          {isSolving && (
            <div className="my-4 p-4 rounded-2xl bg-teal-50 border border-teal-200 flex flex-col gap-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs font-bold text-[#007d6e]">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#007d6e] animate-ping" />
                  {solvingStep === 1 && 'Bước 1: Nạp danh mục điểm đến, kiểm tra giờ mở cửa và thời gian di chuyển...'}
                  {solvingStep === 2 && 'Bước 2: Tối ưu khung giờ vàng ngắm hoàng hôn biển &amp; tránh nắng trưa...'}
                  {solvingStep === 3 && 'Bước 3: Hoàn tất lịch trình 1 ngày lý tưởng, nhịp độ hoàn hảo!'}
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
          <div className="my-6 p-4 rounded-2xl bg-[#00152a] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 border border-teal-400/20">
                <span className="material-symbols-outlined">wb_twilight</span>
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-teal-300">Ràng buộc Thiên văn (Astronomical Constraint)</p>
                <p className="text-sm font-semibold text-slate-100 mt-0.5">{currentPreset.sunsetEvent}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-teal-400 text-sm">verified</span>
                <span>Khả thi: <strong className="text-white">{currentPreset.feasibilityScore}%</strong></span>
              </div>
              <div><strong className="text-white">{displayedSchedule.length}</strong> điểm dừng</div>
              <div><strong className="text-white">{selectedPace === 'relaxed' ? '6.5 giờ' : selectedPace === 'balanced' ? '8.5 giờ' : currentPreset.totalDuration}</strong> tổng thời gian</div>
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
                  className={`group rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                    isExpanded
                      ? 'border-[#007d6e] bg-white shadow-md'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Left Icon & Information */}
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center font-bold text-sm shadow-xs transition-colors shrink-0 overflow-hidden ${
                        isExpanded
                          ? 'bg-[#007d6e] text-white border-[#007d6e]'
                          : 'bg-white border-slate-200 text-[#007d6e] group-hover:bg-[#007d6e] group-hover:text-white'
                      }`}>
                        <span className="material-symbols-outlined text-lg select-none">{item.icon}</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-[#007d6e] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                            {item.time}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md">
                            {item.duration}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
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
                      <span className={`material-symbols-outlined text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#007d6e]' : ''}`}>
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Expanded Detail Drawer */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-teal-50/20 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
                      <div className="flex items-start gap-2 max-w-xl">
                        <span className="material-symbols-outlined text-base text-[#007d6e] shrink-0 mt-0.5">psychology</span>
                        <p>
                          <strong className="text-slate-900">Lý do thuật toán CSP xếp điểm này:</strong> {item.constraintNote}
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
            <a
              href="#tours"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#007d6e] hover:text-teal-800 hover:underline cursor-pointer"
            >
              <span>Xem các tour có sẵn cùng tuyến</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
          </div>

        </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
