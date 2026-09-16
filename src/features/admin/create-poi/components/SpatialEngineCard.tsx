export function SpatialEngineCard() {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0B192C] p-5 text-xs text-slate-300 shadow-md">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-bold tracking-wider text-[11px] text-white">SPATIAL ENGINE</span>
        <span className="rounded bg-blue-900/60 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-300 border border-blue-700/50">
          POSTGIS 3.4
        </span>
      </div>

      <p className="text-[11px] leading-relaxed text-slate-400">
        SRID 4326 (WGS84) Geodetic calculations will index this node into spatial cluster{' '}
        <span className="font-mono font-bold text-emerald-400">VN-DAN-C4</span>.
      </p>
    </div>
  );
}
