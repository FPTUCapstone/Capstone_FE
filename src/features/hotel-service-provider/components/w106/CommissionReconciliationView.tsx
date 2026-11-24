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
import { hotelProviderVi } from '../../resources/vi';
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
  const [inspectStatement, setInspectStatement] = useState<StatementItem | null>(null);

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
        showToast(hotelProviderVi.messages.MSG127, 'error');
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
        showToast(hotelProviderVi.messages.MSG209, 'success');
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
        showToast(res.error || hotelProviderVi.messages.MSG127, 'error');
      }
    } catch {
      showToast(hotelProviderVi.messages.MSG133, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const providerOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    map.set('42', 'Hội An Riverside Heritage Resort');
    map.set('43', 'Da Nang Beachfront Boutique Resort');
    statements.forEach((s) => {
      if (s.providerId) map.set(String(s.providerId), s.providerName);
    });
    return [
      { value: 'All', label: 'Tất cả đối tác' },
      ...Array.from(map.entries()).map(([value, label]) => ({ value, label })),
    ];
  }, [statements]);

  const periodOptions = React.useMemo(() => {
    const set = new Set<string>(['11/2026', '10/2026', '09/2026']);
    statements.forEach((s) => {
      if (s.period) set.add(s.period);
    });
    return [
      { value: 'All', label: 'Tất cả các kỳ' },
      ...Array.from(set).map((p) => ({ value: p, label: `Tháng ${p}` })),
    ];
  }, [statements]);

  const statusOptions = [
    { value: 'All', label: 'Tất cả trạng thái' },
    {
      value: 'PaymentReported',
      label: hotelProviderVi.statuses.paymentReported,
      icon: 'hourglass_top',
    },
    {
      value: 'Paid',
      label: hotelProviderVi.statuses.paid,
      icon: 'task_alt',
    },
    {
      value: 'Issued',
      label: hotelProviderVi.statuses.issued,
      icon: 'receipt_long',
    },
    {
      value: 'Overdue',
      label: hotelProviderVi.statuses.overdue,
      icon: 'warning',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-[#5B6E69] mb-1">
          <Link href={ROUTES.admin.dashboard} className="hover:text-[#174B4A] transition-colors">
            {hotelProviderVi.w106.breadcrumb}
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#1C2928] font-medium">{hotelProviderVi.w106.pageTitle}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1C2928] tracking-tight">
              {hotelProviderVi.w106.pageTitle}
            </h1>
            <p className="mt-1 text-xs text-[#5B6E69]">
              {hotelProviderVi.w106.subtitle}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F7F4] text-[#174B4A] border border-[#B2DFDB] shrink-0">
            <span className="material-symbols-outlined text-[15px]">verified_user</span>
            {hotelProviderVi.w106.staffRoleBadge}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#DCE2DD] rounded-xl p-4 shadow-xs">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          {/* Service Provider Filter */}
          <div className="lg:col-span-3">
            <AccessibleSelect
              label={hotelProviderVi.w106.filters.providerLabel}
              options={providerOptions}
              value={selectedProvider}
              onChange={(val) => setSelectedProvider(val)}
            />
          </div>

          {/* Period Filter */}
          <div className="lg:col-span-2">
            <AccessibleSelect
              label={hotelProviderVi.w106.filters.periodLabel}
              options={periodOptions}
              value={selectedPeriod}
              onChange={(val) => setSelectedPeriod(val)}
            />
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-3">
            <AccessibleSelect
              label={hotelProviderVi.w106.filters.statusLabel}
              options={statusOptions}
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(val as StatementStatus | 'All')}
            />
          </div>

          {/* Reference Keyword Search */}
          <div className="lg:col-span-3">
            <label htmlFor="w106-ref-search" className="block text-xs font-semibold text-[#1C2928] mb-1">
              {hotelProviderVi.w106.filters.referenceLabel}
            </label>
            <input
              id="w106-ref-search"
              type="text"
              value={refKeyword}
              onChange={(e) => setRefKeyword(e.target.value)}
              placeholder={hotelProviderVi.w106.filters.referencePlaceholder}
              className="w-full px-3 py-2 text-xs bg-white border border-[#DCE2DD] rounded-lg text-[#1C2928] placeholder-[#8E9E9B] focus:outline-none focus:ring-2 focus:ring-[#174B4A]/15 focus:border-[#174B4A] transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="lg:col-span-1 flex items-center gap-1.5">
            <button
              type="submit"
              className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-[#174B4A] hover:bg-[#103B39] rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">search</span>
              <span>{hotelProviderVi.w106.filters.applyButton}</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="p-2 text-xs font-semibold text-[#5B6E69] hover:text-[#1C2928] hover:bg-[#F7F5EF] rounded-lg transition-colors cursor-pointer border border-[#DCE2DD]"
              title={hotelProviderVi.w106.filters.resetButton}
              aria-label={hotelProviderVi.w106.filters.resetButton}
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
            {hotelProviderVi.common.loading}
          </div>
        ) : statements.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#5B6E69]">
            <span className="material-symbols-outlined text-[36px] text-[#8E9E9B] mb-2 block mx-auto">
              task_alt
            </span>
            <h3 className="font-bold text-sm text-[#1C2928] mb-1">
              {hotelProviderVi.w106.emptyTitle}
            </h3>
            <p className="text-[#5B6E69] max-w-sm mx-auto">
              {hotelProviderVi.w106.emptySubtitle}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F7F5EF] border-b border-[#DCE2DD] text-[#5B6E69] font-semibold uppercase tracking-wider text-[11px]">
                  <th scope="col" className="py-3 px-4 min-w-[200px]">
                    {hotelProviderVi.w106.tableHeaders.provider}
                  </th>
                  <th scope="col" className="py-3 px-3.5 w-[90px] whitespace-nowrap">
                    {hotelProviderVi.w106.tableHeaders.period}
                  </th>
                  <th scope="col" className="py-3 px-3.5 w-[140px] text-right whitespace-nowrap">
                    {hotelProviderVi.w106.tableHeaders.commissionAmount}
                  </th>
                  <th scope="col" className="py-3 px-3.5 w-[110px] whitespace-nowrap">
                    {hotelProviderVi.w106.tableHeaders.dueDate}
                  </th>
                  <th scope="col" className="py-3 px-3.5 w-[140px]">
                    {hotelProviderVi.w106.tableHeaders.status}
                  </th>
                  <th scope="col" className="py-3 px-3.5 min-w-[170px]">
                    {hotelProviderVi.w106.tableHeaders.bankReference}
                  </th>
                  <th scope="col" className="py-3 px-3.5 w-[130px] whitespace-nowrap">
                    {hotelProviderVi.w106.tableHeaders.reportedAt}
                  </th>
                  <th scope="col" className="py-3 px-4 w-[160px] text-right">
                    {hotelProviderVi.w106.tableHeaders.action}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8ECE9] text-[#1C2928]">
                {statements.map((item) => {
                  const isReported = item.status === 'PaymentReported';
                  const isPaid = item.status === 'Paid';

                  return (
                    <tr key={item.id} className="hover:bg-[#F7F5EF]/70 transition-colors">
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
                      <td className="py-3 px-3.5 text-right tabular-nums font-mono font-bold text-[#174B4A] whitespace-nowrap">
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
                            Chưa có mã
                          </span>
                        )}
                      </td>

                      {/* Reported At */}
                      <td className="py-3 px-3.5 text-[#5B6E69] text-[11px] whitespace-nowrap">
                        {formatDateTime(item.reportedAt)}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setInspectStatement(item)}
                            className="p-1.5 text-[#5B6E69] hover:text-[#174B4A] hover:bg-[#E8ECE9] rounded-lg transition-colors cursor-pointer"
                            title="Xem chi tiết bảng kê"
                            aria-label={`Xem chi tiết ${item.statementCode}`}
                          >
                            <span className="material-symbols-outlined text-[16px] block">visibility</span>
                          </button>

                          {isReported ? (
                            <button
                              type="button"
                              onClick={() => handleOpenReceiptModal(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0E9F6E] hover:bg-[#065F46] text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[15px]">task_alt</span>
                              <span>{hotelProviderVi.w106.recordReceiptButton}</span>
                            </button>
                          ) : isPaid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#065F46] bg-[#E6F7F0] px-2.5 py-1 rounded-md border border-[#A7F3D0]">
                              <span className="material-symbols-outlined text-[13px]">done_all</span>
                              <span>{hotelProviderVi.w106.reconciledBadge}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#8E9E9B] italic">
                              Chờ chuyển khoản
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspection Modal: View Full Statement Detail */}
      {inspectStatement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#DCE2DD] rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E8ECE9] pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-[#174B4A] bg-[#E8F7F4] px-2 py-0.5 rounded border border-[#B2DFDB]">
                  {inspectStatement.statementCode}
                </span>
                <h3 className="text-base font-bold text-[#1C2928] mt-1">
                  Chi tiết bảng kê hoa hồng kỳ {inspectStatement.period}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectStatement(null)}
                className="p-1.5 text-[#5B6E69] hover:text-[#1C2928] hover:bg-[#F7F5EF] rounded-lg transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined text-[20px] block">close</span>
              </button>
            </div>

            {/* Partner Info */}
            <div className="p-3 bg-[#F7F5EF] rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[#5B6E69]">Đối tác:</span>
                <span className="font-bold text-[#1C2928]">{inspectStatement.providerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5B6E69]">Hạn thanh toán:</span>
                <span className="font-medium text-[#1C2928]">{formatDate(inspectStatement.dueDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5B6E69]">Trạng thái:</span>
                <StatusBadge status={inspectStatement.status} size="sm" />
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-[#DCE2DD] rounded-xl">
                <span className="text-[#5B6E69] text-[11px] block">Lượt đơn hoàn thành</span>
                <span className="text-base font-bold text-[#1C2928] font-mono">{inspectStatement.completedCount}</span>
              </div>
              <div className="p-3 bg-white border border-[#DCE2DD] rounded-xl">
                <span className="text-[#5B6E69] text-[11px] block">Tổng doanh thu thực tế</span>
                <span className="text-base font-bold text-[#1C2928] font-mono">{formatVnd(inspectStatement.totalRevenue)}</span>
              </div>
            </div>

            <div className="p-3 bg-[#E8F7F4] border border-[#B2DFDB] rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-[#174B4A]">Hoa hồng phải thu (10%):</span>
              <span className="text-base font-bold font-mono text-[#174B4A]">{formatVnd(inspectStatement.commissionAmount)}</span>
            </div>

            {/* Bank wire reference info */}
            <div className="p-3 border border-[#E8ECE9] rounded-xl text-xs space-y-2">
              <span className="font-semibold text-[#1C2928] block">Thông tin thanh toán ngân hàng:</span>
              <div className="flex items-center justify-between">
                <span className="text-[#5B6E69]">Mã giao dịch ngân hàng:</span>
                <span className="font-mono font-bold text-[#1C2928]">
                  {inspectStatement.bankReference || 'Chưa cung cấp'}
                </span>
              </div>
              {inspectStatement.reportedAt && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#5B6E69]">Thời gian gửi mã:</span>
                  <span className="text-[#1C2928]">{formatDateTime(inspectStatement.reportedAt)}</span>
                </div>
              )}
              {inspectStatement.confirmedAt && (
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#E8ECE9]">
                  <span className="text-[#065F46] font-medium">Xác nhận thu tiền lúc:</span>
                  <span className="font-mono text-[#065F46]">{formatDateTime(inspectStatement.confirmedAt)}</span>
                </div>
              )}
            </div>

            {/* Completed Bookings Audit Breakdown */}
            {inspectStatement.breakdown && inspectStatement.breakdown.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#1C2928] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-[#174B4A]">
                    checklist
                  </span>
                  <span>Danh sách đơn hoàn thành ({inspectStatement.breakdown.length})</span>
                </h4>
                <div className="border border-[#E8ECE9] rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-[#F7F5EF] text-[#5B6E69] font-semibold border-b border-[#E8ECE9]">
                      <tr>
                        <th scope="col" className="py-2 px-3">Mã đơn</th>
                        <th scope="col" className="py-2 px-2.5">Gói dịch vụ</th>
                        <th scope="col" className="py-2 px-2.5">Du khách</th>
                        <th scope="col" className="py-2 px-2.5 text-right">Doanh thu</th>
                        <th scope="col" className="py-2 px-3 text-right">Hoa hồng (10%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8ECE9] text-[#1C2928]">
                      {inspectStatement.breakdown.map((row) => (
                        <tr key={row.id} className="hover:bg-[#F7F5EF]/50">
                          <td className="py-2 px-3 font-mono font-medium text-[#174B4A]">
                            {row.bookingCode}
                          </td>
                          <td className="py-2 px-2.5 truncate max-w-[120px]">{row.roomOption}</td>
                          <td className="py-2 px-2.5 truncate max-w-[100px]">{row.guestName}</td>
                          <td className="py-2 px-2.5 text-right font-mono">{formatVnd(row.actualAmount)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-[#174B4A]">
                            {formatVnd(row.commissionAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8ECE9]">
              <button
                type="button"
                onClick={() => setInspectStatement(null)}
                className="px-4 py-2 border border-[#DCE2DD] hover:bg-[#F7F5EF] text-[#5B6E69] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Đóng
              </button>
              {inspectStatement.status === 'PaymentReported' && (
                <button
                  type="button"
                  onClick={() => {
                    const stmt = inspectStatement;
                    setInspectStatement(null);
                    handleOpenReceiptModal(stmt);
                  }}
                  className="px-4 py-2 bg-[#0E9F6E] hover:bg-[#065F46] text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">task_alt</span>
                  <span>{hotelProviderVi.w106.recordReceiptButton}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Record Receipt */}
      {targetStatement && (
        <ConfirmationDialog
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmReceipt}
          title={hotelProviderVi.w106.confirmModal.title}
          message={
            <div className="space-y-2">
              <p>
                {hotelProviderVi.w106.confirmModal.message(
                  formatVnd(targetStatement.commissionAmount),
                  targetStatement.providerName,
                  targetStatement.bankReference || 'VCB-REF'
                )}
              </p>
              <div className="p-2.5 bg-[#F7F5EF] border border-[#DCE2DD] rounded-lg text-[11px] text-[#5B6E69]">
                {hotelProviderVi.w106.confirmModal.auditNotice}
              </div>
            </div>
          }
          confirmLabel={hotelProviderVi.w106.confirmModal.confirmButton}
          cancelLabel={hotelProviderVi.w106.confirmModal.cancelButton}
          variant="primary"
          isLoading={isProcessing}
        />
      )}
    </div>
  );
}
