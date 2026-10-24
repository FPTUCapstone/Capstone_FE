interface OperationsCardProps {
  onSave: () => void;
  onCancel: () => void;
  submitting: boolean;
  saveDisabled?: boolean;
}

export function OperationsCard({ onSave, onCancel, submitting, saveDisabled }: OperationsCardProps) {
  return (
    <section className="bg-white rounded-2xl p-6 shadow-xs border border-[#E6E4DD]">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[#758B74] mb-3">
        OPERATIONS
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saveDisabled || submitting}
          className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#245747] text-white hover:bg-[#1C2923] transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">save</span>
          <span>{submitting ? 'Saving POI...' : 'Save POI'}</span>
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#F7F6F2] text-[#1C2923] hover:bg-[#E6E4DD] border border-[#E6E4DD] transition-colors text-center cursor-pointer"
        >
          Cancel & Discard
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-[#F0EFEA] flex items-center justify-between text-[11px] font-mono text-[#758B74]">
        <span>POST /api/v1/admin/pois</span>
        <span>Auth: Admin Token</span>
      </div>
    </section>
  );
}
