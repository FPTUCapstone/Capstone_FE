import type { PoiFormData } from '../types/poi';

interface PoiSummaryReadinessCardProps {
  formData: PoiFormData;
}

export function PoiSummaryReadinessCard({ formData }: PoiSummaryReadinessCardProps) {
  const hasCoords = String(formData.latitude).trim() !== '' && String(formData.longitude).trim() !== '' && Number.isFinite(Number(formData.latitude)) && Math.abs(Number(formData.latitude)) <= 90 && Number.isFinite(Number(formData.longitude)) && Math.abs(Number(formData.longitude)) <= 180;
  const hasMetadata = Boolean(formData.name.trim() && formData.category_id);
  const hasSchedule = formData.operating_schedule.length === 7;

  return (
    <section className="bg-white rounded-2xl p-6 shadow-xs border border-[#E6E4DD] relative">
      <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA]">
        <h2 className="text-base font-semibold text-[#1C2923]">POI Summary & Readiness</h2>
        <span className="w-2.5 h-2.5 rounded-full bg-[#758B74] animate-pulse"></span>
      </div>

      {/* Initial State */}
      <div className="p-3.5 rounded-xl bg-[#F7F6F2] border border-[#E6E4DD] flex items-center justify-between mt-3">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-[#245747]"></div>
          <span className="text-xs font-semibold text-[#1C2923]">Initial State</span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-[#E8EFEA] text-[#245747] text-xs font-semibold border border-[#D0DFD6]">
          Active upon creation
        </span>
      </div>

      {/* Scores Note */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#F7F6F2] border border-[#E6E4DD]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#758B74]">landscape</span>
            <span className="text-sm text-[#1C2923]">Scenic Score</span>
          </div>
          <span className="text-xs italic bg-[#E6E4DD] px-2 py-0.5 rounded text-[#758B74] font-medium">
            Not available yet
          </span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#F7F6F2] border border-[#E6E4DD]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#758B74]">photo_camera</span>
            <span className="text-sm text-[#1C2923]">Photo Rating</span>
          </div>
          <span className="text-xs italic bg-[#E6E4DD] px-2 py-0.5 rounded text-[#758B74] font-medium">
            Not available yet
          </span>
        </div>
      </div>

      <p className="text-xs text-[#758B74] mt-3 leading-relaxed">
        Scores are not supplied when creating a POI.
      </p>

      {/* Readiness Checklist */}
      <div className="mt-5 border-t border-[#F0EFEA] pt-4">
        <div className="text-[10px] uppercase tracking-wider text-[#758B74] font-bold mb-3">
          READINESS CHECKLIST
        </div>
        <ul className="space-y-2.5 text-xs font-medium">
          <li className="flex items-center gap-2.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${hasCoords ? 'bg-[#E8EFEA] text-[#245747]' : 'bg-[#E6E4DD] text-[#758B74]'}`}>
              ✓
            </span>
            <span className={hasCoords ? 'text-[#1C2923] font-semibold' : 'text-[#758B74]'}>
              Coordinates within valid latitude/longitude ranges
            </span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${hasMetadata ? 'bg-[#E8EFEA] text-[#245747]' : 'bg-[#E6E4DD] text-[#758B74]'}`}>
              ✓
            </span>
            <span className={hasMetadata ? 'text-[#1C2923] font-semibold' : 'text-[#758B74]'}>
              Name and category selected
            </span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${hasSchedule ? 'bg-[#E8EFEA] text-[#245747]' : 'bg-[#E6E4DD] text-[#758B74]'}`}>
              ✓
            </span>
            <span className={hasSchedule ? 'text-[#1C2923] font-semibold' : 'text-[#758B74]'}>
              {hasSchedule ? '7-day operating schedule supplied' : 'Opening hours are optional'}
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
