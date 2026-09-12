interface Props { onSubmit: () => void; onReset: () => void; submitting: boolean; disabled: boolean; errorCount: number }
export function StickyActionBarMobile({ onSubmit, onReset, submitting, disabled, errorCount }: Props) {
  return <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-slate-200 bg-white p-4 shadow-lg lg:hidden">
    <button type="button" disabled={submitting} onClick={onReset} className="min-h-11 rounded-lg bg-slate-200 px-4 text-sm disabled:opacity-50">Clear</button>
    <button type="button" disabled={disabled} onClick={onSubmit} className="min-h-11 flex-1 rounded-lg bg-[#006b5f] px-4 text-sm font-semibold text-white disabled:opacity-50">{submitting ? 'Saving POI...' : `Save POI${errorCount ? ` (${errorCount} errors)` : ''}`}</button>
  </div>;
}

