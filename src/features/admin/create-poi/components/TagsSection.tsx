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
    <section className="bg-white rounded-xl p-6 shadow-xs border border-slate-200">
      <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#102a43] text-white flex items-center justify-center"><span className="material-symbols-outlined text-[18px]">sell</span></div>
        <h2 className="text-lg text-[#00152a] font-semibold">4. Categorization Tags</h2>
      </div>
      <div className="p-3 rounded-lg bg-[#f2f4f7] min-h-12 flex flex-wrap gap-2 border border-slate-200">
        {formData.tags.map(id => {
          const name = tags.find(tag => tag.id === id)?.name ?? `Unavailable tag #${id}`;
          return <span key={id} className="inline-flex items-center gap-2 px-3 rounded-full bg-slate-200 text-sm">
            {name}
            <button type="button" disabled={disabled} aria-label={`Remove ${name}`} onClick={() => onChange('tags', formData.tags.filter(value => value !== id))} className="min-h-11 min-w-7 hover:text-red-600 focus-visible:outline-2">×</button>
          </span>;
        })}
        {!formData.tags.length ? <span className="text-sm text-slate-500">No tags selected.</span> : null}
      </div>
      <label htmlFor="poi-tags" className="block text-xs font-semibold mt-4 mb-1">Add a catalogue tag (optional)</label>
      <select id="poi-tags" value="" disabled={disabled || tags.length === 0} aria-invalid={Boolean(errors.tags)} aria-describedby="poi-tags-help" onChange={event => { if (event.target.value) onChange('tags', [...formData.tags, Number(event.target.value)]); }} className="w-full min-h-11 rounded-lg bg-[#f2f4f7] px-3 text-sm border border-slate-200">
        <option value="">Select a tag...</option>
        {tags.filter(tag => !formData.tags.includes(tag.id)).map(tag => <option value={tag.id} key={tag.id}>{tag.name}</option>)}
      </select>
      <p id="poi-tags-help" className="text-xs text-slate-500 mt-2">{tags.length ? 'Choose existing tags from the catalogue.' : 'No catalogue tags are available. You can create this POI without tags.'}</p>
      {errors.tags ? <p className="text-xs text-red-600 mt-2">{errors.tags}</p> : null}
    </section>
  );
}

