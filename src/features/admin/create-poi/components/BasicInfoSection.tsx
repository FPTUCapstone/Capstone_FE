import type { CatalogueOption, PoiFormData, ValidationErrors } from '../types/poi';

interface BasicInfoSectionProps {
  categories: CatalogueOption[];
  formData: PoiFormData;
  errors: ValidationErrors;
  onChange: (field: keyof PoiFormData, value: unknown) => void;
  disabled?: boolean;
}

export function BasicInfoSection({ formData, errors, onChange, disabled, categories }: BasicInfoSectionProps) {
  return (
    <section className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 relative">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#102a43] text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">info</span>
          </div>
          <h2 className="text-lg text-[#00152a] font-semibold">1. Basic Information</h2>
        </div>
        <span className="text-xs text-slate-400 font-medium">Required metadata</span>
      </div>

      <div className="space-y-4 pt-4">
        {/* Name Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-900" htmlFor="poi-name">
              POI Name <span className="text-red-600">*</span>
            </label>
            <span className="text-xs text-slate-400 font-mono" id="name-counter">
              {formData.name.length}/200
            </span>
          </div>
          <div className="relative">
            <input
              id="poi-name"
              type="text"
              disabled={disabled}
              maxLength={200}
              value={formData.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="e.g. Marble Mountains, Sun World Ba Na Hills"
              aria-invalid={Boolean(errors.name)}
              className={`w-full px-3.5 py-2.5 rounded-lg bg-[#f2f4f7] text-slate-900 text-sm focus:bg-white focus:outline-none focus:shadow-md transition-all placeholder:text-slate-400 border ${
                errors.name ? 'border-red-500 bg-red-50/50' : 'border-transparent'
              }`}
            />
          </div>
          {errors.name ? (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errors.name}</span>
            </p>
          ) : null}
        </div>

        {/* Category Searchable Select */}
        <div>
          <label className="text-xs font-semibold text-slate-900 block mb-1.5" htmlFor="poi-category">
            Category <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <span className="material-symbols-outlined text-[20px]">category</span>
            </div>
            <select
              id="poi-category"
              disabled={disabled}
              value={formData.category_id}
              onChange={(e) => onChange('category_id', e.target.value)}
              aria-invalid={Boolean(errors.category_id)}
              className={`w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#f2f4f7] text-slate-900 text-sm focus:bg-white focus:outline-none focus:shadow-md transition-all cursor-pointer appearance-none border ${
                errors.category_id ? 'border-red-500 bg-red-50/50' : 'border-transparent'
              }`}
            >
              <option value="">Search and select category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <span className="material-symbols-outlined text-[20px]">expand_more</span>
            </div>
          </div>
          {errors.category_id ? (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errors.category_id}</span>
            </p>
          ) : null}
        </div>

        {/* Description Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-900" htmlFor="poi-desc">
              Description <span className="text-slate-400 text-xs font-normal">(Optional)</span>
            </label>
            <span className="text-xs text-slate-400 font-mono" id="desc-counter">
              {formData.description.length}/2000
            </span>
          </div>
          <textarea
            id="poi-desc"
            rows={3}
            disabled={disabled}
            maxLength={2000}
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="Brief synthesis of this location for itinerary planners and navigation briefs..."
            aria-invalid={Boolean(errors.description)}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#f2f4f7] text-slate-900 text-sm focus:bg-white focus:outline-none focus:shadow-md transition-all placeholder:text-slate-400 resize-none border border-transparent"
          />
        </div>

        {errors.description ? <p className="text-xs text-red-600">{errors.description}</p> : null}
        {/* Address Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-900" htmlFor="poi-address">
              Address <span className="text-slate-400 text-xs font-normal">(Optional)</span>
            </label>
            <span className="text-xs text-slate-400 font-mono" id="address-counter">
              {formData.address.length}/400
            </span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <span className="material-symbols-outlined text-[20px]">location_on</span>
            </div>
            <input
              id="poi-address"
              type="text"
              disabled={disabled}
              maxLength={400}
              value={formData.address}
              onChange={(e) => onChange('address', e.target.value)}
              placeholder="Street name, district, city..."
              aria-invalid={Boolean(errors.address)}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-[#f2f4f7] text-slate-900 text-sm focus:bg-white focus:outline-none focus:shadow-md transition-all placeholder:text-slate-400 border border-transparent"
            />
          </div>
        </div>
        {errors.address ? <p className="text-xs text-red-600">{errors.address}</p> : null}
      </div>
    </section>
  );
}
