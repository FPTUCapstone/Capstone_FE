'use client';

import { useState, type InputHTMLAttributes, type ReactNode } from 'react';

type FormFieldProps = {
  id: string;
  label: string;
  icon: string;
  hint?: ReactNode;
  /** Bật nút ẩn/hiện mật khẩu (dùng với type="password") */
  toggleable?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>;

export default function FormField({
  id,
  label,
  icon,
  hint,
  toggleable = false,
  type = 'text',
  ...inputProps
}: FormFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputType = toggleable ? (visible ? 'text' : 'password') : type;

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
      >
        {label}{' '}
        {inputProps.required && <span className="text-rose-500 font-bold">*</span>}
      </label>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>

        <input
          id={id}
          name={id}
          type={inputType}
          {...inputProps}
          className={`w-full pl-10 ${
            toggleable ? 'pr-11' : 'pr-4'
          } py-3 bg-brand-surface border border-slate-200 rounded-xl text-sm text-brand-textPrimary placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition-all duration-200`}
        />

        {toggleable && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {visible ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        )}
      </div>

      {hint}
    </div>
  );
}
