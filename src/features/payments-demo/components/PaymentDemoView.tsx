'use client';

import { useState } from 'react';

import {
  createMockPayment,
  resolveMockPaymentOutcome,
  type MockPayment,
  type MockPaymentOutcome,
} from '../paymentDemo';

interface PaymentDemoViewProps {
  bookingId: string;
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

function outcomeContent(status: MockPayment['status']): { title: string; description: string; tone: string } {
  switch (status) {
    case 'Success':
      return {
        title: 'Thanh toán mô phỏng thành công',
        description: 'Trong tích hợp thật, trạng thái này chỉ được Backend xác nhận sau callback từ PayOS.',
        tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
      };
    case 'Cancelled':
      return {
        title: 'Thanh toán mô phỏng đã hủy',
        description: 'Booking mẫu vẫn ở trạng thái chờ thanh toán để người dùng có thể thử lại.',
        tone: 'border-amber-200 bg-amber-50 text-amber-900',
      };
    case 'Expired':
      return {
        title: 'Liên kết thanh toán mô phỏng đã hết hạn',
        description: 'Trong tích hợp thật, Web sẽ lấy lại trạng thái chuẩn từ Backend.',
        tone: 'border-rose-200 bg-rose-50 text-rose-900',
      };
    default:
      return {
        title: 'Đang chờ thanh toán',
        description: 'Chọn một kết quả Mock để xem từng trạng thái giao diện.',
        tone: 'border-sky-200 bg-sky-50 text-sky-900',
      };
  }
}

export function PaymentDemoView({ bookingId }: PaymentDemoViewProps) {
  const [payment, setPayment] = useState<MockPayment | null>(null);

  const beginPayment = () => setPayment(createMockPayment(bookingId));
  const setOutcome = (outcome: MockPaymentOutcome) => {
    setPayment((current) => current && resolveMockPaymentOutcome(current, outcome));
  };

  const state = outcomeContent(payment?.status ?? 'Pending');

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-10">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <p className="mb-3 inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800">
          Demo cục bộ — không tạo giao dịch thật
        </p>
        <h1 className="text-2xl font-extrabold text-slate-950">Thanh toán điện tử</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Màn hình kiểm thử UI UC-28. Dữ liệu dưới đây là giả lập và không kết nối Backend hoặc PayOS.
        </p>

        <dl className="mt-7 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-slate-50 px-4">
          <div className="flex items-center justify-between gap-4 py-3 text-sm">
            <dt className="text-slate-500">Mã booking mẫu</dt>
            <dd className="font-bold text-slate-900">{payment?.bookingCode ?? 'BK-DEMO-UC28'}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-3 text-sm">
            <dt className="text-slate-500">Booking ID</dt>
            <dd className="max-w-[58%] truncate font-mono text-xs text-slate-900">{bookingId}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-3 text-sm">
            <dt className="text-slate-500">Số tiền</dt>
            <dd className="font-extrabold text-slate-950">{formatVnd(payment?.amount ?? 1700000)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-3 text-sm">
            <dt className="text-slate-500">Cổng thanh toán</dt>
            <dd className="font-bold text-slate-900">PayOS Mock</dd>
          </div>
        </dl>

        {!payment ? (
          <button
            type="button"
            onClick={beginPayment}
            className="mt-7 w-full rounded-xl bg-[#007d6e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#006b5f] focus:outline-none focus:ring-2 focus:ring-[#007d6e] focus:ring-offset-2"
          >
            Bắt đầu thanh toán Mock
          </button>
        ) : (
          <>
            <div className={`mt-7 rounded-2xl border p-4 ${state.tone}`} role="status">
              <h2 className="font-bold">{state.title}</h2>
              <p className="mt-1 text-sm leading-6">{state.description}</p>
            </div>
            {payment.status === 'Pending' && (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <button type="button" onClick={() => setOutcome('Success')} className="rounded-xl bg-[#007d6e] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#006b5f]">
                  Thanh toán thành công
                </button>
                <button type="button" onClick={() => setOutcome('Cancelled')} className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-900 hover:bg-amber-100">
                  Hủy thanh toán
                </button>
                <button type="button" onClick={() => setOutcome('Expired')} className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-900 hover:bg-rose-100">
                  Làm hết hạn
                </button>
              </div>
            )}
            {payment.status !== 'Pending' && (
              <button type="button" onClick={beginPayment} className="mt-5 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50">
                Chạy lại demo
              </button>
            )}
          </>
        )}

        <p className="mt-7 text-xs leading-5 text-slate-500">
          Không có yêu cầu nào được gửi đến Backend hoặc PayOS.
        </p>
      </section>
    </main>
  );
}
