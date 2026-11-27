"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import {
  type DirectRefundCase,
  formatDt,
  formatVnd,
  parseDirectRefundCase,
  sourceLabel,
} from "@/features/bookings/types/directRefund";

type ResolveResolution =
  | "Completed"
  | "CorrectionRequired"
  | "MoreEvidenceRequired";

type PageState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; case: DirectRefundCase };

const RESOLUTION_OPTIONS: {
  value: ResolveResolution;
  label: string;
  desc: string;
  color: string;
  activeColor: string;
}[] = [
  {
    value: "Completed",
    label: "Xác nhận đã hoàn tiền",
    desc: "Có đủ căn cứ — giao dịch đúng tài khoản, đúng số tiền",
    color: "border-slate-200 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50",
    activeColor: "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200",
  },
  {
    value: "CorrectionRequired",
    label: "Yêu cầu TO khắc phục",
    desc: "Chuyển lỗi / sai tài khoản / sai số tiền — TO cần xử lý lại",
    color: "border-slate-200 text-slate-700 hover:border-amber-400 hover:bg-amber-50",
    activeColor: "border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-200",
  },
  {
    value: "MoreEvidenceRequired",
    label: "Yêu cầu bổ sung bằng chứng",
    desc: "Chưa đủ căn cứ để kết luận — giữ Disputed, chờ bổ sung",
    color: "border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50",
    activeColor: "border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-200",
  },
];

export function DirectRefundDisputeDetailScreen({ caseId }: { caseId: string }) {
  const [state, setState] = useState<PageState>({ phase: "loading" });
  const [resolution, setResolution] = useState<ResolveResolution>("Completed");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [decisionSaved, setDecisionSaved] = useState(false);

  const load = useCallback(async () => {
    setState({ phase: "loading" });
    try {
      const res = await fetch(
        `/api/v1/admin/direct-refund-disputes/${encodeURIComponent(caseId)}`,
        { cache: "no-store" },
      );
      const payload: unknown = await res.json().catch(() => null);
      if (!res.ok || !payload) {
        setState({
          phase: "error",
          message:
            res.status === 404
              ? "Không tìm thấy hồ sơ tranh chấp."
              : "Không thể tải chi tiết hồ sơ.",
        });
        return;
      }
      const inner =
        payload &&
        typeof payload === "object" &&
        "data" in payload
          ? (payload as { data: unknown }).data
          : payload;
      setState({ phase: "ready", case: parseDirectRefundCase(inner) });
    } catch {
      setState({ phase: "error", message: "Lỗi mạng. Vui lòng thử lại." });
    }
  }, [caseId]);

  useEffect(() => {
    const tid = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(tid);
  }, [load]);

  async function resolve() {
    if (state.phase !== "ready") return;
    if (!reason.trim()) {
      setSubmitError("Lý do quyết định là bắt buộc.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(
        `/api/v1/admin/direct-refund-disputes/${encodeURIComponent(caseId)}/resolve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            resolution,
            reason: reason.trim(),
            expectedVersion: state.case.rowVersion,
          }),
        },
      );
      if (res.status === 409) {
        setSubmitError("Hồ sơ vừa được cập nhật. Đang tải lại…");
        setTimeout(() => void load(), 1500);
        setSubmitting(false);
        return;
      }
      if (!res.ok) {
        const err: unknown = await res.json().catch(() => null);
        const msg =
          err && typeof err === "object" && "title" in err
            ? String((err as { title: unknown }).title)
            : "Không thể ghi kết quả. Vui lòng thử lại.";
        setSubmitError(msg);
        setSubmitting(false);
        return;
      }
      setDecisionSaved(true);
      await load();
      setSubmitting(false);
    } catch {
      setSubmitError("Lỗi mạng. Vui lòng thử lại.");
      setSubmitting(false);
    }
  }

  if (state.phase === "loading")
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-sm text-slate-400">Đang tải hồ sơ tranh chấp…</span>
      </div>
    );

  if (state.phase === "error")
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mb-4 text-3xl">⚠️</div>
        <p className="text-sm font-semibold text-rose-700">{state.message}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 rounded-xl bg-[#174B4A] px-5 py-2 text-sm font-bold text-white hover:bg-[#1C5F5D] transition"
        >
          Thử lại
        </button>
      </div>
    );

  const c = state.case;
  const transfer = c.pendingTransfer;
  const canResolve = c.allowedActions.includes("ResolveDispute");

  const prevDecisionLabel: Record<string, string> = {
    Completed: "Xác nhận đã hoàn tiền",
    CorrectionRequired: "Yêu cầu TO khắc phục",
    MoreEvidenceRequired: "Yêu cầu bổ sung bằng chứng",
  };
  const prevDecisionColor: Record<string, string> = {
    Completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
    CorrectionRequired: "border-amber-200 bg-amber-50 text-amber-800",
    MoreEvidenceRequired: "border-blue-200 bg-blue-50 text-blue-800",
  };

  return (
    <div className="space-y-6 pb-12">
      <Link href="/admin/direct-refund-disputes" className="text-sm font-semibold text-[#174B4A]">← Quay lại danh sách tranh chấp</Link>
      {decisionSaved && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
          <p className="font-semibold">Đã ghi nhận quyết định</p>
          <p className="text-sm">Hồ sơ đã được cập nhật. Bạn có thể xem lại thông tin và bằng chứng bên dưới.</p>
        </div>
      )}
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-[#1C2928]">
              Hồ sơ tranh chấp #{c.caseId}
            </h1>
            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${c.status === 'Completed' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>
              {c.status === 'Completed' ? 'Đã hoàn tất' : c.status === 'AwaitingTravelerConfirmation' ? 'Chờ khách xác nhận' : c.status === 'AwaitingTransfer' ? 'Chờ TO xử lý' : c.status === 'Disputed' ? 'Đang tranh chấp' : 'Chờ thông tin nhận tiền'}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            Mã đặt chỗ:{" "}
            <span className="font-mono font-semibold text-slate-700">{c.bookingCode}</span>
            {" · "}Nguồn: {sourceLabel(c.sourceType)}
            {" · "}Mở: {formatDt(c.createdAtUtc)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Số tiền hoàn
          </p>
          <p className="text-xl font-black text-[#1C2928]">{formatVnd(c.refundAmountVnd)}</p>
        </div>
      </div>

      {/* ── Past admin decision banner ── */}
      {c.disputeResolution && (
        <div
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
            prevDecisionColor[c.disputeResolution] ?? "border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          <span className="material-symbols-outlined mt-0.5 text-[18px]" aria-hidden="true">
            history
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">
              Quyết định trước:{" "}
              {prevDecisionLabel[c.disputeResolution] ?? c.disputeResolution}
            </p>
            {c.disputeResolutionReason && (
              <p className="mt-0.5 text-xs opacity-90">{c.disputeResolutionReason}</p>
            )}
            {c.disputeResolvedAtUtc && (
              <p className="mt-1 text-[11px] opacity-70">
                Ghi nhận lúc {formatDt(c.disputeResolvedAtUtc)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Recipient bank (tài khoản nhận) ── */}
      {c.recipientBankCode && (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <SectionTitle icon="account_balance" label="Tài khoản nhận tiền của Traveler" />
          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
            <Field label="Ngân hàng" value={c.recipientBankCode} />
            <Field label="Số tài khoản" value={c.recipientAccountNumberMasked ?? "—"} mono />
            <Field label="Chủ tài khoản" value={c.recipientAccountHolder ?? "—"} />
          </div>
        </section>
      )}

      {/* ── Evidence Comparison ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* LEFT — TO's claim */}
        <section className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-4">
          <SectionTitle
            icon="upload_file"
            label="Báo cáo chuyển khoản của TO"
            badge={transfer ? "Đã báo chuyển" : "Chưa có báo cáo"}
            badgeColor={transfer ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}
          />

          {transfer ? (
            <>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Field label="Số tiền báo cáo" value={formatVnd(transfer.reportedAmountVnd)} highlight />
                <Field label="Mã tham chiếu ngân hàng" value={transfer.bankReference} mono />
                <Field label="Thời điểm chuyển (khai báo)" value={formatDt(transfer.actualTransferredAtUtc)} />
                <Field label="Thời điểm báo hệ thống" value={formatDt(transfer.reportedAtUtc)} />
                <Field label="Hạn Traveler xác nhận" value={formatDt(transfer.confirmationDeadlineAtUtc)} />
              </div>

              {/* Evidence files */}
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-blue-500">
                  Bằng chứng chuyển khoản ({transfer.evidence.length} file)
                </p>
                {transfer.evidence.length === 0 ? (
                  <p className="text-xs text-slate-400">Không có file đính kèm.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {transfer.evidence.map((ev) => (
                      <li
                        key={ev.evidenceId}
                        className="flex items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs"
                      >
                        <span className="material-symbols-outlined text-[16px] text-blue-400" aria-hidden="true">
                          {ev.contentType.startsWith("image/") ? "image" : "picture_as_pdf"}
                        </span>
                        <span className="flex-1 font-medium text-slate-700">{ev.fileName}</span>
                        <span className="shrink-0 text-slate-400">{formatDt(ev.uploadedAtUtc)}</span>
                        <a href={`/api/v1/admin/direct-refund-disputes/${encodeURIComponent(caseId)}/evidence/${ev.evidenceId}`} target="_blank" rel="noopener noreferrer" aria-label={`Mở bằng chứng ${ev.fileName}`} className="font-semibold text-[#174B4A] underline">Mở</a>
                        <a href={`/api/v1/admin/direct-refund-disputes/${encodeURIComponent(caseId)}/evidence/${ev.evidenceId}?download=1`} download={ev.fileName} aria-label={`Tải bằng chứng ${ev.fileName}`} className="font-semibold text-[#174B4A] underline">Tải</a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">TO chưa báo cáo chuyển khoản.</p>
          )}
        </section>

        {/* RIGHT — Traveler's dispute */}
        <section className={`rounded-xl border p-4 space-y-4 ${c.status === 'Completed' ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-100 bg-rose-50/40'}`}>
          <SectionTitle
            icon={c.status === 'Completed' ? 'task_alt' : 'report_problem'}
            label="Phản hồi tranh chấp của Traveler"
            badge={c.status === 'Completed' ? 'Đã giải quyết' : c.status === 'Disputed' ? 'Đang phản đối' : 'Đã ghi nhận'}
            badgeColor={c.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}
          />

          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm space-y-2">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined mt-0.5 text-[18px] text-rose-500" aria-hidden="true">
                {c.status === 'Completed' ? 'check_circle' : 'info'}
              </span>
              <p className="text-slate-700">
                {c.status === 'Completed' ? 'Tranh chấp đã được giải quyết. Hồ sơ và bằng chứng được giữ lại để tra cứu.' : c.status === 'AwaitingTravelerConfirmation' ? 'TO đã nộp báo cáo chuyển khoản mới. Đang chờ Traveler xác nhận lại.' : 'Phản đối của Traveler đã được ghi nhận để đối chiếu giao dịch.'}
              </p>
            </div>
            {transfer && c.status === 'Disputed' && (
              <p className="text-xs text-slate-500 pl-6">
                Traveler cho rằng chưa nhận được{" "}
                <span className="font-semibold">{formatVnd(transfer.reportedAmountVnd)}</span>{" "}
                TO báo đã chuyển tới tài khoản{" "}
                <span className="font-mono">{c.recipientAccountNumberMasked ?? "—"}</span>.
              </p>
            )}
          </div>

          {/* What admin needs to verify */}
          {c.status !== 'Completed' && <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-rose-500">
              Điểm cần đối chiếu
            </p>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {[
                "Mã tham chiếu ngân hàng có khớp giao dịch thực tế?",
                "Số tiền chuyển có đúng nghĩa vụ hoàn?",
                "Tài khoản nhận có khớp thông tin Traveler đã xác nhận?",
                "Bằng chứng TO tải lên có xác thực được giao dịch không?",
                "Thời điểm chuyển có trước hạn xác nhận của Traveler?",
              ].map((point) => (
                <li key={point} className="flex items-start gap-1.5">
                  <span className="mt-0.5 text-rose-400">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>}
        </section>
      </div>

      {/* ── Admin Decision Form ── */}
      {canResolve && (
        <section className="rounded-xl border border-[#174B4A]/20 bg-white p-5 shadow-xs space-y-5">
          <SectionTitle icon="gavel" label="Quyết định của Admin" />

          {/* Resolution options */}
          <div>
            <p className="mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Kết quả xét hồ sơ
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {RESOLUTION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setResolution(opt.value)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    resolution === opt.value ? opt.activeColor : opt.color
                  }`}
                >
                  <p className="text-sm font-bold leading-snug">{opt.label}</p>
                  <p className="mt-1 text-[11px] opacity-80">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Căn cứ / lý do quyết định <span className="text-rose-500">*</span>
              </span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174B4A]"
                placeholder="Mô tả cụ thể căn cứ ra quyết định: giao dịch nào, kết quả tra soát, so sánh bằng chứng hai phía…"
                maxLength={1000}
              />
              <p className="mt-1 text-right text-[11px] text-slate-400">{reason.length}/1000</p>
            </label>
          </div>

          {submitError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <span className="material-symbols-outlined text-[18px] text-rose-500" aria-hidden="true">
                error
              </span>
              <p className="text-xs text-rose-800">{submitError}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-[11px] text-slate-400">
              Quyết định này sẽ được lưu audit bất biến cùng actor và timestamp.
            </p>
            <button
              type="button"
              disabled={submitting || !reason.trim()}
              onClick={() => void resolve()}
              className="rounded-xl bg-[#174B4A] px-6 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#1C5F5D] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Đang ghi…" : "Ghi kết quả"}
            </button>
          </div>
        </section>
      )}

      {!canResolve && c.status === "Disputed" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Chỉ Administrator mới có thể ra quyết định cho hồ sơ tranh chấp.
        </div>
      )}
    </div>
  );
}

// ── Shared sub-components ───────────────────────────────────────────────────

function SectionTitle({
  icon,
  label,
  badge,
  badgeColor,
}: {
  icon: string;
  label: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        className="material-symbols-outlined text-[18px] text-slate-500"
        aria-hidden="true"
      >
        {icon}
      </span>
      <p className="text-sm font-bold text-[#1C2928]">{label}</p>
      {badge && (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeColor ?? "bg-slate-100 text-slate-600"}`}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p
        className={`mt-0.5 truncate text-sm font-semibold text-slate-800 ${mono ? "font-mono text-xs" : ""} ${highlight ? "text-base text-[#174B4A]" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
