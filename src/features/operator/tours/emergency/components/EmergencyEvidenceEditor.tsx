'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type {
  AddEmergencyTourEvidenceRequest,
  AddEmergencyTourEvidenceResponse,
  EmergencyTourEvidenceResponse,
} from '../types';
import {
  addEmergencyEvidence,
  getEmergencyEvidence,
  OperatorEmergencyApiError,
} from '../operatorEmergencyApi';
import { AUTHORITY_REFERENCE_MAX_LENGTH, isValidHttpsUrl } from '../evidenceFields';

interface EmergencyEvidenceEditorProps {
  tourId: number;
  scheduleId: number;
  onSuccess: (res: AddEmergencyTourEvidenceResponse) => void;
  className?: string;
}

export function EmergencyEvidenceEditor({
  tourId,
  scheduleId,
  onSuccess,
  className = '',
}: EmergencyEvidenceEditorProps) {
  const [current, setCurrent] = useState<EmergencyTourEvidenceResponse | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [authorityReference, setAuthorityReference] = useState('');
  const [evidenceReference, setEvidenceReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noOperation, setNoOperation] = useState(false);

  // A save replaces the whole evidence set, so nothing is sent before it has been read.
  const showLatest = useCallback((latest: EmergencyTourEvidenceResponse) => {
    setCurrent(latest);
    setEvidenceUrl(latest.evidenceUrl ?? '');
    setAuthorityReference(latest.authorityReference ?? '');
    setEvidenceReference(latest.evidenceReference ?? '');
  }, []);

  const showLoadFailure = useCallback(() => {
    setCurrent(null);
    setError('Không thể tải bằng chứng hiện tại. Vui lòng thử lại trước khi chỉnh sửa.');
  }, []);

  useEffect(() => {
    let active = true;
    getEmergencyEvidence(tourId, scheduleId)
      .then((latest) => {
        if (active) showLatest(latest);
      })
      .catch((err: unknown) => {
        if (!active) return;
        // A departure cancelled outside UC-70 has no operation to attach evidence to.
        if (err instanceof OperatorEmergencyApiError && err.status === 404) setNoOperation(true);
        else showLoadFailure();
      });
    return () => {
      active = false;
    };
  }, [tourId, scheduleId, showLatest, showLoadFailure]);

  const loadCurrent = async () => {
    try {
      showLatest(await getEmergencyEvidence(tourId, scheduleId));
    } catch {
      showLoadFailure();
    }
  };

  const hasExistingEvidence =
    Boolean(current?.evidenceUrl) ||
    Boolean(current?.authorityReference) ||
    Boolean(current?.evidenceReference);

  const failWith = async (err: unknown, fallback: string) => {
    if (err instanceof OperatorEmergencyApiError && err.status === 409) {
      await loadCurrent();
      setError('Bằng chứng vừa được thay đổi. Vui lòng xem lại nội dung mới nhất trước khi lưu.');
      return;
    }
    setError(err instanceof Error ? err.message : fallback);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current) return;
    setError(null);

    const trimmedUrl = evidenceUrl.trim();
    const trimmedAuth = authorityReference.trim();
    const trimmedRef = evidenceReference.trim();

    if (!trimmedUrl && !trimmedAuth && !trimmedRef) {
      setError('Vui lòng nhập ít nhất một thông tin: Liên kết URL, Cơ quan ban hành, hoặc Mã số công điện.');
      return;
    }

    if (trimmedUrl) {
      if (!isValidHttpsUrl(trimmedUrl)) {
        setError('Liên kết bằng chứng bắt buộc phải là HTTPS hợp lệ và không chứa thông tin đăng nhập.');
        return;
      }
      if (trimmedUrl.length > 1000) {
        setError('Độ dài liên kết URL tối đa 1000 ký tự.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: AddEmergencyTourEvidenceRequest = {
        evidenceUrl: trimmedUrl || null,
        authorityReference: trimmedAuth || null,
        evidenceReference: trimmedRef || null,
        expectedVersion: current.evidenceVersion,
      };
      const result = await addEmergencyEvidence(tourId, scheduleId, payload);
      await loadCurrent();
      onSuccess(result);
    } catch (err: unknown) {
      await failWith(err, 'Lỗi khi cập nhật bằng chứng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!current) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await addEmergencyEvidence(tourId, scheduleId, {
        withdrawEvidence: true,
        expectedVersion: current.evidenceVersion,
      });
      await loadCurrent();
      onSuccess(result);
    } catch (err: unknown) {
      await failWith(err, 'Lỗi khi rút lại bằng chứng');
    } finally {
      setSubmitting(false);
    }
  };

  if (noOperation) return null;

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-teal-700 text-lg" aria-hidden="true">
              description
            </span>
            Hồ sơ bằng chứng vận hành khẩn cấp
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Cung cấp công điện khẩn, chỉ thị cấm đường/cấm biển làm căn cứ pháp lý cho thao tác.
          </p>
        </div>
        {hasExistingEvidence && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
              badge
            </span>
            Đơn vị điều hành cung cấp
          </span>
        )}
      </div>

      {current?.evidenceAddedLater && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs font-medium text-amber-900">
          Quyết định này được đánh dấu bổ sung bằng chứng sau. Hãy thêm hoặc xác nhận bên dưới.
        </p>
      )}

      {hasExistingEvidence && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Bằng chứng hiện tại đã lưu:</span>
            <span className="text-[11px] text-slate-400">Nguồn: Đối tác khai báo</span>
          </div>
          {current?.evidenceUrl && (
            <div>
              <span className="text-slate-500">Liên kết: </span>
              <a
                href={current.evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-700 font-medium underline break-all"
              >
                {current.evidenceUrl}
              </a>
            </div>
          )}
          {current?.authorityReference && (
            <div>
              <span className="text-slate-500">Cơ quan: </span>
              <span className="text-slate-800 font-medium">{current.authorityReference}</span>
            </div>
          )}
          {current?.evidenceReference && (
            <div>
              <span className="text-slate-500">Mã văn bản: </span>
              <span className="text-slate-800 font-medium">{current.evidenceReference}</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 p-2.5 text-xs font-semibold text-rose-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-3 text-xs">
        <div>
          <label htmlFor="evidence-url" className="block font-semibold text-slate-700 mb-1">
            Liên kết văn bản (Bắt buộc HTTPS)
          </label>
          <input
            id="evidence-url"
            type="url"
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            disabled={submitting}
            placeholder="https://..."
            maxLength={1000}
            className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-teal-600 focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="authority-ref" className="block font-semibold text-slate-700 mb-1">
              Cơ quan ban hành chỉ thị
            </label>
            <input
              id="authority-ref"
              type="text"
              value={authorityReference}
              onChange={(e) => setAuthorityReference(e.target.value)}
              disabled={submitting}
              placeholder="Ví dụ: UBND TP Đà Nẵng, Cảng vụ Hàng hải..."
              maxLength={AUTHORITY_REFERENCE_MAX_LENGTH}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-teal-600 focus:outline-hidden"
            />
            <div className="mt-0.5 text-right text-[11px] text-slate-500">
              {authorityReference.length} / {AUTHORITY_REFERENCE_MAX_LENGTH}
            </div>
          </div>

          <div>
            <label htmlFor="evidence-ref" className="block font-semibold text-slate-700 mb-1">
              Mã hiệu công điện / văn bản
            </label>
            <input
              id="evidence-ref"
              type="text"
              value={evidenceReference}
              onChange={(e) => setEvidenceReference(e.target.value)}
              disabled={submitting}
              placeholder="Ví dụ: Công điện số 08/CĐ-PCTT..."
              maxLength={500}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-teal-600 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          {hasExistingEvidence ? (
            <button
              type="button"
              onClick={handleWithdraw}
              disabled={submitting || !current}
              className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition disabled:opacity-50"
            >
              Rút lại bằng chứng
            </button>
          ) : (
            <div />
          )}

          <button
            type="submit"
            disabled={submitting || !current}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-teal-800 disabled:opacity-50 transition"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined text-[15px] animate-spin" aria-hidden="true">
                  progress_activity
                </span>
                <span>Đang lưu...</span>
              </>
            ) : (
              <span>Lưu bằng chứng</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
