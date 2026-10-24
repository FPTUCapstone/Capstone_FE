export function CreationSummaryCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#E6E4DD] p-4 shadow-xs space-y-2.5">
      <div className="flex items-center gap-2 pb-2 border-b border-[#F0EFEA]">
        <span className="material-symbols-outlined text-[#245747] text-lg">analytics</span>
        <h2 className="text-sm font-bold text-[#1C2923]">Creation Summary</h2>
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-[#758B74]">Initial Status</span>
        <span className="px-2 py-0.5 rounded-full bg-[#E8EFEA] text-[#245747] border border-[#D0DFD6] font-semibold text-[11px] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#245747]"></span>
          Active (on creation)
        </span>
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-[#758B74]">Scenic Score</span>
        <span className="text-[#758B74]/70 italic text-[11px]">Not available yet</span>
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-[#758B74]">Photo Rating</span>
        <span className="text-[#758B74]/70 italic text-[11px]">Not available yet</span>
      </div>
      <p className="text-[10px] text-[#758B74] pt-1 border-t border-[#F0EFEA] font-mono">Target API: POST /api/v1/admin/pois</p>
    </div>
  );
}
