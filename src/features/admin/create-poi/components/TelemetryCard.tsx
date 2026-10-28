import { useState } from 'react';
import type { CreatePoiRequest } from '../types/poi';

export function TelemetryCard({ payload }: { payload: CreatePoiRequest | null }) {
  const [copyMessage, setCopyMessage] = useState('');
  return (
    <details className="rounded-2xl bg-[#1C2923] p-5 text-xs text-[#E6E4DD] border border-[#245747]/40 shadow-xs">
      <summary className="cursor-pointer font-semibold text-white flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-[#758B74]">code</span>
          <span>Request payload preview</span>
        </span>
      </summary>
      {payload ? (
        <>
          <div className="flex items-center gap-2 my-3">
            <button
              type="button"
              className="h-8 px-3 rounded-lg bg-[#245747] hover:bg-[#2e6b57] text-white text-xs font-medium transition cursor-pointer"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
                  setCopyMessage('Copied to clipboard.');
                } catch {
                  setCopyMessage('Copy unavailable. Select the text below.');
                }
              }}
            >
              Copy JSON
            </button>
            <span role="status" className="text-xs text-[#758B74] font-mono">{copyMessage}</span>
          </div>
          <pre className="max-h-72 overflow-auto text-[#758B74] bg-[#141E1A] p-3 rounded-xl font-mono text-[11px] border border-[#245747]/30">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </>
      ) : (
        <p className="mt-3 text-[#758B74]">Complete valid form fields to preview the request.</p>
      )}
    </details>
  );
}
