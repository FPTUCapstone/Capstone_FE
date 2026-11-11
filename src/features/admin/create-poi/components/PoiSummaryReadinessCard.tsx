import type { PoiFormData } from '../types/poi';

interface PoiSummaryReadinessCardProps {
  formData: PoiFormData;
}

export function PoiSummaryReadinessCard({ formData }: PoiSummaryReadinessCardProps) {
  const hasCoords = String(formData.latitude).trim() !== '' && String(formData.longitude).trim() !== '' && Number.isFinite(Number(formData.latitude)) && Math.abs(Number(formData.latitude)) <= 90 && Number.isFinite(Number(formData.longitude)) && Math.abs(Number(formData.longitude)) <= 180;
  const hasMetadata = Boolean(formData.name.trim() && formData.category_id);
  const hasSchedule = formData.operating_schedule.length === 7;

  return (
    <section className="bg-white rounded-2xl p-6 shadow-xs border border-[#DCE2DD] relative">
      <div className="flex items-center justify-between pb-3 border-b border-[#F7F5EF]">
        <h2 className="text-base font-semibold text-[#1C2928]">POI Summary & Readiness</h2>
        <span className="w-2.5 h-2.5 rounded-full bg-[#5B6E69] animate-pulse"></span>
      </div>

      {/* Initial State */}
      <div className="p-3.5 rounded-xl bg-[#F7F5EF] border border-[#DCE2DD] flex items-center justify-between mt-3">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-[#174B4A]"></div>
          <span className="text-xs font-semibold text-[#1C2928]">Initial State</span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-[#E8F0EA] text-[#174B4A] text-xs font-semibold border border-[#D0DFD6]">
          Active upon creation
        </span>
      </div>

      {/* Scores Note */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#F7F5EF] border border-[#DCE2DD]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#5B6E69]">landscape</span>
            <span className="text-sm text-[#1C2928]">Scenic Score</span>
          </div>
          <span className="text-xs italic bg-[#DCE2DD] px-2 py-0.5 rounded text-[#5B6E69] font-medium">
            Not available yet
          </span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#F7F5EF] border border-[#DCE2DD]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#5B6E69]">photo_camera</span>
            <span className="text-sm text-[#1C2928]">Photo Rating</span>
          </div>
          <span className="text-xs italic bg-[#DCE2DD] px-2 py-0.5 rounded text-[#5B6E69] font-medium">
            Not available yet
          </span>
        </div>
      </div>

      <p className="text-xs text-[#5B6E69] mt-3 leading-relaxed">
        Scores are not supplied when creating a POI.
      </p>

      {/* Readiness Checklist */}
      <div className="mt-5 border-t border-[#F7F5EF] pt-4">
        <div className="text-[10px] uppercase tracking-wider text-[#5B6E69] font-bold mb-3">
          READINESS CHECKLIST
        </div>
        <ul className="space-y-2.5 text-xs font-medium">
          <li className="flex items-center gap-2.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${hasCoords ? 'bg-[#E8F0EA] text-[#174B4A]' : 'bg-[#DCE2DD] text-[#5B6E69]'}`}>
              ✓
            </span>
            <span className={hasCoords ? 'text-[#1C2928] font-semibold' : 'text-[#5B6E69]'}>
              Coordinates within valid latitude/longitude ranges
            </span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${hasMetadata ? 'bg-[#E8F0EA] text-[#174B4A]' : 'bg-[#DCE2DD] text-[#5B6E69]'}`}>
              ✓
            </span>
            <span className={hasMetadata ? 'text-[#1C2928] font-semibold' : 'text-[#5B6E69]'}>
              Name and category selected
            </span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${hasSchedule ? 'bg-[#E8F0EA] text-[#174B4A]' : 'bg-[#DCE2DD] text-[#5B6E69]'}`}>
              ✓
            </span>
            <span className={hasSchedule ? 'text-[#1C2928] font-semibold' : 'text-[#5B6E69]'}>
              {hasSchedule ? '7-day operating schedule supplied' : 'Opening hours are optional'}
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
