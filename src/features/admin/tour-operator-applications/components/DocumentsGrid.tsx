'use client';

import { OperatorDocumentDto } from '@/types/tour-operator-application';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface DocumentsGridProps {
  documents: OperatorDocumentDto[];
}

export function DocumentsGrid({ documents }: DocumentsGridProps) {
  const hasBusinessLicense = documents.some(
    (d) => d.documentType === 'BusinessLicense' && d.status !== 'Rejected'
  );
  // TaxCode is a text field verified via public registry; no separate document upload required.
  const isMissingMandatory = !hasBusinessLicense;

  return (
    <div className="mt-8 rounded-2xl border-2 border-slate-300 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between border-b-2 border-slate-100 pb-3.5">
        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <span>📑</span> Submitted Verification Documents
        </h2>
        <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {documents.length} document(s) uploaded
        </span>
      </div>

      {isMissingMandatory && (
        <div className="mb-6 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h4 className="font-extrabold text-amber-950 text-sm">Mandatory Document Missing or Rejected</h4>
              <p className="text-xs text-amber-900 mt-1">
                Approval requires a valid <strong>Business License (GPKD/ĐKKD)</strong> document.
                {!hasBusinessLicense && <span className="block mt-0.5 font-bold">• Missing Business License document.</span>}
              </p>
            </div>
          </div>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-300 p-8 text-center text-slate-500 font-bold">
          No verification documents uploaded.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {documents.map((doc) => {
            const isLicense = doc.documentType === 'BusinessLicense';
            const isTax = doc.documentType === 'TaxCode';

            return (
              <div
                key={doc.documentId}
                className="flex flex-col justify-between rounded-xl border-2 border-slate-200 bg-slate-50/80 p-5 hover:border-teal-500 hover:bg-white hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{isLicense ? '📜' : isTax ? '🏛️' : '📁'}</span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {isLicense ? 'Business License (GPKD)' : isTax ? 'Tax Code Certificate' : doc.documentType}
                      </span>
                    </div>

                    {doc.status === 'Submitted' && <StatusBadge tone="warning">Submitted</StatusBadge>}
                    {doc.status === 'Approved' && <StatusBadge tone="teal">Approved</StatusBadge>}
                    {doc.status === 'Rejected' && <StatusBadge tone="danger">Rejected</StatusBadge>}
                  </div>

                  <p className="text-xs text-slate-700 mb-4 truncate font-mono bg-white p-2.5 rounded-lg border border-slate-200 font-medium">
                    {doc.fileUrl}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t-2 border-slate-200/60 pt-3 text-xs text-slate-600 font-semibold">
                  <span>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-extrabold text-teal-700 hover:text-teal-900 transition"
                  >
                    View File ↗
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
