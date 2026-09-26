import React from 'react';
import { AuditLogResult } from '../types/auditLogAdmin';

export function AuditLogResultBadge({ result }: { result: AuditLogResult | null }) {
  const tone = result === 'Success'
    ? 'border-emerald-700/50 bg-emerald-900/40 text-emerald-300'
    : result === 'Failure'
      ? 'border-red-700/50 bg-red-900/40 text-red-300'
      : 'border-slate-700 bg-slate-800 text-slate-300';

  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${tone}`}>
      {result ?? 'No recorded result'}
    </span>
  );
}
