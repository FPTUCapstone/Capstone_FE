import type { PoiFormData } from '../types/poi';
import { POI_CATEGORIES } from '../mock/defaultPoiData';
import { BuildingIcon, ClockIcon, MapPinIcon, SunIcon } from './icons/PoiIcons';

interface CreationSummaryCardProps {
  formData: PoiFormData;
  isValid: boolean;
  errorCount: number;
}

export function CreationSummaryCard({ formData, isValid, errorCount }: CreationSummaryCardProps) {
  const category = POI_CATEGORIES.find((c) => c.id === formData.category_id);
  const openDaysCount = formData.operating_schedule.filter((h) => h.is_open).length;

  let filledFields = 0;
  const totalRequired = 6;
  if (formData.name.trim()) filledFields++;
  if (formData.category_id) filledFields++;
  if (formData.address.trim()) filledFields++;
  if (formData.latitude) filledFields++;
  if (formData.longitude) filledFields++;
  if (formData.tags.length > 0) filledFields++;
  const completionPercent = Math.min(100, Math.round((filledFields / totalRequired) * 100));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <BuildingIcon className="h-4 w-4 text-[#057A55]" />
          Live Creation Summary
        </h3>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            isValid ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-800 border border-red-300'
          }`}
        >
          {isValid ? '100% Valid' : `${errorCount} Errors`}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
          <span>Form Completeness</span>
          <span>{completionPercent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full transition-all duration-300 ${
              completionPercent === 100 ? 'bg-[#057A55]' : 'bg-blue-500'
            }`}
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* Live Preview Card */}
      <div className="rounded-xl border border-slate-200 bg-[#F9FAFB] p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-snug">
              {formData.name || <span className="italic text-slate-400">Untitled Point of Interest</span>}
            </h4>
            <span className="mt-1 inline-block rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
              {category?.name || 'No category selected'}
            </span>
          </div>
          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
            Active
          </span>
        </div>

        <div className="text-xs text-slate-600 space-y-1">
          <p className="flex items-start gap-1.5">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
            <span className="line-clamp-2">{formData.address || 'Address not specified'}</span>
          </p>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 pl-5">
            <span>Lat: {formData.latitude || '0.00'}</span>
            <span>•</span>
            <span>Lng: {formData.longitude || '0.00'}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
          <span className="rounded-md bg-white px-2 py-1 font-semibold text-slate-700 border border-slate-200">
            {formData.environment_setting}
          </span>
          <span className="rounded-md bg-white px-2 py-1 font-semibold text-slate-700 border border-slate-200 flex items-center gap-1">
            <ClockIcon className="h-3 w-3 text-slate-500" />
            {formData.avg_visit_duration_minutes || 0} mins
          </span>
          {formData.has_shelter ? (
            <span className="rounded-md bg-emerald-50 px-2 py-1 font-semibold text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <SunIcon className="h-3 w-3 text-emerald-600" />
              Has Shelter
            </span>
          ) : null}
        </div>

        {formData.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1 pt-1">
            {formData.tags.map((t) => (
              <span key={t} className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                #{t}
              </span>
            ))}
          </div>
        ) : null}

        <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-200/60 pt-2">
          <span>Weekly Schedule:</span>
          <span className="font-semibold text-slate-700">{openDaysCount} / 7 days open</span>
        </div>
      </div>
    </div>
  );
}
