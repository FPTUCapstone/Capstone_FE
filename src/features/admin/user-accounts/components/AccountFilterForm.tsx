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
    <form className="flex flex-wrap items-end gap-3" method="get" onSubmit={validate}
      aria-describedby={showDateError ? 'account-date-error' : undefined}>
      {children}
      {showDateError && <p id="account-date-error" role="alert" className="basis-full">{invalidAccountDateRange}</p>}
    </form>
  );
}
