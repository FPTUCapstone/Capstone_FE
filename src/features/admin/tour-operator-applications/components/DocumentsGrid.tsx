'use client';

import { OperatorDocumentDto } from '@/types/tour-operator-application';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { tourOperatorApplicationEn as copy } from '../resources/en';
import { getSafeDocumentUrl } from '../utils/documentUrl';
import { hasUsableBusinessLicense } from '../utils/documents';
import { formatApplicationDateTime } from '../utils/format';

interface DocumentsGridProps {
  documents: OperatorDocumentDto[];
}

export function DocumentsGrid({ documents }: DocumentsGridProps) {
  const isMissingMandatory = !hasUsableBusinessLicense(documents);

  return (
    <div className="mt-8 rounded-2xl border-2 border-slate-300 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-100 pb-3.5">
        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <span aria-hidden="true">📑</span> {copy.documents.title}
        </h2>
        <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {copy.documents.count(documents.length)}
        </span>
      </div>

      {isMissingMandatory && (
        <div className="mb-6 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="text-xl" aria-hidden="true">⚠️</span>
            <div>
              <h4 className="font-extrabold text-amber-950 text-sm">{copy.documents.missingTitle}</h4>
              <p className="text-xs text-amber-900 mt-1">
                {copy.documents.missingBody}
                <span className="block mt-0.5 font-bold">{copy.documents.missingLicense}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-300 p-8 text-center text-slate-500 font-bold">
          {copy.documents.empty}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {documents.map((doc) => {
            const isLicense = doc.documentType === 'BusinessLicense';
            const isTax = doc.documentType === 'TaxCode';
            const safeUrl = getSafeDocumentUrl(doc.fileUrl);
            const uploadedAt = formatApplicationDateTime(doc.uploadedAt) ?? copy.common.notAvailable;

            return (
              <div
                key={doc.documentId}
                className="flex flex-col justify-between rounded-xl border-2 border-slate-200 bg-slate-50/80 p-5 hover:border-teal-500 hover:bg-white hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl" aria-hidden="true">{isLicense ? '📜' : isTax ? '🏛️' : '📁'}</span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {copy.documents.typeLabels[doc.documentType] ?? doc.documentType}
                      </span>
                    </div>
                    {doc.status === 'Submitted' && <StatusBadge tone="warning">{copy.documents.status.submitted}</StatusBadge>}
                    {doc.status === 'Approved' && <StatusBadge tone="teal">{copy.documents.status.approved}</StatusBadge>}
                    {doc.status === 'Rejected' && <StatusBadge tone="danger">{copy.documents.status.rejected}</StatusBadge>}
                  </div>
                  <p className="text-xs text-slate-700 mb-4 truncate font-mono bg-white p-2.5 rounded-lg border border-slate-200 font-medium">
                    {safeUrl ?? copy.documents.linkUnavailable}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-slate-200/60 pt-3 text-xs text-slate-600 font-semibold">
                  <span>{copy.documents.uploadedAt(uploadedAt)}</span>
                  {safeUrl && (
                    <a
                      href={safeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-extrabold text-teal-700 hover:text-teal-900 transition"
                    >
                      {copy.documents.viewFile}
                      <span aria-hidden="true"> ↗</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
