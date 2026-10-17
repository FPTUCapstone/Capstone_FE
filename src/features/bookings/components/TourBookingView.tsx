/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

import type { WebAuthContext } from '@/features/auth/session/authSession';
import type { TourDetailDto, TourScheduleDto } from '@/features/public/tours/types/tour';
import { ROUTES } from '@/lib/routes';
import { createBooking, quoteBooking } from '../services/bookingApi';
import { BookingApiError } from '../types/booking';
import type { BookingDto, BookingParticipantRequestDto, BookingQuoteDto, ParticipantType } from '../types/booking';

interface TourBookingViewProps {
  tour: TourDetailDto;
  initialScheduleId?: string;
  isDemo?: boolean;
  userContext: WebAuthContext | null;
  /** Loaded from the Traveler profile; it is intentionally separate from the auth session. */
  profilePhone?: string | null;
}

type RequiredField = 'leadName' | 'leadPhone' | 'leadEmail' | 'agreedTerms';
type RequiredFieldErrors = Partial<Record<RequiredField, string>>;

function formatCurrency(amount: number, currency: string = 'VND'): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency === 'VND' ? 'VND' : currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDatetime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

/** Capacity left and, for real data, the server's `bookable` decision (registration still open). */
function isBookableSchedule(schedule: TourScheduleDto): boolean {
  return schedule.status === 'Available' && schedule.remainingSlots > 0 && schedule.bookable !== false;
}

export function TourBookingView({
  tour,
  initialScheduleId,
  isDemo = false,
  userContext,
  profilePhone,
}: TourBookingViewProps) {
  const router = useRouter();
  const phoneInputId = useId();
  const notesInputId = useId();
  const couponInputId = useId();
  const leadNameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const leadEmailInputRef = useRef<HTMLInputElement>(null);
  const termsInputRef = useRef<HTMLInputElement>(null);

  // Find selected schedule. A departure is selectable only while the server still says it is bookable
  // (capacity left and registration open, BR-60); a link to a closed departure must not pre-select it.
  const availableSchedules = useMemo(() => {
    return (tour.schedules ?? []).filter(isBookableSchedule);
  }, [tour.schedules]);

  const defaultSchedule = useMemo(() => {
    if (initialScheduleId) {
      const match = tour.schedules.find((s) => s.scheduleId === initialScheduleId);
      if (match && isBookableSchedule(match)) return match;
    }
    return availableSchedules[0] ?? tour.schedules[0] ?? null;
  }, [initialScheduleId, tour.schedules, availableSchedules]);

  const [selectedSchedule, setSelectedSchedule] = useState<TourScheduleDto | null>(defaultSchedule);

  // Traveler Counts
  const [adultCount, setAdultCount] = useState<number>(2);
  const [childCount, setChildCount] = useState<number>(1);
  const [infantCount, setInfantCount] = useState<number>(0);

  // Lead Traveler Info (prefill from userContext or demo)
  const [leadName, setLeadName] = useState<string>(
    userContext?.fullName || (isDemo ? 'Nguyễn Minh Phúc' : ''),
  );
  // `null` means the traveler has not edited this field. That lets a profile value that arrives
  // after the form render act as a default without an effect that overwrites an explicit edit.
  const [leadPhone, setLeadPhone] = useState<string | null>(
    isDemo ? '0905 123 456' : null,
  );
  const resolvedLeadPhone = leadPhone ?? profilePhone?.trim() ?? '';
  const [requiredFieldErrors, setRequiredFieldErrors] = useState<RequiredFieldErrors>({});
  const [leadEmail, setLeadEmail] = useState<string>(
    userContext?.email || (isDemo ? 'traveler@tripmate.vn' : ''),
  );
  const [specialRequests, setSpecialRequests] = useState<string>(
    isDemo ? 'Gia đình có trẻ nhỏ, ưu tiên ghế gần cửa sổ nếu thuận tiện.' : '',
  );

  // Discount code — applying only stages the code; the server quote (BR-63) decides eligibility and discount.
  const [couponCode, setCouponCode] = useState<string>(isDemo ? 'HOIAN15' : '');
  const [appliedVoucherCode, setAppliedVoucherCode] = useState<string | null>(isDemo ? 'HOIAN15' : null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Server-computed quote (BE spec §3.1). The client never computes price itself.
  const [quote, setQuote] = useState<BookingQuoteDto | null>(null);
  const [quoteLoading, setQuoteLoading] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Terms agreement (explicit opt-in required)
  const [agreedTerms, setAgreedTerms] = useState<boolean>(false);

  // UC-27 ends at a confirmed PendingPayment booking; "created" switches the view to that
  // confirmation. Payment (UC-28) is a separate, user-initiated navigation, never started here.
  const [createdBooking, setCreatedBooking] = useState<BookingDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Remaining capacity still comes from the already-loaded tour detail for the selector/counter UI.
  const remainingSlots = quote?.remainingSlots ?? selectedSchedule?.remainingSlots ?? 0;
  const totalTravelers = adultCount + childCount + infantCount;
  const isOverCapacity = totalTravelers > remainingSlots;

  // A quote fetched for a now-invalid input (no schedule, zero travelers, over capacity) is stale
  // and must never be trusted for display or submission, even if React hasn't re-run the effect yet.
  const isQuoteInputValid = Boolean(selectedSchedule) && totalTravelers > 0 && !isOverCapacity;
  const effectiveQuote = isQuoteInputValid ? quote : null;

  // Monetary amounts are valid only once the server has produced a quote. In particular, the
  // client must not infer Child/Infant prices from a schedule card or calculate line totals.
  const findLine = (type: ParticipantType) =>
    effectiveQuote?.priceBreakdown.find((line) => line.participantType === type);
  const adultLine = findLine('Adult');
  const childLine = findLine('Child');
  const infantLine = findLine('Infant');
  const discountAmount = effectiveQuote?.discountAmount;
  const totalAmount = effectiveQuote?.totalAmount;
  const appliedVoucherLabel = effectiveQuote?.appliedVoucher?.code ?? null;

  // UC-27 BR-63: re-quote from the server whenever the inputs that affect price change. Debounced
  // and cancelled on change so a fast typist / counter-clicker never races an earlier request.
  useEffect(() => {
    if (!selectedSchedule || totalTravelers === 0 || isOverCapacity) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      setQuoteLoading(true);
      quoteBooking(
        {
          tourScheduleId: selectedSchedule.scheduleId,
          participantCounts: { adult: adultCount, child: childCount, infant: infantCount },
          voucherCode: appliedVoucherCode ?? undefined,
        },
        tour.tourId,
        { allowDemo: isDemo, signal: controller.signal },
      )
        .then((result) => {
          setQuote(result);
          setQuoteError(null);
          if (appliedVoucherCode && !result.appliedVoucher) {
            setCouponError('Mã ưu đãi không hợp lệ hoặc đã hết lượt áp dụng.');
          } else {
            setCouponError(null);
          }
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          setQuote(null);
          setQuoteError(err instanceof Error ? err.message : 'Không thể tải báo giá từ máy chủ.');
        })
        .finally(() => setQuoteLoading(false));
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    selectedSchedule,
    tour.tourId,
    adultCount,
    childCount,
    infantCount,
    appliedVoucherCode,
    isDemo,
    totalTravelers,
    isOverCapacity,
  ]);

  // Coupon handling — "Apply" only stages the code; the next quote tells us if it was accepted.
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const cleanCode = couponCode.trim().toUpperCase();
    setAppliedVoucherCode(cleanCode || null);
  };

  const handleRemoveCoupon = () => {
    setAppliedVoucherCode(null);
    setCouponCode('');
    setCouponError(null);
  };

  const clearRequiredFieldError = (field: RequiredField) => {
    setRequiredFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const focusRequiredField = (field: RequiredField) => {
    const input = field === 'leadName'
      ? leadNameInputRef.current
      : field === 'leadPhone'
        ? phoneInputRef.current
        : field === 'leadEmail'
          ? leadEmailInputRef.current
          : termsInputRef.current;
    requestAnimationFrame(() => {
      input?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      input?.focus();
    });
  };

  const validateRequiredFields = (): boolean => {
    const errors: RequiredFieldErrors = {};
    if (!leadName.trim()) errors.leadName = 'Vui lòng nhập họ và tên trưởng đoàn.';
    if (!resolvedLeadPhone.trim()) errors.leadPhone = 'Vui lòng nhập số điện thoại liên hệ để tiếp tục đặt tour.';
    if (!leadEmail.trim()) errors.leadEmail = 'Vui lòng nhập email nhận vé điện tử.';
    if (!agreedTerms) errors.agreedTerms = 'Vui lòng đồng ý với điều khoản đặt tour và chính sách hoàn hủy.';

    setRequiredFieldErrors(errors);
    const firstInvalid = (['leadName', 'leadPhone', 'leadEmail', 'agreedTerms'] as const)
      .find((field) => Boolean(errors[field]));
    if (firstInvalid) {
      focusRequiredField(firstInvalid);
      return false;
    }
    return true;
  };

  // Step 1 Submission: Create Booking
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule || !isBookableSchedule(selectedSchedule)) return;
    if (adultCount < 1) {
      alert('Đơn đặt tour cần ít nhất 1 người lớn.');
      return;
    }
    if (isOverCapacity) {
      alert(`Số lượng khách (${totalTravelers}) vượt quá số chỗ còn trống (${remainingSlots}).`);
      return;
    }
    if (!validateRequiredFields()) return;

    if (!effectiveQuote || quoteLoading) {
      alert('Vui lòng chờ hệ thống tải xong báo giá trước khi xác nhận đặt tour.');
      return;
    }

    // Demo is explicitly read-only (quote preview only): it must never create a booking, reserve
    // a seat, or lead to payment. Real submission always goes through the live Backend contract.
    if (isDemo) {
      setSubmissionError(
        'Chế độ xem trước (Demo) chỉ hiển thị báo giá mô phỏng và không tạo đơn đặt tour thật. Vui lòng tắt chế độ Demo để đặt tour thực tế.',
      );
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    const participants: BookingParticipantRequestDto[] = [
      { fullName: leadName, participantType: 'Adult', phoneNumber: resolvedLeadPhone, email: leadEmail },
      ...(adultCount > 1
        ? Array.from({ length: adultCount - 1 }, (_, i) => ({
            fullName: `Người lớn ${i + 2}`,
            participantType: 'Adult' as const,
          }))
        : []),
      ...(childCount > 0
        ? Array.from({ length: childCount }, (_, i) => ({
            fullName: `Trẻ em ${i + 1}`,
            participantType: 'Child' as const,
          }))
        : []),
      ...(infantCount > 0
        ? Array.from({ length: infantCount }, (_, i) => ({
            fullName: `Em bé ${i + 1}`,
            participantType: 'Infant' as const,
          }))
        : []),
    ];

    try {
      // One idempotency key per logical submit attempt; the same key is only reused by the
      // underlying fetch layer's own retry (if any), never minted again for this same click.
      const booking = await createBooking(
        {
          tourScheduleId: selectedSchedule.scheduleId,
          participants,
          voucherCode: effectiveQuote.appliedVoucher?.code,
        },
        { idempotencyKey: crypto.randomUUID() },
      );

      // UC-27 ends here at PendingPayment. Payment (UC-28) is a separate, user-initiated
      // navigation triggered by the "Pay now" button below — never started automatically.
      setCreatedBooking(booking);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof BookingApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Có lỗi xảy ra khi tạo đơn đặt tour.';
      setSubmissionError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToPayment = () => {
    if (!createdBooking) return;
    router.push(`/bookings/${encodeURIComponent(createdBooking.bookingId)}/pay${isDemo ? '?demo=1' : ''}`);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 font-sans" lang="vi">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-slate-500">
        <Link href={ROUTES.home} className="hover:text-[#007d6e] transition">
          Trang chủ
        </Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <Link href={ROUTES.tours} className="hover:text-[#007d6e] transition">
          Gói tour
        </Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <Link href={ROUTES.tour(tour.tourId)} className="hover:text-[#007d6e] transition truncate max-w-xs">
          {tour.title}
        </Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="font-semibold text-slate-900">Xác nhận đặt tour (UC-27)</span>
      </nav>

      {/* Demo notice bar when in demo mode */}
      {isDemo && (
        <div className="mb-6 rounded-2xl border border-teal-200 bg-teal-50/70 p-4 text-xs text-teal-900 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600 text-lg">science</span>
            <div>
              <p className="font-bold">Chế độ xem trước trải nghiệm đặt tour (Demo Mode)</p>
              <p className="text-teal-700">
                Đang sử dụng dữ liệu mô phỏng chuẩn SRS (Report 3) để kiểm thử luồng UC-27 &rarr; UC-28 &rarr; UC-29.
              </p>
            </div>
          </div>
          <span className="rounded-lg bg-teal-200 px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase text-teal-900">
            DEMO ONLY
          </span>
        </div>
      )}

      {/* Stepper Indicator */}
      <div className="mb-8 flex items-center justify-center gap-2 sm:gap-4 text-xs">
        <div className={`flex items-center gap-2 font-bold ${createdBooking ? 'text-slate-400' : 'text-[#007d6e]'}`}>
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              createdBooking ? 'bg-emerald-600 text-white' : 'bg-[#007d6e] text-white shadow-sm'
            }`}
          >
            {createdBooking ? '✓' : '1'}
          </span>
          <span>1. Xác nhận đặt tour</span>
        </div>

        <div className="h-0.5 w-8 sm:w-16 bg-slate-200" />

        <div className={`flex items-center gap-2 font-bold ${createdBooking ? 'text-[#007d6e]' : 'text-slate-400'}`}>
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              createdBooking ? 'bg-[#007d6e] text-white shadow-sm' : 'bg-slate-200 text-slate-500'
            }`}
          >
            2
          </span>
          <span>2. Thanh toán điện tử</span>
        </div>

        <div className="h-0.5 w-8 sm:w-16 bg-slate-200" />

        <div className="flex items-center gap-2 font-bold text-slate-400">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-500 text-xs">
            3
          </span>
          <span>3. Nhận vé QR E-ticket</span>
        </div>
      </div>

      {/* Pending BE Notification banner (Real mode) */}
      {submissionError && (
        <div role="alert" className="mb-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-xs text-red-900 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-red-600 text-xl">error</span>
            <div>
              <h4 className="font-bold text-sm text-red-900 mb-1">
                Không thể tạo đơn đặt tour
              </h4>
              <p className="text-red-800 leading-relaxed">{submissionError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      {!createdBooking ? (
        /* STEP 1: CONFIRM BOOKING FORM (UC-27) */
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Form Details (7 cols) */}
          <div className="space-y-6 lg:col-span-7">
            {/* Tour Mini Summary Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center gap-4">
              <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {tour.images?.[0] ? (
                  <img
                    src={tour.images[0]}
                    alt={tour.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined text-2xl">image</span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-block rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-[#007d6e] mb-1">
                  {tour.operatorName}
                </span>
                <h2 className="text-base font-bold text-slate-900 line-clamp-1">{tour.title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thời lượng: {tour.durationDays} ngày • Điểm đón: {selectedSchedule?.meetingPoint || tour.meetingPoint || 'Đang cập nhật'}
                </p>
              </div>
            </div>

            {/* Schedule Selector */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#007d6e] text-base">calendar_month</span>
                Chọn lịch khởi hành
              </h3>

              <div className="space-y-2">
                {tour.schedules.map((schedule) => {
                  const isSelected = selectedSchedule?.scheduleId === schedule.scheduleId;
                  const isAvailable = isBookableSchedule(schedule);

                  return (
                    <button
                      key={schedule.scheduleId}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedSchedule(schedule)}
                      className={`w-full text-left rounded-xl p-3.5 border transition flex items-center justify-between text-xs ${
                        isSelected
                          ? 'border-[#007d6e] bg-teal-50/40 ring-1 ring-[#007d6e]'
                          : isAvailable
                          ? 'border-slate-200 bg-white hover:border-slate-300'
                          : 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            Khởi hành: {formatDatetime(schedule.startDatetime)}
                          </span>
                          {isSelected && (
                            <span className="rounded-full bg-[#007d6e] px-2 py-0.2 text-[10px] font-bold text-white">
                              Đã chọn
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Đến: {formatDatetime(schedule.endDatetime)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-sm text-[#007d6e]">
                          {formatCurrency(schedule.price, schedule.currency)}
                        </span>
                        <p className={`text-[11px] mt-0.5 ${schedule.remainingSlots > 5 ? 'text-slate-500' : 'text-amber-600 font-semibold'}`}>
                          {isAvailable ? `Còn ${schedule.remainingSlots} chỗ` : 'Đã hết chỗ'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Travelers Counter */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#007d6e] text-base">group</span>
                Số lượng khách tham gia
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Chỗ trống còn lại: <strong className="text-slate-900">{remainingSlots}</strong> chỗ
              </p>

              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs space-y-3">
                {/* Adults */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">Người lớn</span>
                    <span className="text-slate-500 text-[11px]">
                      {adultLine ? `${formatCurrency(adultLine.unitPrice)} / khách` : 'Đang tải báo giá…'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={adultCount <= 1}
                      onClick={() => setAdultCount((prev) => Math.max(1, prev - 1))}
                      className="h-8 w-8 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition flex items-center justify-center cursor-pointer"
                      aria-label="Giảm 1 người lớn"
                    >
                      –
                    </button>
                    <span className="w-5 text-center font-bold text-sm text-slate-900">
                      {adultCount}
                    </span>
                    <button
                      type="button"
                      disabled={totalTravelers >= remainingSlots}
                      onClick={() => setAdultCount((prev) => prev + 1)}
                      className="h-8 w-8 rounded-lg bg-[#007d6e] font-bold text-white hover:bg-[#006b5f] disabled:opacity-40 transition flex items-center justify-center cursor-pointer"
                      aria-label="Tăng 1 người lớn"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Children (4-11) */}
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">Trẻ em (4–11 tuổi)</span>
                    <span className="text-slate-500 text-[11px]">
                      {childLine ? `${formatCurrency(childLine.unitPrice)} / khách` : 'Đang tải báo giá…'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={childCount <= 0}
                      onClick={() => setChildCount((prev) => Math.max(0, prev - 1))}
                      className="h-8 w-8 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition flex items-center justify-center cursor-pointer"
                      aria-label="Giảm 1 trẻ em"
                    >
                      –
                    </button>
                    <span className="w-5 text-center font-bold text-sm text-slate-900">
                      {childCount}
                    </span>
                    <button
                      type="button"
                      disabled={totalTravelers >= remainingSlots}
                      onClick={() => setChildCount((prev) => prev + 1)}
                      className="h-8 w-8 rounded-lg bg-[#007d6e] font-bold text-white hover:bg-[#006b5f] disabled:opacity-40 transition flex items-center justify-center cursor-pointer"
                      aria-label="Tăng 1 trẻ em"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Infants */}
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">Em bé (dưới 4 tuổi)</span>
                    <span className="text-slate-500 text-[11px]">
                      {infantLine ? `${formatCurrency(infantLine.unitPrice)} / khách` : 'Đang tải báo giá…'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={infantCount <= 0}
                      onClick={() => setInfantCount((prev) => Math.max(0, prev - 1))}
                      className="h-8 w-8 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition flex items-center justify-center cursor-pointer"
                      aria-label="Giảm 1 em bé"
                    >
                      –
                    </button>
                    <span className="w-5 text-center font-bold text-sm text-slate-900">
                      {infantCount}
                    </span>
                    <button
                      type="button"
                      disabled={totalTravelers >= remainingSlots}
                      onClick={() => setInfantCount((prev) => prev + 1)}
                      className="h-8 w-8 rounded-lg bg-[#007d6e] font-bold text-white hover:bg-[#006b5f] disabled:opacity-40 transition flex items-center justify-center cursor-pointer"
                      aria-label="Tăng 1 em bé"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {isOverCapacity && (
                <p className="mt-3 text-xs text-red-600 font-semibold">
                  Tổng số khách vượt quá số chỗ trống còn lại ({remainingSlots} chỗ).
                </p>
              )}
            </div>

            {/* Lead Traveler Contact Form */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#007d6e] text-base">badge</span>
                Thông tin người đặt (Trưởng đoàn)
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                <div>
                  <label htmlFor="lead-traveler-name-input" className="block font-semibold text-slate-700 mb-1">
                    Họ và tên trưởng đoàn *
                  </label>
                  <input
                    ref={leadNameInputRef}
                    id="lead-traveler-name-input"
                    type="text"
                    required
                    value={leadName}
                    onChange={(e) => {
                      setLeadName(e.target.value);
                      clearRequiredFieldError('leadName');
                    }}
                    placeholder="Ví dụ: Nguyễn Minh Phúc"
                    aria-invalid={Boolean(requiredFieldErrors.leadName)}
                    aria-describedby={requiredFieldErrors.leadName ? 'lead-traveler-name-error' : undefined}
                    className={`w-full rounded-xl border px-3 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:ring-1 ${
                      requiredFieldErrors.leadName
                        ? 'border-red-500 bg-red-50 focus:border-red-600 focus:ring-red-500'
                        : 'border-slate-300 focus:border-[#007d6e] focus:ring-[#007d6e]'
                    }`}
                  />
                  {requiredFieldErrors.leadName && (
                    <p id="lead-traveler-name-error" role="alert" className="mt-1 text-xs font-medium text-red-600">
                      {requiredFieldErrors.leadName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor={phoneInputId} className="block font-semibold text-slate-700 mb-1">
                    Số điện thoại liên hệ *
                  </label>
                  <input
                    ref={phoneInputRef}
                    id={phoneInputId}
                    type="tel"
                    required
                    value={resolvedLeadPhone}
                    onChange={(e) => {
                      setLeadPhone(e.target.value);
                      clearRequiredFieldError('leadPhone');
                    }}
                    placeholder="Ví dụ: 0905 123 456"
                    aria-invalid={Boolean(requiredFieldErrors.leadPhone)}
                    aria-describedby={requiredFieldErrors.leadPhone ? `${phoneInputId}-error` : undefined}
                    className={`w-full rounded-xl border px-3 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:ring-1 ${
                      requiredFieldErrors.leadPhone
                        ? 'border-red-500 bg-red-50 focus:border-red-600 focus:ring-red-500'
                        : 'border-slate-300 focus:border-[#007d6e] focus:ring-[#007d6e]'
                    }`}
                  />
                  {requiredFieldErrors.leadPhone && (
                    <p id={`${phoneInputId}-error`} role="alert" className="mt-1 text-xs font-medium text-red-600">
                      {requiredFieldErrors.leadPhone}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="lead-traveler-email-input" className="block font-semibold text-slate-700 mb-1">
                    Email nhận vé điện tử *
                  </label>
                  <input
                    ref={leadEmailInputRef}
                    id="lead-traveler-email-input"
                    type="email"
                    required
                    value={leadEmail}
                    onChange={(e) => {
                      setLeadEmail(e.target.value);
                      clearRequiredFieldError('leadEmail');
                    }}
                    placeholder="Ví dụ: traveler@tripmate.vn"
                    aria-invalid={Boolean(requiredFieldErrors.leadEmail)}
                    aria-describedby={requiredFieldErrors.leadEmail ? 'lead-traveler-email-error' : undefined}
                    className={`w-full rounded-xl border px-3 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:ring-1 ${
                      requiredFieldErrors.leadEmail
                        ? 'border-red-500 bg-red-50 focus:border-red-600 focus:ring-red-500'
                        : 'border-slate-300 focus:border-[#007d6e] focus:ring-[#007d6e]'
                    }`}
                  />
                  {requiredFieldErrors.leadEmail && (
                    <p id="lead-traveler-email-error" role="alert" className="mt-1 text-xs font-medium text-red-600">
                      {requiredFieldErrors.leadEmail}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor={notesInputId} className="block font-semibold text-slate-700 mb-1">
                    Ghi chú / Yêu cầu đặc biệt (tùy chọn)
                  </label>
                  <textarea
                    id={notesInputId}
                    rows={2}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Ví dụ: Ăn chay, người già đi cùng, hỗ trợ xe lăn..."
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs text-slate-900 focus:border-[#007d6e] focus:outline-hidden focus:ring-1 focus:ring-[#007d6e]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing & Confirmation Box (5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            {/* Coupon Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#007d6e] text-base">local_activity</span>
                Mã giảm giá / Ưu đãi
              </h3>

              {appliedVoucherCode ? (
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs">
                  <div>
                    <span className="font-extrabold text-emerald-800 tracking-wider">
                      {appliedVoucherCode}
                    </span>
                    {appliedVoucherLabel ? (
                      <span className="ml-2 rounded-sm bg-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-900">
                        Đã áp dụng
                      </span>
                    ) : (
                      <span className="ml-2 rounded-sm bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                        Đang kiểm tra…
                      </span>
                    )}
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Giảm giá do máy chủ tính toán sau khi xác thực mã.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    Gỡ bỏ
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <label htmlFor={couponInputId} className="sr-only">Mã giảm giá</label>
                  <input
                    id={couponInputId}
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Ví dụ: HOIAN15 hoặc BANA15"
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs uppercase text-slate-900 focus:border-[#007d6e] focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 cursor-pointer"
                  >
                    Áp dụng
                  </button>
                </form>
              )}

              {couponError && (
                <p className="mt-2 text-[11px] text-red-600 font-semibold">{couponError}</p>
              )}
            </div>

            {/* Price Summary Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Chi tiết thanh toán
              </h3>

              <div className="space-y-2 text-xs text-slate-600">
                {effectiveQuote ? (
                  effectiveQuote.priceBreakdown.map((line) => (
                    <div key={line.participantType} className="flex justify-between">
                      <span>
                        {line.participantType === 'Adult'
                          ? 'Người lớn'
                          : line.participantType === 'Child'
                            ? 'Trẻ em'
                            : 'Em bé'}{' '}
                        ({line.quantity} × {formatCurrency(line.unitPrice)})
                      </span>
                      <span className="font-semibold text-slate-900">{formatCurrency(line.lineAmount)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">Đang tải báo giá từ máy chủ…</p>
                )}

                {appliedVoucherLabel && (discountAmount ?? 0) > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Giảm giá ({appliedVoucherLabel})</span>
                    <span>-{formatCurrency(discountAmount!)}</span>
                  </div>
                )}

                <div className="border-t border-dashed border-slate-200 pt-3 flex items-baseline justify-between">
                  <span className="text-sm font-bold text-slate-900">Tổng thanh toán:</span>
                  <span className="text-2xl font-black text-[#007d6e] inline-flex items-center gap-2">
                    {quoteLoading && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#007d6e] border-t-transparent" />
                    )}
                    {totalAmount === undefined ? '—' : formatCurrency(totalAmount)}
                  </span>
                </div>
                {quoteError && (
                  <p className="text-[11px] text-red-600 font-semibold">{quoteError}</p>
                )}
              </div>

              {/* Agreement checkbox */}
              <div className={`rounded-xl border p-3 transition ${requiredFieldErrors.agreedTerms ? 'border-red-500 bg-red-50' : 'border-transparent'}`}>
                <label
                  htmlFor="agreed-terms-checkbox"
                  className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer"
                >
                  <input
                    ref={termsInputRef}
                    id="agreed-terms-checkbox"
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => {
                      setAgreedTerms(e.target.checked);
                      clearRequiredFieldError('agreedTerms');
                    }}
                    aria-invalid={Boolean(requiredFieldErrors.agreedTerms)}
                    aria-describedby={requiredFieldErrors.agreedTerms ? 'agreed-terms-error' : undefined}
                    className={`mt-0.5 h-4 w-4 rounded text-[#007d6e] focus:ring-[#007d6e] ${requiredFieldErrors.agreedTerms ? 'border-red-500' : 'border-slate-300'}`}
                  />
                  <span>
                    Tôi xác nhận thông tin chính xác và đồng ý với{' '}
                    <span className="font-semibold text-slate-900 underline">
                      Điều khoản đặt tour &amp; Chính sách hoàn hủy
                    </span>{' '}
                    của TripMate.
                  </span>
                </label>
                {requiredFieldErrors.agreedTerms && (
                  <p id="agreed-terms-error" role="alert" className="mt-2 text-xs font-medium text-red-600">
                    {requiredFieldErrors.agreedTerms}
                  </p>
                )}
              </div>

              {/* Submit CTA Button — Demo is read-only (quote preview only); it never creates a
                  real booking, so the button stays disabled and says so explicitly in that mode. */}
              <button
                type="button"
                disabled={
                  isDemo ||
                  isSubmitting ||
                  isOverCapacity ||
                  !selectedSchedule ||
                  !isBookableSchedule(selectedSchedule)
                  ||
                  quoteLoading ||
                  !effectiveQuote
                }
                onClick={handleCreateBooking}
                className="w-full rounded-xl bg-[#007d6e] py-3.5 px-4 text-center text-sm font-bold text-white shadow-md transition hover:bg-[#006b5f] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Đang tạo đơn đặt tour…</span>
                  </>
                ) : isDemo ? (
                  <span>Đặt tour thật không khả dụng ở chế độ Demo</span>
                ) : (
                  <>
                    <span>Tiếp tục thanh toán</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-slate-400">
                Đơn đặt sẽ được tạo ở trạng thái <strong>Chờ thanh toán (Pending Payment)</strong> và giữ chỗ theo thời hạn do máy chủ quy định.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* UC-27 ends here: a confirmed PendingPayment booking. "Pay now" is the only handoff
           to UC-28 — this view never selects a payment method or calls the gateway itself. */
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <span className="material-symbols-outlined">check_circle</span>
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">Đặt tour thành công</h2>
                <p className="text-xs text-slate-500">Đơn của bạn đang ở trạng thái Chờ thanh toán.</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-y border-slate-100 py-4">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Mã đơn đặt tour</p>
                <p className="text-base font-black font-mono text-slate-900">{createdBooking?.bookingCode}</p>
              </div>
              <div className="text-right">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                  Chờ thanh toán
                </span>
                <p className="text-2xl font-black text-[#007d6e] mt-1">
                  {createdBooking ? formatCurrency(createdBooking.totalAmount, createdBooking.currency) : '—'}
                </p>
              </div>
            </div>

            <p className="pt-4 text-xs text-slate-500">
              Vui lòng hoàn tất thanh toán trong thời gian giữ chỗ. Số dư và thời hạn chính xác sẽ
              được máy chủ xác nhận lại ở bước thanh toán.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoToPayment}
            className="w-full rounded-xl bg-[#007d6e] py-3.5 px-4 text-center text-sm font-bold text-white shadow-md transition hover:bg-[#006b5f] cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Thanh toán ngay</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      )}
    </div>
  );
}
