'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatusBadge } from '../common/StatusBadge';
import { AccessibleSelect } from '../common/AccessibleSelect';
import { ConfirmationDialog } from '../common/ConfirmationDialog';
import { useToast } from '../common/Toast';
import { StaffReconciliationService } from '../../services/staffReconciliationService';
import type { StatementItem, StatementStatus } from '../../types';
import { formatDate, formatDateTime, formatVnd } from '../../utils/formatters';
import { hotelProviderEn } from '../../resources/en';
import { ROUTES } from '@/lib/routes';

export function CommissionReconciliationView() {
  const { showToast } = useToast();

  const [statements, setStatements] = useState<StatementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedProvider, setSelectedProvider] = useState<string>('All');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<StatementStatus | 'All'>('PaymentReported');
  const [refKeyword, setRefKeyword] = useState('');

  // Applied filter state
  const [appliedFilters, setAppliedFilters] = useState({
    providerId: 'All',
    period: 'All',
    status: 'PaymentReported' as StatementStatus | 'All',
    keyword: '',
  });

  // Reconcile Receipt Modal
  const [targetStatement, setTargetStatement] = useState<StatementItem | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let active = true;
    StaffReconciliationService.fetchReconciliationStatements({
      providerId: appliedFilters.providerId,
      period: appliedFilters.period,
      status: appliedFilters.status,
      keyword: appliedFilters.keyword,
    })
      .then((data) => {
        if (!active) return;
        setStatements(data.items);
        setIsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        showToast(hotelProviderEn.messages.MSG127, 'error');
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [appliedFilters, showToast]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFilters({
      providerId: selectedProvider,
      period: selectedPeriod,
      status: selectedStatus,
      keyword: refKeyword.trim(),
    });
  };

  const handleReset = () => {
    setSelectedProvider('All');
    setSelectedPeriod('All');
    setSelectedStatus('All');
    setRefKeyword('');
    setAppliedFilters({
      providerId: 'All',
      period: 'All',
      status: 'All',
      keyword: '',
    });
  };

  const handleOpenReceiptModal = (stmt: StatementItem) => {
    setTargetStatement(stmt);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmReceipt = async () => {
    if (!targetStatement) return;
    setIsProcessing(true);
    try {
      const res = await StaffReconciliationService.confirmReceipt(targetStatement.id);
      if (res.success) {
        showToast(hotelProviderEn.messages.MSG209, 'success');
        setStatements((prev) =>
          prev.map((s) =>
            s.id === targetStatement.id
              ? {
                  ...s,
                  status: 'Paid',
                  confirmedAt: res.confirmedAt,
                  confirmedByStaffId: 101,
                }
              : s
          )
        );
        setIsConfirmModalOpen(false);
      } else {
        showToast(res.error || hotelProviderEn.messages.MSG127, 'error');
      }
    } catch {
      showToast(hotelProviderEn.messages.MSG133, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const providerOptions = [
    { value: 'All', label: 'All Providers' },
    { value: '42', label: 'Hội An Riverside Heritage Resort' },
    { value: '43', label: 'Da Nang Beachfront Boutique Resort' },
  ];

  const periodOptions = [
    { value: 'All', label: 'All Periods' },
    { value: '11/2026', label: 'Tháng 11/2026' },
    { value: '10/2026', label: 'Tháng 10/2026' },
    { value: '09/2026', label: 'Tháng 09/2026' },
  ];

  const statusOptions = [
    { value: 'All', label: 'All Statuses' },
    { value: 'PaymentReported', label: hotelProviderEn.statuses.paymentReported, icon: 'hourglass_top' },
    { value: 'Paid', label: hotelProviderEn.statuses.paid, icon: 'task_alt' },
    { value: 'Issued', label: hotelProviderEn.statuses.issued, icon: 'receipt_long' },
    { value: 'Overdue', label: hotelProviderEn.statuses.overdue, icon: 'warning' },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-[#5B6E69] mb-1">
          <Link href={ROUTES.admin.dashboard} className="hover:text-[#174B4A] transition-colors">
            {hotelProviderEn.w106.breadcrumb}
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#1C2928] font-medium">{hotelProviderEn.w106.pageTitle}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1C2928] tracking-tight">
              {hotelProviderEn.w106.pageTitle}
            </h1>
            <p className="mt-1 text-xs text-[#5B6E69]">
              {hotelProviderEn.w106.subtitle}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F7F4] text-[#174B4A] border border-[#B2DFDB] shrink-0">
            <span className="material-symbols-outlined text-[15px]">verified_user</span>
            Staff Reconciliation (UC-83)
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#DCE2DD] rounded-xl p-4 shadow-xs">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          {/* Service Provider Filter */}
          <div className="lg:col-span-3">
            <AccessibleSelect
              label={hotelProviderEn.w106.filters.providerLabel}
              options={providerOptions}
              value={selectedProvider}
              onChange={(val) => setSelectedProvider(val)}
            />
          </div>

          {/* Period Filter */}
          <div className="lg:col-span-2">
            <AccessibleSelect
              label={hotelProviderEn.w106.filters.periodLabel}
              options={periodOptions}
              value={selectedPeriod}
              onChange={(val) => setSelectedPeriod(val)}
            />
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-3">
            <AccessibleSelect
              label={hotelProviderEn.w106.filters.statusLabel}
              options={statusOptions}
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(val as StatementStatus | 'All')}
            />
          </div>

          {/* Reference Keyword Search */}
          <div className="lg:col-span-3">
            <label htmlFor="w106-ref-search" className="block text-xs font-semibold text-[#1C2928] mb-1">
              {hotelProviderEn.w106.filters.referenceLabel}
            </label>
            <input
              id="w106-ref-search"
              type="text"
              value={refKeyword}
              onChange={(e) => setRefKeyword(e.target.value)}
              placeholder={hotelProviderEn.w106.filters.referencePlaceholder}
              className="w-full px-3 py-2 text-xs bg-white border border-[#DCE2DD] rounded-lg text-[#1C2928] placeholder-[#8E9E9B] focus:outline-none focus:ring-2 focus:ring-[#174B4A] focus:border-[#174B4A]"
            />
          </div>

          {/* Action Buttons */}
          <div className="lg:col-span-1 flex items-center gap-1.5">
            <button
              type="submit"
              className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-[#174B4A] hover:bg-[#103B39] rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">search</span>
              <span>{hotelProviderEn.w106.filters.applyButton}</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="p-2 text-xs font-semibold text-[#5B6E69] hover:text-[#1C2928] hover:bg-[#F7F5EF] rounded-lg transition-colors cursor-pointer border border-[#DCE2DD]"
              title={hotelProviderEn.w106.filters.resetButton}
              aria-label={hotelProviderEn.w106.filters.resetButton}
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
            </button>
          </div>
        </form>
      </div>

      {/* Full-width Reconciliation Workstation Table */}
      <div className="bg-white border border-[#DCE2DD] rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#5B6E69]">
            <span className="material-symbols-outlined text-[28px] animate-spin text-[#174B4A] mb-2 block mx-auto">
              progress_activity
            </span>
            Loading reconciliation records...
          </div>
        ) : statements.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#5B6E69]">
            <span className="material-symbols-outlined text-[36px] text-[#8E9E9B] mb-2 block mx-auto">
              task_alt
            </span>
            <h3 className="font-bold text-sm text-[#1C2928] mb-1">
              {hotelProviderEn.w106.emptyTitle}
            </h3>
            <p className="text-[#5B6E69] max-w-sm mx-auto">
              {hotelProviderEn.w106.emptySubtitle}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F7F5EF] border-b border-[#DCE2DD] text-[#5B6E69] font-semibold uppercase tracking-wider text-[11px]">
                  <th scope="col" className="py-3 px-4 min-w-[200px]">
                    {hotelProviderEn.w106.tableHeaders.provider}
                  </th>
                  <th scope="col" className="py-3 px-3.5 w-[90px] whitespace-nowrap">
                    {hotelProviderEn.w106.tableHeaders.period}
                  </th>
                  <th scope="col" className="py-3 px-3.5 w-[140px]">
                    {hotelProviderEn.w106.tableHeaders.commissionAmount}
                  </th>
                  <th scope="col" className="py-3 px-3.5 w-[110px] whitespace-nowrap">
                    {hotelProviderEn.w106.tableHeaders.dueDate}
                  </th>
                  <th scope="col" className="py-3 px-3.5 w-[140px]">
                    {hotelProviderEn.w106.tableHeaders.status}
                  </th>
                  <th scope="col" className="py-3 px-3.5 min-w-[170px]">
                    {hotelProviderEn.w106.tableHeaders.bankReference}
                  </th>
                  <th scope="col" className="py-3 px-3.5 w-[130px] whitespace-nowrap">
                    {hotelProviderEn.w106.tableHeaders.reportedAt}
                  </th>
                  <th scope="col" className="py-3 px-4 w-[160px] text-right">
                    {hotelProviderEn.w106.tableHeaders.action}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8ECE9] text-[#1C2928]">
                {statements.map((item) => {
                  const isReported = item.status === 'PaymentReported';
                  const isPaid = item.status === 'Paid';

                  return (
                    <tr key={item.id} className="hover:bg-[#F7F5EF]/60 transition-colors">
                      {/* Provider Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#1C2928]">{item.providerName}</div>
                        <div className="text-[10px] font-mono text-[#5B6E69]">{item.statementCode}</div>
                      </td>

                      {/* Period */}
                      <td className="py-3 px-3.5 font-semibold text-[#174B4A] whitespace-nowrap">
                        {item.period}
                      </td>

                      {/* Commission Amount */}
                      <td className="py-3 px-3.5 font-mono font-bold text-[#174B4A]">
                        {formatVnd(item.commissionAmount)}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-[#5B6E69]">
                        {formatDate(item.dueDate)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5">
                        <StatusBadge status={item.status} size="sm" />
                      </td>

                      {/* Bank Reference */}
                      <td className="py-3 px-3.5 font-mono font-bold">
                        {item.bankReference ? (
                          <span className="bg-[#E8ECE9] px-2 py-0.5 rounded text-[#1C2928]">
                            {item.bankReference}
                          </span>
                        ) : (
                          <span className="text-[#8E9E9B] italic font-normal font-sans">
                            None reported
                          </span>
                        )}
                      </td>

                      {/* Reported At */}
                      <td className="py-3 px-3.5 text-[#5B6E69] text-[11px] whitespace-nowrap">
                        {formatDateTime(item.reportedAt)}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        {isReported ? (
                          <button
                            type="button"
                            onClick={() => handleOpenReceiptModal(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0E9F6E] hover:bg-[#065F46] text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[15px]">task_alt</span>
                            <span>{hotelProviderEn.w106.recordReceiptButton}</span>
                          </button>
                        ) : isPaid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#065F46] bg-[#E6F7F0] px-2.5 py-1 rounded-md border border-[#A7F3D0]">
                            <span className="material-symbols-outlined text-[13px]">done_all</span>
                            <span>{hotelProviderEn.w106.reconciledBadge}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#8E9E9B] italic">
                            Awaiting Transfer
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog: Record Receipt (CR-05, BR-174) */}
      {targetStatement && (
        <ConfirmationDialog
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmReceipt}
          title={hotelProviderEn.w106.confirmModal.title}
          message={
            <div className="space-y-2">
              <p>
                {hotelProviderEn.w106.confirmModal.message(
                  formatVnd(targetStatement.commissionAmount),
                  targetStatement.providerName,
                  targetStatement.bankReference || 'VCB-REF'
                )}
              </p>
              <div className="p-2.5 bg-[#F7F5EF] border border-[#DCE2DD] rounded-lg text-[11px] text-[#5B6E69]">
                {hotelProviderEn.w106.confirmModal.auditNotice}
              </div>
            </div>
          }
          confirmLabel={hotelProviderEn.w106.confirmModal.confirmButton}
          cancelLabel={hotelProviderEn.w106.confirmModal.cancelButton}
          variant="primary"
          isLoading={isProcessing}
        />
      )}
    </div>
  );
}
