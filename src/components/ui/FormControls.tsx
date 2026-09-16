'use client';

import { useId, useState } from 'react';
import type { ChangeEventHandler, InputHTMLAttributes, ReactNode } from 'react';

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  error?: string;
  help?: ReactNode;
  label: string;
  optional?: boolean;
  trailing?: ReactNode;
};

const inputClass =
  'mt-1.5 w-full rounded-[11px] border border-[#E1E8F3] bg-white px-3 py-2.5 text-[12.5px] text-[#0F1B2D] shadow-[0_1px_2px_rgba(15,27,45,0.06)] transition placeholder:text-[#96A4BB] hover:border-[#6B7C97] focus:border-[#1D4ED8] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#F4F7FC] disabled:text-[#6B7C97]';

export function TextField({ error, help, id, label, optional, trailing, ...props }: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const helpId = `${fieldId}-help`;
  const errorId = `${fieldId}-error`;

  return (
    <label htmlFor={fieldId} className="block text-[10px] font-bold uppercase tracking-[0.4px] text-[#33425A]">
      <span className="flex items-center justify-between gap-2">
        <span>{label}</span>
        {trailing ? <span>{trailing}</span> : optional ? <span className="font-medium normal-case tracking-normal text-[#6B7C97]">Optional</span> : null}
      </span>
      <div className="relative">
        <input
          {...props}
          id={fieldId}
          aria-describedby={error ? errorId : help ? helpId : undefined}
          aria-invalid={Boolean(error)}
          className={`${inputClass} ${error ? 'border-[#E02D4D] bg-[#FDECEF]' : ''}`}
        />
      </div>
      {help ? (
        <span id={helpId} className="mt-1 block text-[10.5px] font-normal normal-case leading-relaxed tracking-normal text-[#6B7C97]">
          {help}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="mt-1 flex items-center gap-1 text-[10.5px] font-semibold normal-case leading-relaxed tracking-normal text-[#E02D4D]">
          <span>⚠</span> {error}
        </span>
      ) : null}
    </label>
  );
}

type PasswordFieldProps = Omit<TextFieldProps, 'type'>;

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const fieldId = props.id ?? generatedId;

  return (
    <div className="relative">
      <TextField {...props} id={fieldId} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="absolute right-2.5 top-[28px] rounded-md p-1 text-[#6B7C97] hover:text-[#0F1B2D] focus:outline-none"
        aria-label={visible ? `Hide ${props.label}` : `Show ${props.label}`}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        disabled={props.disabled}
      >
        <span className="material-symbols-outlined text-base" aria-hidden="true">
          {visible ? 'visibility_off' : 'visibility'}
        </span>
      </button>
    </div>
  );
}

type CheckboxFieldProps = {
  checked: boolean;
  children: ReactNode;
  disabled?: boolean;
  error?: string;
  name: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

export function CheckboxField({ checked, children, disabled, error, name, onChange }: CheckboxFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-[11.5px] leading-relaxed text-[#33425A]">
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#C3CEE0] accent-[#1D4ED8]"
        />
        <span>{children}</span>
      </label>
      {error ? (
        <p id={errorId} className="mt-1 flex items-center gap-1 text-[10.5px] font-semibold text-[#E02D4D]">
          <span>⚠</span> {error}
        </p>
      ) : null}
    </div>
  );
}

export const fieldClassName = inputClass;
