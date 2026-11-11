interface Props {
  onSubmit: () => void;
  onReset: () => void;
  submitting: boolean;
  disabled: boolean;
  errorCount: number;
}

export function StickyActionBarMobile({ onSubmit, onReset, submitting, disabled, errorCount }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 bg-[#F7F5EF]/95 backdrop-blur-md border-t border-[#DCE2DD] px-4 py-3 flex items-center gap-3 shadow-[0_-4px_16px_rgba(28,41,35,0.08)] lg:hidden">
      <button
        type="button"
        disabled={submitting}
        onClick={onReset}
        className="w-1/3 h-12 rounded-xl border border-[#DCE2DD] text-[#1C2928] font-semibold text-sm hover:bg-white active:scale-95 transition disabled:opacity-50 flex items-center justify-center cursor-pointer"
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onSubmit}
        className="flex-1 h-12 rounded-xl bg-[#174B4A] hover:bg-[#1C2928] active:scale-95 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#174B4A]/20 transition disabled:opacity-50 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px]">save</span>
        <span>{submitting ? 'Saving...' : `Save POI${errorCount ? ` (${errorCount} errors)` : ''}`}</span>
      </button>
    </div>
  );
}
