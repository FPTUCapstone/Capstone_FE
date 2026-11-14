'use client';

import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { useToast } from '../common/Toast';
import { ProviderStatementService } from '../../services/providerStatementService';
import type { StatementItem } from '../../types';
import { formatDate, formatDateTime, formatVnd } from '../../utils/formatters';
import { hotelProviderVi } from '../../resources/vi';

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
        showToast(hotelProviderVi.messages.MSG127, 'error');
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
      setBankRefError(hotelProviderVi.messages.MSG172);
      showToast(hotelProviderVi.messages.MSG172, 'error');
      return;
    }

    setIsReporting(true);
    try {
      const res = await ProviderStatementService.reportPayment({
        statementId: selectedStatement.id,
        bankReference: bankRefInput.trim(),
      });

      if (res.success) {
        showToast(hotelProviderVi.messages.MSG208, 'success');
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
        showToast(res.error || hotelProviderVi.messages.MSG127, 'error');
      }
    } catch {
      showToast(hotelProviderVi.messages.MSG133, 'error');
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#1C2928] tracking-tight">
          {hotelProviderVi.w105.pageTitle}
        </h1>
        <p className="mt-1 text-xs text-[#5B6E69]">
          {hotelProviderVi.w105.subtitle}
        </p>
      </div>

      {/* 60 / 40 Two-Column Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Statement Ledger Table (60% -> 7 cols of 12) */}
        <div className="lg:col-span-7 bg-white border border-[#DCE2DD] rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E8ECE9] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1C2928] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#174B4A]">
                receipt_long
              </span>
              <span>Sổ cái Quyết toán Hoa hồng</span>
            </h2>
            <span className="text-xs text-[#5B6E69]">
              {statements.length} kỳ quyết toán
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-xs text-[#5B6E69]">
              <span className="material-symbols-outlined text-[28px] animate-spin text-[#174B4A] mb-2 block mx-auto">
                progress_activity
              </span>
              {hotelProviderVi.common.loading}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F5EF] border-b border-[#DCE2DD] text-[#5B6E69] font-semibold uppercase tracking-wider text-[11px]">
                    <th scope="col" className="py-3 px-3.5 whitespace-nowrap">
                      {hotelProviderVi.w105.tableHeaders.period}
                    </th>
                    <th scope="col" className="py-3 px-3 text-center whitespace-nowrap">
                      {hotelProviderVi.w105.tableHeaders.completedCount}
                    </th>
                    <th scope="col" className="py-3 px-3 whitespace-nowrap">
                      {hotelProviderVi.w105.tableHeaders.totalRevenue}
                    </th>
                    <th scope="col" className="py-3 px-3 whitespace-nowrap">
                      {hotelProviderVi.w105.tableHeaders.commissionAmount}
                    </th>
                    <th scope="col" className="py-3 px-3 whitespace-nowrap">
                      {hotelProviderVi.w105.tableHeaders.dueDate}
                    </th>
                    <th scope="col" className="py-3 px-3">
                      {hotelProviderVi.w105.tableHeaders.status}
                    </th>
                    <th scope="col" className="py-3 px-3 text-right">
                      {hotelProviderVi.w105.tableHeaders.action}
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
                            aria-label={`Xem bảng kê ${stmt.period}`}
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

        {/* Right: Selected Statement Details & Wire Reporting Drawer (40% -> 5 cols of 12) */}
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
                  Quyết toán Hoa hồng — Tháng {selectedStatement.period}
                </h3>
                <p className="text-xs text-[#5B6E69] mt-0.5">
                  Hạn thanh toán: {formatDate(selectedStatement.dueDate)} • {selectedStatement.completedCount} lượt hoàn thành
                </p>

                <div className="mt-3 p-3 bg-[#F7F5EF] rounded-lg flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#5B6E69]">Tổng hoa hồng phải nộp:</span>
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
                    {hotelProviderVi.w105.detailDrawer.breakdownSectionTitle}
                  </h4>

                  <div className="border border-[#E8ECE9] rounded-lg overflow-hidden max-h-44 overflow-y-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-[#F7F5EF] text-[#5B6E69] font-semibold border-b border-[#E8ECE9]">
                        <tr>
                          <th scope="col" className="py-1.5 px-2.5">Mã đơn</th>
                          <th scope="col" className="py-1.5 px-2">Du khách</th>
                          <th scope="col" className="py-1.5 px-2 text-right">Doanh thu</th>
                          <th scope="col" className="py-1.5 px-2.5 text-right">Hoa hồng (10%)</th>
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

              {/* Bank Account Information - Clearly distinguished DEMO / SANDBOX */}
              <div className="p-4 bg-[#FFF8F0] border-2 border-[#FBD38D] rounded-xl text-xs space-y-2.5 shadow-2xs">
                {/* Prominent Demo Sandbox Banner */}
                <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-[#9C4221] bg-[#FEEBC8] px-2.5 py-1 rounded-md border border-[#FBD38D]">
                  <span className="material-symbols-outlined text-[16px] text-[#DD6B20]">warning</span>
                  <span>{hotelProviderVi.w105.detailDrawer.bankInfoCard.title}</span>
                </div>

                <p className="text-[11px] text-[#7B341E] leading-relaxed font-medium">
                  {hotelProviderVi.w105.detailDrawer.bankInfoCard.warningBadge}
                </p>

                <div className="text-[11px] space-y-1.5 pt-1 text-[#1C2928] bg-white p-3 rounded-lg border border-[#FEEBC8]">
                  <p>
                    <span className="text-[#5B6E69]">Ngân hàng:</span>{' '}
                    <span className="font-medium">{hotelProviderVi.w105.detailDrawer.bankInfoCard.bankName}</span>
                  </p>
                  <p>
                    <span className="text-[#5B6E69]">Chủ tài khoản:</span>{' '}
                    <strong>{hotelProviderVi.w105.detailDrawer.bankInfoCard.accountHolder}</strong>
                  </p>
                  <p>
                    <span className="text-[#5B6E69]">Số tài khoản:</span>{' '}
                    <strong className="font-mono text-sm text-[#174B4A] tracking-wider">
                      {hotelProviderVi.w105.detailDrawer.bankInfoCard.accountNumber}
                    </strong>
                  </p>
                  <p className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[#5B6E69]">Cú pháp chuyển khoản:</span>{' '}
                    <code className="font-mono bg-[#F7F5EF] px-2 py-0.5 rounded border border-[#DCE2DD] font-bold text-[#174B4A]">
                      {hotelProviderVi.w105.detailDrawer.bankInfoCard.transferContent(selectedStatement.statementCode, 'HOIAN')}
                    </code>
                  </p>
                </div>
              </div>

              {/* Wire Payment Reporting Form */}
              {selectedStatement.status === 'Issued' || selectedStatement.status === 'Overdue' ? (
                <form onSubmit={handleReportPayment} className="space-y-3 pt-2 border-t border-[#E8ECE9]">
                  <h4 className="text-xs font-bold text-[#1C2928] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#174B4A]">
                      send
                    </span>
                    {hotelProviderVi.w105.detailDrawer.paymentSectionTitle}
                  </h4>
                  <p className="text-[11px] text-[#5B6E69] leading-relaxed">
                    {hotelProviderVi.w105.detailDrawer.paymentExplanation}
                  </p>

                  <div>
                    <label htmlFor="w105-bank-ref" className="block text-xs font-semibold text-[#1C2928] mb-1">
                      {hotelProviderVi.w105.detailDrawer.referenceInputLabel}{' '}
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
                      placeholder={hotelProviderVi.w105.detailDrawer.referencePlaceholder}
                      className={`w-full px-3 py-2 text-xs font-mono font-bold bg-white border rounded-lg text-[#1C2928] placeholder-[#8E9E9B] focus:outline-none focus:ring-2 focus:ring-[#174B4A]/15 focus:border-[#174B4A] transition-colors ${
                        bankRefError ? 'border-[#DC2626]' : 'border-[#DCE2DD]'
                      }`}
                    />
                    <p className="mt-1 text-[10px] text-[#5B6E69]">
                      {hotelProviderVi.w105.detailDrawer.referenceHelp}
                    </p>
                    {bankRefError && (
                      <p className="mt-1 text-xs text-[#DC2626] flex items-center gap-1" role="alert">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        <span>{bankRefError}</span>
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isReporting}
                    className="w-full py-2.5 px-4 bg-[#174B4A] hover:bg-[#103B39] text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isReporting ? (
                      <span className="material-symbols-outlined text-[15px] animate-spin">
                        progress_activity
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    )}
                    <span>{hotelProviderVi.w105.detailDrawer.reportButton}</span>
                  </button>
                </form>
              ) : selectedStatement.status === 'PaymentReported' ? (
                /* Payment Reported Read-only Notice */
                <div className="p-4 bg-[#FEF3E2] border border-[#FDE68A] rounded-xl text-xs text-[#92400E] space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
                    <span>Đã Thông Báo Chuyển Khoản</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {hotelProviderVi.w105.detailDrawer.reportedNotice(
                      selectedStatement.bankReference || 'VCB-REF',
                      formatDateTime(selectedStatement.reportedAt)
                    )}
                  </p>
                </div>
              ) : (
                /* Paid Reconciled Notice */
                <div className="p-4 bg-[#E6F7F0] border border-[#A7F3D0] rounded-xl text-xs text-[#065F46] space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="material-symbols-outlined text-[18px]">task_alt</span>
                    <span>Đã Thanh Toán & Hoàn Tất Đối Soát</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {hotelProviderVi.w105.detailDrawer.paidNotice}
                  </p>
                  {selectedStatement.confirmedAt && (
                    <p className="text-[10px] text-[#065F46]/80 pt-1 font-mono">
                      Xác nhận lúc {formatDateTime(selectedStatement.confirmedAt)} bởi Nhân viên #{selectedStatement.confirmedByStaffId}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 bg-white border border-[#DCE2DD] rounded-xl text-center text-xs text-[#5B6E69]">
              Chọn một kỳ quyết toán từ danh sách sổ cái để xem chi tiết.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
