'use client';

import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { useToast } from '../common/Toast';
import { ProviderStatementService } from '../../services/providerStatementService';
import type { StatementItem } from '../../types';
import { formatDate, formatDateTime, formatVnd } from '../../utils/formatters';
import { hotelProviderEn } from '../../resources/en';

export function CommissionStatementsView() {
  const { showToast } = useToast();

  const [statements, setStatements] = useState<StatementItem[]>([]);
  const [selectedStatement, setSelectedStatement] = useState<StatementItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Wire transfer reference input state
  const [bankRefInput, setBankRefInput] = useState('');
  const [bankRefError, setBankRefError] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    let active = true;
    ProviderStatementService.fetchStatements()
      .then((data) => {
        if (!active) return;
        setStatements(data.items);
        if (data.items.length > 0) {
          setSelectedStatement(data.items[0]);
          if (data.items[0].bankReference) {
            setBankRefInput(data.items[0].bankReference);
          }
        }
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
  }, [showToast]);

  const handleSelectStatement = (statement: StatementItem) => {
    setSelectedStatement(statement);
    setBankRefInput(statement.bankReference || '');
    setBankRefError('');
  };

  const handleReportPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatement) return;

    if (!bankRefInput.trim()) {
      setBankRefError(hotelProviderEn.messages.MSG172);
      showToast(hotelProviderEn.messages.MSG172, 'error');
      return;
    }

    setIsReporting(true);
    try {
      const res = await ProviderStatementService.reportPayment({
        statementId: selectedStatement.id,
        bankReference: bankRefInput.trim(),
      });

      if (res.success) {
        showToast(hotelProviderEn.messages.MSG208, 'success');
        const updated = {
          ...selectedStatement,
          status: res.updatedStatus,
          bankReference: bankRefInput.trim(),
          reportedAt: res.reportedAt,
        };
        setSelectedStatement(updated);
        setStatements((prev) =>
          prev.map((s) => (s.id === selectedStatement.id ? updated : s))
        );
      } else {
        showToast(res.error || hotelProviderEn.messages.MSG127, 'error');
      }
    } catch {
      showToast(hotelProviderEn.messages.MSG133, 'error');
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#1C2928] tracking-tight">
          {hotelProviderEn.w105.pageTitle}
        </h1>
        <p className="mt-1 text-xs text-[#5B6E69]">
          {hotelProviderEn.w105.subtitle}
        </p>
      </div>

      {/* 60 / 40 Two-Column Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Statement Ledger Table (60% -> 7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#DCE2DD] rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E8ECE9] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1C2928] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#174B4A]">
                receipt_long
              </span>
              <span>Statement Ledger</span>
            </h2>
            <span className="text-xs text-[#5B6E69]">
              {statements.length} statements on record
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-xs text-[#5B6E69]">
              <span className="material-symbols-outlined text-[28px] animate-spin text-[#174B4A] mb-2 block mx-auto">
                progress_activity
              </span>
              Loading statements...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F5EF] border-b border-[#DCE2DD] text-[#5B6E69] font-semibold uppercase tracking-wider text-[11px]">
                    <th scope="col" className="py-3 px-3.5">
                      {hotelProviderEn.w105.tableHeaders.period}
                    </th>
                    <th scope="col" className="py-3 px-3 text-center">
                      {hotelProviderEn.w105.tableHeaders.completedCount}
                    </th>
                    <th scope="col" className="py-3 px-3">
                      {hotelProviderEn.w105.tableHeaders.totalRevenue}
                    </th>
                    <th scope="col" className="py-3 px-3">
                      {hotelProviderEn.w105.tableHeaders.commissionAmount}
                    </th>
                    <th scope="col" className="py-3 px-3 whitespace-nowrap">
                      {hotelProviderEn.w105.tableHeaders.dueDate}
                    </th>
                    <th scope="col" className="py-3 px-3">
                      {hotelProviderEn.w105.tableHeaders.status}
                    </th>
                    <th scope="col" className="py-3 px-3 text-right">
                      {hotelProviderEn.w105.tableHeaders.action}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8ECE9] text-[#1C2928]">
                  {statements.map((stmt) => {
                    const isSelected = selectedStatement?.id === stmt.id;
                    return (
                      <tr
                        key={stmt.id}
                        onClick={() => handleSelectStatement(stmt)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#E8F7F4]/70 font-medium'
                            : 'hover:bg-[#F7F5EF]/60'
                        }`}
                      >
                        <td className="py-3 px-3.5 whitespace-nowrap font-bold text-[#174B4A]">
                          Tháng {stmt.period}
                        </td>
                        <td className="py-3 px-3 text-center font-medium">
                          {stmt.completedCount}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {formatVnd(stmt.totalRevenue)}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#174B4A]">
                          {formatVnd(stmt.commissionAmount)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-[#5B6E69]">
                          {formatDate(stmt.dueDate)}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={stmt.status} size="sm" />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectStatement(stmt);
                            }}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#174B4A] text-white'
                                : 'text-[#5B6E69] hover:bg-[#DCE2DD]'
                            }`}
                            aria-label={`View statement ${stmt.period}`}
                          >
                            <span className="material-symbols-outlined text-[16px] block">
                              visibility
                            </span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Selected Statement Details & Wire Reporting Drawer (40% -> 5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedStatement ? (
            <div className="bg-white border border-[#DCE2DD] rounded-xl p-5 shadow-xs space-y-5">
              {/* Summary Card */}
              <div className="border-b border-[#E8ECE9] pb-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono font-bold text-xs text-[#174B4A] bg-[#E8F7F4] px-2 py-0.5 rounded border border-[#B2DFDB]">
                    {selectedStatement.statementCode}
                  </span>
                  <StatusBadge status={selectedStatement.status} size="sm" />
                </div>
                <h3 className="text-base font-bold text-[#1C2928]">
                  Commission Billing — Month {selectedStatement.period}
                </h3>
                <p className="text-xs text-[#5B6E69] mt-0.5">
                  Due by {formatDate(selectedStatement.dueDate)} • {selectedStatement.completedCount} completed stays
                </p>

                <div className="mt-3 p-3 bg-[#F7F5EF] rounded-lg flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#5B6E69]">Total Commission Due:</span>
                  <span className="font-mono text-base font-bold text-[#174B4A]">
                    {formatVnd(selectedStatement.commissionAmount)}
                  </span>
                </div>
              </div>

              {/* Completed Bookings Audit Breakdown */}
              {selectedStatement.breakdown && selectedStatement.breakdown.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[#1C2928] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-[#174B4A]">
                      checklist
                    </span>
                    {hotelProviderEn.w105.detailDrawer.breakdownSectionTitle}
                  </h4>

                  <div className="border border-[#E8ECE9] rounded-lg overflow-hidden max-h-44 overflow-y-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-[#F7F5EF] text-[#5B6E69] font-semibold border-b border-[#E8ECE9]">
                        <tr>
                          <th scope="col" className="py-1.5 px-2.5">Code</th>
                          <th scope="col" className="py-1.5 px-2">Guest</th>
                          <th scope="col" className="py-1.5 px-2 text-right">Actual</th>
                          <th scope="col" className="py-1.5 px-2.5 text-right">Comm (10%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8ECE9] text-[#1C2928]">
                        {selectedStatement.breakdown.map((row) => (
                          <tr key={row.id}>
                            <td className="py-1.5 px-2.5 font-mono font-medium text-[#174B4A]">
                              {row.bookingCode}
                            </td>
                            <td className="py-1.5 px-2 truncate max-w-[100px]">{row.guestName}</td>
                            <td className="py-1.5 px-2 text-right font-mono">{formatVnd(row.actualAmount)}</td>
                            <td className="py-1.5 px-2.5 text-right font-mono font-bold text-[#174B4A]">
                              {formatVnd(row.commissionAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Official Bank Account Information */}
              <div className="p-3.5 bg-[#FFF2EB] border border-[#FFD8C2] rounded-xl text-xs space-y-1.5 text-[#995436]">
                <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-[#995436]">
                  <span className="material-symbols-outlined text-[16px]">account_balance</span>
                  {hotelProviderEn.w105.detailDrawer.bankInfoCard.title}
                </div>
                <div className="text-[11px] space-y-0.5 pt-1 text-[#1C2928]">
                  <p><span className="text-[#5B6E69]">Bank:</span> {hotelProviderEn.w105.detailDrawer.bankInfoCard.bankName}</p>
                  <p><span className="text-[#5B6E69]">Account Holder:</span> <strong>{hotelProviderEn.w105.detailDrawer.bankInfoCard.accountHolder}</strong></p>
                  <p><span className="text-[#5B6E69]">Account Number:</span> <strong className="font-mono text-sm text-[#174B4A]">{hotelProviderEn.w105.detailDrawer.bankInfoCard.accountNumber}</strong></p>
                  <p><span className="text-[#5B6E69]">Transfer Syntax:</span> <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#FFD8C2] font-bold text-[#995436]">{hotelProviderEn.w105.detailDrawer.bankInfoCard.transferContent(selectedStatement.statementCode, 'HOIAN')}</code></p>
                </div>
              </div>

              {/* Wire Payment Reporting Form */}
              {selectedStatement.status === 'Issued' || selectedStatement.status === 'Overdue' ? (
                <form onSubmit={handleReportPayment} className="space-y-3 pt-2 border-t border-[#E8ECE9]">
                  <h4 className="text-xs font-bold text-[#1C2928] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#174B4A]">
                      send
                    </span>
                    {hotelProviderEn.w105.detailDrawer.paymentSectionTitle}
                  </h4>
                  <p className="text-[11px] text-[#5B6E69] leading-relaxed">
                    {hotelProviderEn.w105.detailDrawer.paymentExplanation}
                  </p>

                  <div>
                    <label htmlFor="w105-bank-ref" className="block text-xs font-semibold text-[#1C2928] mb-1">
                      {hotelProviderEn.w105.detailDrawer.referenceInputLabel}{' '}
                      <span className="text-[#DC2626]" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="w105-bank-ref"
                      type="text"
                      value={bankRefInput}
                      onChange={(e) => {
                        setBankRefInput(e.target.value);
                        if (bankRefError) setBankRefError('');
                      }}
                      placeholder={hotelProviderEn.w105.detailDrawer.referencePlaceholder}
                      className={`w-full px-3 py-2 text-xs font-mono font-bold bg-white border rounded-lg text-[#1C2928] placeholder-[#8E9E9B] focus:outline-none focus:ring-2 focus:ring-[#174B4A] focus:border-[#174B4A] ${
                        bankRefError ? 'border-[#DC2626]' : 'border-[#DCE2DD]'
                      }`}
                    />
                    <p className="mt-1 text-[10px] text-[#5B6E69]">
                      {hotelProviderEn.w105.detailDrawer.referenceHelp}
                    </p>
                    {bankRefError && (
                      <p className="mt-1 text-xs text-[#DC2626]" role="alert">
                        {bankRefError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isReporting}
                    className="w-full py-2.5 px-4 bg-[#174B4A] hover:bg-[#103B39] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isReporting ? (
                      <span className="material-symbols-outlined text-[15px] animate-spin">
                        progress_activity
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    )}
                    <span>{hotelProviderEn.w105.detailDrawer.reportButton}</span>
                  </button>
                </form>
              ) : selectedStatement.status === 'PaymentReported' ? (
                /* Payment Reported Read-only Notice */
                <div className="p-4 bg-[#FEF3E2] border border-[#FDE68A] rounded-xl text-xs text-[#92400E] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
                    <span>Wire Payment Reported</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {hotelProviderEn.w105.detailDrawer.reportedNotice(
                      selectedStatement.bankReference || 'VCB-REF',
                      formatDateTime(selectedStatement.reportedAt)
                    )}
                  </p>
                </div>
              ) : (
                /* Paid Reconciled Notice */
                <div className="p-4 bg-[#E6F7F0] border border-[#A7F3D0] rounded-xl text-xs text-[#065F46] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="material-symbols-outlined text-[18px]">task_alt</span>
                    <span>Payment Reconciled & Settled</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {hotelProviderEn.w105.detailDrawer.paidNotice}
                  </p>
                  {selectedStatement.confirmedAt && (
                    <p className="text-[10px] text-[#065F46]/80 pt-1">
                      Confirmed on {formatDateTime(selectedStatement.confirmedAt)} by Staff #{selectedStatement.confirmedByStaffId}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 bg-white border border-[#DCE2DD] rounded-xl text-center text-xs text-[#5B6E69]">
              Select a statement from the ledger to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
