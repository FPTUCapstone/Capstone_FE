import { type ReactNode, useId, useRef, useState } from 'react';

interface OperatorListSearchProps {
  keyword: string;
  hasFilters: boolean;
  label: string;
  placeholder: string;
  searchLabel: string;
  clearLabel: string;
  children?: ReactNode;
  onSearch: (keyword: string) => void;
  onClear: () => void;
}

export function OperatorListSearch({
  keyword,
  hasFilters,
  label,
  placeholder,
  searchLabel,
  clearLabel,
  children,
  onSearch,
  onClear,
}: OperatorListSearchProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(keyword);

  return (
    <form
      role="search"
      aria-label={label}
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const value = draft.trim();
        setDraft(value);
        onSearch(value);
      }}
    >
      <label htmlFor={inputId} className="sr-only">{label}</label>
      <div className="relative w-full min-w-0 sm:w-auto sm:max-w-sm sm:flex-1">
        <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3 -translate-y-2 rounded-full border-2 border-slate-500 after:absolute after:left-2 after:top-2 after:h-1.5 after:w-0.5 after:-rotate-45 after:bg-slate-500 after:content-['']" />
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-brand-border bg-white pl-10 pr-3 text-sm focus-visible:outline-2 focus-visible:outline-brand-teal"
        />
      </div>
      {children}
      <button
        type="submit"
        className="min-h-11 rounded-xl bg-brand-teal px-4 text-sm font-semibold text-white hover:bg-brand-brightTeal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
      >
        {searchLabel}
      </button>
      {(hasFilters || draft) && (
        <button
          type="button"
          className="min-h-11 rounded-xl px-3 text-sm font-semibold text-brand-teal hover:bg-brand-lightTeal focus-visible:outline-2 focus-visible:outline-brand-teal"
          onClick={() => {
            setDraft('');
            onClear();
            inputRef.current?.focus();
          }}
        >
          {clearLabel}
        </button>
      )}
    </form>
  );
}
