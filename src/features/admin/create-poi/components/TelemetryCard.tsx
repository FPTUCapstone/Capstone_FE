import { useState } from 'react';
import type { CreatePoiRequest } from '../types/poi';

export function TelemetryCard({ payload }: { payload: CreatePoiRequest | null }) {
  const [copyMessage, setCopyMessage] = useState('');
  return (
    <details className="rounded-xl bg-slate-950 p-5 text-xs text-slate-300">
      <summary className="cursor-pointer font-semibold">Request payload preview</summary>
      {payload ? <>
        <button type="button" className="my-3 min-h-11 rounded bg-slate-800 px-3" onClick={async () => {
          try { await navigator.clipboard.writeText(JSON.stringify(payload, null, 2)); setCopyMessage('Copied.'); }
          catch { setCopyMessage('Copy unavailable. Select the text below.'); }
        }}>Copy JSON</button>
        <span role="status" className="ml-2">{copyMessage}</span>
        <pre className="max-h-72 overflow-auto text-emerald-300">{JSON.stringify(payload, null, 2)}</pre>
      </> : <p className="mt-3">Complete valid form fields to preview the request.</p>}
    </details>
  );
}

