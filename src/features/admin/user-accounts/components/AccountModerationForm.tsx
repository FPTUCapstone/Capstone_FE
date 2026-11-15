'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AccountModerationForm({ accountId, locked }: { accountId: string; locked: boolean }) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const action = locked ? 'unlock' : 'lock';
  return (
    <form className="space-y-3" onSubmit={async (event) => {
      event.preventDefault();
      if (!reason.trim() || busy) return;
      setBusy(true);
      setError('');
      try {
        const response = await fetch(`/api/admin/users/${encodeURIComponent(accountId)}/${action}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }),
        });
        if (!response.ok) {
          const problem = await response.json().catch(() => null);
          setError(typeof problem?.title === 'string' ? problem.title : 'Account update failed.');
          return;
        }
        setReason('');
        router.refresh();
      } catch {
        setError('Account management is temporarily unavailable.');
      } finally {
        setBusy(false);
      }
    }}>
      <label className="block">
        Reason for {locked ? 'unlocking' : 'locking'}
        <textarea className="mt-1 block w-full rounded border p-2" required maxLength={200}
          value={reason} onChange={(event) => setReason(event.target.value)} />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" className="rounded bg-teal-800 px-4 py-2 text-white disabled:opacity-50"
        disabled={busy || !reason.trim()}>
        {busy ? 'Updating…' : locked ? 'Unlock account' : 'Lock account'}
      </button>
    </form>
  );
}
