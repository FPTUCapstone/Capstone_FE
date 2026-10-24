import type { CatalogueOption, PoiFormData, ValidationErrors } from '../types/poi';

interface Props {
  formData: PoiFormData;
  tags: CatalogueOption[];
  errors: ValidationErrors;
  onChange: (field: keyof PoiFormData, value: unknown) => void;
  disabled?: boolean;
}

export function TagsSection({ formData, tags, errors, onChange, disabled }: Props) {
  return (
    <section className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-[#E6E4DD]">
      <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA] mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#245747] text-xl">local_offer</span>
          <h2 className="text-sm sm:text-base text-[#1C2923] font-bold">4. Tags</h2>
        </div>
        <span className="text-[10px] text-[#758B74] font-medium uppercase tracking-wider">Catalogue Only</span>
      </div>

      <div className="flex flex-wrap gap-2 min-h-8">
        {formData.tags.map(id => {
          const name = tags.find(tag => tag.id === id)?.name ?? `Unavailable tag #${id}`;
          return (
            <span key={id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E8EFEA] text-[#245747] border border-[#D0DFD6] text-xs font-semibold">
              {name}
              <button
                type="button"
                disabled={disabled}
                aria-label={`Remove ${name}`}
                onClick={() => onChange('tags', formData.tags.filter(value => value !== id))}
                className="hover:text-[#1C2923] focus-visible:outline-none text-xs ml-0.5"
              >
                ✕
              </button>
            </span>
          );
        })}
        {!formData.tags.length ? <span className="text-xs text-[#758B74] italic">No tags selected.</span> : null}
      </div>

      <div className="relative mt-3">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#758B74]">
          <span className="material-symbols-outlined text-[18px]">search</span>
        </div>
        <select
          id="poi-tags"
          value=""
          disabled={disabled || tags.length === 0}
          aria-invalid={Boolean(errors.tags)}
          aria-describedby="poi-tags-help"
          onChange={event => {
            if (event.target.value) onChange('tags', [...formData.tags, Number(event.target.value)]);
          }}
          className="w-full h-11 pl-9 pr-8 rounded-xl bg-[#F7F6F2] text-[#1C2923] text-xs sm:text-sm border border-[#E6E4DD] focus:border-[#245747] focus:ring-2 focus:ring-[#245747]/20 outline-none appearance-none"
        >
          <option value="">Search catalogue tags...</option>
          {tags.filter(tag => !formData.tags.includes(tag.id)).map(tag => (
            <option value={tag.id} key={tag.id}>{tag.name}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#758B74]">
          <span className="material-symbols-outlined text-[18px]">expand_more</span>
        </div>
      </div>
      <p id="poi-tags-help" className="text-[10px] text-[#758B74] mt-2">
        Inline tag creation is restricted to Taxonomy Administrators.
      </p>
      {errors.tags ? <p className="text-xs text-red-600 mt-1">{errors.tags}</p> : null}
    </section>
  );
}
