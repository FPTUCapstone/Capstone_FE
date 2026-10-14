import type { ContentErrors, DestinationEntry } from '../landingContent';
import { landingContentEn } from '../resources/en';
import { ImageField } from './ImageField';
import { TextField } from './TextField';

interface DestinationsBlockProps {
  value: DestinationEntry[];
  errors: ContentErrors;
  onChange: (next: DestinationEntry[]) => void;
  disabled: boolean;
}

let newEntryCounter = 0;

function swap(list: DestinationEntry[], from: number, to: number): DestinationEntry[] {
  const next = [...list];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

const BUTTON_CLASS =
  'rounded-lg border border-[#d0d7de] px-2.5 py-1 text-xs font-bold text-[#00152a] hover:bg-[#f2f4f7] disabled:cursor-not-allowed disabled:opacity-50';

export function DestinationsBlock({ value, errors, onChange, disabled }: DestinationsBlockProps) {
  const copy = landingContentEn.editor.destinations;

  function update(index: number, patch: Partial<DestinationEntry>) {
    onChange(value.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  }

  return (
    <section aria-label={copy.title} className="rounded-2xl border border-[#d0d7de] bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-extrabold text-[#00152a]">{copy.title}</h2>
      <ol className="mt-4 space-y-4">
        {value.map((entry, index) => {
          const position = index + 1;
          return (
            <li key={entry.id} className="rounded-xl border border-[#eaecf0] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-[#1d2939]">
                  {copy.itemLabel} {position}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={disabled || index === 0}
                    aria-label={`${copy.moveUp} ${position}`}
                    onClick={() => onChange(swap(value, index, index - 1))}
                    className={BUTTON_CLASS}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={disabled || index === value.length - 1}
                    aria-label={`${copy.moveDown} ${position}`}
                    onClick={() => onChange(swap(value, index, index + 1))}
                    className={BUTTON_CLASS}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    aria-label={`${copy.remove} ${position}`}
                    onClick={() => onChange(value.filter((_, i) => i !== index))}
                    className={BUTTON_CLASS}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <TextField
                  label={copy.name}
                  value={entry.name}
                  error={errors[`destinations.${index}.name`]}
                  disabled={disabled}
                  onChange={(name) => update(index, { name })}
                />
                <ImageField
                  label={copy.image}
                  value={entry.image}
                  error={errors[`destinations.${index}.image`]}
                  disabled={disabled}
                  onChange={(image) => update(index, { image })}
                />
                <div className="sm:col-span-2">
                  <TextField
                    label={copy.description}
                    value={entry.description}
                    error={errors[`destinations.${index}.description`]}
                    disabled={disabled}
                    multiline
                    onChange={(description) => update(index, { description })}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          onChange([
            ...value,
            { id: `new-${Date.now()}-${newEntryCounter++}`, name: '', image: null, description: '' },
          ])
        }
        className={`mt-4 ${BUTTON_CLASS}`}
      >
        {copy.add}
      </button>
    </section>
  );
}
