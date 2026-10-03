import type { SimulatorState } from '../types/poi';

interface StateSimulatorBarProps {
  currentState: SimulatorState;
  onStateChange: (state: SimulatorState) => void;
  onReset: () => void;
}

const SIMULATOR_OPTIONS: { id: SimulatorState; label: string; dotColor: string }[] = [
  { id: 'valid', label: 'A. Filled Valid Form', dotColor: 'bg-white' },
  { id: 'empty', label: 'B. Empty Form', dotColor: 'bg-slate-400' },
  { id: 'errors', label: 'C. Validation Errors', dotColor: 'bg-red-500' },
  { id: 'submitting', label: 'D. Submitting', dotColor: 'bg-amber-500' },
  { id: 'conflict409', label: 'E. 409 Duplicate Modal', dotColor: 'bg-[#102a43]' },
  { id: 'success', label: 'F. 201 Success', dotColor: 'bg-[#6df5e1]' },
  { id: 'notFound404', label: 'G. 404 Reference Error', dotColor: 'bg-red-800' },
];

export function StateSimulatorBar({ currentState, onStateChange, onReset }: StateSimulatorBarProps) {
  return (
    <div className="sticky top-16 z-30 bg-[#f2f4f7] px-4 sm:px-6 md:px-8 py-3 shadow-xs border-b border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 max-w-[1440px] mx-auto">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#006b5f]">tune</span>
          <span className="text-xs uppercase tracking-wider text-slate-600 font-semibold">
            Demo State Control (UC-52 / TM-98)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-200/80">
          {SIMULATOR_OPTIONS.map((opt) => {
            const isActive = currentState === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onStateChange(opt.id)}
                aria-pressed={isActive}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#006b5f] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-300/60'
                }`}
              >
                {isActive ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                ) : (
                  <span className={`w-1.5 h-1.5 rounded-full ${opt.dotColor}`} />
                )}
                <span>{opt.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={onReset}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-300/80 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">refresh</span>
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
}
