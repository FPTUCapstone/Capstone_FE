'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useProviderLocale } from '@/features/hotel-service-provider/components/common/ProviderLocaleContext';

type Service = { id: number; name: string };
type Slot = { startsAt: string; quantity: number; remainingQuantity: number };

const endpoint = '/api/provider/commercial-services';

function formatVietnamDateTime(iso: string, locale: 'vi' | 'en'): { date: string; time: string } {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return { date: iso, time: '' };
  const date = new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(parsed);
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(parsed);
  return { date, time };
}

function toVietnamLocalInput(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  }).formatToParts(parsed);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  const hour = get('hour') === '24' ? '00' : get('hour');
  return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}`;
}

async function load<T>(url: string, init?: RequestInit, locale: 'vi' | 'en' = 'vi'): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...init });
  if (!response.ok) {
    if (response.status === 409) {
      throw new Error(
        locale === 'vi'
          ? 'Số lượng mới thấp hơn số yêu cầu đã xác nhận.'
          : 'New capacity cannot be lower than confirmed requests.'
      );
    }
    if (response.status === 400) {
      throw new Error(
        locale === 'vi'
          ? 'Kiểm tra thời gian và sức chứa của dịch vụ.'
          : 'Please verify the selected time slot and capacity.'
      );
    }
    throw new Error(
      locale === 'vi'
        ? 'Không thể tải hoặc lưu lịch. Vui lòng thử lại.'
        : 'Unable to load or save availability. Please try again.'
    );
  }
  return response.json() as Promise<T>;
}

export default function ProviderAvailabilityPage() {
  const { locale } = useProviderLocale('vi');
  const isVi = locale === 'vi';

  const [services, setServices] = useState<Service[] | null>(null);
  const [selected, setSelected] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [start, setStart] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [editingSlotIso, setEditingSlotIso] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [range, setRange] = useState('');
  const [rangeDate, setRangeDate] = useState('');

  function selectDate(date: string) {
    setRangeDate(date);
    setReading(true);
    setSlots([]);
    setError('');
    if (!date) {
      setRange('');
      return;
    }
    const from = new Date(date + 'T00:00:00+07:00');
    const to = new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);
    const query = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
    setRange('?' + query.toString());
  }

  useEffect(() => {
    const controller = new AbortController();
    void load<Service[]>(endpoint, { signal: controller.signal }, locale)
      .then((items) => {
        if (!controller.signal.aborted) {
          setServices(items);
          setReading(items.length > 0);
          setSelected(items[0] ? String(items[0].id) : '');
        }
      })
      .catch((failure: Error) => {
        if (!controller.signal.aborted) setError(failure.message);
      });
    return () => controller.abort();
  }, [locale]);

  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    void load<Slot[]>(endpoint + '/' + selected + '/availability' + range, { signal: controller.signal }, locale)
      .then((items) => {
        if (!controller.signal.aborted) setSlots(items);
      })
      .catch((failure: Error) => {
        if (!controller.signal.aborted) setError(failure.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setReading(false);
      });
    return () => controller.abort();
  }, [selected, range, locale]);

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setSaved(false);
    setError('');
    const path = endpoint + '/' + selected + '/availability';
    try {
      const stamp = new Date(start + ':00+07:00').toISOString();
      const slot = await load<Slot>(
        path + '/' + encodeURIComponent(stamp),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: Number(quantity) }),
        },
        locale
      );
      setSlots((current) =>
        [
          ...current.filter((item) => Date.parse(item.startsAt) !== Date.parse(slot.startsAt)),
          slot,
        ].sort((first, second) => Date.parse(first.startsAt) - Date.parse(second.startsAt))
      );
      setEditingSlotIso(slot.startsAt);
      setSaved(true);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : isVi
          ? 'Không thể lưu lịch.'
          : 'Unable to save availability.'
      );
    } finally {
      setBusy(false);
    }
  }

  function handleSelectSlotForEdit(slot: Slot) {
    setStart(toVietnamLocalInput(slot.startsAt));
    setQuantity(String(slot.quantity));
    setEditingSlotIso(slot.startsAt);
    setSaved(false);
    setError('');
  }

  function stepQuantity(delta: number) {
    const current = Number.parseInt(quantity, 10);
    const next = Math.max(0, (Number.isFinite(current) ? current : 0) + delta);
    setQuantity(String(next));
  }

  const stats = useMemo(() => {
    let openSlots = 0;
    let totalCapacity = 0;
    let totalRemaining = 0;
    let lowOrClosed = 0;

    for (const slot of slots) {
      if (slot.quantity > 0) openSlots += 1;
      totalCapacity += Math.max(0, slot.quantity);
      totalRemaining += Math.max(0, slot.remainingQuantity);
      if (slot.quantity === 0 || slot.remainingQuantity <= 1) lowOrClosed += 1;
    }
    const booked = Math.max(0, totalCapacity - totalRemaining);
    const occupancyPct = totalCapacity > 0 ? Math.round((booked / totalCapacity) * 100) : 0;
    return { openSlots, totalCapacity, totalRemaining, lowOrClosed, occupancyPct };
  }, [slots]);

  const activeServiceName = services?.find((s) => String(s.id) === selected)?.name ?? '';
  const editingSlot = editingSlotIso
    ? slots.find((s) => Date.parse(s.startsAt) === Date.parse(editingSlotIso)) ?? null
    : null;
  const editingBookedCount = editingSlot
    ? Math.max(0, editingSlot.quantity - editingSlot.remainingQuantity)
    : 0;

  const ui = isVi
    ? {
        title: 'Lịch dịch vụ & Sức chứa',
        subtitle:
          'Công bố khung giờ phục vụ, theo dõi số suất đã xác nhận và điều chỉnh sức chứa theo ngày.',
        rangeLabel: 'Xem lịch 30 ngày từ',
        loadingServices: 'Đang tải danh mục…',
        noServicesTitle: 'Chưa có dịch vụ liên kết',
        noServicesBody: 'Chưa có dịch vụ liên kết với tài khoản.',
        savedMsg: 'Đã lưu lịch.',
        kpiOpenLabel: 'Khung giờ đang mở bán',
        kpiOpenSub: (total: number) => `Trong ${total} khung giờ đã công bố`,
        kpiCapLabel: 'Tổng sức chứa còn trống',
        kpiCapUnit: 'suất',
        kpiCapSub: (pct: number) => `Tỷ lệ lấp đầy hiện tại ${pct}%`,
        kpiLowLabel: 'Khung giờ sắp đầy / đã đóng',
        kpiLowSub: 'Còn ≤ 1 suất hoặc đang đóng',
        listHeading: 'Danh sách khung giờ đã công bố',
        tzBadge: 'Giờ Việt Nam (GMT+7)',
        loadingSlots: 'Đang tải lịch…',
        emptySlotsTitle: 'Chưa có khung giờ nào được công bố',
        emptySlotsBody:
          'Sử dụng biểu mẫu bên cạnh để công bố khung giờ và số lượng tiếp nhận cho dịch vụ này.',
        colDateTime: 'Ngày giờ',
        colOccupancy: 'Mức lấp đầy sức chứa',
        colRemaining: 'Còn lại',
        colStatus: 'Trạng thái',
        colEdit: 'Điều chỉnh',
        bookedLabel: (booked: number, total: number) => `Đã đặt ${booked} / ${total}`,
        closedMeta: 'Đã đóng mở bán',
        statusAvailable: 'Còn chỗ',
        statusLow: 'Sắp đầy',
        statusFull: 'Hết chỗ',
        statusClosed: 'Đã đóng',
        btnEdit: 'Sửa',
        btnEditing: 'Đang sửa',
        btnReopen: 'Mở lại',
        formHeading: 'Công bố / Cập nhật khung giờ',
        fieldService: 'Dịch vụ',
        fieldStart: 'Ngày giờ (Việt Nam)',
        fieldQuantity: 'Số lượng',
        quantityHint: 'Nhập 0 để đóng khung giờ chưa có yêu cầu xác nhận.',
        bookedProtection: (booked: number) =>
          `Khung giờ này đã có ${booked} yêu cầu được xác nhận. Số lượng mới không thể thấp hơn ${booked}.`,
        presetClose: '0 (Đóng)',
        presetUnit: 'suất',
        submitBtn: 'Công bố lịch',
        savingBtn: 'Đang lưu…',
        decreaseAria: 'Giảm số lượng',
        increaseAria: 'Tăng số lượng',
      }
    : {
        title: 'Service Availability & Capacity',
        subtitle:
          'Publish available time slots, monitor confirmed bookings, and adjust daily capacity.',
        rangeLabel: 'View 30 days from',
        loadingServices: 'Loading linked services…',
        noServicesTitle: 'No Linked Services',
        noServicesBody: 'No commercial service is linked to this provider account yet.',
        savedMsg: 'Availability saved.',
        kpiOpenLabel: 'Open Time Slots',
        kpiOpenSub: (total: number) => `Across ${total} published slot(s)`,
        kpiCapLabel: 'Remaining Capacity',
        kpiCapUnit: 'slots',
        kpiCapSub: (pct: number) => `Current occupancy ${pct}%`,
        kpiLowLabel: 'Low Capacity / Closed',
        kpiLowSub: '1 or fewer remaining, or closed',
        listHeading: 'Published Availability Slots',
        tzBadge: 'Vietnam Time (GMT+7)',
        loadingSlots: 'Loading availability…',
        emptySlotsTitle: 'No Published Slots Yet',
        emptySlotsBody:
          'Use the editor panel to publish service time slots and available capacity.',
        colDateTime: 'Date & Time',
        colOccupancy: 'Capacity Occupancy',
        colRemaining: 'Remaining',
        colStatus: 'Status',
        colEdit: 'Adjust',
        bookedLabel: (booked: number, total: number) => `Booked ${booked} / ${total}`,
        closedMeta: 'Slot closed',
        statusAvailable: 'Available',
        statusLow: 'Almost Full',
        statusFull: 'Full',
        statusClosed: 'Closed',
        btnEdit: 'Edit',
        btnEditing: 'Editing',
        btnReopen: 'Reopen',
        formHeading: 'Publish / Update Slot',
        fieldService: 'Service',
        fieldStart: 'Date & Time (Vietnam)',
        fieldQuantity: 'Quantity',
        quantityHint: 'Enter 0 to close a slot that has no confirmed requests.',
        bookedProtection: (booked: number) =>
          `This slot already has ${booked} confirmed booking(s). New capacity cannot be below ${booked}.`,
        presetClose: '0 (Close)',
        presetUnit: 'units',
        submitBtn: 'Publish Availability',
        savingBtn: 'Saving…',
        decreaseAria: 'Decrease quantity',
        increaseAria: 'Increase quantity',
      };

  return (
    <section className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1C2928]">{ui.title}</h1>
          <p className="mt-1 text-[13px] text-[#5B6E69]">{ui.subtitle}</p>
        </div>

        {!!services?.length && (
          <div className="flex flex-wrap items-center gap-2.5">
            {activeServiceName && (
              <span className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#DCE2DD] bg-white px-3.5 text-xs font-bold text-[#1C2928] shadow-2xs">
                <span className="material-symbols-outlined text-[16px] text-[#174B4A]" aria-hidden="true">
                  storefront
                </span>
                <span className="max-w-[220px] truncate">{activeServiceName}</span>
              </span>
            )}
            <label className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#DCE2DD] bg-white px-3 text-xs font-semibold text-[#5B6E69] shadow-2xs">
              <span className="whitespace-nowrap">{ui.rangeLabel}</span>
              <input
                type="date"
                value={rangeDate}
                disabled={busy}
                onChange={(event) => selectDate(event.target.value)}
                className="bg-transparent font-bold text-[#1C2928] focus:outline-none"
              />
            </label>
          </div>
        )}
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-xl border border-[#FECDD3] bg-[#FDECEF] px-4 py-3 text-xs font-semibold text-[#991B1B]"
        >
          <span className="material-symbols-outlined shrink-0 text-[18px]" aria-hidden="true">
            error
          </span>
          <span>{error}</span>
        </div>
      )}

      {saved && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-xl border border-[#A7F3D0] bg-[#E6F7F0] px-4 py-3 text-xs font-semibold text-[#065F46]"
        >
          <span className="material-symbols-outlined shrink-0 text-[18px]" aria-hidden="true">
            check_circle
          </span>
          <span>{ui.savedMsg}</span>
        </div>
      )}

      {/* Initial Loading / Empty Services */}
      {!services && !error && (
        <div
          role="status"
          className="rounded-2xl border border-[#DCE2DD] bg-white p-14 text-center text-xs text-[#5B6E69] shadow-xs"
        >
          <span className="material-symbols-outlined mx-auto mb-2 block animate-spin text-[28px] text-[#174B4A]">
            progress_activity
          </span>
          {ui.loadingServices}
        </div>
      )}

      {services?.length === 0 && (
        <div className="rounded-2xl border border-[#DCE2DD] bg-white p-14 text-center shadow-xs">
          <span className="material-symbols-outlined mx-auto mb-2 block text-[36px] text-[#8E9E9B]">
            event_busy
          </span>
          <h2 className="text-sm font-bold text-[#1C2928]">{ui.noServicesTitle}</h2>
          <p className="mt-1 text-xs text-[#5B6E69]">{ui.noServicesBody}</p>
        </div>
      )}

      {!!services?.length && (
        <>
          {/* 3 Truthful Capacity KPI Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
            <div className="relative overflow-hidden rounded-2xl border border-[#DCE2DD] bg-white p-4 shadow-[inset_3.5px_0_0_#174B4A,0_1px_2px_rgba(28,41,40,0.03)]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#5B6E69]">{ui.kpiOpenLabel}</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8F0EA] text-[#174B4A]">
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                    calendar_month
                  </span>
                </span>
              </div>
              <p className="mt-2 text-2xl font-extrabold tabular-nums text-[#1C2928]">
                {stats.openSlots}
              </p>
              <p className="mt-1 text-[11px] font-medium text-[#5B6E69]">
                {ui.kpiOpenSub(slots.length)}
              </p>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-[#DCE2DD] bg-white p-4 shadow-[inset_3.5px_0_0_#0E9F6E,0_1px_2px_rgba(28,41,40,0.03)]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#5B6E69]">{ui.kpiCapLabel}</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E6F7F0] text-[#0E9F6E]">
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                    event_available
                  </span>
                </span>
              </div>
              <p className="mt-2 text-2xl font-extrabold tabular-nums text-[#1C2928]">
                {stats.totalRemaining}{' '}
                <span className="text-sm font-semibold text-[#5B6E69]">
                  / {stats.totalCapacity} {ui.kpiCapUnit}
                </span>
              </p>
              <p className="mt-1 text-[11px] font-medium text-[#5B6E69]">
                {ui.kpiCapSub(stats.occupancyPct)}
              </p>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-[#DCE2DD] bg-white p-4 shadow-[inset_3.5px_0_0_#B96D4C,0_1px_2px_rgba(28,41,40,0.03)]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#5B6E69]">{ui.kpiLowLabel}</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FCECE5] text-[#995436]">
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                    warning
                  </span>
                </span>
              </div>
              <p className="mt-2 text-2xl font-extrabold tabular-nums text-[#1C2928]">
                {stats.lowOrClosed}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#995436]">{ui.kpiLowSub}</p>
            </div>
          </div>

          {/* 2-Column Master List & Slot Publisher */}
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
            {/* Left: Published Slots Table with Occupancy Bars (7 cols) */}
            <div className="overflow-hidden rounded-2xl border border-[#DCE2DD] bg-white shadow-xs lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8ECE9] px-5 py-4">
                <h2 className="flex items-center gap-2 text-sm font-extrabold text-[#1C2928]">
                  <span className="material-symbols-outlined text-[19px] text-[#174B4A]" aria-hidden="true">
                    calendar_month
                  </span>
                  <span>{ui.listHeading}</span>
                </h2>
                <span className="text-[11.5px] font-semibold text-[#5B6E69]">{ui.tzBadge}</span>
              </div>

              {reading ? (
                <div role="status" className="p-14 text-center text-xs text-[#5B6E69]">
                  <span className="material-symbols-outlined mx-auto mb-2 block animate-spin text-[28px] text-[#174B4A]">
                    progress_activity
                  </span>
                  {ui.loadingSlots}
                </div>
              ) : slots.length === 0 ? (
                <div className="p-14 text-center text-xs text-[#5B6E69]">
                  <span className="material-symbols-outlined mx-auto mb-2 block text-[36px] text-[#8E9E9B]">
                    calendar_add_on
                  </span>
                  <h3 className="text-sm font-bold text-[#1C2928]">{ui.emptySlotsTitle}</h3>
                  <p className="mx-auto mt-1 max-w-sm text-[#5B6E69]">{ui.emptySlotsBody}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#DCE2DD] bg-[#F7F5EF] text-[10.5px] font-bold uppercase tracking-wider text-[#5B6E69]">
                        <th scope="col" className="px-4 py-3 whitespace-nowrap">
                          {ui.colDateTime}
                        </th>
                        <th scope="col" className="px-4 py-3 whitespace-nowrap">
                          {ui.colOccupancy}
                        </th>
                        <th scope="col" className="px-3 py-3 text-center whitespace-nowrap">
                          {ui.colRemaining}
                        </th>
                        <th scope="col" className="px-3 py-3 whitespace-nowrap">
                          {ui.colStatus}
                        </th>
                        <th scope="col" className="px-4 py-3 text-right whitespace-nowrap">
                          {ui.colEdit}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDF1EE] text-[#1C2928]">
                      {slots.map((slot) => {
                        const booked = Math.max(0, slot.quantity - slot.remainingQuantity);
                        const pct =
                          slot.quantity > 0 ? Math.min(100, Math.round((booked / slot.quantity) * 100)) : 0;
                        const isClosed = slot.quantity === 0;
                        const isFull = !isClosed && slot.remainingQuantity <= 0;
                        const isLow = !isClosed && !isFull && (pct >= 80 || slot.remainingQuantity === 1);
                        const isEditing =
                          editingSlotIso !== null &&
                          Date.parse(editingSlotIso) === Date.parse(slot.startsAt);
                        const formatted = formatVietnamDateTime(slot.startsAt, locale);

                        const barColor = isClosed
                          ? 'bg-[#94A3B8]'
                          : isFull
                          ? 'bg-[#E02D4D]'
                          : isLow
                          ? 'bg-[#D97706]'
                          : 'bg-[#174B4A]';

                        const badgeClass = isClosed
                          ? 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]'
                          : isFull
                          ? 'bg-[#FDECEF] text-[#9F1239] border-[#FECDD3]'
                          : isLow
                          ? 'bg-[#FEF3E2] text-[#92400E] border-[#FDE68A]'
                          : 'bg-[#E6F7F0] text-[#065F46] border-[#A7F3D0]';

                        const statusLabel = isClosed
                          ? ui.statusClosed
                          : isFull
                          ? ui.statusFull
                          : isLow
                          ? ui.statusLow
                          : ui.statusAvailable;

                        return (
                          <tr
                            key={slot.startsAt}
                            className={`transition-colors ${
                              isEditing
                                ? 'bg-[#EDF5F1] shadow-[inset_3.5px_0_0_#174B4A]'
                                : 'hover:bg-[#F7F5EF]/70'
                            }`}
                          >
                            <td className="whitespace-nowrap px-4 py-3.5">
                              <div
                                className={`font-bold tabular-nums ${
                                  isClosed ? 'text-[#5B6E69]' : 'text-[#1C2928]'
                                }`}
                              >
                                {formatted.date}
                              </div>
                              <div className="mt-0.5 font-mono text-[11px] text-[#5B6E69]">
                                {formatted.time}
                              </div>
                            </td>

                            <td className="px-4 py-3.5">
                              <div className="min-w-[140px] space-y-1.5">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-medium text-[#5B6E69]">
                                    {isClosed ? ui.closedMeta : ui.bookedLabel(booked, slot.quantity)}
                                  </span>
                                  <span className="font-mono font-bold text-[#1C2928]">
                                    {isClosed ? '0/0' : `${pct}%`}
                                  </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-[#E8ECE9]">
                                  <div
                                    className={`h-full rounded-full transition-all ${barColor}`}
                                    style={{ width: `${isClosed ? 0 : Math.max(pct, booked > 0 ? 6 : 0)}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="whitespace-nowrap px-3 py-3.5 text-center">
                              <span
                                className={`font-mono text-sm font-extrabold ${
                                  isClosed
                                    ? 'text-[#64748B]'
                                    : isFull
                                    ? 'text-[#B91C1C]'
                                    : isLow
                                    ? 'text-[#995436]'
                                    : 'text-[#065F46]'
                                }`}
                              >
                                {slot.remainingQuantity}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-3 py-3.5">
                              <span
                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badgeClass}`}
                              >
                                {statusLabel}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-4 py-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleSelectSlotForEdit(slot)}
                                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11.5px] font-bold transition cursor-pointer ${
                                  isEditing
                                    ? 'border-[#CCE0D3] bg-[#E8F0EA] text-[#174B4A]'
                                    : 'border-[#DCE2DD] bg-white text-[#1C2928] hover:border-[#174B4A] hover:text-[#174B4A]'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                                  edit
                                </span>
                                <span>
                                  {isEditing ? ui.btnEditing : isClosed ? ui.btnReopen : ui.btnEdit}
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

            {/* Right: Publish / Update Slot Panel (5 cols) */}
            <div className="rounded-2xl border-2 border-[#C8D6CE] bg-white p-5 sm:p-6 shadow-xs lg:sticky lg:top-22 lg:col-span-5">
              <h2 className="mb-4 flex items-center gap-2 border-b border-[#EDF1EE] pb-3 text-sm font-extrabold text-[#1C2928]">
                <span className="material-symbols-outlined text-[19px] text-[#174B4A]" aria-hidden="true">
                  add_circle
                </span>
                <span>{ui.formHeading}</span>
              </h2>

              <form onSubmit={publish} className="space-y-4">
                <div>
                  <label
                    htmlFor="provider-avail-service"
                    className="mb-1 block text-xs font-bold text-[#1C2928]"
                  >
                    {ui.fieldService}
                  </label>
                  <select
                    id="provider-avail-service"
                    className="block min-h-11 w-full rounded-xl border border-[#D5DDD8] bg-white px-3 text-xs font-semibold text-[#1C2928] transition focus:border-[#174B4A] focus:outline-none focus:ring-2 focus:ring-[#174B4A]/20"
                    value={selected}
                    disabled={busy}
                    onChange={(event) => {
                      setSelected(event.target.value);
                      setSlots([]);
                      setEditingSlotIso(null);
                      setReading(true);
                      setError('');
                      setSaved(false);
                    }}
                  >
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="provider-avail-start"
                    className="mb-1 block text-xs font-bold text-[#1C2928]"
                  >
                    {ui.fieldStart}
                  </label>
                  <input
                    id="provider-avail-start"
                    type="datetime-local"
                    required
                    value={start}
                    onChange={(event) => {
                      setStart(event.target.value);
                      setEditingSlotIso(null);
                    }}
                    className="block min-h-11 w-full rounded-xl border border-[#D5DDD8] bg-white px-3 font-mono text-xs font-semibold text-[#1C2928] transition focus:border-[#174B4A] focus:outline-none focus:ring-2 focus:ring-[#174B4A]/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="provider-avail-quantity"
                    className="mb-1 block text-xs font-bold text-[#1C2928]"
                  >
                    {ui.fieldQuantity}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => stepQuantity(-1)}
                      aria-label={ui.decreaseAria}
                      className="flex min-h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#D5DDD8] bg-white text-base font-bold text-[#1C2928] transition hover:bg-[#F7F5EF] disabled:opacity-50 cursor-pointer"
                    >
                      −
                    </button>
                    <input
                      id="provider-avail-quantity"
                      type="number"
                      required
                      min="0"
                      step="1"
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                      className="block min-h-11 w-full rounded-xl border border-[#D5DDD8] bg-white px-3 text-center font-mono text-sm font-extrabold text-[#1C2928] transition focus:border-[#174B4A] focus:outline-none focus:ring-2 focus:ring-[#174B4A]/20"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => stepQuantity(1)}
                      aria-label={ui.increaseAria}
                      className="flex min-h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#D5DDD8] bg-white text-base font-bold text-[#1C2928] transition hover:bg-[#F7F5EF] disabled:opacity-50 cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Quick Capacity Preset Chips */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[0, 2, 5, 10].map((preset) => {
                      const active = quantity === String(preset);
                      return (
                        <button
                          key={preset}
                          type="button"
                          disabled={busy}
                          onClick={() => setQuantity(String(preset))}
                          className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                            active
                              ? 'border-[#B7D2C0] bg-[#E8F0EA] text-[#174B4A]'
                              : 'border-[#DCE2DD] bg-[#F7F5EF] text-[#5B6E69] hover:border-[#174B4A] hover:text-[#1C2928]'
                          }`}
                        >
                          {preset === 0 ? ui.presetClose : `${preset} ${ui.presetUnit}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] px-3.5 py-3 text-[11.5px] leading-relaxed text-[#536661]">
                  <p>{ui.quantityHint}</p>
                  {editingBookedCount > 0 && (
                    <p className="mt-1.5 font-semibold text-[#995436]">
                      {ui.bookedProtection(editingBookedCount)}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={busy || reading || !selected}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#174B4A] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#103B39] disabled:opacity-50 cursor-pointer"
                >
                  {busy && (
                    <span className="material-symbols-outlined animate-spin text-[16px]">
                      progress_activity
                    </span>
                  )}
                  <span>{busy ? ui.savingBtn : ui.submitBtn}</span>
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
