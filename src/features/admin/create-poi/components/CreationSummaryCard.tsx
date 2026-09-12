export function CreationSummaryCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <span className="material-symbols-outlined text-[#006b5f] text-lg">analytics</span>
        <h2 className="text-sm font-bold text-slate-900">Creation Summary</h2>
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-500">Initial Status</span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Active (on creation)
        </span>
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-500">Scenic Score</span>
        <span className="text-slate-400 italic text-[11px]">Not available yet</span>
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-500">Photo Rating</span>
        <span className="text-slate-400 italic text-[11px]">Not available yet</span>
      </div>
      <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">Target API: POST /api/v1/admin/pois</p>
    </div>
  );
}

