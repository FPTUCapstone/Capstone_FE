import { useId } from 'react';

import type { ContentErrorKey } from '../resources/en';
import { landingContentEn } from '../resources/en';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
  error?: ContentErrorKey;
  disabled: boolean;
  type?: 'text' | 'date';
  multiline?: boolean;
}

const INPUT_CLASS =
  'mt-2 w-full rounded-xl border border-[#d0d7de] bg-white px-3.5 py-2.5 text-sm text-[#191c1e] disabled:cursor-not-allowed disabled:bg-[#f2f4f7] disabled:text-[#667085] aria-[invalid=true]:border-[#b42318]';

export function TextField({ label, value, onChange, error, disabled, type = 'text', multiline = false }: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const common = {
    id,
    value,
    disabled,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
    className: INPUT_CLASS,
  } as const;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold text-[#1d2939]">
        {label}
      </label>
      {multiline ? (
        <textarea {...common} rows={3} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input {...common} type={type} onChange={(event) => onChange(event.target.value)} />
      )}
      {error && (
        <p id={errorId} className="mt-1 text-xs font-semibold text-[#b42318]">
          {landingContentEn.errors[error]}
        </p>
      )}
    </div>
  );
}
