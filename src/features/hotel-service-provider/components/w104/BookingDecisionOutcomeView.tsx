'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WorkflowError } from '../../services/workflowClient';
import type { DecisionPayload, OutcomePayload } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ConfirmationDialog } from '../common/ConfirmationDialog';
import { useToast } from '../common/Toast';
import { ProviderBookingService } from '../../services/providerBookingService';
import type { BookingRequestItem } from '../../types';
import { formatDate, formatTime, formatDateTime, formatVnd, isDateInPast } from '../../utils/formatters';
import { hotelProviderEn } from '../../resources/en';
import { ROUTES } from '@/lib/routes';

interface BookingDecisionOutcomeViewProps {
  id: string;
}

export function BookingDecisionOutcomeView({ id }: BookingDecisionOutcomeViewProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  const submitting = useRef(false);
  const activeViewId = useRef<string | null>(null);

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
  const actualAmount = Number(actualAmountInput);
  const isActualAmountValid = Number.isFinite(actualAmount) && actualAmount > 0
    && actualAmount <= 9_999_999_999.99 && Math.round(actualAmount * 100) / 100 === actualAmount;
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [isNoShowModalOpen, setIsNoShowModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    activeViewId.current = id;
    ProviderBookingService.getBookingRequestById(id)
      .then((data) => {
        if (!active) return;
        if (data) {
          setBooking(data);
          if (data.estimatedAmount) {
            setActualAmountInput(String(data.estimatedAmount));
          }
        } else {
          setErrorMessage('Booking request not found.');
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setErrorMessage(hotelProviderEn.messages.MSG127);
        setIsLoading(false);
      });

    return () => {
      active = false;
      activeViewId.current = null;
    };
  }, [id]);

  async function submit(operation: 'decision' | 'outcome', payload: DecisionPayload | OutcomePayload, successMessage: string) {
    if (!booking || submitting.current) return;
    submitting.current = true;
    setIsSubmitting(true);
    try {
      const updated = operation === 'decision'
        ? await ProviderBookingService.submitDecision(booking.id, payload as DecisionPayload)
        : await ProviderBookingService.recordOutcome(booking.id, payload as OutcomePayload);
      if (activeViewId.current !== id) return;
      setBooking(updated);
      setIsConfirmModalOpen(false);
      setIsRejectModalOpen(false);
      setIsCompletedModalOpen(false);
      setIsNoShowModalOpen(false);
      showToast(successMessage, 'success');
      if (operation === 'decision') router.push(ROUTES.provider.bookings);
    } catch (error) {
      if (activeViewId.current !== id) return;
      showToast(error instanceof WorkflowError ? error.message : hotelProviderEn.messages.MSG127, 'error');
      if (error instanceof WorkflowError && (error.status === 409 || error.code === 'ServiceProviderRequest.InvalidState')) {
        try {
          const refreshed = await ProviderBookingService.getBookingRequestById(id);
          if (activeViewId.current !== id) return;
          setBooking(refreshed);
        } catch {
          if (activeViewId.current !== id) return;
          setErrorMessage(hotelProviderEn.messages.MSG127);
        }
        setIsConfirmModalOpen(false);
        setIsRejectModalOpen(false);
        setIsCompletedModalOpen(false);
        setIsNoShowModalOpen(false);
      }
    } finally {
      submitting.current = false;
      if (activeViewId.current === id) setIsSubmitting(false);
    }
  }

  const handleConfirmDecision = () => booking && submit('decision', { decision: 'Confirmed', rowVersion: booking.rowVersion }, hotelProviderEn.messages.MSG203);
  const handleRejectDecision = () => {
    if (!booking) return;
    if (!rejectionReason.trim()) { setRejectionError(hotelProviderEn.messages.MSG123); return; }
    void submit('decision', { decision: 'Rejected', reason: rejectionReason.trim(), rowVersion: booking.rowVersion }, hotelProviderEn.messages.MSG204);
  };
  const handleRecordCompleted = () => {
    if (!booking) return;
    if (!isActualAmountValid) { setActualAmountError(hotelProviderEn.messages.MSG143); return; }
    void submit('outcome', { outcome: 'Completed', actualAmount, rowVersion: booking.rowVersion }, hotelProviderEn.messages.MSG206);
  };
  const handleRecordNoShow = () => booking && submit('outcome', { outcome: 'NoShow', rowVersion: booking.rowVersion }, hotelProviderEn.messages.MSG206);

  if (isLoading) {
    return (
      <div className="p-16 text-center text-xs text-[#5B6E69]">
        <span className="material-symbols-outlined text-[32px] animate-spin text-[#174B4A] mb-2 block mx-auto">
          progress_activity
        </span>
        Loading booking details...
      </div>
    );
  }

  if (errorMessage || !booking) {
    return (
      <div role="alert" className="p-16 text-center text-xs text-[#DC2626] bg-white border border-[#DCE2DD] rounded-xl">
        <span className="material-symbols-outlined text-[36px] mb-2 block mx-auto">
          error
        </span>
        <h3 className="font-bold text-sm text-[#1C2928] mb-1">
          {errorMessage || 'Booking Not Found'}
        </h3>
        <p className="text-[#5B6E69] mb-4">
          The requested booking record could not be retrieved.
        </p>
        <Link
          href={ROUTES.provider.bookings}
          className="inline-flex items-center gap-1 min-h-11 px-4 py-2 text-sm font-semibold text-white bg-[#174B4A] rounded-lg"
        >
          <span className="material-symbols-outlined text-[15px]">arrow_back</span>
          <span>Return to Booking Requests</span>
        </Link>
      </div>
    );
  }

  const isPending = booking.status === 'PendingConfirmation' && (!booking.responseDeadlineUtc || Date.parse(booking.responseDeadlineUtc) > now);
  const isConfirmed = booking.status === 'Confirmed';
  const isTerminal = ['Completed', 'NoShow', 'Rejected', 'Cancelled', 'Expired'].includes(booking.status);
  const outcomeWindowEnded = !!booking.autoCompleteAtUtc && now >= Date.parse(booking.autoCompleteAtUtc);
  const stayDatePassed = booking.outcomeAvailableAtUtc
    ? now >= Date.parse(booking.outcomeAvailableAtUtc)
    : isDateInPast(booking.requestedDate);

  const parsedActualAmount = Number(actualAmountInput) || 0;
  const previewCommission = Math.floor(parsedActualAmount / 10);

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
            <span>{hotelProviderEn.w104.breadcrumbList}</span>
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
              Submitted on {formatDateTime(booking.submittedAt)}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#5B6E69]">
            {booking.serviceName} • {booking.serviceOption} ({booking.quantity} units)
          </p>
        </div>

        {isPending && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FFF2EB] border border-[#FFD8C2] rounded-lg text-xs text-[#995436] font-medium">
            <span className="material-symbols-outlined text-[16px] text-[#B96D4C]">
              timer
            </span>
            <span>Response deadline {formatDateTime(booking.responseDeadlineUtc)}</span>
          </div>
        )}
      </div>

      {/* 62 / 38 Two-Column Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (62% -> 7 or 8 cols, let's use 7.5 or 8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Reservation Parameters Card */}
          <div className="bg-white border border-[#DCE2DD] rounded-xl p-6 shadow-xs">
            <h2 className="text-sm font-bold text-[#1C2928] pb-3 border-b border-[#E8ECE9] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#174B4A]">
                hotel
              </span>
              {hotelProviderEn.w104.sectionParametersTitle}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#5B6E69] block mb-0.5">{hotelProviderEn.w104.fields.service}</span>
                <span className="font-semibold text-[#1C2928] text-sm">{booking.serviceName}</span>
              </div>
              <div>
                <span className="text-[#5B6E69] block mb-0.5">{hotelProviderEn.w104.fields.option}</span>
                <span className="font-semibold text-[#1C2928] text-sm">{booking.serviceOption}</span>
              </div>
              <div>
                <span className="text-[#5B6E69] block mb-0.5">{hotelProviderEn.w104.fields.requestedDate}</span>
                <span className="font-semibold text-[#1C2928] text-sm">{formatDate(booking.requestedDate)}</span>
              </div>
              <div>
                <span className="text-[#5B6E69] block mb-0.5">{hotelProviderEn.w104.fields.requestedTime}</span>
                <span className="font-semibold text-[#1C2928] font-mono text-sm">{formatTime(booking.requestedTime)}</span>
              </div>
              <div>
                <span className="text-[#5B6E69] block mb-0.5">{hotelProviderEn.w104.fields.quantity}</span>
                <span className="font-semibold text-[#1C2928] text-sm">{booking.quantity}</span>
              </div>
              <div>
                <span className="text-[#5B6E69] block mb-0.5">{hotelProviderEn.w104.fields.estimatedAmount}</span>
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
                {hotelProviderEn.w104.sectionDecisionTitle}
              </h2>

              <p className="text-xs text-[#5B6E69] mb-4 leading-relaxed">
                {hotelProviderEn.w104.decisionActions.confirmPrompt}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(true)}
                  className="px-5 py-2.5 bg-[#174B4A] hover:bg-[#103B39] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>{hotelProviderEn.w104.decisionActions.confirmButton}</span>
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
                  <span>{hotelProviderEn.w104.decisionActions.rejectButton}</span>
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
                {hotelProviderEn.w104.sectionOutcomeTitle}
              </h2>

              {outcomeWindowEnded ? (
                <p role="status" className="text-sm text-[#5B6E69]">
                  The outcome recording window has ended. TripMate will complete this request automatically using the estimated amount. Reload to view its latest status.
                </p>
              ) : !stayDatePassed ? (
                /* Locked state notice */
                <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs text-[#64748B] flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[20px] text-[#64748B] shrink-0">
                    lock_clock
                  </span>
                  <div>
                    <h3 className="font-semibold text-[#1C2928] mb-0.5">
                      Outcome Recording Locked
                    </h3>
                    <p>{hotelProviderEn.w104.outcomeSection.lockedNotice(formatDate(booking.requestedDate))}</p>
                  </div>
                </div>
              ) : (
                /* Eligible state */
                <div className="space-y-4">
                  <p className="text-xs text-[#5B6E69]">
                    {hotelProviderEn.w104.outcomeSection.eligiblePrompt}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#F7F5EF] border border-[#DCE2DD] rounded-lg">
                    <div>
                      <label htmlFor="w104-actual-amount" className="block text-xs font-semibold text-[#1C2928] mb-1">
                        {hotelProviderEn.w104.outcomeSection.actualAmountLabel}{' '}
                        <span className="text-[#DC2626]" aria-hidden="true">*</span>
                      </label>
                      <input
                        id="w104-actual-amount"
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        max="9999999999.99"
                        step="0.01"
                        aria-invalid={!!actualAmountError}
                        value={actualAmountInput}
                        onChange={(e) => {
                          setActualAmountInput(e.target.value);
                          if (actualAmountError) setActualAmountError('');
                        }}
                        placeholder={hotelProviderEn.w104.outcomeSection.actualAmountPlaceholder}
                        className={`w-full px-3 py-2 text-xs font-mono font-bold bg-white border rounded-lg text-[#1C2928] focus:outline-none focus:ring-2 focus:ring-[#174B4A] focus:border-[#174B4A] ${
                          actualAmountError ? 'border-[#DC2626]' : 'border-[#DCE2DD]'
                        }`}
                      />
                      {actualAmountError && (
                        <p className="mt-1 text-xs text-[#DC2626] font-sans" role="alert">
                          {actualAmountError}
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-[#5B6E69] mb-1">
                        {hotelProviderEn.w104.outcomeSection.commissionPreviewLabel}
                      </span>
                      <div className="px-3 py-2 bg-white border border-[#DCE2DD] rounded-lg text-xs font-mono font-bold text-[#174B4A]">
                        {formatVnd(previewCommission)}
                      </div>
                      <p className="mt-1 text-[10px] text-[#5B6E69]">
                        {hotelProviderEn.w104.outcomeSection.commissionCalculationNote}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isActualAmountValid) { setActualAmountError(hotelProviderEn.messages.MSG143); return; }
                        setIsCompletedModalOpen(true);
                      }}
                      className="px-5 py-2.5 bg-[#174B4A] hover:bg-[#103B39] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      <span>{hotelProviderEn.w104.outcomeSection.markCompletedButton}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsNoShowModalOpen(true)}
                      className="px-5 py-2.5 bg-white text-[#5B21B6] border border-[#DDD6FE] hover:bg-[#F1EBFE] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">person_off</span>
                      <span>{hotelProviderEn.w104.outcomeSection.markNoShowButton}</span>
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
                Recorded Operational Outcome
              </h2>

              <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#5B6E69]">Final Status:</span>
                  <StatusBadge status={booking.status} size="sm" />
                </div>

                {booking.actualAmount !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#5B6E69]">Actual Spend Collected:</span>
                    <span className="font-mono font-bold text-[#1C2928]">{formatVnd(booking.actualAmount)}</span>
                  </div>
                )}

                {booking.commissionAmount !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#5B6E69]">TripMate Commission:</span>
                    <span className="font-mono font-bold text-[#174B4A]">{formatVnd(booking.commissionAmount)}</span>
                  </div>
                )}

                {booking.rejectionReason && (
                  <div className="pt-2 border-t border-[#E2E8F0]">
                    <span className="text-[#991B1B] font-semibold block mb-0.5">Rejection Reason:</span>
                    <p className="text-[#1C2928] bg-white p-2.5 rounded border border-[#FECDD3] italic">
                      {booking.rejectionReason}
                    </p>
                  </div>
                )}

                {booking.outcomeRecordedAt && (
                  <div className="pt-2 text-[11px] text-[#5B6E69]">
                    {hotelProviderEn.w104.outcomeSection.terminalNotice(
                      booking.status,
                      formatDateTime(booking.outcomeRecordedAt),
                      booking.outcomeRecordedBy || 'Provider Account'
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
              {hotelProviderEn.w104.sectionTravelerTitle}
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#5B6E69] block mb-0.5">{hotelProviderEn.w104.fields.travelerFullName}</span>
                <span className="font-bold text-[#1C2928] text-sm">{booking.travelerName}</span>
              </div>
              <div>
                <span className="text-[#5B6E69] block mb-0.5">{hotelProviderEn.w104.fields.travelerPhone}</span>
                <span className="font-mono font-semibold text-[#1C2928]">{booking.travelerPhone}</span>
              </div>
              <div>
                <span className="text-[#5B6E69] block mb-0.5">{hotelProviderEn.w104.fields.travelerEmail}</span>
                <span className="text-[#1C2928]">{booking.travelerEmail}</span>
              </div>
              <div>
                <span className="text-[#5B6E69] block mb-0.5">{hotelProviderEn.w104.fields.specialRequests}</span>
                <p className="p-2.5 bg-[#F7F5EF] border border-[#DCE2DD] rounded-lg text-[11px] text-[#1C2928] italic">
                  {booking.specialRequests || hotelProviderEn.w104.fields.noneProvided}
                </p>
              </div>
            </div>
          </div>

          {/* Mandatory Direct Payment Notice (BR-196) */}
          <div className="bg-[#FFF2EB] border border-[#FFD8C2] rounded-xl p-5 shadow-xs text-xs text-[#995436]">
            <h3 className="font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 text-[#995436]">
              <span className="material-symbols-outlined text-[17px] text-[#B96D4C]">
                payments
              </span>
              {hotelProviderEn.directPaymentNotice.title}
            </h3>
            <p className="text-[11px] leading-relaxed">
              {hotelProviderEn.directPaymentNotice.body}
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog: Confirm Booking (CR-05) */}
      <ConfirmationDialog
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => { void handleConfirmDecision(); }}
        title={hotelProviderEn.w104.decisionActions.confirmDialogTitle}
        message={hotelProviderEn.w104.decisionActions.confirmDialogMessage(booking.requestCode)}
        confirmLabel={hotelProviderEn.w104.decisionActions.submitConfirm}
        cancelLabel={hotelProviderEn.w104.decisionActions.cancelAction}
        variant="primary"
        isLoading={isSubmitting}
      />

      <ConfirmationDialog
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleRejectDecision}
        title={hotelProviderEn.w104.decisionActions.rejectDialogTitle}
        confirmLabel={hotelProviderEn.w104.decisionActions.submitReject}
        variant="danger"
        isLoading={isSubmitting}
        message={<div className="space-y-3">
          <label htmlFor="w104-rejection-reason" className="block text-sm font-semibold">Rejection reason</label>
          <textarea id="w104-rejection-reason" required maxLength={1000} disabled={isSubmitting} value={rejectionReason}
            onChange={event => { setRejectionReason(event.target.value); setRejectionError(''); }}
            aria-invalid={!!rejectionError} aria-describedby={rejectionError ? 'rejection-error' : undefined}
            className="min-h-28 w-full rounded-lg border border-[#DCE2DD] p-3 text-sm focus-visible:outline-2 focus-visible:outline-blue-600" />
          {rejectionError && <p id="rejection-error" role="alert" className="text-red-700">{rejectionError}</p>}
        </div>}
      />

      {/* Confirmation Dialog: Mark Completed (CR-05) */}
      <ConfirmationDialog
        isOpen={isCompletedModalOpen}
        onClose={() => setIsCompletedModalOpen(false)}
        onConfirm={handleRecordCompleted}
        title={hotelProviderEn.w104.outcomeSection.completedDialogTitle}
        message={hotelProviderEn.w104.outcomeSection.completedDialogMessage(
          formatVnd(parsedActualAmount),
          formatVnd(previewCommission)
        )}
        confirmLabel="Confirm Completion"
        variant="primary"
        isLoading={isSubmitting}
      />

      {/* Confirmation Dialog: Mark No-show (CR-05) */}
      <ConfirmationDialog
        isOpen={isNoShowModalOpen}
        onClose={() => setIsNoShowModalOpen(false)}
        onConfirm={() => { void handleRecordNoShow(); }}
        title={hotelProviderEn.w104.outcomeSection.noShowDialogTitle}
        message={hotelProviderEn.w104.outcomeSection.noShowDialogMessage}
        confirmLabel="Confirm No-Show"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}
