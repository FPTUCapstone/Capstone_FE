import type { EnvironmentSetting, PoiFormData, ValidationErrors } from '../types/poi';

interface VisitAttributesSectionProps {
  formData: PoiFormData;
  errors: ValidationErrors;
  onChange: (field: keyof PoiFormData, value: unknown) => void;
  disabled?: boolean;
}

const ENVIRONMENT_OPTIONS: EnvironmentSetting[] = ['Indoor', 'Outdoor', 'Mixed'];

export function VisitAttributesSection({ formData, errors, onChange, disabled }: VisitAttributesSectionProps) {
  return (
    <section className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 relative">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#102a43] text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">nature_people</span>
          </div>
          <h2 className="text-lg text-[#00152a] font-semibold">3. Visit Attributes</h2>
        </div>
        <span className="text-xs text-slate-400 font-medium">Itinerary sizing parameters</span>
      </div>

      <div className="space-y-5">
        {/* Indoor / Outdoor Segmented Control */}
        <div>
          <label className="text-xs font-semibold text-slate-900 block mb-2">
            Environment Setting <span className="text-red-600">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2 bg-[#f2f4f7] p-1.5 rounded-xl">
            {ENVIRONMENT_OPTIONS.map((opt) => {
              const isSelected = formData.environment_setting === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange('environment_setting', opt)}
                  aria-pressed={isSelected}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all text-center flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#006b5f] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt === 'Mixed' ? (
                    <span className="material-symbols-outlined text-[16px]">wb_twilight</span>
                  ) : null}
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration & Shelter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Average Visit Duration */}
          <div>
            <label className="text-xs font-semibold text-slate-900 block mb-1.5" htmlFor="poi-duration">
              Average Visit Duration
            </label>
            <div className="relative">
              <input
                id="poi-duration"
                type="number"
                min="1"
                max="2147483647"
                step="1"
                aria-invalid={Boolean(errors.avg_visit_duration_minutes)}
                disabled={disabled}
                value={formData.avg_visit_duration_minutes}
                onChange={(e) => onChange('avg_visit_duration_minutes', e.target.value)}
                placeholder="60 (default)"
                className={`w-full pl-3.5 pr-14 py-2.5 rounded-lg bg-[#f2f4f7] text-slate-900 text-sm focus:bg-white focus:outline-none focus:shadow-md transition-all border ${
                  errors.avg_visit_duration_minutes ? 'border-red-500 bg-red-50/50' : 'border-transparent'
                }`}
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 font-medium">min</span>
            </div>
            {errors.avg_visit_duration_minutes ? (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{errors.avg_visit_duration_minutes}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">Optional. Leave blank to use 60 minutes.</p>
            )}
          </div>

          {/* Shelter Available Toggle */}
          <div className="flex flex-col justify-between">
            <label className="text-xs font-semibold text-slate-900 mb-1.5">
              Inclement Weather Shelter
            </label>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#f2f4f7] border border-slate-200">
              <span className="text-xs text-slate-800 font-medium">Shelter available on site</span>
              <label htmlFor="shelter-toggle" className="relative inline-flex items-center cursor-pointer">
                <input
                  id="shelter-toggle"
                  type="checkbox"
                  disabled={disabled}
                  checked={formData.has_shelter}
                  onChange={(e) => onChange('has_shelter', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006b5f]" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
