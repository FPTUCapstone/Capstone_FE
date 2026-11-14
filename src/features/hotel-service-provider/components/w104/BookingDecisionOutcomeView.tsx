'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatusBadge } from '../common/StatusBadge';
import { ConfirmationDialog } from '../common/ConfirmationDialog';
import { useToast } from '../common/Toast';
import { ProviderBookingService } from '../../services/providerBookingService';
import type { BookingRequestItem } from '../../types';
import { formatDate, formatTime, formatDateTime, formatVnd, isDateInPast } from '../../utils/formatters';
import { hotelProviderVi } from '../../resources/vi';
import { ROUTES } from '@/lib/routes';

interface BookingDecisionOutcomeViewProps {
  id: string;
}

export function BookingDecisionOutcomeView({ id }: BookingDecisionOutcomeViewProps) {
  const { showToast } = useToast();

  const [booking, setBooking] = useState<BookingRequestItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dialog & Form states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');

  // Outcome states
  const [actualAmountInput, setActualAmountInput] = useState('');
  const [actualAmountError, setActualAmountError] = useState('');
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [isNoShowModalOpen, setIsNoShowModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    ProviderBookingService.getBookingRequestById(id)
      .then((data) => {
        if (!active) return;
        if (data) {
          setBooking(data);
          if (data.estimatedAmount) {
            setActualAmountInput(String(data.estimatedAmount));
          }
        } else {
          setErrorMessage('Không tìm thấy thông tin yêu cầu đặt phòng.');
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setErrorMessage(hotelProviderVi.messages.MSG127);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  // Handle Decision: Confirm
  const handleConfirmDecision = async () => {
    if (!booking) return;
    setIsSubmitting(true);
    try {
      const res = await ProviderBookingService.submitDecision(booking.id, { action: 'Confirm' });
      if (res.success) {
        setBooking((prev) => (prev ? { ...prev, status: res.updatedStatus } : null));
        setIsConfirmModalOpen(false);
        showToast(hotelProviderVi.messages.MSG203, 'success');
      } else {
        showToast(res.error || hotelProviderVi.messages.MSG127, 'error');
      }
    } catch {
      showToast(hotelProviderVi.messages.MSG133, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Decision: Reject
  const handleRejectDecision = async () => {
    if (!booking) return;
    if (!rejectionReason.trim()) {
      setRejectionError(hotelProviderVi.messages.MSG123);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await ProviderBookingService.submitDecision(booking.id, {
        action: 'Reject',
        rejectionReason: rejectionReason.trim(),
      });
      if (res.success) {
        setBooking((prev) =>
          prev
            ? {
                ...prev,
                status: res.updatedStatus,
                rejectionReason: rejectionReason.trim(),
              }
            : null
        );
        setIsRejectModalOpen(false);
        showToast(hotelProviderVi.messages.MSG204, 'success');
      } else {
        showToast(res.error || hotelProviderVi.messages.MSG127, 'error');
      }
    } catch {
      showToast(hotelProviderVi.messages.MSG133, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Outcome: Completed
  const handleRecordCompleted = async () => {
    if (!booking) return;
    const numericAmount = parseFloat(actualAmountInput.replace(/\./g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setActualAmountError(hotelProviderVi.messages.MSG143);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await ProviderBookingService.recordOutcome(booking.id, {
        outcome: 'Completed',
        actualAmount: numericAmount,
      });
      if (res.success) {
        setBooking((prev) =>
          prev
            ? {
                ...prev,
                status: res.updatedStatus,
                actualAmount: res.actualAmount,
                commissionAmount: res.commissionAmount,
                outcomeRecordedAt: new Date().toISOString(),
                outcomeRecordedBy: 'Nhân viên lễ tân',
              }
            : null
        );
        setIsCompletedModalOpen(false);
        showToast(hotelProviderVi.messages.MSG206, 'success');
      } else {
        showToast(res.error || hotelProviderVi.messages.MSG127, 'error');
      }
    } catch {
      showToast(hotelProviderVi.messages.MSG133, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Outcome: No-show
  const handleRecordNoShow = async () => {
    if (!booking) return;
    setIsSubmitting(true);
    try {
      const res = await ProviderBookingService.recordOutcome(booking.id, {
        outcome: 'NoShow',
      });
      if (res.success) {
        setBooking((prev) =>
          prev
            ? {
                ...prev,
                status: res.updatedStatus,
                actualAmount: 0,
                commissionAmount: 0,
                outcomeRecordedAt: new Date().toISOString(),
                outcomeRecordedBy: 'Nhân viên lễ tân',
              }
            : null
        );
        setIsNoShowModalOpen(false);
        showToast(hotelProviderVi.messages.MSG206, 'success');
      } else {
        showToast(res.error || hotelProviderVi.messages.MSG127, 'error');
      }
    } catch {
      showToast(hotelProviderVi.messages.MSG133, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-xs text-[#5B6E69]">
        <span className="material-symbols-outlined text-[32px] animate-spin text-[#174B4A] mb-2 block mx-auto">
          progress_activity
        </span>
        {hotelProviderVi.common.loading}
      </div>
    );
  }

  if (errorMessage || !booking) {
    return (
      <div className="p-16 text-center text-xs text-[#DC2626] bg-white border border-[#DCE2DD] rounded-xl shadow-xs">
        <span className="material-symbols-outlined text-[36px] mb-2 block mx-auto">
          error
        </span>
        <h3 className="font-bold text-sm text-[#1C2928] mb-1">
          {errorMessage || 'Không tìm thấy yêu cầu đặt phòng'}
        </h3>
        <p className="text-[#5B6E69] mb-4">
          Thông tin chi tiết về yêu cầu đặt phòng này không tồn tại hoặc đã bị xóa.
        </p>
        <Link
          href={ROUTES.provider.bookings}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#174B4A] rounded-lg cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">arrow_back</span>
          <span>Quay lại danh sách yêu cầu</span>
        </Link>
      </div>
    );
  }

  const isPending = booking.status === 'PendingConfirmation';
  const isConfirmed = booking.status === 'Confirmed';
  const isTerminal = ['Completed', 'NoShow', 'Rejected', 'Cancelled', 'Expired'].includes(booking.status);
  const stayDatePassed = isDateInPast(booking.requestedDate);

  const parsedActualAmount = parseFloat(actualAmountInput.replace(/\./g, '')) || 0;
  const previewCommission = Math.round(parsedActualAmount * 0.1);

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-[#5B6E69]">
          <Link
            href={ROUTES.provider.bookings}
            className="hover:text-[#174B4A] transition-colors flex items-center gap-1 font-semibold"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>{hotelProviderVi.w104.breadcrumbList}</span>
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="font-mono font-bold text-[#174B4A]">{booking.requestCode}</span>
        </div>
        <StatusBadge status={booking.status} size="md" />
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-[#DCE2DD] rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-mono font-bold text-[#1C2928] tracking-tight">
              {booking.requestCode}
            </h1>
            <span className="text-xs text-[#5B6E69]">
              Gửi lúc {formatDateTime(booking.submittedAt)}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#5B6E69]">
            {booking.serviceName} • {booking.serviceOption} ({booking.quantity} phòng)
          </p>
        </div>

        {isPending && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FFF2EB] border border-[#FFD8C2] rounded-lg text-xs text-[#995436] font-medium">
            <span className="material-symbols-outlined text-[16px] text-[#B96D4C]">
              timer
            </span>
            <span>{hotelProviderVi.w104.responseDeadlineLabel}</span>
          </div>
        )}
      </div>

      {/* 62 / 38 Two-Column Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (62% -> 8 cols of 12) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Reservation Parameters Card */}
          <div className="bg-white border border-[#DCE2DD] rounded-xl p-6 shadow-xs">
            <h2 className="text-sm font-bold text-[#1C2928] pb-3 border-b border-[#E8ECE9] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#174B4A]">
                hotel
              </span>
              {hotelProviderVi.w104.sectionParametersTitle}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#5B6E69] block mb-0.5">{hotelProviderVi.w104.fields.service}</span>
                <span className="font-semibold text-[#1C2928] text-sm">{booking.serviceName}</span>
              </div>
              <div>
                <span className="text-[#5B6E69] block mb-0.5">{hotelProviderVi.w104.fields.option}</span>
                <span className="font-semibold text-[#1C2928] text-sm">{booking.serviceOption}</span>
              </div>
              <div>
                <span className="text-[#5B6E69] block mb-0.5">{hotelProviderVi.w104.fields.requestedDate}</span>
                <span className="font-semibold text-[#1C2928] text-sm">{formatDate(booking.requestedDate)}</span>
              </div>
              <div>
                <span className="text-[#5B6E69] block mb-0.5">{hotelProviderVi.w104.fields.requestedTime}</span>
                <span className="font-semibold text-[#1C2928] font-mono text-sm">{formatTime(booking.requestedTime)}</span>
              </div>
              <div>
                <span className="text-[#5B6E69] block mb-0.5">{hotelProviderVi.w104.fields.quantity}</span>
                <span className="font-semibold text-[#1C2928] text-sm">{booking.quantity} phòng</span>
              </div>
              <div>
                <span className="text-[#5B6E69] block mb-0.5">{hotelProviderVi.w104.fields.estimatedAmount}</span>
                <span className="font-bold text-[#174B4A] text-sm font-mono">{formatVnd(booking.estimatedAmount)}</span>
              </div>
            </div>
          </div>

          {/* SECTION B: Provider Decision Actions (Pending Confirmation Only) */}
          {isPending && (
            <div className="bg-white border-2 border-[#174B4A]/30 rounded-xl p-6 shadow-xs">
              <h2 className="text-sm font-bold text-[#1C2928] pb-3 border-b border-[#E8ECE9] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#174B4A]">
                  gavel
                </span>
                {hotelProviderVi.w104.sectionDecisionTitle}
              </h2>

              <p className="text-xs text-[#5B6E69] mb-4 leading-relaxed">
                {hotelProviderVi.w104.decisionActions.confirmPrompt}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(true)}
                  className="px-5 py-2.5 bg-[#174B4A] hover:bg-[#103B39] text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>{hotelProviderVi.w104.decisionActions.confirmButton}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRejectionReason('');
                    setRejectionError('');
                    setIsRejectModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-white text-[#DC2626] border border-[#FECDD3] hover:bg-[#FDECEF] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  <span>{hotelProviderVi.w104.decisionActions.rejectButton}</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION C: Record Service Outcome (Confirmed State) */}
          {isConfirmed && (
            <div className="bg-white border border-[#DCE2DD] rounded-xl p-6 shadow-xs">
              <h2 className="text-sm font-bold text-[#1C2928] pb-3 border-b border-[#E8ECE9] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#174B4A]">
                  assignment_turned_in
                </span>
                {hotelProviderVi.w104.sectionOutcomeTitle}
              </h2>

              {!stayDatePassed ? (
                /* Locked state notice */
                <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs text-[#64748B] flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[20px] text-[#64748B] shrink-0">
                    lock_clock
                  </span>
                  <div>
                    <h3 className="font-semibold text-[#1C2928] mb-0.5">
                      Chưa đến thời điểm ghi nhận kết quả
                    </h3>
                    <p>{hotelProviderVi.w104.outcomeSection.lockedNotice(formatDate(booking.requestedDate))}</p>
                  </div>
                </div>
              ) : (
                /* Eligible state */
                <div className="space-y-4">
                  <p className="text-xs text-[#5B6E69]">
                    {hotelProviderVi.w104.outcomeSection.eligiblePrompt}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#F7F5EF] border border-[#DCE2DD] rounded-lg">
                    <div>
                      <label htmlFor="w104-actual-amount" className="block text-xs font-semibold text-[#1C2928] mb-1">
                        {hotelProviderVi.w104.outcomeSection.actualAmountLabel}{' '}
                        <span className="text-[#DC2626]" aria-hidden="true">*</span>
                      </label>
                      <input
                        id="w104-actual-amount"
                        type="text"
                        value={actualAmountInput}
                        onChange={(e) => {
                          setActualAmountInput(e.target.value);
                          if (actualAmountError) setActualAmountError('');
                        }}
                        placeholder={hotelProviderVi.w104.outcomeSection.actualAmountPlaceholder}
                        className={`w-full px-3 py-2 text-xs font-mono font-bold bg-white border rounded-lg text-[#1C2928] focus:outline-none focus:ring-2 focus:ring-[#174B4A]/15 focus:border-[#174B4A] transition-colors ${
                          actualAmountError ? 'border-[#DC2626]' : 'border-[#DCE2DD]'
                        }`}
                      />
                      {actualAmountError && (
                        <p className="mt-1 text-xs text-[#DC2626] font-sans flex items-center gap-1" role="alert">
                          <span className="material-symbols-outlined text-[14px]">error</span>
                          <span>{actualAmountError}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-[#5B6E69] mb-1">
                        {hotelProviderVi.w104.outcomeSection.commissionPreviewLabel}
                      </span>
                      <div className="px-3 py-2 bg-white border border-[#DCE2DD] rounded-lg text-xs font-mono font-bold text-[#174B4A]">
                        {formatVnd(previewCommission)}
                      </div>
                      <p className="mt-1 text-[10px] text-[#5B6E69]">
                        {hotelProviderVi.w104.outcomeSection.commissionCalculationNote}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCompletedModalOpen(true)}
                      className="px-5 py-2.5 bg-[#174B4A] hover:bg-[#103B39] text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      <span>{hotelProviderVi.w104.outcomeSection.markCompletedButton}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsNoShowModalOpen(true)}
                      className="px-5 py-2.5 bg-white text-[#5B21B6] border border-[#DDD6FE] hover:bg-[#F1EBFE] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">person_off</span>
                      <span>{hotelProviderVi.w104.outcomeSection.markNoShowButton}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Terminal State Read-Only Outcome */}
          {isTerminal && (
            <div className="bg-white border border-[#DCE2DD] rounded-xl p-6 shadow-xs">
              <h2 className="text-sm font-bold text-[#1C2928] pb-3 border-b border-[#E8ECE9] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#5B6E69]">
                  history_toggle_off
                </span>
                Kết quả Vận hành đã Ghi nhận
              </h2>

              <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#5B6E69]">Trạng thái cuối cùng:</span>
                  <StatusBadge status={booking.status} size="sm" />
                </div>

                {booking.actualAmount !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#5B6E69]">Doanh thu thực tế đã thu:</span>
                    <span className="font-mono font-bold text-[#1C2928]">{formatVnd(booking.actualAmount)}</span>
                  </div>
                )}

                {booking.commissionAmount !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#5B6E69]">Hoa hồng nền tảng:</span>
                    <span className="font-mono font-bold text-[#174B4A]">{formatVnd(booking.commissionAmount)}</span>
                  </div>
                )}

                {booking.rejectionReason && (
                  <div className="pt-2 border-t border-[#E2E8F0]">
                    <span className="text-[#991B1B] font-semibold block mb-0.5">Lý do từ chối:</span>
                    <p className="text-[#1C2928] bg-white p-2.5 rounded border border-[#FECDD3] italic">
                      {booking.rejectionReason}
                    </p>
                  </div>
                )}

                {booking.outcomeRecordedAt && (
                  <div className="pt-2 text-[11px] text-[#5B6E69]">
                    {hotelProviderVi.w104.outcomeSection.terminalNotice(
                      booking.status,
                      formatDateTime(booking.outcomeRecordedAt),
                      booking.outcomeRecordedBy || 'Đối tác lưu trú'
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (38% -> 4 cols of 12) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Traveler Identity Card */}
          <div className="bg-white border border-[#DCE2DD] rounded-xl p-5 shadow-xs">
            <h2 className="text-xs font-bold text-[#1C2928] uppercase tracking-wider pb-2.5 border-b border-[#E8ECE9] mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#174B4A]">
                person
              </span>
              {hotelProviderVi.w104.sectionTravelerTitle}
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#5B6E69] block mb-0.5">{hotelProviderVi.w104.fields.travelerFullName}</span>
                <span className="font-bold text-[#1C2928] text-sm">{booking.travelerName}</span>
              </div>
              <div>
                <span className="text-[#5B6E69] block mb-0.5">{hotelProviderVi.w104.fields.travelerPhone}</span>
                <span className="font-mono font-semibold text-[#1C2928]">{booking.travelerPhone}</span>
              </div>
              <div>
                <span className="text-[#5B6E69] block mb-0.5">{hotelProviderVi.w104.fields.travelerEmail}</span>
                <span className="text-[#1C2928]">{booking.travelerEmail}</span>
              </div>
              <div>
                <span className="text-[#5B6E69] block mb-0.5">{hotelProviderVi.w104.fields.specialRequests}</span>
                <p className="p-2.5 bg-[#F7F5EF] border border-[#DCE2DD] rounded-lg text-[11px] text-[#1C2928] italic">
                  {booking.specialRequests || hotelProviderVi.w104.fields.noneProvided}
                </p>
              </div>
            </div>
          </div>

          {/* Direct Payment Notice */}
          <div className="bg-[#FFF2EB] border border-[#FFD8C2] rounded-xl p-5 shadow-xs text-xs text-[#995436]">
            <h3 className="font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 text-[#995436]">
              <span className="material-symbols-outlined text-[17px] text-[#B96D4C]">
                payments
              </span>
              {hotelProviderVi.directPaymentNotice.title}
            </h3>
            <p className="text-[11px] leading-relaxed">
              {hotelProviderVi.directPaymentNotice.body}
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog: Confirm Booking */}
      <ConfirmationDialog
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDecision}
        title={hotelProviderVi.w104.decisionActions.confirmDialogTitle}
        message={hotelProviderVi.w104.decisionActions.confirmDialogMessage(booking.requestCode)}
        confirmLabel={hotelProviderVi.w104.decisionActions.submitConfirm}
        cancelLabel={hotelProviderVi.w104.decisionActions.cancelAction}
        variant="primary"
        isLoading={isSubmitting}
      />

      {/* Rejection Modal Dialog */}
      {isRejectModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101E26]/60 backdrop-blur-xs animate-in fade-in duration-200"
          aria-modal="true"
          role="dialog"
        >
          <div className="w-full max-w-lg bg-white border border-[#DCE2DD] rounded-xl shadow-2xl p-6 text-[#1C2928] animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FDECEF] text-[#DC2626] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">cancel</span>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-[#1C2928]">
                  {hotelProviderVi.w104.decisionActions.rejectDialogTitle}
                </h3>
                <p className="text-xs text-[#5B6E69] mt-0.5">
                  Mã yêu cầu: {booking.requestCode} • {booking.travelerName}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="w104-rejection-reason" className="block text-xs font-semibold text-[#1C2928]">
                {hotelProviderVi.w104.decisionActions.rejectReasonLabel}{' '}
                <span className="text-[#DC2626]" aria-hidden="true">*</span>
              </label>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5">
                {hotelProviderVi.w104.decisionActions.rejectPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setRejectionReason(preset);
                      if (rejectionError) setRejectionError('');
                    }}
                    className="px-2.5 py-1 text-[11px] bg-[#F7F5EF] hover:bg-[#E8ECE9] border border-[#DCE2DD] rounded-md text-[#5B6E69] transition-colors cursor-pointer text-left"
                  >
                    + {preset}
                  </button>
                ))}
              </div>

              <textarea
                id="w104-rejection-reason"
                rows={4}
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  if (rejectionError) setRejectionError('');
                }}
                placeholder={hotelProviderVi.w104.decisionActions.rejectReasonPlaceholder}
                className={`w-full px-3 py-2 text-xs bg-white border rounded-lg text-[#1C2928] placeholder-[#8E9E9B] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/15 focus:border-[#DC2626] transition-colors ${
                  rejectionError ? 'border-[#DC2626]' : 'border-[#DCE2DD]'
                }`}
              />

              {rejectionError && (
                <p className="text-xs text-[#DC2626] flex items-center gap-1" role="alert">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  <span>{rejectionError}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-[#E8ECE9]">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#5B6E69] hover:bg-[#F7F5EF] rounded-lg transition-colors cursor-pointer"
              >
                {hotelProviderVi.w104.decisionActions.cancelAction}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleRejectDecision}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting && (
                  <span className="material-symbols-outlined text-[14px] animate-spin">
                    progress_activity
                  </span>
                )}
                <span>{hotelProviderVi.w104.decisionActions.submitReject}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Mark Completed */}
      <ConfirmationDialog
        isOpen={isCompletedModalOpen}
        onClose={() => setIsCompletedModalOpen(false)}
        onConfirm={handleRecordCompleted}
        title={hotelProviderVi.w104.outcomeSection.completedDialogTitle}
        message={hotelProviderVi.w104.outcomeSection.completedDialogMessage(
          formatVnd(parsedActualAmount),
          formatVnd(previewCommission)
        )}
        confirmLabel="Xác nhận hoàn thành"
        variant="primary"
        isLoading={isSubmitting}
      />

      {/* Confirmation Dialog: Mark No-show */}
      <ConfirmationDialog
        isOpen={isNoShowModalOpen}
        onClose={() => setIsNoShowModalOpen(false)}
        onConfirm={handleRecordNoShow}
        title={hotelProviderVi.w104.outcomeSection.noShowDialogTitle}
        message={hotelProviderVi.w104.outcomeSection.noShowDialogMessage}
        confirmLabel="Xác nhận vắng mặt"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}
