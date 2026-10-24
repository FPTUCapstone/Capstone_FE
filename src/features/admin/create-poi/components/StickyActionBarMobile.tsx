interface Props {
  onSubmit: () => void;
  onReset: () => void;
  submitting: boolean;
  disabled: boolean;
  errorCount: number;
}

export function StickyActionBarMobile({ onSubmit, onReset, submitting, disabled, errorCount }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 bg-[#F7F6F2]/95 backdrop-blur-md border-t border-[#E6E4DD] px-4 py-3 flex items-center gap-3 shadow-[0_-4px_16px_rgba(28,41,35,0.08)] lg:hidden">
      <button
        type="button"
        disabled={submitting}
        onClick={onReset}
        className="w-1/3 h-12 rounded-xl border border-[#E6E4DD] text-[#1C2923] font-semibold text-sm hover:bg-white active:scale-95 transition disabled:opacity-50 flex items-center justify-center cursor-pointer"
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onSubmit}
        className="flex-1 h-12 rounded-xl bg-[#245747] hover:bg-[#1C2923] active:scale-95 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#245747]/20 transition disabled:opacity-50 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px]">save</span>
        <span>{submitting ? 'Saving...' : `Save POI${errorCount ? ` (${errorCount} errors)` : ''}`}</span>
      </button>
    </div>
  );
}
