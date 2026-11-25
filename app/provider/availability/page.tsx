'use client';

import { useEffect, useState, type FormEvent } from 'react';

type Service = { id: number; name: string };
type Slot = { startsAt: string; quantity: number; remainingQuantity: number };
const endpoint = '/api/provider/commercial-services';
const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh',
});

async function load<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...init });
  if (!response.ok) {
    if (response.status === 409) throw new Error('Số lượng mới thấp hơn số yêu cầu đã xác nhận.');
    if (response.status === 400) throw new Error('Kiểm tra thời gian và sức chứa của dịch vụ.');
    throw new Error('Không thể tải hoặc lưu lịch. Vui lòng thử lại.');
  }
  return response.json() as Promise<T>;
}

export default function ProviderAvailabilityPage() {
  const [services, setServices] = useState<Service[] | null>(null);
  const [selected, setSelected] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [start, setStart] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [range, setRange] = useState('');

  function selectDate(date: string) {
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
    void load<Service[]>(endpoint, { signal: controller.signal })
      .then(items => {
        if (!controller.signal.aborted) {
          setServices(items);
          setReading(items.length > 0);
          setSelected(items[0] ? String(items[0].id) : '');
        }
      })
      .catch((failure: Error) => { if (!controller.signal.aborted) setError(failure.message); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    void load<Slot[]>(endpoint + '/' + selected + '/availability' + range, { signal: controller.signal })
      .then(items => { if (!controller.signal.aborted) setSlots(items); })
      .catch((failure: Error) => { if (!controller.signal.aborted) setError(failure.message); })
      .finally(() => { if (!controller.signal.aborted) setReading(false); });
    return () => controller.abort();
  }, [selected, range]);

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setSaved(false);
    setError('');
    const path = endpoint + '/' + selected + '/availability';
    try {
      const stamp = new Date(start + ':00+07:00').toISOString();
      const slot = await load<Slot>(path + '/' + encodeURIComponent(stamp), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: Number(quantity) }),
      });
      setSlots(current => [...current.filter(item => Date.parse(item.startsAt) !== Date.parse(slot.startsAt)), slot]
        .sort((first, second) => Date.parse(first.startsAt) - Date.parse(second.startsAt)));
      setSaved(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Không thể lưu lịch.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Lịch nhận yêu cầu đặt dịch vụ</h1>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {saved && <p role="status" className="text-sm text-primary">Đã lưu lịch.</p>}
      {!services && !error && <p role="status">Đang tải danh mục…</p>}
      {services?.length === 0 && <p>Chưa có dịch vụ liên kết với tài khoản.</p>}
      {!!services?.length && (
        <>
          <form onSubmit={publish} className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-semibold sm:col-span-2">
              Dịch vụ
              <select className="block min-h-11 w-full rounded-lg border border-border px-3" value={selected} disabled={busy}
                onChange={event => {
                  setSelected(event.target.value);
                  setSlots([]);
                  setReading(true);
                  setError('');
                  setSaved(false);
                }}>
                {services.map(service => <option key={service.id} value={service.id}>{service.name}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-sm font-semibold">
              Ngày giờ (Việt Nam)
              <input type="datetime-local" required value={start} onChange={event => setStart(event.target.value)}
                className="block min-h-11 w-full rounded-lg border border-border px-3" />
            </label>
            <label className="space-y-1 text-sm font-semibold">
              Số lượng
              <input type="number" required min="0" step="1" value={quantity} onChange={event => setQuantity(event.target.value)}
                className="block min-h-11 w-full rounded-lg border border-border px-3" />
              <span className="block font-normal text-text-secondary">Nhập 0 để đóng khung giờ chưa có yêu cầu xác nhận.</span>
            </label>
            <button type="submit" disabled={busy || reading || !selected}
              className="min-h-11 rounded-lg bg-primary px-4 font-semibold text-white disabled:opacity-50">
              {busy ? 'Đang lưu…' : 'Công bố lịch'}
            </button>
          </form>
          <label className="block space-y-1 text-sm font-semibold">
            Xem lịch 30 ngày từ
            <input type="date" disabled={busy} onChange={event => selectDate(event.target.value)}
              className="block min-h-11 rounded-lg border border-border px-3" />
          </label>
          {reading && <p role="status">Đang tải lịch…</p>}
          {slots.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead><tr><th scope="col">Ngày giờ</th><th scope="col">Công bố</th><th scope="col">Còn lại</th></tr></thead>
              <tbody>{slots.map(slot => (
                <tr key={slot.startsAt} className="border-b border-border">
                  <td className="py-3">{dateFormat.format(new Date(slot.startsAt))}</td>
                  <td>{slot.quantity}</td><td>{slot.remainingQuantity}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </>
      )}
    </section>
  );
}
