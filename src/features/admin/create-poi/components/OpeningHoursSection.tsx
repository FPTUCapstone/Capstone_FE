import type { OperatingScheduleDay, PoiFormData, ValidationErrors } from '../types/poi';

interface OpeningHoursSectionProps {
  formData: PoiFormData;
  errors: ValidationErrors;
  onChange: (field: keyof PoiFormData, value: unknown) => void;
  disabled?: boolean;
}

export function OpeningHoursSection({ formData, errors, onChange, disabled }: OpeningHoursSectionProps) {
  const handleDayChange = (index: number, updatedFields: Partial<OperatingScheduleDay>) => {
    const updated = formData.operating_schedule.map((item, i) => (i === index ? { ...item, ...updatedFields } : item));
    onChange('operating_schedule', updated);
  };

  const handleApplyMonToAll = () => {
    const monday = formData.operating_schedule.find(day => day.day_of_week === 1);
    if (!monday) return;
    const updated = formData.operating_schedule.map((item) => ({
      ...item,
      open_time: monday.open_time,
      close_time: monday.close_time,
      is_open: monday.is_open,
    }));
    onChange('operating_schedule', updated);
  };

  return (
    <section className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 relative">
      <div className="flex flex-wrap items-center justify-between pb-4 gap-2 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#102a43] text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">schedule</span>
          </div>
          <h2 className="text-lg text-[#00152a] font-semibold">5. Operating Schedule</h2>
        </div>
        <button
          type="button"
          disabled={disabled || formData.operating_schedule.length === 0}
          onClick={handleApplyMonToAll}
          className="px-3 py-1.5 rounded-lg bg-[#e6e8eb] hover:bg-slate-300 text-[#00152a] text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">content_copy</span>
          <span>Apply Monday to All Days</span>
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm mb-4 min-h-11">
        <input type="checkbox" disabled={disabled} checked={formData.operating_schedule.length > 0} onChange={event => onChange('operating_schedule', event.target.checked ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((name, index) => ({ day_name: name, day_of_week: (index + 1) % 7, is_open: true, open_time: '', close_time: '' })) : [])} />
        Include opening hours (optional)
      </label>
      {errors.operating_schedule ? <p className="text-xs text-red-600 mb-3">{errors.operating_schedule}</p> : null}
      {/* Schedule Day Rows */}
      <div className="space-y-2">
        {formData.operating_schedule.map((day, idx) => (
          <div
            key={day.day_name}
            className={`flex flex-wrap items-center justify-between p-2.5 rounded-lg transition-colors gap-3 ${
              day.is_open ? 'bg-[#f2f4f7] hover:bg-slate-200/60' : 'bg-slate-100 opacity-60'
            }`}
          >
            <div className="w-28 text-xs font-semibold text-[#00152a]">{day.day_name}</div>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  aria-label={`${day.day_name} open`}
                  disabled={disabled}
                  checked={day.is_open}
                  onChange={(e) => handleDayChange(idx, { is_open: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#006b5f]" />
              </label>
              <span className={`text-xs font-semibold w-14 ${day.is_open ? 'text-[#006b5f]' : 'text-slate-400'}`}>
                {day.is_open ? 'Open' : 'Closed'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="time"
                step="1"
                aria-label={`${day.day_name} opening time`}
                aria-invalid={Boolean(errors[`operating_schedule.${day.day_of_week}`])}
                disabled={disabled || !day.is_open}
                value={day.open_time}
                onChange={(e) => handleDayChange(idx, { open_time: e.target.value })}
                className="min-w-0 px-2 py-2 rounded bg-white text-slate-900 font-mono text-sm border border-slate-300 w-28 sm:w-32 text-center font-semibold"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="time"
                step="1"
                aria-label={`${day.day_name} closing time`}
                aria-invalid={Boolean(errors[`operating_schedule.${day.day_of_week}`])}
                disabled={disabled || !day.is_open}
                value={day.close_time}
                onChange={(e) => handleDayChange(idx, { close_time: e.target.value })}
                className="min-w-0 px-2 py-2 rounded bg-white text-slate-900 font-mono text-sm border border-slate-300 w-28 sm:w-32 text-center font-semibold"
              />
            </div>
            {errors[`operating_schedule.${day.day_of_week}`] ? <p className="w-full text-xs text-red-600">{errors[`operating_schedule.${day.day_of_week}`]}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
