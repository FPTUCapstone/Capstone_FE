interface OperationsCardProps {
  onSave: () => void;
  onCancel: () => void;
  submitting: boolean;
  saveDisabled?: boolean;
}

export function OperationsCard({ onSave, onCancel, submitting, saveDisabled }: OperationsCardProps) {
  return (
    <section className="bg-white rounded-2xl p-6 shadow-xs border border-[#DCE2DD]">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[#5B6E69] mb-3">
        OPERATIONS
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saveDisabled || submitting}
          className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#174B4A] text-white hover:bg-[#1C2928] transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">save</span>
          <span>{submitting ? 'Saving POI...' : 'Save POI'}</span>
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#F7F5EF] text-[#1C2928] hover:bg-[#DCE2DD] border border-[#DCE2DD] transition-colors text-center cursor-pointer"
        >
          Cancel & Discard
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-[#F7F5EF] flex items-center justify-between text-[11px] font-mono text-[#5B6E69]">
        <span>POST /api/v1/admin/pois</span>
        <span>Auth: Admin Token</span>
      </div>
    </section>
  );
}
