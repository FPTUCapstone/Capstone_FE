interface OperationsCardProps {
  onSave: () => void;
  onCancel: () => void;
  submitting: boolean;
  saveDisabled?: boolean;
}

export function OperationsCard({ onSave, onCancel, submitting, saveDisabled }: OperationsCardProps) {
  return (
    <section className="bg-white rounded-xl p-6 shadow-xs border border-slate-200">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
        OPERATIONS
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saveDisabled || submitting}
          className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#006b5f] text-white hover:bg-[#006b5f]/90 transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[20px]">save</span>
          <span>{submitting ? 'Saving POI...' : 'Save POI'}</span>
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors text-center"
        >
          Cancel & Discard
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>POST /api/v1/admin/pois</span>
        <span>Auth: Admin Token</span>
      </div>
    </section>
  );
}
