'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GetAuditLogsParams, PaginatedList, AuditLogSummaryDto } from '../types/auditLogAdmin';
import { getAuditLogs, AuditLogServiceError } from '../services/auditLogAdminService';
import { AuditLogFilterBar } from './AuditLogFilterBar';
import { AuditLogTable } from './AuditLogTable';
import { AuditLogPagination } from './AuditLogPagination';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ROUTES } from '@/lib/routes';

export function AuditLogManagementView() {
  const router = useRouter();
  const [filters, setFilters] = useState<GetAuditLogsParams>({
    pageNumber: 1,
    pageSize: 10,
  });

  const [data, setData] = useState<PaginatedList<AuditLogSummaryDto> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState<boolean>(false);
  const [isValidationError, setIsValidationError] = useState<boolean>(false);
  const [reloadVersion, setReloadVersion] = useState<number>(0);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrentRequest = true;

    getAuditLogs(filters, controller.signal)
      .then((result) => {
        if (isCurrentRequest) {
          setData(result);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isCurrentRequest) {
          if (err instanceof DOMException && err.name === 'AbortError') return;

          if (err instanceof AuditLogServiceError && err.statusCode === 401) {
            const returnUrl = encodeURIComponent(ROUTES.admin.auditLogs);
            router.replace(`${ROUTES.admin.login}?returnUrl=${returnUrl}`);
            return;
          } else if (err instanceof AuditLogServiceError && (err.statusCode === 403 || err.errorCode === 'Forbidden')) {
            setIsForbidden(true);
            setError('Access denied. Administrator role required.');
          } else if (err instanceof AuditLogServiceError && err.statusCode === 400) {
            setIsValidationError(true);
            setError('Please check the audit log filters and try again.');
          } else if (err instanceof Error) {
            setError(err.message || 'TripMate is temporarily unable to process your request. Please check your connection and try again.');
          } else {
            setError('TripMate is temporarily unable to process your request. Please check your connection and try again.');
          }
          setIsLoading(false);
        }
      });

    return () => {
      isCurrentRequest = false;
      controller.abort();
    };
  }, [filters, reloadVersion, router]);

  const prepareForRequest = () => {
    setIsLoading(true);
    setError(null);
    setIsForbidden(false);
    setIsValidationError(false);
    setData(null);
  };

  const handleFilterChange = (updatedFilters: Partial<GetAuditLogsParams>) => {
    prepareForRequest();
    setFilters((prev) => ({
      ...prev,
      ...updatedFilters,
      pageNumber: 1,
    }));
  };

  const handleResetFilters = () => {
    prepareForRequest();
    setFilters({
      pageNumber: 1,
      pageSize: 10,
    });
  };

  const handlePageChange = (newPage: number) => {
    prepareForRequest();
    setFilters((prev) => ({
      ...prev,
      pageNumber: newPage,
    }));
  };

  const handlePageSizeChange = (newSize: number) => {
    prepareForRequest();
    setFilters((prev) => ({
      ...prev,
      pageSize: newSize,
      pageNumber: 1,
    }));
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-1 border-b border-[#c3c6ce] pb-5">
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

      {/* Error Alert Display */}
      {error && (
        <FeedbackAlert
          tone="error"
          title={isForbidden ? 'Permission Denied' : isValidationError ? 'Check Audit Log Filters' : 'Unable to Load Audit Logs'}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span>{error}</span>
            {!isForbidden && !isValidationError && (
              <button
                type="button"
                onClick={() => {
                  prepareForRequest();
                  setReloadVersion((version) => version + 1);
                }}
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
    </div>
  );
}
