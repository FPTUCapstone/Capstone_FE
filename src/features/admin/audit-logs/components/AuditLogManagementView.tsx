'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GetAuditLogsParams, PaginatedList, AuditLogSummaryDto } from '../types/auditLogAdmin';
import { getAuditLogs, AuditLogServiceError } from '../services/auditLogAdminService';
import { AuditLogFilterBar } from './AuditLogFilterBar';
import { AuditLogTable } from './AuditLogTable';
import { AuditLogPagination } from './AuditLogPagination';
import { AuditLogDetailDrawer } from './AuditLogDetailDrawer';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';

// CR-01: every list screen paginates at 20 records per page by default.
const DEFAULT_PAGE_SIZE = 20;

// SRS 5.3 locked message content.
const MSG126 = 'You do not have permission to access this function.';
const MSG127 = 'TripMate is temporarily unable to process your request. Please check your connection and try again.';

export function AuditLogManagementView() {
  const router = useRouter();

  const [filters, setFilters] = useState<GetAuditLogsParams>({
    pageNumber: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const [data, setData] = useState<PaginatedList<AuditLogSummaryDto> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState<boolean>(false);
  const [isValidationError, setIsValidationError] = useState(false);

  // Detail Drawer state (UC-69)
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    getAuditLogs(filters)
      .then((result) => {
        if (isMounted) {
          setData(result);
          setError(null);
          setIsForbidden(false);
          setIsValidationError(false);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          if (err instanceof AuditLogServiceError && err.statusCode === 401) {
            // CR-10: expired session — redirect to sign-in, preserving the intended destination.
            router.replace(`/admin/login?returnUrl=${encodeURIComponent('/admin/audit-logs')}`);
            return;
          }
          if (err instanceof AuditLogServiceError && (err.statusCode === 403 || err.errorCode === 'Forbidden')) {
            setIsForbidden(true);
            setError(MSG126);
          } else if (err instanceof AuditLogServiceError && err.statusCode === 400) {
            setIsValidationError(true);
            const messages = Object.values(err.validationErrors).flat();
            setError(messages.length ? messages.join(' ') : 'Please check the audit log filters and apply them again.');
          } else {
            setError(MSG127);
          }
          setData(null);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [filters, refreshKey, router]);

  const beginFetch = () => {
    setIsLoading(true);
    setError(null);
    setIsForbidden(false);
    setIsValidationError(false);
  };

  const handleFilterChange = (updatedFilters: Partial<GetAuditLogsParams>) => {
    beginFetch();
    setFilters((prev) => ({
      ...prev,
      ...updatedFilters,
      pageNumber: 1,
    }));
  };

  const handleResetFilters = () => {
    beginFetch();
    setFilters({
      pageNumber: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });
  };

  const handlePageChange = (newPage: number) => {
    beginFetch();
    setFilters((prev) => ({
      ...prev,
      pageNumber: newPage,
    }));
  };

  const handlePageSizeChange = (newSize: number) => {
    beginFetch();
    setFilters((prev) => ({
      ...prev,
      pageSize: newSize,
      pageNumber: 1,
    }));
  };

  const handleRetry = () => {
    beginFetch();
    setRefreshKey((key) => key + 1);
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 border-b border-[#c3c6ce] pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-[#006b5f]">
              find_in_page
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#00152a]">
              System Audit Logs
            </h1>
          </div>
          <p className="text-sm text-[#43474d]">
            Operational, security, and administrative event trail for auditability and compliance.
          </p>
        </div>
      </div>

      {/* Error Alert Display */}
      {error && (
        <FeedbackAlert
          tone="error"
          title={isForbidden ? 'Permission Denied' : isValidationError ? 'Check Audit Log Filters' : 'Error Loading Audit Logs'}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span>{error}</span>
            {!isForbidden && !isValidationError && (
              <button
                type="button"
                onClick={handleRetry}
                className="rounded bg-[#93000a] px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-800"
              >
                Retry
              </button>
            )}
          </div>
        </FeedbackAlert>
      )}

      {/* Search & Filter Bar */}
      <AuditLogFilterBar
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Audit Log Table */}
      <AuditLogTable
        items={data?.items || []}
        isLoading={isLoading}
        onViewDetail={(log) => setSelectedLogId(log.id)}
      />

      {/* Pagination Bar */}
      {data && (
        <AuditLogPagination
          pageNumber={data.pageNumber}
          pageSize={data.pageSize}
          totalPages={data.totalPages}
          totalCount={data.totalCount}
          hasPreviousPage={data.hasPreviousPage}
          hasNextPage={data.hasNextPage}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* Detail Drawer Component (UC-69) */}
      <AuditLogDetailDrawer
        logId={selectedLogId}
        isOpen={selectedLogId !== null}
        onClose={() => setSelectedLogId(null)}
      />
    </div>
  );
}
