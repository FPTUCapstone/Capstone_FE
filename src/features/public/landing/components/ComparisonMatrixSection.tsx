import { COMPARISON_DATA } from '@/data/landingData';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export function ComparisonMatrixSection() {
  return (
    <section className="py-16 sm:py-24 bg-white px-4 sm:px-8 border-b border-slate-200">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <ScrollReveal animation="fade-up">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#9edbd2] bg-teal-50 px-3.5 py-1.5 text-xs font-black uppercase tracking-widest text-[#007d6e] mb-4">
              <span className="material-symbols-outlined text-base">balance</span>
              <span>So Sánh Năng Lực Vượt Trội</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#00152a] tracking-tight">
              Tại sao chọn <span className="text-[#007d6e]">TripMate</span> thay vì các ứng dụng rời rạc?
            </h2>
            <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
              Hiện nay, du khách phải mất 4–8 giờ kết hợp giữa Google Maps, TripAdvisor, các ứng dụng thời tiết và trang đặt tour nhưng vẫn không tránh được việc bể kế hoạch khi trời mưa hay điểm đến đóng cửa.
            </p>
          </div>
        </ScrollReveal>

        {/* Comparison Table */}
        <ScrollReveal animation="fade-up" delay={150}>
          <div className="mt-12 overflow-x-auto rounded-3xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs sm:text-sm border-collapse bg-white">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <th className="p-4 sm:p-5 font-black text-sm uppercase tracking-wider w-1/3">
                  Tiêu chí so sánh
                </th>
                <th className="p-4 sm:p-5 font-black text-sm text-[#007d6e] bg-teal-50/70 border-x border-teal-100">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-lg">star</span>
                    <span>TripMate Platform</span>
                  </div>
                </th>
                <th className="p-4 sm:p-5 font-bold text-slate-500">Google Maps</th>
                <th className="p-4 sm:p-5 font-bold text-slate-500">TripAdvisor</th>
                <th className="p-4 sm:p-5 font-bold text-slate-500">Klook / OTA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {COMPARISON_DATA.map((row, idx) => (
                <tr key={row.feature} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                  <td className="p-4 sm:p-5">
                    <strong className="block text-slate-900 font-bold">{row.feature}</strong>
                    <span className="text-xs text-slate-500 mt-1 block leading-relaxed">{row.description}</span>
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-[#007d6e] bg-teal-50/40 border-x border-teal-100">
                    <div className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-base text-emerald-600 mt-0.5">check_circle</span>
                      <span>{row.tripmate}</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 text-slate-500">
                    <div className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-base text-slate-300 mt-0.5">cancel</span>
                      <span>{row.googleMaps}</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 text-slate-500">
                    <div className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-base text-slate-300 mt-0.5">cancel</span>
                      <span>{row.tripAdvisor}</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 text-slate-500">
                    <div className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-base text-slate-300 mt-0.5">cancel</span>
                      <span>{row.klook}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
