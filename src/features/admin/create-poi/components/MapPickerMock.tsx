import { DANANG_COORDINATE_PRESETS } from '../mock/defaultPoiData';

interface MapPickerMockProps {
  latitude: number | string;
  longitude: number | string;
  onSelectCoordinates: (lat: number, lng: number, address?: string) => void;
  disabled?: boolean;
}

export function MapPickerMock({ latitude, longitude, onSelectCoordinates, disabled }: MapPickerMockProps) {
  return (
    <div className="space-y-3">
      {/* Interactive Map Container */}
      <div className="relative rounded-xl overflow-hidden bg-[#e0e3e6] h-72 shadow-inner border border-slate-200">
        {/* Simulated Map Canvas (SVG Vector Topography from Stitch) */}
        <svg className="absolute inset-0 w-full h-full text-slate-400/40" fill="none" preserveAspectRatio="none" viewBox="0 0 800 450">
          <path d="M 520 0 Q 560 180 500 300 T 540 450 L 800 450 L 800 0 Z" fill="#d1e4ff" opacity="0.5" />
          <path d="M 220 180 Q 280 140 360 170 T 430 220 Q 370 270 290 250 Z" fill="#e6e8eb" opacity="0.6" stroke="#7e91ac" strokeDasharray="3 3" strokeWidth="1.5" />
          <path d="M 250 190 Q 300 160 340 180 T 390 220 Q 350 250 290 230 Z" fill="#eceef1" opacity="0.7" stroke="#7e91ac" strokeWidth="1.5" />
          <path d="M 0 120 Q 300 140 800 90" stroke="#c3c6ce" strokeWidth="3" />
          <path d="M 0 320 Q 340 280 800 340" stroke="#c3c6ce" strokeWidth="2.5" />
          <path d="M 210 0 L 250 450" stroke="#c3c6ce" strokeWidth="2" />
          <path d="M 440 0 L 410 450" stroke="#c3c6ce" strokeWidth="3.5" />
          <path d="M 480 0 Q 520 190 470 450" stroke="#006b5f" strokeOpacity="0.5" strokeWidth="2.5" />
        </svg>

        {/* Map Controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
          <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-md p-1 flex flex-col items-center border border-slate-200">
            <button className="w-8 h-8 rounded hover:bg-slate-100 flex items-center justify-center text-slate-800" type="button">
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
            <div className="w-5 h-px bg-slate-200 my-0.5" />
            <button className="w-8 h-8 rounded hover:bg-slate-100 flex items-center justify-center text-slate-800" type="button">
              <span className="material-symbols-outlined text-[18px]">remove</span>
            </button>
          </div>
          <button className="bg-white/95 backdrop-blur-md w-10 h-10 rounded-lg shadow-md flex items-center justify-center text-slate-800 hover:bg-slate-100 border border-slate-200" type="button">
            <span className="material-symbols-outlined text-[18px]">layers</span>
          </button>
        </div>

        {/* Spatial Badge */}
        <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-semibold text-slate-700 shadow-xs flex items-center gap-1.5 border border-slate-200">
          <span className="material-symbols-outlined text-[16px] text-[#006b5f]">explore</span>
          <span>Da Nang Spatial Node VN-DN-05</span>
        </div>

        {/* Draggable SVG Pin Marker & Tooltip */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full z-20 flex flex-col items-center">
          <div className="bg-[#00152a] text-white text-xs px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap mb-1 flex items-center gap-1 font-semibold">
            <span className="material-symbols-outlined text-[14px] text-[#6df5e1]">drag_indicator</span>
            <span>{String(latitude).trim() !== '' && String(longitude).trim() !== '' ? `${latitude}°, ${longitude}°` : 'Enter coordinates below'}</span>
          </div>
          <div className="relative flex items-center justify-center">
            <span className="absolute -bottom-1 w-6 h-2 bg-[#00152a]/20 rounded-full blur-[2px]" />
            <svg className="drop-shadow-md" fill="none" height="42" viewBox="0 0 34 42" width="34">
              <path d="M17 0C7.61116 0 0 7.61116 0 17C0 27.5 17 42 17 42C17 42 34 27.5 34 17C34 7.61116 26.3888 0 17 0Z" fill="#006b5f" />
              <circle cx="17" cy="16" fill="#ffffff" r="6.5" />
              <circle cx="17" cy="16" fill="#102a43" r="3.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* Coordinate Presets Bar */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-xs font-semibold text-slate-500 mr-1">Presets:</span>
        {DANANG_COORDINATE_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            disabled={disabled}
            onClick={() => onSelectCoordinates(preset.lat, preset.lng, preset.address)}
            className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 transition-all shadow-2xs"
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
}
