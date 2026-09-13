'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GetAuditLogsParams, PaginatedList, AuditLogSummaryDto } from '../types/auditLogAdmin';
import { getAuditLogs, devLoginAsAdmin, AuditLogServiceError } from '../services/auditLogAdminService';
import { AuditLogFilterBar } from './AuditLogFilterBar';
import { AuditLogTable } from './AuditLogTable';
import { AuditLogPagination } from './AuditLogPagination';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';

export function AuditLogManagementView() {
  const [filters, setFilters] = useState<GetAuditLogsParams>({
    pageNumber: 1,
    pageSize: 10,
  });

  const [data, setData] = useState<PaginatedList<AuditLogSummaryDto> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState<boolean>(false);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsForbidden(false);

    try {
      const result = await getAuditLogs(filters);
      setData(result);
    } catch (err: unknown) {
      if (err instanceof AuditLogServiceError && err.statusCode === 401) {
        setIsForbidden(true);
        setError('Authentication required. Administrator credentials expected. (401)');
      } else if (err instanceof AuditLogServiceError && (err.statusCode === 403 || err.errorCode === 'Forbidden')) {
        setIsForbidden(true);
        setError('Access denied. Administrator role required. (MSG126)');
      } else if (err instanceof Error) {
        setError(err.message || 'Failed to load system audit logs. Please try again later. (MSG127)');
      } else {
        setError('Failed to load system audit logs. Please try again later. (MSG127)');
      }
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    let isMounted = true;
    
    getAuditLogs(filters)
      .then((result) => {
        if (isMounted) {
          setData(result);
          setError(null);
          setIsForbidden(false);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          if (err instanceof AuditLogServiceError && err.statusCode === 401) {
            setIsForbidden(true);
            setError('Authentication required. Administrator credentials expected. (401)');
          } else if (err instanceof AuditLogServiceError && (err.statusCode === 403 || err.errorCode === 'Forbidden')) {
            setIsForbidden(true);
            setError('Access denied. Administrator role required. (MSG126)');
          } else if (err instanceof Error) {
            setError(err.message || 'Failed to load system audit logs. Please try again later. (MSG127)');
          } else {
            setError('Failed to load system audit logs. Please try again later. (MSG127)');
          }
          setData(null);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [filters]);

  const handleFilterChange = (updatedFilters: Partial<GetAuditLogsParams>) => {
    setFilters((prev) => ({
      ...prev,
      ...updatedFilters,
      pageNumber: 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      pageNumber: 1,
      pageSize: 10,
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      pageNumber: newPage,
    }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setFilters((prev) => ({
      ...prev,
      pageSize: newSize,
      pageNumber: 1,
    }));
  };

  const handleDevLogin = async () => {
    try {
      setIsLoading(true);
      await devLoginAsAdmin();
      await fetchLogs();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`Dev login failed: ${err.message}`);
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-3 border-b border-[#c3c6ce] pb-5 sm:flex-row sm:items-center sm:justify-between">
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

        {/* Quick Dev Login Button */}
        <button
          type="button"
          onClick={handleDevLogin}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-[#006b5f] bg-[#e8f7f4] px-3 py-2 text-xs font-bold text-[#005048] shadow-xs transition-colors hover:bg-[#006b5f] hover:text-white sm:self-auto"
          title="Auto-authenticate as Admin (linhtv171@gmail.com) for testing"
        >
          <span className="material-symbols-outlined text-base">key</span>
          Dev Auto-Authenticate
        </button>
      </div>

      {/* Error Alert Display */}
      {error && (
        <FeedbackAlert
          tone="error"
          title={isForbidden ? 'Permission Denied' : 'Error Loading Audit Logs'}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span>{error}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDevLogin}
                className="rounded bg-[#006b5f] px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#005048]"
              >
                ⚡ Dev Login (linhtv171)
              </button>
              {!isForbidden && (
                <button
                  type="button"
                  onClick={fetchLogs}
                  className="rounded bg-[#93000a] px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-800"
                >
                  Retry
                </button>
              )}
            </div>
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
