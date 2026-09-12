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
    <section className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-200 relative">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#006b5f] text-xl">schedule</span>
          <h2 className="text-sm sm:text-base text-[#00152a] font-bold">5. Opening Hours</h2>
        </div>
        <button
          type="button"
          disabled={disabled || formData.operating_schedule.length === 0}
          onClick={handleApplyMonToAll}
          className="text-[11px] font-semibold text-[#006b5f] hover:underline disabled:opacity-50"
        >
          Apply to all
        </button>
      </div>

      <label className="flex items-center gap-2 text-xs sm:text-sm mb-3 min-h-8 cursor-pointer">
        <input
          type="checkbox"
          disabled={disabled}
          checked={formData.operating_schedule.length > 0}
          onChange={event => onChange('operating_schedule', event.target.checked ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((name, index) => ({ day_name: name, day_of_week: (index + 1) % 7, is_open: true, open_time: '07:00', close_time: '17:30' })) : [])}
          className="rounded text-[#006b5f] focus:ring-[#006b5f]"
        />
        <span>Include opening hours (optional)</span>
      </label>
      {errors.operating_schedule ? <p className="text-xs text-red-600 mb-3">{errors.operating_schedule}</p> : null}

      {/* Schedule Day Rows */}
      <div className="space-y-2">
        {formData.operating_schedule.map((day, idx) => (
          <div
            key={day.day_name}
            className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl border transition-colors gap-2 ${
              day.is_open ? 'bg-[#f8fafc] border-slate-200' : 'bg-slate-100/70 border-slate-200 opacity-60'
            }`}
          >
            <span className="font-semibold text-slate-800 text-xs w-10 sm:w-12">
              {day.day_name.slice(0, 3)}
            </span>

            <div className="flex items-center gap-1.5 flex-1 justify-center max-w-[200px] sm:max-w-none">
              <input
                type="time"
                step="1"
                aria-label={`${day.day_name} opening time`}
                aria-invalid={Boolean(errors[`operating_schedule.${day.day_of_week}`])}
                disabled={disabled || !day.is_open}
                value={day.open_time}
                onChange={(e) => handleDayChange(idx, { open_time: e.target.value })}
                className="h-8 px-1.5 sm:px-2 rounded-lg bg-white text-slate-800 font-mono text-xs border border-slate-200 focus:border-[#006b5f] outline-none text-center font-medium w-20 sm:w-24 disabled:opacity-50"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="time"
                step="1"
                aria-label={`${day.day_name} closing time`}
                aria-invalid={Boolean(errors[`operating_schedule.${day.day_of_week}`])}
                disabled={disabled || !day.is_open}
                value={day.close_time}
                onChange={(e) => handleDayChange(idx, { close_time: e.target.value })}
                className="h-8 px-1.5 sm:px-2 rounded-lg bg-white text-slate-800 font-mono text-xs border border-slate-200 focus:border-[#006b5f] outline-none text-center font-medium w-20 sm:w-24 disabled:opacity-50"
              />
            </div>

            <button
              type="button"
              disabled={disabled}
              onClick={() => handleDayChange(idx, { is_open: !day.is_open })}
              className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all shrink-0 ${
                day.is_open
                  ? 'bg-teal-100 text-teal-800 hover:bg-teal-200'
                  : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
              }`}
            >
              {day.is_open ? 'Open' : 'Closed'}
            </button>
            {errors[`operating_schedule.${day.day_of_week}`] ? (
              <p className="w-full text-xs text-red-600 mt-1">{errors[`operating_schedule.${day.day_of_week}`]}</p>
            ) : null}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-400 mt-3">Overnight hours are not supported. Times must be within 00:00 - 23:59.</p>
    </section>
  );
}
