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
    <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#DCE2DD] bg-white px-4 py-3 text-xs text-[#5B6E69] shadow-xs sm:flex-row">
      {/* Items count summary */}
      <div className="flex items-center gap-3">
        <span>
          Showing <strong className="text-[#1C2928]">{startItem}</strong> to{' '}
          <strong className="text-[#1C2928]">{endItem}</strong> of{' '}
          <strong className="text-[#1C2928]">{totalCount}</strong> entries
        </span>

        {/* Page size select */}
        <div className="flex items-center gap-1.5 border-l border-[#DCE2DD] pl-3">
          <label htmlFor="audit-page-size" className="text-[#5B6E69]">
            Per page:
          </label>
          <select
            id="audit-page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-[#DCE2DD] bg-[#F7F5EF]/60 px-2 py-1 text-xs font-semibold text-[#1C2928] focus:border-[#174B4A] focus:bg-white focus:outline-none"
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
          className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-[#DCE2DD] bg-white px-3 py-1.5 text-xs font-bold text-[#1C2928] transition hover:bg-[#F7F5EF] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
          Previous
        </button>

        <span className="px-2 font-semibold text-[#1C2928]">
          Page {pageNumber} of {totalPages || 1}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(pageNumber + 1)}
          disabled={!hasNextPage}
          className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-[#DCE2DD] bg-white px-3 py-1.5 text-xs font-bold text-[#1C2928] transition hover:bg-[#F7F5EF] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
