import type { PoiFormData } from '../types/poi';

interface PoiSummaryReadinessCardProps {
  formData: PoiFormData;
}

export function PoiSummaryReadinessCard({ formData }: PoiSummaryReadinessCardProps) {
  const hasCoords = String(formData.latitude).trim() !== '' && String(formData.longitude).trim() !== '' && Number.isFinite(Number(formData.latitude)) && Math.abs(Number(formData.latitude)) <= 90 && Number.isFinite(Number(formData.longitude)) && Math.abs(Number(formData.longitude)) <= 180;
  const hasMetadata = Boolean(formData.name.trim() && formData.category_id);
  const hasSchedule = formData.operating_schedule.length === 7;

  return (
    <section className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 relative">
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-lg font-semibold text-[#00152a]">POI Summary & Readiness</h2>
        <span className="w-2.5 h-2.5 rounded-full bg-[#6df5e1] animate-pulse"></span>
      </div>

      {/* Initial State */}
      <div className="p-3.5 rounded-xl bg-[#f2f4f7] flex items-center justify-between mt-3">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-[#006b5f]"></div>
          <span className="text-xs font-semibold text-[#00152a]">Initial State</span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-[#006b5f]/15 text-[#006b5f] text-xs font-semibold">
          Active upon creation
        </span>
      </div>

      {/* Scores Note */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#f2f4f7]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-slate-400">landscape</span>
            <span className="text-sm text-slate-800">Scenic Score</span>
          </div>
          <span className="text-xs italic bg-slate-200 px-2 py-0.5 rounded text-slate-500 font-medium">
            Not available yet
          </span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#f2f4f7]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-slate-400">photo_camera</span>
            <span className="text-sm text-slate-800">Photo Rating</span>
          </div>
          <span className="text-xs italic bg-slate-200 px-2 py-0.5 rounded text-slate-500 font-medium">
            Not available yet
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-3 leading-relaxed">
        Scores are not supplied when creating a POI.
      </p>

      {/* Readiness Checklist */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-3">
          READINESS CHECKLIST
        </div>
        <ul className="space-y-2.5 text-xs font-medium">
          <li className="flex items-center gap-2.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${hasCoords ? 'bg-[#006b5f]/20 text-[#006b5f]' : 'bg-slate-200 text-slate-400'}`}>
              ✓
            </span>
            <span className={hasCoords ? 'text-slate-900 font-semibold' : 'text-slate-500'}>
              Coordinates within valid latitude/longitude ranges
            </span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${hasMetadata ? 'bg-[#006b5f]/20 text-[#006b5f]' : 'bg-slate-200 text-slate-400'}`}>
              ✓
            </span>
            <span className={hasMetadata ? 'text-slate-900 font-semibold' : 'text-slate-500'}>
              Name and category selected
            </span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${hasSchedule ? 'bg-[#006b5f]/20 text-[#006b5f]' : 'bg-slate-200 text-slate-400'}`}>
              ✓
            </span>
            <span className={hasSchedule ? 'text-slate-900 font-semibold' : 'text-slate-500'}>
              {hasSchedule ? '7-day operating schedule supplied' : 'Opening hours are optional'}
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
