'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { stayRequest } from './stayApi';

interface Claim {
  id: number;
  facilityName: string;
  applicant: string;
  email: string;
  evidence: string;
  status: string;
  reviewNote: string | null;
}

const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#174B4A] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#103B39] disabled:cursor-not-allowed disabled:opacity-50';
const FIELD_CLASS =
  'mt-1.5 block w-full rounded-xl border border-[#BFC9C3] bg-white px-3.5 py-2.5 text-sm text-[#1C2928] focus:border-[#174B4A] focus:outline-none focus:ring-3 focus:ring-[#174B4A]/10';

export function ClaimStay({ poiId }: { poiId: number }) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);
    const data = new FormData(event.currentTarget);
    try {
      const result = await stayRequest<Claim>('/stays/ownership-claims', {
        method: 'POST',
        body: JSON.stringify({ poiId, evidence: data.get('evidence') }),
      });
      setFeedback({
        ok: true,
        text: `Đã gửi hồ sơ #${result.id}. Staff TripMate sẽ xác minh thông tin đại diện cơ sở.`,
      });
    } catch (reason) {
      if (reason instanceof Error) setFeedback({ ok: false, text: reason.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="rounded-2xl border border-[#DCE2DD] bg-white p-5 shadow-[0_4px_20px_-2px_rgba(0,21,42,0.04)]">
      <summary className="flex cursor-pointer items-center justify-between gap-2 text-sm font-bold text-[#174B4A]">
        <span className="inline-flex items-center gap-2">
          <span className="material-symbols-outlined text-[19px]" aria-hidden="true">
            verified_user
          </span>
          Bạn là đại diện cơ sở? Đề nghị quản lý khách sạn này
        </span>
        <span className="text-xs font-semibold text-[#5B6E69]">Mở biểu mẫu</span>
      </summary>
      <form className="mt-4 space-y-3.5 border-t border-[#EEF1ED] pt-4" onSubmit={submit}>
        <p className="text-xs leading-relaxed text-[#5B6E69]">
          Dùng tài khoản riêng có email công việc đã xác minh. Sau khi Staff duyệt, tài khoản này sẽ chuyển sang vai trò Hotel Operator (ServiceProvider) để quản lý bài và phản hồi yêu cầu lưu trú.
        </p>
        <div>
          <label htmlFor={`claim-evidence-${poiId}`} className="block text-xs font-bold text-[#1C2928]">
            Căn cứ xác minh quyền đại diện <span className="text-[#E02D4D]">*</span>
          </label>
          <textarea
            id={`claim-evidence-${poiId}`}
            className={`${FIELD_CLASS} min-h-[84px]`}
            required
            name="evidence"
            maxLength={1000}
            placeholder="Nhập thông tin giấy phép kinh doanh, số điện thoại lễ tân hoặc tài liệu xác minh..."
          />
        </div>
        {feedback && (
          <div
            role="status"
            className={`rounded-xl border px-3.5 py-2.5 text-xs font-semibold ${
              feedback.ok
                ? 'border-[#A7F3D0] bg-[#E6F7F0] text-[#065F46]'
                : 'border-[#FECDD3] bg-[#FDECEF] text-[#991B1B]'
            }`}
          >
            {feedback.text}
          </div>
        )}
        <button type="submit" className={BTN_PRIMARY} disabled={busy}>
          {busy ? 'Đang gửi…' : 'Gửi hồ sơ xác minh'}
        </button>
      </form>
    </details>
  );
}

export function StaffStayClaims() {
  const [claims, setClaims] = useState<Claim[]>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<number>();

  useEffect(() => {
    const controller = new AbortController();
    stayRequest<Claim[]>('/api/admin/stay-ownership-claims', { signal: controller.signal })
      .then(setClaims)
      .catch((reason: Error) => {
        if (!controller.signal.aborted) setError(reason.message);
      });
    return () => controller.abort();
  }, []);

  async function review(event: FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError('');
    setBusy(id);
    try {
      await stayRequest<Claim>(`/api/admin/stay-ownership-claims/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({
          approved: data.get('decision') === 'approve',
          note: data.get('note'),
        }),
      });
      setClaims((current) => current?.filter((claim) => claim.id !== id));
    } catch (reason) {
      if (reason instanceof Error) setError(reason.message);
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <span className="inline-flex items-center rounded-full border border-[#C2D6CC] bg-[#E8F0EA] px-2.5 py-0.5 text-[11px] font-bold text-[#174B4A]">
          Staff TripMate · Xác minh Hotel Operator
        </span>
        <h1 className="mt-1.5 font-display text-2xl font-bold text-[#1C2928]">
          Duyệt quyền quản lý khách sạn
        </h1>
        <p className="mt-1 text-sm text-[#5B6E69]">
          Xác minh thông tin đại diện cơ sở lưu trú trước khi cấp quyền quản lý bài viết và nhận yêu cầu trên Provider Web.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-[#FECDD3] bg-[#FDECEF] px-4 py-3 text-sm font-semibold text-[#991B1B]"
        >
          {error}
        </div>
      )}

      {!claims && !error && (
        <p role="status" className="py-8 text-center text-sm font-semibold text-[#5B6E69]">
          Đang tải hồ sơ chờ duyệt…
        </p>
      )}

      {claims?.length === 0 && (
        <div className="rounded-2xl border border-[#DCE2DD] bg-white p-10 text-center shadow-[0_4px_20px_-2px_rgba(0,21,42,0.045)]">
          <p className="text-base font-bold text-[#1C2928]">Chưa có hồ sơ chờ duyệt.</p>
          <p className="mt-1 text-xs text-[#5B6E69]">
            Khi đại diện khách sạn gửi yêu cầu quản lý cơ sở, hồ sơ sẽ xuất hiện tại đây.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {claims?.map((claim) => (
          <form
            key={claim.id}
            className="space-y-4 rounded-2xl border border-[#DCE2DD] bg-white p-5 shadow-[0_4px_20px_-2px_rgba(0,21,42,0.045)] sm:p-6"
            onSubmit={(event) => review(event, claim.id)}
          >
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#EEF1ED] pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-[#5B6E69]">Hồ sơ #{claim.id}</span>
                <h2 className="mt-0.5 font-display text-lg font-bold text-[#1C2928]">
                  {claim.facilityName}
                </h2>
              </div>
              <span className="rounded-full border border-[#FDE68A] bg-[#FEF3E2] px-2.5 py-1 text-[11px] font-bold text-[#92400E]">
                Chờ xác minh
              </span>
            </div>

            <div className="rounded-xl border border-[#EEF1ED] bg-[#FBF9F4] p-3.5 text-sm">
              <p className="font-bold text-[#1C2928]">
                {claim.applicant}{' '}
                <span className="font-mono text-xs font-semibold text-[#5B6E69]">· {claim.email}</span>
              </p>
              <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-[#5B6E69]">
                {claim.evidence}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={`decision-${claim.id}`} className="block text-xs font-bold text-[#1C2928]">
                  Kết quả xác minh <span className="text-[#E02D4D]">*</span>
                </label>
                <select id={`decision-${claim.id}`} name="decision" className={FIELD_CLASS} required defaultValue="">
                  <option value="" disabled>
                    Chọn kết quả
                  </option>
                  <option value="approve">Duyệt quyền quản lý</option>
                  <option value="reject">Từ chối</option>
                </select>
              </div>
              <div>
                <label htmlFor={`note-${claim.id}`} className="block text-xs font-bold text-[#1C2928]">
                  Căn cứ xác minh hoặc lý do từ chối <span className="text-[#E02D4D]">*</span>
                </label>
                <textarea
                  id={`note-${claim.id}`}
                  className={`${FIELD_CLASS} min-h-[76px]`}
                  required
                  name="note"
                  maxLength={1000}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className={BTN_PRIMARY} disabled={busy !== undefined}>
                {busy === claim.id ? 'Đang lưu…' : 'Lưu kết quả xác minh'}
              </button>
            </div>
          </form>
        ))}
      </div>
    </main>
  );
}
