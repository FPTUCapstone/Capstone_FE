'use client';

import { useState, useEffect } from 'react';
import { VERIFIED_TOURS, VerifiedTour } from '@/data/landingData';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export function FeaturedToursSection() {
  const [filterCity, setFilterCity] = useState<'all' | 'Đà Nẵng' | 'Hội An' | 'Huế'>('all');
  const [selectedTour, setSelectedTour] = useState<VerifiedTour | null>(null);
  const [ticketIssued, setTicketIssued] = useState(false);
  const [qrSecondsLeft, setQrSecondsLeft] = useState(30);

  const filtered = filterCity === 'all'
    ? VERIFIED_TOURS
    : VERIFIED_TOURS.filter((t) => t.city === filterCity);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (ticketIssued) {
      interval = setInterval(() => {
        setQrSecondsLeft((prev) => (prev <= 1 ? 30 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [ticketIssued]);

  function handleOpenTour(tour: VerifiedTour) {
    setSelectedTour(tour);
    setTicketIssued(false);
    setQrSecondsLeft(30);
  }

  function handleConfirmBooking() {
    setTicketIssued(true);
    setQrSecondsLeft(30);
  }

  function handleCloseModal() {
    setSelectedTour(null);
    setTicketIssued(false);
  }

  return (
    <section id="tours" className="scroll-mt-20 py-16 sm:py-24 bg-[#f4f7fc] px-4 sm:px-8 border-b border-slate-200">
      <div className="mx-auto max-w-7xl">
        
        {/* Section Header */}
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1.5 text-xs font-black uppercase tracking-widest text-[#007d6e] mb-3">
                <span className="material-symbols-outlined text-base">verified</span>
                <span>Sàn Giao Dịch Tour Bản Địa Được Bảo Chứng</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#00152a] tracking-tight">
                Tour Trải Nghiệm Bản Địa <span className="text-[#007d6e]">Đã Kiểm Duyệt</span>
              </h2>
              <p className="mt-3 text-slate-500 text-sm sm:text-base max-w-2xl leading-relaxed">
                Trực tiếp từ các nhà tổ chức tour (Tour Operators) uy tín tại Miền Trung. 
                Tích hợp vé điện tử Dynamic QR, thanh toán ký quỹ an toàn và gợi ý tour tương thích trên 80%.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterCity('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterCity === 'all'
                    ? 'bg-[#00152a] text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Tất cả ({VERIFIED_TOURS.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCity('Đà Nẵng')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterCity === 'Đà Nẵng'
                    ? 'bg-[#007d6e] text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Đà Nẵng
              </button>
              <button
                type="button"
                onClick={() => setFilterCity('Hội An')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterCity === 'Hội An'
                    ? 'bg-[#d97706] text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Hội An
              </button>
              <button
                type="button"
                onClick={() => setFilterCity('Huế')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterCity === 'Huế'
                    ? 'bg-[#7c3aed] text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Cố Đô Huế
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Tours Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((tour, idx) => (
            <ScrollReveal
              key={tour.id}
              animation="fade-up"
              delay={idx * 120}
              duration={700}
            >
              <div
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-teal-300 card-hover-lift transition-all duration-300 flex flex-col group h-full"
              >
                {/* Tour Hero Image */}
                <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                  <img
                    src={tour.image}
                    alt={tour.title}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/95 text-slate-900 backdrop-blur-md shadow-xs">
                    {tour.tag}
                  </span>
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-teal-600 text-white backdrop-blur-md shadow-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">auto_awesome</span>
                    <span>Match {tour.aiMatchScore}%</span>
                  </span>
                </div>

                {/* Tour Body */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                      <span className="font-semibold text-slate-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-[#007d6e]">storefront</span>
                        {tour.operator}
                      </span>
                      <span className="text-amber-500 font-bold flex items-center gap-0.5">
                        ★ {tour.rating}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#00152a] line-clamp-2 group-hover:text-[#007d6e] transition-colors">
                      {tour.title}
                    </h3>

                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {tour.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">pin_drop</span>
                        {tour.city}
                      </span>
                    </div>

                    {/* Highlights */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {tour.highlights.slice(0, 2).map((h) => (
                        <span key={h} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          ✓ {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Price & CTA */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Giá từ:</span>
                      <span className="text-base font-black text-[#007d6e]">{tour.price}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenTour(tour)}
                      className="px-3.5 py-2 rounded-xl bg-[#00152a] hover:bg-[#007d6e] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* Tour Detail & Booking Modal */}
      {selectedTour && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            
            {!ticketIssued ? (
              <>
                {/* Modal Header Image */}
                <div className="relative aspect-video overflow-hidden rounded-t-3xl bg-slate-100">
                  <img src={selectedTour.image} alt={selectedTour.title} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-teal-600 text-white shadow-xs">
                      {selectedTour.operatorBadge}
                    </span>
                    <h3 className="text-lg font-black mt-2 leading-tight drop-shadow-md">{selectedTour.title}</h3>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 flex flex-col gap-5">
                  
                  {/* Meta stats */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Đơn vị tổ chức:</span>
                      <strong className="text-slate-900 font-bold">{selectedTour.operator}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Thời lượng:</span>
                      <strong className="text-slate-900 font-bold">{selectedTour.duration}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Đánh giá:</span>
                      <strong className="text-amber-600 font-bold">★ {selectedTour.rating} ({selectedTour.reviewCount})</strong>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Trải nghiệm bao gồm:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                      {selectedTour.highlights.map((h) => (
                        <div key={h} className="flex items-center gap-1.5 p-2 rounded-xl bg-teal-50/60 border border-teal-100 font-medium">
                          <span className="material-symbols-outlined text-sm text-[#007d6e]">check_circle</span>
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic QR Ticket & Escrow Guarantee */}
                  <div className="p-4 rounded-2xl bg-[#00152a] text-white flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-3xl text-teal-300">qr_code_2</span>
                      <div>
                        <p className="text-xs font-bold text-white">Dynamic QR E-Ticket &amp; Escrow</p>
                        <p className="text-[11px] text-slate-300">Mã hóa chống vé giả • Hoàn 100% nếu hủy do bão lũ thời tiết</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-teal-400/20 text-teal-300 border border-teal-400/30 shrink-0">
                      An toàn 100%
                    </span>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">Tổng thanh toán:</span>
                      <span className="text-2xl font-black text-[#007d6e]">{selectedTour.price}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                      >
                        Đóng
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmBooking}
                        className="px-6 py-2.5 rounded-xl bg-[#007d6e] hover:bg-[#006b5f] text-white text-xs font-bold transition shadow-md shadow-teal-700/25 cursor-pointer flex items-center gap-2"
                      >
                        <span>Xác nhận Đặt tour &amp; Cấp vé QR</span>
                        <span className="material-symbols-outlined text-sm">confirmation_number</span>
                      </button>
                    </div>
                  </div>

                </div>
              </>
            ) : (
              /* Simulated Dynamic Boarding Pass / E-Ticket */
              <div className="p-6 sm:p-8 flex flex-col gap-5 bg-gradient-to-b from-teal-900 to-[#00152a] text-white">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-2xl text-teal-400">check_circle</span>
                    <div>
                      <h3 className="font-black text-base text-white">Đặt Tour Thành Công!</h3>
                      <p className="text-xs text-teal-300">Vé điện tử Dynamic QR bảo mật cao</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>

                {/* Simulated Digital Pass Card */}
                <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4 relative overflow-hidden">
                  <div className="w-full flex items-center justify-between text-xs pb-3 border-b border-dashed border-slate-200">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Mã đặt vé</p>
                      <p className="font-mono font-black text-slate-900 text-sm">#TM-PASS-2026-9921</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Trạng thái Escrow</p>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        ĐÃ KÝ QUỸ AN TOÀN
                      </span>
                    </div>
                  </div>

                  <div className="w-full text-center">
                    <h4 className="font-black text-sm text-slate-900 line-clamp-1">{selectedTour.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedTour.operator} • {selectedTour.duration}</p>
                  </div>

                  {/* QR Code Graphics Simulation */}
                  <div className="relative p-4 rounded-2xl bg-slate-50 border-2 border-[#007d6e] shadow-md flex flex-col items-center">
                    <svg className="w-44 h-44 text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                      {/* Corner markers */}
                      <rect x="5" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" rx="4" />
                      <rect x="12" y="12" width="11" height="11" />
                      
                      <rect x="70" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" rx="4" />
                      <rect x="77" y="12" width="11" height="11" />

                      <rect x="5" y="70" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" rx="4" />
                      <rect x="12" y="77" width="11" height="11" />

                      {/* Simulated QR data grid blocks */}
                      <rect x="36" y="8" width="6" height="6" />
                      <rect x="46" y="8" width="8" height="6" />
                      <rect x="58" y="8" width="6" height="6" />
                      <rect x="36" y="18" width="12" height="6" />
                      <rect x="52" y="18" width="10" height="6" />
                      <rect x="8" y="36" width="10" height="8" />
                      <rect x="22" y="36" width="6" height="6" />
                      <rect x="36" y="36" width="12" height="12" />
                      <rect x="54" y="36" width="8" height="6" />
                      <rect x="68" y="36" width="12" height="6" />
                      <rect x="84" y="36" width="8" height="8" />
                      <rect x="8" y="50" width="8" height="6" />
                      <rect x="20" y="50" width="12" height="6" />
                      <rect x="36" y="52" width="8" height="12" />
                      <rect x="48" y="50" width="14" height="6" />
                      <rect x="66" y="50" width="8" height="14" />
                      <rect x="78" y="50" width="14" height="6" />
                      <rect x="36" y="70" width="10" height="8" />
                      <rect x="50" y="70" width="8" height="8" />
                      <rect x="62" y="70" width="12" height="6" />
                      <rect x="78" y="70" width="14" height="8" />
                      <rect x="36" y="82" width="14" height="10" />
                      <rect x="54" y="82" width="8" height="10" />
                      <rect x="66" y="80" width="10" height="12" />
                      <rect x="80" y="82" width="12" height="10" />
                    </svg>

                    {/* Rotating TOTP badge */}
                    <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[11px] font-mono font-bold text-[#007d6e]">
                      <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                      <span>Làm mới mã sau: {qrSecondsLeft}s</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 text-center max-w-sm">
                    Mã QR bảo mật xoay vòng liên tục theo chu kỳ 30 giây để ngăn chặn gian lận bán lại hoặc chụp màn hình.
                  </p>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-300">Đã lưu vào Ví vé Mobile</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-5 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-black transition cursor-pointer"
                    >
                      Hoàn tất &amp; Đóng
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </section>
  );
}
