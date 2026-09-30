'use client';

import React from 'react';

interface AuditLogPaginationProps {
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function AuditLogPagination({
  pageNumber,
  pageSize,
  totalPages,
  totalCount,
  hasPreviousPage,
  hasNextPage,
  onPageChange,
  onPageSizeChange,
}: AuditLogPaginationProps) {
  if (totalCount === 0) return null;

  const startItem = (pageNumber - 1) * pageSize + 1;
  const endItem = Math.min(pageNumber * pageSize, totalCount);

  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-[#314863] bg-[#102a43] px-4 py-3 text-xs text-[#d1e4ff] sm:flex-row">
      {/* Items count summary */}
      <div className="flex items-center gap-3">
        <span>
          Showing <strong className="text-white">{startItem}</strong> to{' '}
          <strong className="text-white">{endItem}</strong> of{' '}
          <strong className="text-white">{totalCount}</strong> entries
        </span>

        {/* Page size select */}
        <div className="flex items-center gap-1.5 border-l border-[#314863] pl-3">
          <label htmlFor="audit-page-size" className="text-slate-400">
            Per page:
          </label>
          <select
            id="audit-page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded border border-[#314863] bg-[#00152a] px-2 py-1 text-xs text-[#d1e4ff] focus:border-[#71f8e4] focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(pageNumber - 1)}
          disabled={!hasPreviousPage}
          className="inline-flex items-center gap-1 rounded-lg border border-[#314863] bg-[#00152a] px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-[#314863] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
          Previous
        </button>

        <span className="px-2 font-semibold text-slate-300">
          Page {pageNumber} of {totalPages || 1}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(pageNumber + 1)}
          disabled={!hasNextPage}
          className="inline-flex items-center gap-1 rounded-lg border border-[#314863] bg-[#00152a] px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-[#314863] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
