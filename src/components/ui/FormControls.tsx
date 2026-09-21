'use client';

import { useId, useState } from 'react';
import type { ChangeEventHandler, InputHTMLAttributes, ReactNode } from 'react';

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  endAdornment?: ReactNode;
  error?: string;
  help?: ReactNode;
  label: string;
  leading?: ReactNode;
  optional?: boolean;
  trailing?: ReactNode;
};

const inputClass =
  'w-full rounded-xl border border-brand-border bg-brand-surface px-3.5 py-3 text-sm text-brand-textPrimary placeholder:text-slate-400 shadow-[0_1px_2px_rgba(15,27,45,0.06)] transition hover:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal disabled:cursor-not-allowed disabled:bg-brand-surface disabled:text-brand-textSecondary';

export function TextField({ endAdornment, error, help, id, label, leading, optional, trailing, ...props }: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const helpId = `${fieldId}-help`;
  const errorId = `${fieldId}-error`;

  return (
    <div className="mb-1.5">
      <label htmlFor={fieldId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
        <span className="flex items-center justify-between gap-2">
          <span>{label}</span>
          {trailing ? <span>{trailing}</span> : optional ? <span className="font-medium normal-case tracking-normal text-slate-400">Optional</span> : null}
        </span>
      </label>
      <div className="relative mt-1.5">
        {leading ? (
          <span className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            {leading}
          </span>
        ) : null}
        <input
          {...props}
          id={fieldId}
          aria-label={props['aria-label'] ?? label}
          aria-describedby={error ? errorId : help ? helpId : undefined}
          aria-invalid={Boolean(error)}
          className={`${inputClass} ${error ? 'border-red-500 bg-red-50 focus:ring-red-500/30 focus:border-red-500' : ''} ${leading ? 'pl-10' : ''} ${endAdornment ? 'pr-11' : ''}`}
        />
        {endAdornment}
      </div>
      {help ? (
        <span id={helpId} className="mt-1.5 flex items-center gap-1 text-[11px] text-brand-textSecondary leading-snug">
          <span className="material-symbols-outlined text-[14px] text-brand-teal">info</span>
          {help}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-600">
          <span>⚠</span> {error}
        </span>
      ) : null}
    </div>
  );
}

type PasswordFieldProps = Omit<TextFieldProps, 'type'>;

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const fieldId = props.id ?? generatedId;

  return (
    <TextField
      {...props}
      id={fieldId}
      type={visible ? 'text' : 'password'}
      endAdornment={(
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none"
          aria-label={visible ? `Hide ${props.label}` : `Show ${props.label}`}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          disabled={props.disabled}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            {visible ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      )}
    />
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
      <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-[11.5px] leading-snug text-slate-600 select-none group">
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            id={id}
            name={name}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className="peer h-4 w-4 shrink-0 rounded border-slate-300 text-brand-teal focus:ring-brand-teal/20 focus:ring-offset-0 transition"
          />
        </div>
        <span>{children}</span>
      </label>
      {error ? (
        <p id={errorId} className="mt-1 flex items-center gap-1 text-[10.5px] font-semibold text-red-500">
          <span>⚠</span> {error}
        </p>
      ) : null}
    </div>
  );
}

export const fieldClassName = inputClass;
