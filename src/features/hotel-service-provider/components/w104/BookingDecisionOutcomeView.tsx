'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WorkflowError } from '../../services/workflowClient';
import type { BookingRequestStatus, DecisionPayload, OutcomePayload } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ConfirmationDialog } from '../common/ConfirmationDialog';
import { useToast } from '../common/Toast';
import { useProviderLocale } from '../common/ProviderLocaleContext';
import { ProviderBookingService } from '../../services/providerBookingService';
import type { BookingRequestItem } from '../../types';
import {
  formatDate,
  formatTime,
  formatDateTime,
  formatVnd,
  isDateInPast,
  formatRemainingSla,
} from '../../utils/formatters';
import { hotelProviderEn } from '../../resources/en';
import { hotelProviderVi } from '../../resources/vi';
import { ROUTES } from '@/lib/routes';

interface BookingDecisionOutcomeViewProps {
  id: string;
}

type StepState = 'done' | 'current' | 'failed' | 'todo';

function getLifecycleSteps(
  status: BookingRequestStatus,
  stayDatePassed: boolean,
  isVi: boolean
): Array<{ number: number; label: string; state: StepState }> {
  const labels = isVi
    ? ['1. Gửi yêu cầu', '2. Đối tác xác nhận', '3. Sử dụng dịch vụ', '4. Ghi nhận kết quả']
    : ['1. Request Sent', '2. Provider Decision', '3. Service Delivery', '4. Outcome Recorded'];

  if (status === 'PendingConfirmation') {
    return [
      { number: 1, label: labels[0], state: 'done' },
      { number: 2, label: labels[1], state: 'current' },
      { number: 3, label: labels[2], state: 'todo' },
      { number: 4, label: labels[3], state: 'todo' },
    ];
  }
  if (status === 'Confirmed') {
    return [
      { number: 1, label: labels[0], state: 'done' },
      { number: 2, label: labels[1], state: 'done' },
      { number: 3, label: labels[2], state: stayDatePassed ? 'done' : 'current' },
      { number: 4, label: labels[3], state: stayDatePassed ? 'current' : 'todo' },
    ];
  }
  if (status === 'Completed' || status === 'NoShow') {
    return [
      { number: 1, label: labels[0], state: 'done' },
      { number: 2, label: labels[1], state: 'done' },
      { number: 3, label: labels[2], state: 'done' },
      { number: 4, label: labels[3], state: 'done' },
    ];
  }
  // Rejected, Cancelled, Expired
  return [
    { number: 1, label: labels[0], state: 'done' },
    { number: 2, label: labels[1], state: 'failed' },
    { number: 3, label: labels[2], state: 'todo' },
    { number: 4, label: labels[3], state: 'todo' },
  ];
}

function getGuestInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || 'KH';
}

export function BookingDecisionOutcomeView({ id }: BookingDecisionOutcomeViewProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const { locale } = useProviderLocale('en');
  const isVi = locale === 'vi';
  const res = isVi ? hotelProviderVi : hotelProviderEn;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

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
  const isActualAmountValid =
    Number.isFinite(actualAmount) &&
    actualAmount > 0 &&
    actualAmount <= 9_999_999_999.99 &&
    Math.round(actualAmount * 100) / 100 === actualAmount;
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
          setErrorMessage(
            isVi ? 'Không tìm thấy yêu cầu đặt dịch vụ.' : 'Booking request not found.'
          );
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setErrorMessage(res.messages.MSG127);
        setIsLoading(false);
      });

    return () => {
      active = false;
      activeViewId.current = null;
    };
  }, [id, isVi, res.messages.MSG127]);

  async function handleCopyText(value: string, label: string) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(value);
        showToast(
          isVi ? `Đã sao chép ${label} vào bộ nhớ tạm.` : `Copied ${label} to clipboard.`,
          'info'
        );
      }
    } catch {
      // Clipboard unavailable
    }
  }

  async function submit(
    operation: 'decision' | 'outcome',
    payload: DecisionPayload | OutcomePayload,
    successMessage: string
  ) {
    if (!booking || submitting.current) return;
    submitting.current = true;
    setIsSubmitting(true);
    try {
      const updated =
        operation === 'decision'
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
      showToast(error instanceof WorkflowError ? error.message : res.messages.MSG127, 'error');
      if (
        error instanceof WorkflowError &&
        (error.status === 409 || error.code === 'ServiceProviderRequest.InvalidState')
      ) {
        try {
          const refreshed = await ProviderBookingService.getBookingRequestById(id);
          if (activeViewId.current !== id) return;
          setBooking(refreshed);
        } catch {
          if (activeViewId.current !== id) return;
          setErrorMessage(res.messages.MSG127);
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

  const handleConfirmDecision = () =>
    booking &&
    submit(
      'decision',
      { decision: 'Confirmed', rowVersion: booking.rowVersion },
      res.messages.MSG203
    );

  const handleRejectDecision = () => {
    if (!booking) return;
    if (!rejectionReason.trim()) {
      setRejectionError(res.messages.MSG123);
      return;
    }
    void submit(
      'decision',
      { decision: 'Rejected', reason: rejectionReason.trim(), rowVersion: booking.rowVersion },
      res.messages.MSG204
    );
  };

  const handleRecordCompleted = () => {
    if (!booking) return;
    if (!isActualAmountValid) {
      setActualAmountError(res.messages.MSG143);
      return;
    }
    void submit(
      'outcome',
      { outcome: 'Completed', actualAmount, rowVersion: booking.rowVersion },
      res.messages.MSG206
    );
  };

  const handleRecordNoShow = () =>
    booking &&
    submit(
      'outcome',
      { outcome: 'NoShow', rowVersion: booking.rowVersion },
      res.messages.MSG206
    );

  const ui = isVi
    ? {
        loading: 'Đang tải chi tiết yêu cầu đặt dịch vụ...',
        notFoundTitle: 'Không tìm thấy yêu cầu',
        notFoundDesc: 'Không thể truy xuất dữ liệu cho yêu cầu đặt dịch vụ này.',
        returnList: 'Quay lại danh sách yêu cầu',
        submittedPrefix: 'Gửi lúc',
        unitsLabel: (qty: number) => `${qty} suất / đơn vị`,
        slaLabel: 'Hạn phản hồi 24 giờ',
        sectionService: 'Thông tin đặt chỗ & Dịch vụ',
        fieldService: 'Dịch vụ / Cơ sở',
        fieldOption: 'Gói dịch vụ đã chọn',
        fieldDate: 'Ngày sử dụng dịch vụ',
        fieldTime: 'Giờ dự kiến (GMT+7)',
        fieldQty: 'Số lượng',
        fieldEstimate: 'Tổng tiền ước tính (Tham khảo)',
        estimatedCommHint: 'Ước tính hoa hồng nền tảng (10% khi hoàn thành dịch vụ)',
        verifiedGuest: 'Du khách đã xác thực trên TripMate',
        copy: 'Sao chép',
        decisionDialogNote: 'Hệ thống sẽ hiển thị hộp thoại xác nhận trước khi lưu quyết định.',
        outcomeEndedNotice:
          'Thời hạn tự ghi nhận kết quả đã kết thúc. TripMate sẽ tự động hoàn tất yêu cầu theo giá trị ước tính. Tải lại trang để xem trạng thái mới nhất.',
        outcomeLockedTitle: 'Chưa mở ghi nhận kết quả',
        outcomeLockedBody: (d: string) =>
          `Chức năng ghi nhận kết quả dịch vụ sẽ mở sau khi ngày sử dụng (${d}) kết thúc theo giờ Việt Nam.`,
        outcomeEligiblePrompt:
          'Ngày sử dụng dịch vụ đã qua. Vui lòng ghi nhận kết quả thực tế và tổng số tiền đã thu từ khách.',
        actualAmountLabel: 'Tổng số tiền thực tế đã thu (₫)',
        markCompletedBtn: 'Đánh dấu Hoàn thành dịch vụ',
        markNoShowBtn: 'Đánh dấu Khách vắng mặt (No-show)',
        confirmCompletionBtn: 'Xác nhận hoàn thành',
        confirmNoShowBtn: 'Xác nhận vắng mặt',
        terminalTitle: 'Kết quả vận hành đã ghi nhận',
        finalStatus: 'Trạng thái cuối cùng',
        actualCollected: 'Doanh thu thực tế đã thu',
        platformComm: 'Hoa hồng nền tảng (10%)',
        rejectionReasonHeading: 'Lý do từ chối',
        rejectionLabel: 'Lý do từ chối yêu cầu',
        quickReasons: 'Chọn nhanh lý do phổ biến:',
        directPaymentTitle: 'Chính sách thanh toán trực tiếp',
        directPaymentBody:
          'Số tiền hiển thị chỉ mang tính ước tính tham khảo. Du khách sẽ thanh toán trực tiếp cho đối tác khi sử dụng dịch vụ. TripMate không thu hộ tiền dịch vụ và không xử lý hoàn tiền cho yêu cầu này.',
      }
    : {
        loading: 'Loading booking details...',
        notFoundTitle: 'Booking Not Found',
        notFoundDesc: 'The requested booking record could not be retrieved.',
        returnList: 'Return to Booking Requests',
        submittedPrefix: 'Submitted on',
        unitsLabel: (qty: number) => `${qty} ${qty === 1 ? 'unit' : 'units'}`,
        slaLabel: '24h Response Deadline',
        sectionService: hotelProviderEn.w104.sectionParametersTitle,
        fieldService: hotelProviderEn.w104.fields.service,
        fieldOption: hotelProviderEn.w104.fields.option,
        fieldDate: hotelProviderEn.w104.fields.requestedDate,
        fieldTime: hotelProviderEn.w104.fields.requestedTime,
        fieldQty: hotelProviderEn.w104.fields.quantity,
        fieldEstimate: hotelProviderEn.w104.fields.estimatedAmount,
        estimatedCommHint: 'Estimated platform commission (10% upon service completion)',
        verifiedGuest: 'Verified TripMate Traveler',
        copy: 'Copy',
        decisionDialogNote: 'A confirmation dialog will appear before saving your decision.',
        outcomeEndedNotice:
          'The outcome recording window has ended. TripMate will complete this request automatically using the estimated amount. Reload to view its latest status.',
        outcomeLockedTitle: 'Outcome Recording Locked',
        outcomeLockedBody: (d: string) => hotelProviderEn.w104.outcomeSection.lockedNotice(d),
        outcomeEligiblePrompt: hotelProviderEn.w104.outcomeSection.eligiblePrompt,
        actualAmountLabel: hotelProviderEn.w104.outcomeSection.actualAmountLabel,
        markCompletedBtn: hotelProviderEn.w104.outcomeSection.markCompletedButton,
        markNoShowBtn: hotelProviderEn.w104.outcomeSection.markNoShowButton,
        confirmCompletionBtn: 'Confirm Completion',
        confirmNoShowBtn: 'Confirm No-Show',
        terminalTitle: 'Recorded Operational Outcome',
        finalStatus: 'Final Status',
        actualCollected: 'Actual Spend Collected',
        platformComm: 'TripMate Commission',
        rejectionReasonHeading: 'Rejection Reason',
        rejectionLabel: 'Rejection reason',
        quickReasons: 'Quick reason presets:',
        directPaymentTitle: hotelProviderEn.directPaymentNotice.title,
        directPaymentBody: hotelProviderEn.directPaymentNotice.body,
      };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#DCE2DD] bg-white p-16 text-center text-xs text-[#5B6E69] shadow-xs">
        <span className="material-symbols-outlined mx-auto mb-2 block animate-spin text-[32px] text-[#174B4A]">
          progress_activity
        </span>
        {ui.loading}
      </div>
    );
  }

  if (errorMessage || !booking) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-[#DCE2DD] bg-white p-14 text-center text-xs text-[#DC2626] shadow-xs"
      >
        <span className="material-symbols-outlined mx-auto mb-2 block text-[36px]">error</span>
        <h3 className="mb-1 text-sm font-bold text-[#1C2928]">
          {errorMessage || ui.notFoundTitle}
        </h3>
        <p className="mb-5 text-[#5B6E69]">{ui.notFoundDesc}</p>
        <Link
          href={ROUTES.provider.bookings}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[#174B4A] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#103B39]"
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            arrow_back
          </span>
          <span>{ui.returnList}</span>
        </Link>
      </div>
    );
  }

  const isPending =
    booking.status === 'PendingConfirmation' &&
    (!booking.responseDeadlineUtc || Date.parse(booking.responseDeadlineUtc) > now);
  const isConfirmed = booking.status === 'Confirmed';
  const isTerminal = ['Completed', 'NoShow', 'Rejected', 'Cancelled', 'Expired'].includes(
    booking.status
  );
  const outcomeWindowEnded =
    !!booking.autoCompleteAtUtc && now >= Date.parse(booking.autoCompleteAtUtc);
  const stayDatePassed = booking.outcomeAvailableAtUtc
    ? now >= Date.parse(booking.outcomeAvailableAtUtc)
    : isDateInPast(booking.requestedDate);

  const parsedActualAmount = Number(actualAmountInput) || 0;
  const previewCommission = Math.floor(parsedActualAmount / 10);
  const estimatedCommission = Math.floor((booking.estimatedAmount || 0) / 10);
  const sla = isPending ? formatRemainingSla(booking.responseDeadlineUtc, now, locale) : null;
  const steps = getLifecycleSteps(booking.status, stayDatePassed, isVi);

  return (
    <div className="space-y-5">
      {/* Top Back Link & Timestamp */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={ROUTES.provider.bookings}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#174B4A] transition-colors hover:text-[#103B39]"
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            arrow_back
          </span>
          <span>{ui.returnList}</span>
        </Link>

        {booking.submittedAt && (
          <span className="text-xs text-[#5B6E69]">
            {ui.submittedPrefix}{' '}
            <strong className="font-mono font-semibold text-[#1C2928]">
              {formatDateTime(booking.submittedAt)}
            </strong>
          </span>
        )}
      </div>

      {/* Hero Order Header Card + 4-Step Lifecycle Stepper */}
      <div className="rounded-2xl border border-[#DCE2DD] bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(28,41,40,0.04),0_4px_16px_rgba(28,41,40,0.025)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-mono text-xl sm:text-2xl font-extrabold tracking-tight text-[#1C2928]">
                {booking.requestCode}
              </h1>
              <StatusBadge status={booking.status} locale={locale} size="md" />
            </div>
            <p className="mt-1.5 text-[13px] text-[#5B6E69]">
              <strong className="font-bold text-[#1C2928]">{booking.serviceName}</strong>
              {booking.serviceOption && booking.serviceOption !== '—' && (
                <> · {booking.serviceOption}</>
              )}{' '}
              · {ui.unitsLabel(booking.quantity)} ·{' '}
              <strong className="tabular-nums text-[#1C2928]">
                {formatDate(booking.requestedDate)}
              </strong>
            </p>
          </div>

          {isPending && booking.responseDeadlineUtc && (
            <div className="flex items-center gap-2.5 rounded-xl border border-[#F3CBB6] bg-[#FFF4EE] px-3.5 py-2.5 text-[#995436]">
              <span
                className="material-symbols-outlined shrink-0 text-[20px] text-[#B96D4C]"
                aria-hidden="true"
              >
                timer
              </span>
              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-wider">{ui.slaLabel}</div>
                <div className="font-mono text-xs font-extrabold">
                  {formatDateTime(booking.responseDeadlineUtc)}
                  {sla ? ` (${sla.text})` : ''}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4-Step Lifecycle Stepper */}
        <ol
          aria-label={isVi ? 'Tiến trình yêu cầu' : 'Request lifecycle'}
          className="mt-5 grid grid-cols-2 gap-3 border-t border-[#EDF1EE] pt-4 sm:flex sm:items-center sm:gap-0"
        >
          {steps.map((step, idx) => (
            <li
              key={step.number}
              className={`flex items-center gap-2 ${idx < steps.length - 1 ? 'sm:flex-1' : ''}`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${
                  step.state === 'done'
                    ? 'bg-[#0E9F6E] text-white'
                    : step.state === 'current'
                    ? 'bg-[#B96D4C] text-white shadow-[0_0_0_4px_rgba(185,109,76,0.18)]'
                    : step.state === 'failed'
                    ? 'bg-[#E02D4D] text-white'
                    : 'border border-[#D5DDD8] bg-[#EDF1EE] text-[#7C908B]'
                }`}
                aria-hidden="true"
              >
                {step.state === 'done' ? '✓' : step.state === 'failed' ? '✕' : step.number}
              </span>
              <span
                className={`text-xs whitespace-nowrap ${
                  step.state === 'done'
                    ? 'font-bold text-[#065F46]'
                    : step.state === 'current'
                    ? 'font-bold text-[#995436]'
                    : step.state === 'failed'
                    ? 'font-bold text-[#991B1B]'
                    : 'font-semibold text-[#7C908B]'
                }`}
              >
                {step.label}
              </span>
              {idx < steps.length - 1 && (
                <span
                  className={`mx-3 hidden h-0.5 flex-1 sm:block ${
                    step.state === 'done' ? 'bg-[#0E9F6E]' : 'bg-[#E3E9E5]'
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* 65 / 35 Two-Column Layout */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* Left Column (8 cols) */}
        <div className="space-y-5 lg:col-span-8">
          {/* Card 1: Reservation Parameters & Service Details */}
          <section className="rounded-2xl border border-[#DCE2DD] bg-white p-5 sm:p-6 shadow-xs">
            <h2 className="mb-4 flex items-center gap-2 border-b border-[#EDF1EE] pb-3 text-sm font-extrabold text-[#1C2928]">
              <span className="material-symbols-outlined text-[19px] text-[#174B4A]" aria-hidden="true">
                room_service
              </span>
              <span>{ui.sectionService}</span>
            </h2>

            <dl className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2 sm:gap-5">
              <div>
                <dt className="mb-0.5 text-[11.5px] font-semibold text-[#5B6E69]">
                  {ui.fieldService}
                </dt>
                <dd className="text-sm font-bold text-[#1C2928]">{booking.serviceName}</dd>
              </div>
              <div>
                <dt className="mb-0.5 text-[11.5px] font-semibold text-[#5B6E69]">
                  {ui.fieldOption}
                </dt>
                <dd className="text-sm font-bold text-[#1C2928]">{booking.serviceOption}</dd>
              </div>
              <div>
                <dt className="mb-0.5 text-[11.5px] font-semibold text-[#5B6E69]">{ui.fieldDate}</dt>
                <dd className="text-sm font-bold tabular-nums text-[#1C2928]">
                  {formatDate(booking.requestedDate)}
                </dd>
              </div>
              <div>
                <dt className="mb-0.5 text-[11.5px] font-semibold text-[#5B6E69]">{ui.fieldTime}</dt>
                <dd className="font-mono text-sm font-bold text-[#1C2928]">
                  {formatTime(booking.requestedTime)}
                </dd>
              </div>
              <div>
                <dt className="mb-0.5 text-[11.5px] font-semibold text-[#5B6E69]">{ui.fieldQty}</dt>
                <dd>
                  <span className="inline-flex items-center rounded-lg border border-[#DCE2DD] bg-[#F1F4F1] px-2.5 py-0.5 text-xs font-bold text-[#1C2928]">
                    {booking.quantity}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="mb-0.5 text-[11.5px] font-semibold text-[#5B6E69]">
                  {ui.fieldEstimate}
                </dt>
                <dd className="font-mono text-base font-extrabold text-[#174B4A]">
                  {formatVnd(booking.estimatedAmount)}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E3E8E4] bg-[#F7F5EF] px-4 py-3 text-xs">
              <span className="font-semibold text-[#5B6E69]">{ui.estimatedCommHint}</span>
              <strong className="font-mono text-sm font-extrabold text-[#174B4A]">
                {formatVnd(estimatedCommission)}
              </strong>
            </div>
          </section>

          {/* Card 2: Traveler Identity & Special Inquiries */}
          <section className="rounded-2xl border border-[#DCE2DD] bg-white p-5 sm:p-6 shadow-xs">
            <h2 className="mb-4 flex items-center gap-2 border-b border-[#EDF1EE] pb-3 text-sm font-extrabold text-[#1C2928]">
              <span className="material-symbols-outlined text-[19px] text-[#174B4A]" aria-hidden="true">
                person
              </span>
              <span>{res.w104.sectionTravelerTitle}</span>
            </h2>

            <div className="mb-4 flex items-center gap-3.5">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8F0EA] text-sm font-extrabold text-[#174B4A]"
                aria-hidden="true"
              >
                {getGuestInitials(booking.travelerName)}
              </div>
              <div>
                <div className="text-[15px] font-extrabold text-[#1C2928]">
                  {booking.travelerName}
                </div>
                <div className="text-xs text-[#5B6E69]">{ui.verifiedGuest}</div>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-2 rounded-xl border border-[#E6EBE7] bg-[#FAF9F5] px-3.5 py-2.5">
                <div className="min-w-0">
                  <span className="block text-[11px] font-semibold text-[#5B6E69]">
                    {res.w104.fields.travelerPhone}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#1C2928]">
                    {booking.travelerPhone || '—'}
                  </span>
                </div>
                {booking.travelerPhone && (
                  <button
                    type="button"
                    onClick={() =>
                      void handleCopyText(booking.travelerPhone!, res.w104.fields.travelerPhone)
                    }
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#DCE2DD] bg-white px-2.5 py-1 text-[11px] font-bold text-[#1C2928] transition hover:border-[#174B4A] hover:text-[#174B4A] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[13px]" aria-hidden="true">
                      content_copy
                    </span>
                    <span>{ui.copy}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 rounded-xl border border-[#E6EBE7] bg-[#FAF9F5] px-3.5 py-2.5">
                <div className="min-w-0">
                  <span className="block text-[11px] font-semibold text-[#5B6E69]">
                    {res.w104.fields.travelerEmail}
                  </span>
                  <span className="block truncate text-xs font-bold text-[#1C2928]">
                    {booking.travelerEmail || '—'}
                  </span>
                </div>
                {booking.travelerEmail && (
                  <button
                    type="button"
                    onClick={() =>
                      void handleCopyText(booking.travelerEmail!, res.w104.fields.travelerEmail)
                    }
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#DCE2DD] bg-white px-2.5 py-1 text-[11px] font-bold text-[#1C2928] transition hover:border-[#174B4A] hover:text-[#174B4A] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[13px]" aria-hidden="true">
                      content_copy
                    </span>
                    <span>{ui.copy}</span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-[11.5px] font-semibold text-[#5B6E69]">
                {res.w104.fields.specialRequests}
              </span>
              <p className="rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] px-3.5 py-3 text-xs leading-relaxed text-[#1C2928]">
                {booking.specialRequests || res.w104.fields.noneProvided}
              </p>
            </div>
          </section>

          {/* Terminal State Read-Only Outcome */}
          {isTerminal && (
            <section className="rounded-2xl border border-[#DCE2DD] bg-white p-5 sm:p-6 shadow-xs">
              <h2 className="mb-4 flex items-center gap-2 border-b border-[#EDF1EE] pb-3 text-sm font-extrabold text-[#1C2928]">
                <span className="material-symbols-outlined text-[19px] text-[#5B6E69]" aria-hidden="true">
                  history_toggle_off
                </span>
                <span>{ui.terminalTitle}</span>
              </h2>

              <div className="space-y-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#5B6E69]">{ui.finalStatus}:</span>
                  <StatusBadge status={booking.status} locale={locale} size="sm" />
                </div>

                {booking.actualAmount !== undefined && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#5B6E69]">{ui.actualCollected}:</span>
                    <span className="font-mono font-bold text-[#1C2928]">
                      {formatVnd(booking.actualAmount)}
                    </span>
                  </div>
                )}

                {booking.commissionAmount !== undefined && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#5B6E69]">{ui.platformComm}:</span>
                    <span className="font-mono font-bold text-[#174B4A]">
                      {formatVnd(booking.commissionAmount)}
                    </span>
                  </div>
                )}

                {booking.rejectionReason && (
                  <div className="border-t border-[#E2E8F0] pt-2.5">
                    <span className="mb-1 block font-semibold text-[#991B1B]">
                      {ui.rejectionReasonHeading}:
                    </span>
                    <p className="rounded-lg border border-[#FECDD3] bg-white p-3 italic text-[#1C2928]">
                      {booking.rejectionReason}
                    </p>
                  </div>
                )}

                {booking.outcomeRecordedAt && (
                  <div className="pt-2 text-[11px] text-[#5B6E69]">
                    {res.w104.outcomeSection.terminalNotice(
                      booking.status,
                      formatDateTime(booking.outcomeRecordedAt),
                      booking.outcomeRecordedBy || (isVi ? 'Tài khoản đối tác' : 'Provider Account')
                    )}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right Sticky Column (4 cols) */}
        <div className="space-y-5 lg:sticky lg:top-22 lg:col-span-4">
          {/* SECTION B: Provider Decision Actions (Pending Confirmation Only) */}
          {isPending && (
            <section className="rounded-2xl border-2 border-[#174B4A]/30 bg-white p-5 sm:p-6 shadow-xs">
              <h2 className="mb-3 flex items-center gap-2 border-b border-[#EDF1EE] pb-3 text-sm font-extrabold text-[#1C2928]">
                <span className="material-symbols-outlined text-[19px] text-[#174B4A]" aria-hidden="true">
                  gavel
                </span>
                <span>{res.w104.sectionDecisionTitle}</span>
              </h2>

              <p className="mb-5 text-xs leading-relaxed text-[#5B6E69]">
                {res.w104.decisionActions.confirmPrompt}
              </p>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(true)}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#174B4A] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#103B39] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
                    check_circle
                  </span>
                  <span>{res.w104.decisionActions.confirmButton}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRejectionReason('');
                    setRejectionError('');
                    setIsRejectModalOpen(true);
                  }}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#F7C2CC] bg-white px-5 py-2.5 text-xs font-bold text-[#C81E3D] transition hover:bg-[#FDECEF] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
                    cancel
                  </span>
                  <span>{res.w104.decisionActions.rejectButton}</span>
                </button>
              </div>

              <p className="mt-3 text-center text-[11px] text-[#7C908B]">{ui.decisionDialogNote}</p>
            </section>
          )}

          {/* SECTION C: Record Service Outcome (Confirmed State) */}
          {isConfirmed && (
            <section className="rounded-2xl border border-[#DCE2DD] bg-white p-5 sm:p-6 shadow-xs">
              <h2 className="mb-3 flex items-center gap-2 border-b border-[#EDF1EE] pb-3 text-sm font-extrabold text-[#1C2928]">
                <span className="material-symbols-outlined text-[19px] text-[#174B4A]" aria-hidden="true">
                  assignment_turned_in
                </span>
                <span>{res.w104.sectionOutcomeTitle}</span>
              </h2>

              {outcomeWindowEnded ? (
                <div
                  role="status"
                  className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 text-xs leading-relaxed text-[#475569]"
                >
                  {ui.outcomeEndedNotice}
                </div>
              ) : !stayDatePassed ? (
                <div className="flex items-start gap-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 text-xs text-[#64748B]">
                  <span
                    className="material-symbols-outlined shrink-0 text-[20px] text-[#64748B]"
                    aria-hidden="true"
                  >
                    lock_clock
                  </span>
                  <div>
                    <h3 className="mb-0.5 font-bold text-[#1C2928]">{ui.outcomeLockedTitle}</h3>
                    <p className="leading-relaxed">
                      {ui.outcomeLockedBody(formatDate(booking.requestedDate))}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs leading-relaxed text-[#5B6E69]">
                    {ui.outcomeEligiblePrompt}
                  </p>

                  <div className="space-y-3 rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] p-4">
                    <div>
                      <label
                        htmlFor="w104-actual-amount"
                        className="mb-1 block text-xs font-bold text-[#1C2928]"
                      >
                        {ui.actualAmountLabel}{' '}
                        <span className="text-[#DC2626]" aria-hidden="true">
                          *
                        </span>
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
                        placeholder={res.w104.outcomeSection.actualAmountPlaceholder}
                        className={`min-h-11 w-full rounded-xl border bg-white px-3 py-2 font-mono text-sm font-bold text-[#1C2928] focus:border-[#174B4A] focus:outline-none focus:ring-2 focus:ring-[#174B4A]/20 ${
                          actualAmountError ? 'border-[#DC2626]' : 'border-[#DCE2DD]'
                        }`}
                      />
                      {actualAmountError && (
                        <p className="mt-1 font-sans text-xs text-[#DC2626]" role="alert">
                          {actualAmountError}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-[#DCE2DD] bg-white px-3 py-2.5 text-xs">
                      <span className="font-semibold text-[#5B6E69]">
                        {res.w104.outcomeSection.commissionPreviewLabel}
                      </span>
                      <span className="font-mono text-sm font-extrabold text-[#174B4A]">
                        {formatVnd(previewCommission)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5B6E69]">
                      {res.w104.outcomeSection.commissionCalculationNote}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isActualAmountValid) {
                          setActualAmountError(res.messages.MSG143);
                          return;
                        }
                        setIsCompletedModalOpen(true);
                      }}
                      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#174B4A] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#103B39] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
                        verified
                      </span>
                      <span>{ui.markCompletedBtn}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsNoShowModalOpen(true)}
                      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#DDD6FE] bg-white px-5 py-2.5 text-xs font-bold text-[#5B21B6] transition hover:bg-[#F1EBFE] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
                        person_off
                      </span>
                      <span>{ui.markNoShowBtn}</span>
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Mandatory Direct Payment Notice (BR-196) */}
          <aside className="rounded-2xl border border-[#F2D4BE] bg-[#FFF8F2] p-5 text-xs text-[#7C442B] shadow-2xs">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#995436]">
              <span className="material-symbols-outlined text-[18px] text-[#B96D4C]" aria-hidden="true">
                payments
              </span>
              <span>{ui.directPaymentTitle}</span>
            </h3>
            <p className="text-xs leading-relaxed">{ui.directPaymentBody}</p>
          </aside>
        </div>
      </div>

      {/* Confirmation Dialog: Confirm Booking (CR-05) */}
      <ConfirmationDialog
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => {
          void handleConfirmDecision();
        }}
        title={res.w104.decisionActions.confirmDialogTitle}
        message={res.w104.decisionActions.confirmDialogMessage(booking.requestCode)}
        confirmLabel={res.w104.decisionActions.submitConfirm}
        cancelLabel={res.w104.decisionActions.cancelAction}
        variant="primary"
        isLoading={isSubmitting}
      />

      {/* Confirmation Dialog: Reject Booking (CR-05 + BR mandatory reason) */}
      <ConfirmationDialog
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleRejectDecision}
        title={res.w104.decisionActions.rejectDialogTitle}
        confirmLabel={res.w104.decisionActions.submitReject}
        cancelLabel={res.w104.decisionActions.cancelAction}
        variant="danger"
        isLoading={isSubmitting}
        message={
          <div className="space-y-3">
            <div>
              <span className="mb-1.5 block text-[11px] font-semibold text-[#5B6E69]">
                {ui.quickReasons}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {res.w104.decisionActions.rejectPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setRejectionReason(preset);
                      setRejectionError('');
                    }}
                    className="rounded-lg border border-[#DCE2DD] bg-[#F7F5EF] px-2.5 py-1 text-left text-[11px] font-medium text-[#1C2928] transition hover:border-[#174B4A] hover:bg-[#E8F0EA] cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="w104-rejection-reason" className="mb-1 block text-xs font-bold text-[#1C2928]">
                {ui.rejectionLabel}
              </label>
              <textarea
                id="w104-rejection-reason"
                required
                maxLength={1000}
                disabled={isSubmitting}
                value={rejectionReason}
                placeholder={res.w104.decisionActions.rejectReasonPlaceholder}
                onChange={(event) => {
                  setRejectionReason(event.target.value);
                  setRejectionError('');
                }}
                aria-invalid={!!rejectionError}
                aria-describedby={rejectionError ? 'rejection-error' : undefined}
                className="min-h-24 w-full rounded-xl border border-[#DCE2DD] p-3 text-xs text-[#1C2928] focus:border-[#174B4A] focus:outline-none focus:ring-2 focus:ring-[#174B4A]/20"
              />
              {rejectionError && (
                <p id="rejection-error" role="alert" className="mt-1 text-xs font-semibold text-[#DC2626]">
                  {rejectionError}
                </p>
              )}
            </div>
          </div>
        }
      />

      {/* Confirmation Dialog: Mark Completed (CR-05) */}
      <ConfirmationDialog
        isOpen={isCompletedModalOpen}
        onClose={() => setIsCompletedModalOpen(false)}
        onConfirm={handleRecordCompleted}
        title={res.w104.outcomeSection.completedDialogTitle}
        message={res.w104.outcomeSection.completedDialogMessage(
          formatVnd(parsedActualAmount),
          formatVnd(previewCommission)
        )}
        confirmLabel={ui.confirmCompletionBtn}
        cancelLabel={res.w104.decisionActions.cancelAction}
        variant="primary"
        isLoading={isSubmitting}
      />

      {/* Confirmation Dialog: Mark No-show (CR-05) */}
      <ConfirmationDialog
        isOpen={isNoShowModalOpen}
        onClose={() => setIsNoShowModalOpen(false)}
        onConfirm={() => {
          void handleRecordNoShow();
        }}
        title={res.w104.outcomeSection.noShowDialogTitle}
        message={res.w104.outcomeSection.noShowDialogMessage}
        confirmLabel={ui.confirmNoShowBtn}
        cancelLabel={res.w104.decisionActions.cancelAction}
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}
