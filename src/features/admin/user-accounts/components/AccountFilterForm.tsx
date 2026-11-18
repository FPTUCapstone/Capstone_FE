'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { invalidAccountDateRange, isAccountDateRangeValid } from '../accountDateRange';

export function AccountFilterForm({ children, invalidRange }: { children: ReactNode; invalidRange: boolean }) {
  const [showDateError, setShowDateError] = useState(invalidRange);

  function validate(event: FormEvent<HTMLFormElement>) {
    const fields = new FormData(event.currentTarget);
    const valid = isAccountDateRangeValid(
      String(fields.get('registeredFrom') ?? ''),
      String(fields.get('registeredTo') ?? ''),
    );
    setShowDateError(!valid);
    if (!valid) event.preventDefault();
  }

  return (
    <form
      className="rounded-2xl border border-[#DCE5E2] bg-white p-5 shadow-xs transition sm:p-6"
      method="get"
      onSubmit={validate}
      aria-describedby={showDateError ? 'account-date-error' : undefined}
    >
      <div className="flex flex-wrap items-end gap-3.5">
        {children}
      </div>
      {showDateError && (
        <div
          id="account-date-error"
          role="alert"
          className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 sm:text-sm"
        >
          <span className="material-symbols-outlined text-base text-red-600" aria-hidden="true">
            warning
          </span>
          <span>{invalidAccountDateRange}</span>
        </div>
      )}
    </form>
  );
}
