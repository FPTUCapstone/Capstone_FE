'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ROUTES } from '@/lib/routes';

type Checklist = {
  license: boolean;
  safety: boolean;
  cspRoute: boolean;
  pricing: boolean;
};

const initialChecklist: Checklist = {
  license: true,
  safety: true,
  cspRoute: true,
  pricing: true,
};

export function TourReviewDecisionPanel() {
  const router = useRouter();
  const [checklist, setChecklist] = useState(initialChecklist);
  const [notes, setNotes] = useState(
    'Lộ trình tối ưu tốt. Cần lưu ý đơn vị điều phối bãi giữ xe đạp ngoài khu vực Tạ Hiện vào tối cuối tuần.',
  );
  const [decision, setDecision] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const toggleCheck = (key: keyof Checklist) => {
    setChecklist((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleDecision = (nextDecision: 'approved' | 'rejected') => {
    setDecision(nextDecision);
    window.setTimeout(() => router.push(ROUTES.admin.tourReviews), 1200);
  };

  return (
    <div className="bg-white border border-[#c3c6ce] rounded-2xl p-5 shadow-xs">
      {decision !== 'pending' && (
        <div
          className={`mb-4 rounded-xl border p-3 text-center text-xs font-bold animate-fade-in ${
            decision === 'approved'
              ? 'border-[#006b5f] bg-[#6df5e1] text-[#005048]'
              : 'border-[#ba1a1a] bg-[#ffdad6] text-[#93000a]'
          }`}
        >
          {decision === 'approved'
            ? 'Tour đã được duyệt trong UI prototype.'
            : 'Tour đã được đánh dấu cần chỉnh sửa trong UI prototype.'}
        </div>
      )}

      <h3 className="text-sm font-bold text-[#00152a] uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[#006b5f]">checklist</span>
        Checklist Kiểm Duyệt
      </h3>

      <div className="space-y-3">
        {[
          ['license', 'Giấy phép lữ hành & chứng chỉ HDV hợp lệ'],
          ['safety', 'Phương án an toàn & bảo hiểm cho khách đạp xe'],
          ['cspRoute', 'Lộ trình thông qua kiểm tra xung đột CSP'],
          ['pricing', 'Giá niêm yết phù hợp quy chuẩn thị trường'],
        ].map(([key, label]) => (
          <label key={key} className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={checklist[key as keyof Checklist]}
              onChange={() => toggleCheck(key as keyof Checklist)}
              className="mt-0.5 h-4 w-4 rounded text-[#006b5f] focus:ring-0"
            />
            <span className="text-xs font-medium leading-tight text-[#191c1e]">{label}</span>
          </label>
        ))}
      </div>

      <div className="mt-5">
        <label htmlFor="moderator-notes" className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#74777e]">
          Ghi chú của kiểm duyệt viên
        </label>
        <textarea
          id="moderator-notes"
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="w-full rounded-xl border border-[#c3c6ce] bg-[#f7f9fc] p-3 text-xs outline-none focus:border-[#006b5f]"
        />
      </div>

      <div className="mt-6 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => handleDecision('approved')}
          disabled={decision !== 'pending'}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#006b5f] py-3 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#005048] disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-base">check_circle</span>
          Duyệt và Xuất bản Tour
        </button>
        <button
          type="button"
          onClick={() => handleDecision('rejected')}
          disabled={decision !== 'pending'}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#c3c6ce] bg-[#eceef1] py-3 text-xs font-bold text-[#ba1a1a] transition-colors hover:bg-[#ffdad6] disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-base">close</span>
          Từ chối & Yêu cầu chỉnh sửa
        </button>
      </div>
    </div>
  );
}
