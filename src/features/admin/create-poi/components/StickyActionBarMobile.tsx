interface Props {
  onSubmit: () => void;
  onReset: () => void;
  submitting: boolean;
  disabled: boolean;
  errorCount: number;
}

export function StickyActionBarMobile({ onSubmit, onReset, submitting, disabled, errorCount }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden">
      <button
        type="button"
        disabled={submitting}
        onClick={onReset}
        className="w-1/3 h-12 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 active:scale-95 transition disabled:opacity-50 flex items-center justify-center"
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onSubmit}
        className="flex-1 h-12 rounded-xl bg-[#006b5f] hover:bg-[#0f635c] active:scale-95 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-teal-900/10 transition disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[18px]">save</span>
        <span>{submitting ? 'Saving...' : `Save POI${errorCount ? ` (${errorCount} errors)` : ''}`}</span>
      </button>
    </div>
  );
}

