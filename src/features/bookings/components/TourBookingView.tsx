/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useId, useMemo, useState } from 'react';

import type { WebAuthContext } from '@/features/auth/session/authSession';
import type { TourDetailDto, TourScheduleDto } from '@/features/public/tours/types/tour';
import { ROUTES } from '@/lib/routes';
import { DEMO_COUPON_CODES } from '../data/bookingDemoFixtures';
import { createBooking, initiatePayment } from '../services/bookingApi';
import type { BookingDto, PaymentMethod } from '../types/booking';

interface TourBookingViewProps {
  tour: TourDetailDto;
  initialScheduleId?: string;
  isDemo?: boolean;
  userContext: WebAuthContext | null;
}

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

export function TourBookingView({
  tour,
  initialScheduleId,
  isDemo = false,
  userContext,
}: TourBookingViewProps) {
  const router = useRouter();
  const phoneInputId = useId();
  const notesInputId = useId();
  const couponInputId = useId();

  // Find selected schedule
  const availableSchedules = useMemo(() => {
    return (tour.schedules ?? []).filter((s) => s.status === 'Available' && s.remainingSlots > 0);
  }, [tour.schedules]);

  const defaultSchedule = useMemo(() => {
    if (initialScheduleId) {
      const match = tour.schedules.find((s) => s.scheduleId === initialScheduleId);
      if (match) return match;
    }
    return availableSchedules[0] ?? tour.schedules[0] ?? null;
  }, [initialScheduleId, tour.schedules, availableSchedules]);

  const [selectedSchedule, setSelectedSchedule] = useState<TourScheduleDto | null>(defaultSchedule);

  // Traveler Counts
  const [adultCount, setAdultCount] = useState<number>(2);
  const [childCount, setChildCount] = useState<number>(1);

  // Lead Traveler Info (prefill from userContext or demo)
  const [leadName, setLeadName] = useState<string>(
    userContext?.fullName || (isDemo ? 'Nguyễn Minh Phúc' : ''),
  );
  const [leadPhone, setLeadPhone] = useState<string>(isDemo ? '0905 123 456' : '');
  const [leadEmail, setLeadEmail] = useState<string>(
    userContext?.email || (isDemo ? 'traveler@tripmate.vn' : ''),
  );
  const [specialRequests, setSpecialRequests] = useState<string>(
    isDemo ? 'Gia đình có trẻ nhỏ, ưu tiên ghế gần cửa sổ nếu thuận tiện.' : '',
  );

  // Discount code
  const [couponCode, setCouponCode] = useState<string>(isDemo ? 'HOIAN15' : '');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number; label: string } | null>(
    isDemo ? { code: 'HOIAN15', percent: 15, label: 'Ưu đãi 15% mùa lễ hội di sản' } : null,
  );
  const [couponError, setCouponError] = useState<string | null>(null);

  // Terms agreement (explicit opt-in required)
  const [agreedTerms, setAgreedTerms] = useState<boolean>(false);

  // Booking Flow Steps: 1 = Form & Confirmation, 2 = Payment Handoff
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [createdBooking, setCreatedBooking] = useState<BookingDto | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('VNPay');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [pendingBeNotice, setPendingBeNotice] = useState<string | null>(null);

  // Countdown timer for 15-minute hold in Step 2
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15 * 60);

  useEffect(() => {
    if (activeStep !== 2) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeStep]);

  const countdownText = useMemo(() => {
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [secondsRemaining]);

  // Pricing calculations
  const remainingSlots = selectedSchedule?.remainingSlots ?? 0;
  const adultUnitPrice = selectedSchedule?.price ?? tour.basePrice;
  const childUnitPrice = Math.round(adultUnitPrice * 0.5); // 50% for children 4-11
  const subtotal = adultCount * adultUnitPrice + childCount * childUnitPrice;
  const discountAmount = appliedCoupon ? Math.round((subtotal * appliedCoupon.percent) / 100) : 0;
  const totalAmount = Math.max(0, subtotal - discountAmount);

  const totalTravelers = adultCount + childCount;
  const isOverCapacity = totalTravelers > remainingSlots;

  // Coupon handling
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const cleanCode = couponCode.trim().toUpperCase();
    if (!cleanCode) {
      setAppliedCoupon(null);
      return;
    }
    const match = DEMO_COUPON_CODES[cleanCode];
    if (match) {
      setAppliedCoupon({ code: cleanCode, percent: match.percent, label: match.label });
    } else {
      setCouponError('Mã ưu đãi không hợp lệ hoặc đã hết lượt áp dụng.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  // Step 1 Submission: Create Booking
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule) return;
    if (adultCount < 1) {
      alert('Đơn đặt tour cần ít nhất 1 người lớn.');
      return;
    }
    if (isOverCapacity) {
      alert(`Số lượng khách (${totalTravelers}) vượt quá số chỗ còn trống (${remainingSlots}).`);
      return;
    }
    if (!leadPhone.trim()) {
      alert('Vui lòng cung cấp số điện thoại liên hệ của trưởng đoàn.');
      return;
    }
    if (!agreedTerms) {
      alert('Vui lòng đồng ý với điều khoản đặt tour và chính sách hoàn hủy.');
      return;
    }

    setIsSubmitting(true);
    setPendingBeNotice(null);

    try {
      const booking = await createBooking(
        {
          tourId: tour.tourId,
          scheduleId: selectedSchedule.scheduleId,
          adultCount,
          childCount,
          leadTravelerName: leadName,
          leadTravelerPhone: leadPhone,
          leadTravelerEmail: leadEmail,
          couponCode: appliedCoupon?.code,
          participants: [
            { fullName: leadName, participantType: 'Adult' },
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
          ],
          specialRequests,
        },
        { allowDemo: isDemo },
      );

      setCreatedBooking(booking);
      setActiveStep(2); // Advance to UC-28: Payment
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo đơn đặt tour.';
      setPendingBeNotice(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2 Submission: Initiate Electronic Payment
  const handleProceedPayment = async () => {
    if (!createdBooking) return;
    setIsSubmitting(true);
    setPendingBeNotice(null);

    try {
      const res = await initiatePayment(createdBooking.bookingId, selectedPaymentMethod, {
        allowDemo: isDemo,
      });

      if (res.paymentUrl) {
        router.push(res.paymentUrl);
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Không thể kết nối cổng thanh toán.';
      setPendingBeNotice(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
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
        <span className="font-semibold text-slate-900">
          {activeStep === 1 ? 'Xác nhận đặt tour (UC-27)' : 'Thanh toán điện tử (UC-28)'}
        </span>
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
        <div className={`flex items-center gap-2 font-bold ${activeStep === 1 ? 'text-[#007d6e]' : 'text-slate-400'}`}>
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              activeStep === 1
                ? 'bg-[#007d6e] text-white shadow-sm'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {activeStep > 1 ? '✓' : '1'}
          </span>
          <span>1. Xác nhận đặt tour</span>
        </div>

        <div className="h-0.5 w-8 sm:w-16 bg-slate-200" />

        <div className={`flex items-center gap-2 font-bold ${activeStep === 2 ? 'text-[#007d6e]' : 'text-slate-400'}`}>
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              activeStep === 2
                ? 'bg-[#007d6e] text-white shadow-sm'
                : 'bg-slate-200 text-slate-500'
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
      {pendingBeNotice && (
        <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 text-xl">pending_actions</span>
            <div>
              <h4 className="font-bold text-sm text-amber-900 mb-1">
                Trạng thái kết nối máy chủ: PENDING_BE_INTEGRATION
              </h4>
              <p className="text-amber-800 leading-relaxed">{pendingBeNotice}</p>
              <p className="mt-2 text-[11px] text-amber-700">
                Hệ thống tuân thủ nguyên tắc trung thực: Không tạo đơn giả mạo khi Backend API chưa sẵn sàng. Bạn có thể thêm tham số <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">?demo=1</code> trên môi trường phát triển để trải nghiệm đầy đủ giao diện.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      {activeStep === 1 ? (
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
                  Thời lượng: {tour.durationDays} ngày • Điểm đón: {tour.meetingPoint || 'Đà Nẵng'}
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
                  const isAvailable = schedule.status === 'Available' && schedule.remainingSlots > 0;

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
                      {formatCurrency(adultUnitPrice)} / khách
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
                      {formatCurrency(childUnitPrice)} (50% giá người lớn)
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
                    id="lead-traveler-name-input"
                    type="text"
                    required
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Minh Phúc"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs text-slate-900 focus:border-[#007d6e] focus:outline-hidden focus:ring-1 focus:ring-[#007d6e]"
                  />
                </div>

                <div>
                  <label htmlFor={phoneInputId} className="block font-semibold text-slate-700 mb-1">
                    Số điện thoại liên hệ *
                  </label>
                  <input
                    id={phoneInputId}
                    type="tel"
                    required
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    placeholder="Ví dụ: 0905 123 456"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs text-slate-900 focus:border-[#007d6e] focus:outline-hidden focus:ring-1 focus:ring-[#007d6e]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="lead-traveler-email-input" className="block font-semibold text-slate-700 mb-1">
                    Email nhận vé điện tử *
                  </label>
                  <input
                    id="lead-traveler-email-input"
                    type="email"
                    required
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="Ví dụ: traveler@tripmate.vn"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs text-slate-900 focus:border-[#007d6e] focus:outline-hidden focus:ring-1 focus:ring-[#007d6e]"
                  />
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

              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs">
                  <div>
                    <span className="font-extrabold text-emerald-800 tracking-wider">
                      {appliedCoupon.code}
                    </span>
                    <span className="ml-2 rounded-sm bg-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-900">
                      -{appliedCoupon.percent}%
                    </span>
                    <p className="text-[11px] text-emerald-700 mt-0.5">{appliedCoupon.label}</p>
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
                <div className="flex justify-between">
                  <span>{adultCount} người lớn × {formatCurrency(adultUnitPrice)}</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(adultCount * adultUnitPrice)}
                  </span>
                </div>

                {childCount > 0 && (
                  <div className="flex justify-between">
                    <span>{childCount} trẻ em × {formatCurrency(childUnitPrice)}</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(childCount * childUnitPrice)}
                    </span>
                  </div>
                )}

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Giảm giá ({appliedCoupon.code})</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                <div className="border-t border-dashed border-slate-200 pt-3 flex items-baseline justify-between">
                  <span className="text-sm font-bold text-slate-900">Tổng thanh toán:</span>
                  <span className="text-2xl font-black text-[#007d6e]">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Agreement checkbox */}
              <div className="pt-2">
                <label
                  htmlFor="agreed-terms-checkbox"
                  className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer"
                >
                  <input
                    id="agreed-terms-checkbox"
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#007d6e] focus:ring-[#007d6e]"
                  />
                  <span>
                    Tôi xác nhận thông tin chính xác và đồng ý với{' '}
                    <span className="font-semibold text-slate-900 underline">
                      Điều khoản đặt tour &amp; Chính sách hoàn hủy
                    </span>{' '}
                    của TripMate.
                  </span>
                </label>
              </div>

              {/* Submit CTA Button */}
              <button
                type="button"
                disabled={isSubmitting || isOverCapacity || !agreedTerms || !selectedSchedule}
                onClick={handleCreateBooking}
                className="w-full rounded-xl bg-[#007d6e] py-3.5 px-4 text-center text-sm font-bold text-white shadow-md transition hover:bg-[#006b5f] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Đang tạo đơn đặt tour…</span>
                  </>
                ) : (
                  <>
                    <span>Tiếp tục thanh toán</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-slate-400">
                Đơn đặt sẽ được tạo ở trạng thái <strong>Chờ thanh toán (Pending Payment)</strong> và giữ chỗ trong 15 phút.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* STEP 2: MAKE ELECTRONIC PAYMENT (UC-28) */
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Booking Summary Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Mã đơn đặt tour</p>
                <p className="text-base font-black font-mono text-slate-900">
                  {createdBooking?.bookingCode || 'BK-20261015-0148'}
                </p>
              </div>
              <div className="text-right">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                  Chờ thanh toán
                </span>
                <p className="text-2xl font-black text-[#007d6e] mt-1">
                  {formatCurrency(createdBooking?.totalAmount ?? totalAmount)}
                </p>
              </div>
            </div>

            <div className="py-3 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-900">{tour.title}</p>
              <p>
                Khởi hành: {formatDatetime(selectedSchedule?.startDatetime || '')} • {adultCount} người lớn
                {childCount > 0 ? `, ${childCount} trẻ em` : ''}
              </p>
              <p>Trưởng đoàn: {leadName} ({leadPhone})</p>
            </div>

            {/* Countdown Hold Notice */}
            <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3 text-center text-xs text-amber-900 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-amber-700 text-sm">schedule</span>
              <span>
                Giữ chỗ trong <strong className="font-mono text-amber-950 font-bold">{countdownText}</strong> trước khi hệ thống tự động giải phóng chỗ.
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#007d6e] text-base">payments</span>
              Chọn phương thức thanh toán
            </h3>

            <div className="space-y-3">
              {/* VNPay Option */}
              <label
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
                  selectedPaymentMethod === 'VNPay'
                    ? 'border-[#007d6e] bg-teal-50/30 ring-1 ring-[#007d6e]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="VNPay"
                    checked={selectedPaymentMethod === 'VNPay'}
                    onChange={() => setSelectedPaymentMethod('VNPay')}
                    className="h-4 w-4 text-[#007d6e] focus:ring-[#007d6e]"
                  />
                  <div>
                    <span className="block text-sm font-bold text-slate-900">VNPay Gateway</span>
                    <span className="text-xs text-slate-500">
                      Thẻ ATM nội địa, Internet Banking, Thẻ quốc tế Visa/Mastercard
                    </span>
                  </div>
                </div>
                <span className="rounded-md bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                  Khuyên dùng
                </span>
              </label>

              {/* VNPay QR Option */}
              <label
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
                  selectedPaymentMethod === 'VNPayQR'
                    ? 'border-[#007d6e] bg-teal-50/30 ring-1 ring-[#007d6e]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="VNPayQR"
                    checked={selectedPaymentMethod === 'VNPayQR'}
                    onChange={() => setSelectedPaymentMethod('VNPayQR')}
                    className="h-4 w-4 text-[#007d6e] focus:ring-[#007d6e]"
                  />
                  <div>
                    <span className="block text-sm font-bold text-slate-900">VNPay QR Code</span>
                    <span className="text-xs text-slate-500">
                      Quét mã thanh toán trực tiếp qua 30+ ứng dụng ngân hàng &amp; ví điện tử
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-400">qr_code_2</span>
              </label>
            </div>

            {/* Security Guarantee Banner */}
            <div className="mt-5 rounded-xl bg-blue-50/70 border border-blue-200 p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-blue-600 text-lg">verified_user</span>
              <div>
                <p className="font-bold">Bảo chứng an toàn thanh toán</p>
                <p className="text-blue-800 text-[11px] mt-0.5">
                  Bạn sẽ được chuyển hướng an toàn tới cổng thanh toán VNPay chuẩn PCI DSS. TripMate không bao giờ lưu trữ thông tin thẻ của bạn.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Timeline Steps Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Tiến trình thanh toán
            </h4>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                  ✓
                </span>
                <div>
                  <strong className="text-slate-900 block">1. Tạo đơn đặt tour thành công</strong>
                  <span className="text-slate-500 text-[11px]">Mã đơn: {createdBooking?.bookingCode}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#007d6e] text-white font-bold text-[11px]">
                  2
                </span>
                <div>
                  <strong className="text-slate-900 block">2. Thanh toán qua VNPay</strong>
                  <span className="text-slate-500 text-[11px]">Đang chờ kết quả phản hồi từ cổng thanh toán</span>
                </div>
              </div>

              <div className="flex items-start gap-3 opacity-60">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500 font-bold text-[11px]">
                  3
                </span>
                <div>
                  <strong className="text-slate-700 block">3. Xác nhận đặt tour &amp; Phát hành vé QR</strong>
                  <span className="text-slate-500 text-[11px]">Tự động cấp mã vé điện tử tức thì sau khi thanh toán thành công</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3">
            <button
              type="button"
              disabled={isSubmitting || secondsRemaining <= 0}
              onClick={handleProceedPayment}
              className="w-full rounded-xl bg-[#007d6e] py-3.5 px-4 text-center text-sm font-bold text-white shadow-md transition hover:bg-[#006b5f] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Đang kết nối cổng VNPay…</span>
                </>
              ) : (
                <>
                  <span>Thanh toán {formatCurrency(createdBooking?.totalAmount ?? totalAmount)} với {selectedPaymentMethod}</span>
                  <span className="material-symbols-outlined text-base">lock</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition py-1"
            >
              Quay lại chỉnh sửa thông tin đơn đặt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
