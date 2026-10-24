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
      {/* Illustrative Map Preview */}
      <div className="relative rounded-xl overflow-hidden bg-[#EAE8E1] h-72 shadow-inner border border-[#E6E4DD]">
        {/* Simulated Map Canvas (SVG Vector Topography with Forest & Warm Ivory touches) */}
        <svg className="absolute inset-0 w-full h-full text-[#758B74]/30" fill="none" preserveAspectRatio="none" viewBox="0 0 800 450">
          <path d="M 520 0 Q 560 180 500 300 T 540 450 L 800 450 L 800 0 Z" fill="#D8E2DC" opacity="0.6" />
          <path d="M 220 180 Q 280 140 360 170 T 430 220 Q 370 270 290 250 Z" fill="#E2E6DF" opacity="0.6" stroke="#758B74" strokeDasharray="3 3" strokeWidth="1.5" />
          <path d="M 250 190 Q 300 160 340 180 T 390 220 Q 350 250 290 230 Z" fill="#E8ECE5" opacity="0.7" stroke="#758B74" strokeWidth="1.5" />
          <path d="M 0 120 Q 300 140 800 90" stroke="#C8C6BC" strokeWidth="3" />
          <path d="M 0 320 Q 340 280 800 340" stroke="#C8C6BC" strokeWidth="2.5" />
          <path d="M 210 0 L 250 450" stroke="#C8C6BC" strokeWidth="2" />
          <path d="M 440 0 L 410 450" stroke="#C8C6BC" strokeWidth="3.5" />
          <path d="M 480 0 Q 520 190 470 450" stroke="#245747" strokeOpacity="0.5" strokeWidth="2.5" />
        </svg>

        {/* Spatial Badge */}
        <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold text-[#1C2923] shadow-xs flex items-center gap-1.5 border border-[#E6E4DD]">
          <span className="material-symbols-outlined text-[16px] text-[#245747]">explore</span>
          <span>Da Nang Spatial Node VN-DN-05</span>
        </div>

        {/* SVG Pin Marker & Tooltip */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full z-20 flex flex-col items-center">
          <div className="bg-[#1C2923] text-white text-xs px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap mb-1 flex items-center gap-1 font-semibold">
            <span>{String(latitude).trim() !== '' && String(longitude).trim() !== '' ? `${latitude}°, ${longitude}°` : 'Enter coordinates below'}</span>
          </div>
          <div className="relative flex items-center justify-center">
            <span className="absolute -bottom-1 w-6 h-2 bg-[#1C2923]/20 rounded-full blur-[2px]" />
            <svg className="drop-shadow-md" fill="none" height="42" viewBox="0 0 34 42" width="34">
              <path d="M17 0C7.61116 0 0 7.61116 0 17C0 27.5 17 42 17 42C17 42 34 27.5 34 17C34 7.61116 26.3888 0 17 0Z" fill="#245747" />
              <circle cx="17" cy="16" fill="#F7F6F2" r="6.5" />
              <circle cx="17" cy="16" fill="#1C2923" r="3.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* Coordinate Presets Bar */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-xs font-semibold text-[#758B74] mr-1">Presets:</span>
        {DANANG_COORDINATE_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            disabled={disabled}
            onClick={() => onSelectCoordinates(preset.lat, preset.lng, preset.address)}
            className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-[#1C2923] border border-[#E6E4DD] hover:bg-[#F7F6F2] hover:border-[#758B74] disabled:opacity-50 transition-all shadow-2xs cursor-pointer"
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
}
