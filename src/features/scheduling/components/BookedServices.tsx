import type { ItineraryBookedServiceDto } from '../types/schedulingTypes';
import { formatVietnamTime } from '../types/schedulingTypes';

const money = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);

export function BookedServices({ services }: { services?: ItineraryBookedServiceDto[] }) {
  if (!services?.length) return null;
  return <section aria-labelledby="booked-services-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <h2 id="booked-services-heading" className="text-lg font-bold text-slate-900">Dịch vụ đã xác nhận</h2>
    <p className="mt-2 text-sm text-slate-600">Thanh toán trực tiếp cho nhà cung cấp khi sử dụng dịch vụ.</p>
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
      {services.map(service => <li key={service.id} className="rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900">{service.serviceName}</h3>
          <span className="rounded-full bg-[#E8F0EA] px-2 py-1 text-xs text-[#174B4A]">{service.status}</span>
        </div>
        {service.serviceOption && <p className="mt-2 text-sm text-slate-600">{service.serviceOption}</p>}
        <dl className="mt-3 space-y-2 text-sm text-slate-700">
          <div><dt className="inline font-medium">Thời gian </dt><dd className="inline">{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(service.startAtUtc))} · {formatVietnamTime(service.startAtUtc)}{service.endAtUtc ? ` – ${formatVietnamTime(service.endAtUtc)}` : ''}</dd></div>
          <div><dt className="inline font-medium">Số lượng </dt><dd className="inline">{service.quantity}</dd></div>
          <div><dt className="inline font-medium">Dự kiến </dt><dd className="inline">{money(service.estimatedAmount)}</dd></div>
          {service.actualAmount != null && <div><dt className="inline font-medium">Thực tế </dt><dd className="inline">{money(service.actualAmount)}</dd></div>}
        </dl>
      </li>)}
    </ul>
  </section>;
}
