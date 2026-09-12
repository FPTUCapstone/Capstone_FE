import type { PoiFormData, ValidationErrors } from '../types/poi';
import { MapPickerMock } from './MapPickerMock';

interface LocationSectionProps {
  formData: PoiFormData;
  errors: ValidationErrors;
  onChange: (field: keyof PoiFormData, value: unknown) => void;
  disabled?: boolean;
}

export function LocationSection({ formData, errors, onChange, disabled }: LocationSectionProps) {
  const handleSelectCoords = (lat: number, lng: number, address?: string) => {
    onChange('latitude', lat);
    onChange('longitude', lng);
    if (address && !formData.address) {
      onChange('address', address);
    }
  };

  return (
    <section className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 relative">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#102a43] text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">map</span>
          </div>
          <h2 className="text-lg text-[#00152a] font-semibold">2. Precise Location</h2>
        </div>
        <span className="text-xs text-[#006b5f] font-semibold flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#006b5f]"></span>
          WGS84 coordinates
        </span>
      </div>

      <div className="space-y-4">
        {/* Map Picker Canvas */}
        <MapPickerMock
          latitude={formData.latitude}
          longitude={formData.longitude}
          onSelectCoordinates={handleSelectCoords}
          disabled={disabled}
        />

        {/* Lat / Lng Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-xs font-semibold text-slate-900 block mb-1.5" htmlFor="poi-lat">
              Latitude <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                id="poi-lat"
                type="number"
                step="0.000001"
                disabled={disabled}
                value={formData.latitude}
                onChange={(e) => onChange('latitude', e.target.value)}
                placeholder="16.003890"
                aria-invalid={Boolean(errors.latitude)}
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#f2f4f7] text-slate-900 text-sm font-mono focus:bg-white focus:outline-none focus:shadow-md transition-all border ${
                  errors.latitude ? 'border-red-500 bg-red-50/50' : 'border-transparent'
                }`}
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">deg N</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Accepts -90.0 to 90.0 with 6 decimals</p>
            {errors.latitude ? (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{errors.latitude}</span>
              </p>
            ) : null}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-900 block mb-1.5" htmlFor="poi-lng">
              Longitude <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                id="poi-lng"
                type="number"
                step="0.000001"
                disabled={disabled}
                value={formData.longitude}
                onChange={(e) => onChange('longitude', e.target.value)}
                placeholder="108.264178"
                aria-invalid={Boolean(errors.longitude)}
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#f2f4f7] text-slate-900 text-sm font-mono focus:bg-white focus:outline-none focus:shadow-md transition-all border ${
                  errors.longitude ? 'border-red-500 bg-red-50/50' : 'border-transparent'
                }`}
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">deg E</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Accepts -180.0 to 180.0 with 6 decimals</p>
            {errors.longitude ? (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{errors.longitude}</span>
              </p>
            ) : null}
          </div>
        </div>

        {/* Info Box */}
        <div className="p-3 rounded-lg bg-[#f2f4f7] text-slate-600 text-xs flex items-start gap-2 border border-slate-200">
          <span className="material-symbols-outlined text-[18px] text-[#006b5f] mt-0.5">info</span>
          <span>The map is an illustrative preview. Enter the exact coordinates below; live map selection and address geocoding are not available.</span>
        </div>
      </div>
    </section>
  );
}
