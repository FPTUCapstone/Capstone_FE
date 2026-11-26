'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { useToast } from '../common/Toast';
import { useProviderLocale } from '../common/ProviderLocaleContext';
import { ProviderStatementService } from '../../services/providerStatementService';
import type { StatementItem } from '../../types';
import { formatDate, formatDateTime, formatVnd } from '../../utils/formatters';
import { hotelProviderVi } from '../../resources/vi';
import { hotelProviderEn } from '../../resources/en';

export function CommissionStatementsView() {
  const { showToast } = useToast();
  const { locale } = useProviderLocale('vi');
  const isVi = locale === 'vi';
  const res = isVi ? hotelProviderVi : hotelProviderEn;

  const [statements, setStatements] = useState<StatementItem[]>([]);
  const [selectedStatement, setSelectedStatement] = useState<StatementItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Wire transfer reference input state
  const [bankRefInput, setBankRefInput] = useState('');
  const [bankRefError, setBankRefError] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  const handleCopy = async (text: string, label: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        showToast(
          isVi ? `Đã sao chép ${label} vào bộ nhớ tạm.` : `Copied ${label} to clipboard.`,
          'info'
        );
      }
    } catch {
      // Fallback
    }
  };

  const handleSelectStatement = async (statement: StatementItem) => {
    setSelectedStatement(statement);
    setBankRefInput(statement.bankReference || '');
    setBankRefError('');
    if (!statement.breakdown || statement.breakdown.length === 0) {
      try {
        const detail = await ProviderStatementService.getStatementById(statement.id);
        if (detail?.breakdown) {
          setSelectedStatement((prev) =>
            prev && prev.id === statement.id ? { ...prev, breakdown: detail.breakdown } : prev
          );
        }
      } catch {
        // Keep summary
      }
    }
  };

  useEffect(() => {
    let active = true;
    ProviderStatementService.fetchStatements()
      .then((data) => {
        if (!active) return;
        setStatements(data.items);
        if (data.items.length > 0) {
          void handleSelectStatement(data.items[0]);
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        showToast(res.messages.MSG127, 'error');
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToast]);

  const kpi = useMemo(() => {
    let dueTotal = 0;
    let overdueCount = 0;
    let issuedCount = 0;
    let reportedTotal = 0;
    let reportedCount = 0;
    let paidTotal = 0;
    let paidCount = 0;

    for (const s of statements) {
      if (s.status === 'Overdue') {
        dueTotal += s.commissionAmount;
        overdueCount += 1;
      } else if (s.status === 'Issued') {
        dueTotal += s.commissionAmount;
        issuedCount += 1;
      } else if (s.status === 'PaymentReported') {
        reportedTotal += s.commissionAmount;
        reportedCount += 1;
      } else if (s.status === 'Paid') {
        paidTotal += s.commissionAmount;
        paidCount += 1;
      }
    }
    return { dueTotal, overdueCount, issuedCount, reportedTotal, reportedCount, paidTotal, paidCount };
  }, [statements]);

  const handleReportPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatement) return;

    if (!bankRefInput.trim()) {
      setBankRefError(res.messages.MSG172);
      showToast(res.messages.MSG172, 'error');
      return;
    }

    setIsReporting(true);
    try {
      const result = await ProviderStatementService.reportPayment({
        statementId: selectedStatement.id,
        bankReference: bankRefInput.trim(),
      });

      if (result.success) {
        showToast(res.messages.MSG208, 'success');
        const updated = {
          ...selectedStatement,
          status: result.updatedStatus,
          bankReference: bankRefInput.trim(),
          reportedAt: result.reportedAt,
        };
        setSelectedStatement(updated);
        setStatements((prev) =>
          prev.map((s) => (s.id === selectedStatement.id ? updated : s))
        );
      } else {
        showToast(result.error || res.messages.MSG127, 'error');
      }
    } catch {
      showToast(res.messages.MSG133, 'error');
    } finally {
      setIsReporting(false);
    }
  };

  const ui = isVi
    ? {
        ratePill: 'Tỷ lệ hoa hồng chuẩn: 10% / doanh thu thực tế',
        kpiDueTitle: 'Cần thanh toán ngay',
        kpiDueSub: (overdue: number, issued: number) =>
          overdue > 0
            ? `${overdue} kỳ quá hạn${issued > 0 ? ` · ${issued} kỳ chờ thanh toán` : ''}`
            : issued > 0
            ? `${issued} kỳ đang chờ thanh toán`
            : 'Không có khoản công nợ chưa nộp',
        kpiReportedTitle: 'Đang chờ TripMate đối soát',
        kpiReportedSub: (c: number) =>
          c > 0 ? `${c} kỳ đã báo mã chuyển khoản` : 'Chưa có kỳ nào chờ đối soát',
        kpiPaidTitle: 'Đã hoàn tất quyết toán',
        kpiPaidSub: (c: number) => `${c} kỳ đã xác nhận thanh toán`,
        ledgerTitle: 'Sổ cái Quyết toán Hoa hồng',
        periodCount: (n: number) => `${n} kỳ quyết toán`,
        periodPrefix: 'Tháng',
        detailHeading: (p: string) => `Quyết toán Hoa hồng — Tháng ${p}`,
        dueMeta: (due: string, count: number) => `Hạn thanh toán: ${due} • ${count} lượt hoàn thành`,
        totalDueLabel: 'Tổng hoa hồng phải nộp:',
        overdueTitle: 'Cảnh báo: Bảng kê đã quá hạn thanh toán',
        overdueBody: (due: string) =>
          `Theo quy định TripMate, nếu bảng kê không được thanh toán trong vòng 15 ngày sau hạn thanh toán (${due}), tài khoản dịch vụ sẽ tự động bị khóa và tạm ngừng nhận yêu cầu đặt mới.`,
        overdueCta:
          'Vui lòng hoàn tất chuyển khoản và gửi mã giao dịch ngân hàng ngay bên dưới để tránh gián đoạn dịch vụ.',
        breakdownCode: 'Mã đơn',
        breakdownGuest: 'Du khách',
        breakdownRev: 'Doanh thu',
        breakdownComm: 'Hoa hồng (10%)',
        bankLabel: 'Ngân hàng:',
        holderLabel: 'Chủ tài khoản:',
        accountLabel: 'Số tài khoản:',
        syntaxLabel: 'Nội dung CK:',
        copy: 'Sao chép',
        fillSample: '+ Điền mã mẫu',
        reportedHeading: 'Đã Thông Báo Chuyển Khoản',
        paidHeading: 'Đã Thanh Toán & Hoàn Tất Đối Soát',
        confirmedAtLine: (at: string, staffId: number) =>
          `Xác nhận lúc ${at} bởi Nhân viên #${staffId}`,
        emptySelection: 'Chọn một kỳ quyết toán từ danh sách sổ cái để xem chi tiết.',
        emptyLedger: 'Chưa có kỳ quyết toán hoa hồng nào trên hệ thống.',
      }
    : {
        ratePill: 'Standard platform rate: 10% of actual revenue',
        kpiDueTitle: 'Due for Payment',
        kpiDueSub: (overdue: number, issued: number) =>
          overdue > 0
            ? `${overdue} overdue${issued > 0 ? ` · ${issued} issued` : ''}`
            : issued > 0
            ? `${issued} issued statement(s)`
            : 'No outstanding commission balance',
        kpiReportedTitle: 'Awaiting Bank Reconciliation',
        kpiReportedSub: (c: number) =>
          c > 0 ? `${c} wire transfer(s) reported` : 'No pending reconciliations',
        kpiPaidTitle: 'Reconciled & Paid',
        kpiPaidSub: (c: number) => `${c} settled billing period(s)`,
        ledgerTitle: 'Commission Statement Ledger',
        periodCount: (n: number) => `${n} billing period(s)`,
        periodPrefix: 'Period',
        detailHeading: (p: string) => `Commission Statement — ${p}`,
        dueMeta: (due: string, count: number) => `Due date: ${due} • ${count} completed`,
        totalDueLabel: 'Total commission due:',
        overdueTitle: 'Warning: Commission Statement Overdue',
        overdueBody: (due: string) =>
          `Under TripMate policy, statements unpaid 15 days past the due date (${due}) will trigger automatic account suspension for new booking requests.`,
        overdueCta:
          'Please complete the wire transfer and submit your transaction reference below to avoid service disruption.',
        breakdownCode: 'Code',
        breakdownGuest: 'Guest',
        breakdownRev: 'Revenue',
        breakdownComm: 'Commission (10%)',
        bankLabel: 'Bank:',
        holderLabel: 'Account Holder:',
        accountLabel: 'Account Number:',
        syntaxLabel: 'Transfer Note:',
        copy: 'Copy',
        fillSample: '+ Fill sample ref',
        reportedHeading: 'Wire Payment Reported',
        paidHeading: 'Paid & Reconciled',
        confirmedAtLine: (at: string, staffId: number) =>
          `Confirmed on ${at} by Staff #${staffId}`,
        emptySelection: 'Select a billing statement from the ledger to inspect its details.',
        emptyLedger: 'No commission statements are available yet.',
      };

  const transferTag = (selectedStatement?.providerName || 'PROVIDER')
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 8) || 'HOIAN';

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1C2928]">
            {res.w105.pageTitle}
          </h1>
          <p className="mt-1 text-[13px] text-[#5B6E69]">{res.w105.subtitle}</p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-[#C3DDD3] bg-[#E8F0EA] px-3.5 py-2 text-xs font-bold text-[#174B4A]">
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            percent
          </span>
          <span>{ui.ratePill}</span>
        </span>
      </div>

      {/* 3 Truthful Financial KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
        <div
          className={`relative overflow-hidden rounded-2xl border border-[#DCE2DD] bg-white p-4 ${
            kpi.overdueCount > 0
              ? 'shadow-[inset_3.5px_0_0_#E02D4D,0_1px_2px_rgba(28,41,40,0.03)]'
              : 'shadow-[inset_3.5px_0_0_#B96D4C,0_1px_2px_rgba(28,41,40,0.03)]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#5B6E69]">{ui.kpiDueTitle}</span>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                kpi.overdueCount > 0
                  ? 'bg-[#FDECEF] text-[#E02D4D]'
                  : 'bg-[#FCECE5] text-[#995436]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                {kpi.overdueCount > 0 ? 'warning' : 'payments'}
              </span>
            </span>
          </div>
          <p className="mt-2 font-mono text-2xl font-extrabold text-[#1C2928]">
            {formatVnd(kpi.dueTotal)}
          </p>
          <p
            className={`mt-1 text-[11px] font-semibold ${
              kpi.overdueCount > 0 ? 'text-[#B91C1C]' : 'text-[#5B6E69]'
            }`}
          >
            {ui.kpiDueSub(kpi.overdueCount, kpi.issuedCount)}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-[#DCE2DD] bg-white p-4 shadow-[inset_3.5px_0_0_#D97706,0_1px_2px_rgba(28,41,40,0.03)]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#5B6E69]">{ui.kpiReportedTitle}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FEF3E2] text-[#D97706]">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                hourglass_top
              </span>
            </span>
          </div>
          <p className="mt-2 font-mono text-2xl font-extrabold text-[#1C2928]">
            {formatVnd(kpi.reportedTotal)}
          </p>
          <p className="mt-1 text-[11px] font-medium text-[#5B6E69]">
            {ui.kpiReportedSub(kpi.reportedCount)}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-[#DCE2DD] bg-white p-4 shadow-[inset_3.5px_0_0_#0E9F6E,0_1px_2px_rgba(28,41,40,0.03)]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#5B6E69]">{ui.kpiPaidTitle}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E6F7F0] text-[#0E9F6E]">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                verified
              </span>
            </span>
          </div>
          <p className="mt-2 font-mono text-2xl font-extrabold text-[#1C2928]">
            {formatVnd(kpi.paidTotal)}
          </p>
          <p className="mt-1 text-[11px] font-medium text-[#5B6E69]">
            {ui.kpiPaidSub(kpi.paidCount)}
          </p>
        </div>
      </div>

      {/* 58 / 42 Master-Detail Layout */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* Left: Statement Ledger Table (7 cols) */}
        <div className="overflow-hidden rounded-2xl border border-[#DCE2DD] bg-white shadow-xs lg:col-span-7">
          <div className="flex items-center justify-between border-b border-[#E8ECE9] px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-[#1C2928]">
              <span className="material-symbols-outlined text-[19px] text-[#174B4A]" aria-hidden="true">
                receipt_long
              </span>
              <span>{ui.ledgerTitle}</span>
            </h2>
            <span className="text-xs font-semibold text-[#5B6E69]">
              {ui.periodCount(statements.length)}
            </span>
          </div>

          {isLoading ? (
            <div className="p-14 text-center text-xs text-[#5B6E69]">
              <span className="material-symbols-outlined mx-auto mb-2 block animate-spin text-[28px] text-[#174B4A]">
                progress_activity
              </span>
              {res.common.loading}
            </div>
          ) : statements.length === 0 ? (
            <div className="p-14 text-center text-xs text-[#5B6E69]">
              <span className="material-symbols-outlined mx-auto mb-2 block text-[34px] text-[#8E9E9B]">
                receipt_long
              </span>
              <p>{ui.emptyLedger}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DCE2DD] bg-[#F7F5EF] text-[10.5px] font-bold uppercase tracking-wider text-[#5B6E69]">
                    <th scope="col" className="whitespace-nowrap px-3.5 py-3">
                      {res.w105.tableHeaders.period}
                    </th>
                    <th scope="col" className="whitespace-nowrap px-2.5 py-3 text-center">
                      {res.w105.tableHeaders.completedCount}
                    </th>
                    <th scope="col" className="whitespace-nowrap px-2.5 py-3 text-right">
                      {res.w105.tableHeaders.totalRevenue}
                    </th>
                    <th scope="col" className="whitespace-nowrap px-2.5 py-3 text-right">
                      {res.w105.tableHeaders.commissionAmount}
                    </th>
                    <th scope="col" className="whitespace-nowrap px-2.5 py-3">
                      {res.w105.tableHeaders.dueDate}
                    </th>
                    <th scope="col" className="whitespace-nowrap px-3.5 py-3 text-right">
                      {res.w105.tableHeaders.status}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDF1EE] text-[#1C2928]">
                  {statements.map((stmt) => {
                    const isSelected = selectedStatement?.id === stmt.id;
                    return (
                      <tr
                        key={stmt.id}
                        onClick={() => void handleSelectStatement(stmt)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#EDF5F1] shadow-[inset_3.5px_0_0_#174B4A]'
                            : 'hover:bg-[#F7F5EF]/70'
                        }`}
                      >
                        <td className="whitespace-nowrap px-3.5 py-3.5 font-bold text-[#174B4A]">
                          {ui.periodPrefix} {stmt.period}
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-3.5 text-center">
                          <span className="inline-flex items-center rounded-md border border-[#DCE2DD] bg-[#F1F4F1] px-2 py-0.5 font-bold text-[#1C2928]">
                            {stmt.completedCount}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-3.5 text-right font-mono text-[#1C2928]">
                          {formatVnd(stmt.totalRevenue)}
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-3.5 text-right font-mono font-extrabold text-[#174B4A]">
                          {formatVnd(stmt.commissionAmount)}
                        </td>
                        <td
                          className={`whitespace-nowrap px-2.5 py-3.5 tabular-nums ${
                            stmt.status === 'Overdue'
                              ? 'font-bold text-[#B91C1C]'
                              : 'text-[#5B6E69]'
                          }`}
                        >
                          {formatDate(stmt.dueDate)}
                        </td>
                        <td className="whitespace-nowrap px-3.5 py-3.5 text-right">
                          <StatusBadge status={stmt.status} locale={locale} size="sm" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Selected Statement Details & Wire Reporting Drawer (5 cols) */}
        <div className="space-y-4 lg:sticky lg:top-22 lg:col-span-5">
          {selectedStatement ? (
            <div className="space-y-5 rounded-2xl border border-[#DCE2DD] bg-white p-5 shadow-xs">
              {/* Summary Card */}
              <div className="border-b border-[#EDF1EE] pb-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="rounded-md border border-[#C3DDD3] bg-[#E8F0EA] px-2 py-0.5 font-mono text-xs font-bold text-[#174B4A]">
                    {selectedStatement.statementCode}
                  </span>
                  <StatusBadge status={selectedStatement.status} locale={locale} size="sm" />
                </div>
                <h3 className="text-base font-extrabold text-[#1C2928]">
                  {ui.detailHeading(selectedStatement.period)}
                </h3>
                <p className="mt-0.5 text-xs text-[#5B6E69]">
                  {ui.dueMeta(formatDate(selectedStatement.dueDate), selectedStatement.completedCount)}
                </p>

                <div className="mt-3.5 flex items-center justify-between rounded-xl border border-[#E3E8E4] bg-[#F7F5EF] px-3.5 py-3">
                  <span className="text-xs font-semibold text-[#5B6E69]">{ui.totalDueLabel}</span>
                  <span className="font-mono text-lg font-extrabold text-[#174B4A]">
                    {formatVnd(selectedStatement.commissionAmount)}
                  </span>
                </div>
              </div>

              {/* Overdue Warning Alert (BR-200) */}
              {selectedStatement.status === 'Overdue' && (
                <div
                  className="space-y-1.5 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-3.5 text-xs"
                  role="alert"
                >
                  <div className="flex items-center gap-1.5 font-extrabold text-[#991B1B]">
                    <span className="material-symbols-outlined text-[18px] text-[#DC2626]" aria-hidden="true">
                      warning
                    </span>
                    <span>{ui.overdueTitle}</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-[#7F1D1D]">
                    {ui.overdueBody(formatDate(selectedStatement.dueDate))}
                  </p>
                  <p className="text-[11px] font-semibold text-[#991B1B]">{ui.overdueCta}</p>
                </div>
              )}

              {/* Completed Bookings Audit Breakdown */}
              {selectedStatement.breakdown && selectedStatement.breakdown.length > 0 && (
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1C2928]">
                    <span className="material-symbols-outlined text-[16px] text-[#174B4A]" aria-hidden="true">
                      checklist
                    </span>
                    <span>{res.w105.detailDrawer.breakdownSectionTitle}</span>
                  </h4>

                  <div className="max-h-44 overflow-y-auto rounded-xl border border-[#E8ECE9]">
                    <table className="w-full border-collapse text-left text-[11px]">
                      <thead className="sticky top-0 border-b border-[#E8ECE9] bg-[#F7F5EF] font-bold text-[#5B6E69]">
                        <tr>
                          <th scope="col" className="px-2.5 py-2">
                            {ui.breakdownCode}
                          </th>
                          <th scope="col" className="px-2 py-2">
                            {ui.breakdownGuest}
                          </th>
                          <th scope="col" className="px-2 py-2 text-right">
                            {ui.breakdownRev}
                          </th>
                          <th scope="col" className="px-2.5 py-2 text-right">
                            {ui.breakdownComm}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDF1EE] text-[#1C2928]">
                        {selectedStatement.breakdown.map((row) => (
                          <tr key={row.id}>
                            <td className="whitespace-nowrap px-2.5 py-2 font-mono font-bold text-[#174B4A]">
                              {row.bookingCode}
                            </td>
                            <td className="max-w-[100px] truncate px-2 py-2">{row.guestName}</td>
                            <td className="whitespace-nowrap px-2 py-2 text-right font-mono">
                              {formatVnd(row.actualAmount)}
                            </td>
                            <td className="whitespace-nowrap px-2.5 py-2 text-right font-mono font-bold text-[#174B4A]">
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
              <div className="space-y-2.5 rounded-xl border-2 border-[#F3D1AE] bg-[#FFF9F2] p-4 text-xs">
                <div className="flex items-center gap-1.5 rounded-lg border border-[#FBD38D] bg-[#FEEBC8] px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#9C4221]">
                  <span className="material-symbols-outlined text-[16px] text-[#DD6B20]" aria-hidden="true">
                    warning
                  </span>
                  <span>{res.w105.detailDrawer.bankInfoCard.title}</span>
                </div>

                <p className="text-[11px] font-medium leading-relaxed text-[#7B341E]">
                  {res.w105.detailDrawer.bankInfoCard.warningBadge}
                </p>

                <div className="space-y-2 rounded-xl border border-[#F5DFC6] bg-white p-3 text-[11.5px] text-[#1C2928]">
                  <p>
                    <span className="text-[#5B6E69]">{ui.bankLabel}</span>{' '}
                    <span className="font-semibold">
                      {res.w105.detailDrawer.bankInfoCard.bankName}
                    </span>
                  </p>
                  <p>
                    <span className="text-[#5B6E69]">{ui.holderLabel}</span>{' '}
                    <strong>{res.w105.detailDrawer.bankInfoCard.accountHolder}</strong>
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p>
                      <span className="text-[#5B6E69]">{ui.accountLabel}</span>{' '}
                      <strong className="font-mono text-sm tracking-wider text-[#174B4A]">
                        {res.w105.detailDrawer.bankInfoCard.accountNumber}
                      </strong>
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        void handleCopy(
                          res.w105.detailDrawer.bankInfoCard.accountNumber,
                          ui.accountLabel
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-[#CCE0D3] bg-[#E8F0EA] px-2 py-1 text-[10.5px] font-bold text-[#174B4A] transition hover:bg-[#DCE9E0] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[13px]" aria-hidden="true">
                        content_copy
                      </span>
                      <span>{ui.copy}</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[#5B6E69]">{ui.syntaxLabel}</span>{' '}
                      <code className="rounded-md border border-[#DCE2DD] bg-[#F7F5EF] px-2 py-0.5 font-mono font-bold text-[#174B4A]">
                        {res.w105.detailDrawer.bankInfoCard.transferContent(
                          selectedStatement.statementCode,
                          transferTag
                        )}
                      </code>
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        void handleCopy(
                          res.w105.detailDrawer.bankInfoCard.transferContent(
                            selectedStatement.statementCode,
                            transferTag
                          ),
                          ui.syntaxLabel
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-[#CCE0D3] bg-[#E8F0EA] px-2 py-1 text-[10.5px] font-bold text-[#174B4A] transition hover:bg-[#DCE9E0] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[13px]" aria-hidden="true">
                        content_copy
                      </span>
                      <span>{ui.copy}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Wire Payment Reporting Form */}
              {selectedStatement.status === 'Issued' || selectedStatement.status === 'Overdue' ? (
                <form
                  onSubmit={handleReportPayment}
                  className="space-y-3 border-t border-[#EDF1EE] pt-4"
                >
                  <h4 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1C2928]">
                    <span className="material-symbols-outlined text-[16px] text-[#174B4A]" aria-hidden="true">
                      send
                    </span>
                    <span>{res.w105.detailDrawer.paymentSectionTitle}</span>
                  </h4>
                  <p className="text-[11.5px] leading-relaxed text-[#5B6E69]">
                    {res.w105.detailDrawer.paymentExplanation}
                  </p>

                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label
                        htmlFor="w105-bank-ref"
                        className="block text-xs font-bold text-[#1C2928]"
                      >
                        {res.w105.detailDrawer.referenceInputLabel}{' '}
                        <span className="text-[#DC2626]" aria-hidden="true">
                          *
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setBankRefInput('VCB-202611-889900');
                          if (bankRefError) setBankRefError('');
                        }}
                        className="text-[11px] font-bold text-[#174B4A] hover:underline cursor-pointer"
                      >
                        {ui.fillSample}
                      </button>
                    </div>
                    <input
                      id="w105-bank-ref"
                      type="text"
                      value={bankRefInput}
                      onChange={(e) => {
                        setBankRefInput(e.target.value);
                        if (bankRefError) setBankRefError('');
                      }}
                      placeholder={res.w105.detailDrawer.referencePlaceholder}
                      className={`min-h-11 w-full rounded-xl border bg-white px-3 py-2 font-mono text-xs font-bold text-[#1C2928] placeholder-[#8E9E9B] transition focus:border-[#174B4A] focus:outline-none focus:ring-2 focus:ring-[#174B4A]/20 ${
                        bankRefError ? 'border-[#DC2626]' : 'border-[#D5DDD8]'
                      }`}
                    />
                    <p className="mt-1 text-[11px] text-[#5B6E69]">
                      {res.w105.detailDrawer.referenceHelp}
                    </p>
                    {bankRefError && (
                      <p
                        className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#DC2626]"
                        role="alert"
                      >
                        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                          error
                        </span>
                        <span>{bankRefError}</span>
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isReporting}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#174B4A] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#103B39] disabled:opacity-50 cursor-pointer"
                  >
                    {isReporting ? (
                      <span className="material-symbols-outlined animate-spin text-[16px]">
                        progress_activity
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                        send
                      </span>
                    )}
                    <span>{res.w105.detailDrawer.reportButton}</span>
                  </button>
                </form>
              ) : selectedStatement.status === 'PaymentReported' ? (
                <div className="space-y-1.5 rounded-xl border border-[#FDE68A] bg-[#FEF3E2] p-4 text-xs text-[#92400E]">
                  <div className="flex items-center gap-1.5 font-extrabold">
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      hourglass_top
                    </span>
                    <span>{ui.reportedHeading}</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed">
                    {res.w105.detailDrawer.reportedNotice(
                      selectedStatement.bankReference || 'VCB-REF',
                      formatDateTime(selectedStatement.reportedAt)
                    )}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 rounded-xl border border-[#A7F3D0] bg-[#E6F7F0] p-4 text-xs text-[#065F46]">
                  <div className="flex items-center gap-1.5 font-extrabold">
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      task_alt
                    </span>
                    <span>{ui.paidHeading}</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed">
                    {res.w105.detailDrawer.paidNotice}
                  </p>
                  {selectedStatement.confirmedAt && selectedStatement.confirmedByStaffId && (
                    <p className="pt-1 font-mono text-[10.5px] text-[#065F46]/80">
                      {ui.confirmedAtLine(
                        formatDateTime(selectedStatement.confirmedAt),
                        selectedStatement.confirmedByStaffId
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#DCE2DD] bg-white p-10 text-center text-xs text-[#5B6E69] shadow-xs">
              {ui.emptySelection}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
