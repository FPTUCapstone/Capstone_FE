'use client';

import { useId, useState } from 'react';
import type { ChangeEventHandler, InputHTMLAttributes, ReactNode } from 'react';

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  error?: string;
  help?: ReactNode;
  label: string;
  optional?: boolean;
};

const inputClass =
  'mt-2 w-full rounded-xl border border-[#c3c6ce] bg-white px-4 py-3 text-sm text-[#191c1e] shadow-xs transition placeholder:text-[#74777e] hover:border-[#74777e] focus:border-[#006b5f] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#eceef1] disabled:text-[#74777e]';

export function TextField({ error, help, id, label, optional, ...props }: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const helpId = `${fieldId}-help`;
  const errorId = `${fieldId}-error`;

  return (
    <label htmlFor={fieldId} className="block text-xs font-bold uppercase tracking-[0.08em] text-[#314863]">
      <span className="flex items-center justify-between gap-2">
        {label}
        {optional ? <span className="font-medium normal-case tracking-normal text-[#74777e]">Optional</span> : null}
      </span>
      <input
        {...props}
        id={fieldId}
        aria-describedby={error ? errorId : help ? helpId : undefined}
        aria-invalid={Boolean(error)}
        className={`${inputClass} ${error ? 'border-[#ba1a1a] bg-[#fff8f7]' : ''}`}
      />
      {help ? (
        <span id={helpId} className="mt-1.5 block text-xs font-normal normal-case leading-relaxed tracking-normal text-[#59616b]">
          {help}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="mt-1.5 block text-xs font-semibold normal-case leading-relaxed tracking-normal text-[#ba1a1a]">
          {error}
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
        className="absolute right-3 top-[34px] rounded-md p-1 text-[#59616b] hover:bg-[#eceef1] hover:text-[#00152a]"
        aria-label={visible ? `Hide ${props.label}` : `Show ${props.label}`}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        disabled={props.disabled}
      >
        <span className="material-symbols-outlined text-lg" aria-hidden="true">
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
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-[#314863]">
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#006b5f]"
        />
        <span>{children}</span>
      </label>
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs font-semibold text-[#ba1a1a]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const fieldClassName = inputClass;
