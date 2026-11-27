"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { PublicNavigation } from "@/components/navigation/PublicNavigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { useWebSession } from "@/features/auth/session/useWebSession";
import { ROUTES } from "@/lib/routes";
import {
  type DirectRefundCase,
  type DirectRefundCaseEnvelope,
  completionLabel,
  formatDt,
  formatVnd,
  parseDirectRefundCaseEnvelope,
  sourceLabel,
} from "@/features/bookings/types/directRefund";

type PageState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; envelope: DirectRefundCaseEnvelope };

type MutationState = "idle" | "submitting" | "error";

function statusBadge(status: DirectRefundCase["status"]): {
  label: string;
  tone: string;
} {
  switch (status) {
    case "AwaitingRecipient":
      return { label: "Confirm bank account", tone: "bg-sky-100 text-sky-800" };
    case "AwaitingTransfer":
      return {
        label: "Awaiting transfer",
        tone: "bg-amber-100 text-amber-800",
      };
    case "AwaitingTravelerConfirmation":
      return {
        label: "Confirm receipt",
        tone: "bg-blue-100 text-blue-800",
      };
    case "Disputed":
      return { label: "Under review", tone: "bg-orange-100 text-orange-800" };
    case "Completed":
      return {
        label: "Completed",
        tone: "bg-emerald-100 text-emerald-800",
      };
  }
}

function statusDescription(status: DirectRefundCase["status"]): string {
  switch (status) {
    case "AwaitingRecipient":
      return "Please confirm the bank account where you would like to receive your refund.";
    case "AwaitingTransfer":
      return "The tour operator will transfer the refund to your registered account.";
    case "AwaitingTravelerConfirmation":
      return "The tour operator has reported a transfer. Please confirm whether you have received the full amount.";
    case "Disputed":
      return "Your dispute has been received. TripMate is reviewing the case.";
    case "Completed":
      return "The refund process has been completed.";
  }
}

function useCountdown(deadlineIso: string | null, serverNowIso: string): string {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    if (!deadlineIso) {
      const tid = window.setTimeout(() => setDisplay(""), 0);
      return () => window.clearTimeout(tid);
    }

    const skew = Date.now() - new Date(serverNowIso).getTime();

    function calc() {
      const deadline = new Date(deadlineIso!).getTime();
      const remaining = deadline - (Date.now() - skew);
      if (remaining <= 0) { setDisplay("Expired"); return; }
      const h = Math.floor(remaining / 3_600_000);
      const m = Math.floor((remaining % 3_600_000) / 60_000);
      const s = Math.floor((remaining % 60_000) / 1_000);
      setDisplay(`${h}h ${m}m ${s}s remaining`);
    }

    calc();
    const id = window.setInterval(calc, 1_000);
    return () => window.clearInterval(id);
  }, [deadlineIso, serverNowIso]);

  return display;
}

export function DirectRefundCasePage({
  bookingId,
  caseId,
  embedded = false,
}: {
  bookingId: string;
  caseId: string;
  embedded?: boolean;
}) {
  const { status: sessionStatus } = useWebSession();
  const router = useRouter();
  const [state, setState] = useState<PageState>({ phase: "loading" });
  const [mutation, setMutation] = useState<MutationState>("idle");
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Recipient form state
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const versionRef = useRef<string | null>(null);
  // PartiallyReceived inline form
  const [showPartialForm, setShowPartialForm] = useState(false);
  const [partialAmount, setPartialAmount] = useState("");

  const load = useCallback(async () => {
    setState({ phase: "loading" });
    try {
      const res = await fetch(
        `/api/v1/traveler/direct-refunds/${encodeURIComponent(caseId)}`,
        { cache: "no-store" },
      );
      if (res.status === 401) {
        router.replace(
          `${ROUTES.signIn}?returnUrl=${encodeURIComponent(`/bookings/${bookingId}/refund?caseId=${caseId}`)}`,
        );
        return;
      }
      const payload: unknown = await res.json().catch(() => null);
      if (!res.ok || !payload) {
        setState({
          phase: "error",
          message:
            res.status === 404
              ? "Refund case not found."
              : "Could not load refund details. Please try again.",
        });
        return;
      }
      const envelope = parseDirectRefundCaseEnvelope(payload);
      versionRef.current = envelope.case.rowVersion;
      setState({ phase: "ready", envelope });
      if (envelope.case.allowedActions.includes('ConfirmRecipient')) {
        // Existing unconfirmed cases may predate the saved default. Fill only untouched fields.
        void fetch('/api/v1/traveler/refund-account', { cache: 'no-store' })
          .then(async response => response.ok ? response.json() : null)
          .then((account: unknown) => {
            if (!account || typeof account !== 'object') return;
            const saved = account as Record<string, unknown>;
            if (typeof saved.bankCode === 'string') setBankCode(value => value || saved.bankCode as string);
            if (typeof saved.accountNumber === 'string') setAccountNumber(value => value || saved.accountNumber as string);
            if (typeof saved.accountHolder === 'string') setAccountHolder(value => value || saved.accountHolder as string);
          })
          .catch(() => { /* Manual entry remains available if the saved default cannot be loaded. */ });
      }
    } catch {
      setState({
        phase: "error",
        message: "Could not load refund details. Please check your connection.",
      });
    }
  }, [bookingId, caseId, router]);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.replace(
        `${ROUTES.signIn}?returnUrl=${encodeURIComponent(`/bookings/${bookingId}/refund?caseId=${caseId}`)}`,
      );
    }
  }, [bookingId, caseId, router, sessionStatus]);

  async function confirmRecipient() {
    if (state.phase !== "ready") return;
    if (!bankCode.trim() || !accountNumber.trim() || !accountHolder.trim()) {
      setMutationError("All bank account fields are required.");
      return;
    }
    setMutation("submitting");
    setMutationError(null);
    try {
      const res = await fetch(
        `/api/v1/traveler/direct-refunds/${encodeURIComponent(caseId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bankCode: bankCode.trim(),
            accountNumber: accountNumber.trim(),
            accountHolder: accountHolder.trim(),
            expectedVersion: versionRef.current ?? state.envelope.case.rowVersion,
          }),
          credentials: "same-origin",
        },
      );
      if (!res.ok) {
        const err: unknown = await res.json().catch(() => null);
        const code =
          err && typeof err === "object" && "errorCode" in err
            ? String((err as { errorCode: unknown }).errorCode)
            : "ERROR";
        if (res.status === 409)
          setMutationError("The case was updated by someone else. Reloading…");
        else
          setMutationError(
            code === "VERSION_CONFLICT"
              ? "The case was updated concurrently. Reloading…"
              : "Could not confirm recipient. Please try again.",
          );
        setMutation("error");
        if (res.status === 409) setTimeout(() => void load(), 1500);
        return;
      }
      setMutation("idle");
      await load();
    } catch {
      setMutation("error");
      setMutationError("Network error. Please try again.");
    }
  }

  async function respond(
    responseType: "ReceivedInFull" | "NotReceived" | "PartiallyReceived",
    receivedAmountVnd?: number,
  ) {
    if (state.phase !== "ready") return;
    const transferId = state.envelope.case.pendingTransfer?.transferId;
    if (!transferId) return;
    setMutation("submitting");
    setMutationError(null);
    try {
      const res = await fetch(
        `/api/v1/traveler/direct-refunds/${encodeURIComponent(caseId)}/response`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transferId,
            responseType,
            receivedAmountVnd: receivedAmountVnd ?? null,
            expectedVersion: versionRef.current ?? state.envelope.case.rowVersion,
          }),
          credentials: "same-origin",
        },
      );
      if (!res.ok) {
        const err: unknown = await res.json().catch(() => null);
        const code =
          err && typeof err === "object" && "errorCode" in err
            ? String((err as { errorCode: unknown }).errorCode)
            : "ERROR";
        if (res.status === 409 || code === "VERSION_CONFLICT") {
          setMutationError("The case was updated. Reloading…");
          setTimeout(() => void load(), 1500);
        } else {
          setMutationError("Could not submit response. Please try again.");
        }
        setMutation("error");
        return;
      }
      setMutation("idle");
      await load();
    } catch {
      setMutation("error");
      setMutationError("Network error. Please try again.");
    }
  }

  const isLoading =
    state.phase === "loading" || sessionStatus === "restoring";
  const Container = embedded ? 'div' : 'main';
  const Heading = embedded ? 'h2' : 'h1';

  return (
    <div className={embedded ? '' : 'min-h-screen bg-[#f8fafc]'}>
      {!embedded && <PublicNavigation />}
      <Container className={embedded ? '' : 'mx-auto max-w-xl px-4 py-8'}>
        {!embedded && <Link href={ROUTES.home} className="text-sm font-semibold text-[#174B4A]">
          ← Back to TripMate
        </Link>}
        <section className={embedded ? '' : 'mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'}>
          {!embedded && <Heading className="text-xl font-bold text-[#1C2928]">Refund progress</Heading>}
          {!embedded && <p className="mt-1 text-sm text-slate-600">
            Direct bank transfer for booking {bookingId}.
          </p>}

          {isLoading && (
            <p className="py-14 text-center text-sm text-slate-600">
              Loading refund details…
            </p>
          )}

          {state.phase === "error" && (
            <div className="py-10 text-center">
              <p className="text-sm text-rose-700">{state.message}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-4 rounded-xl bg-[#174B4A] px-4 py-2 text-sm font-bold text-white"
              >
                Try again
              </button>
            </div>
          )}

          {state.phase === "ready" && (
            <DirectRefundDetails
              compact={embedded}
              envelope={state.envelope}
              bankCode={bankCode}
              setBankCode={setBankCode}
              accountNumber={accountNumber}
              setAccountNumber={setAccountNumber}
              accountHolder={accountHolder}
              setAccountHolder={setAccountHolder}
              mutation={mutation}
              mutationError={mutationError}
              onConfirmRecipient={() => void confirmRecipient()}
              onRespond={(rt, amt) => void respond(rt, amt)}
              showPartialForm={showPartialForm}
              setShowPartialForm={setShowPartialForm}
              partialAmount={partialAmount}
              setPartialAmount={setPartialAmount}
            />
          )}
        </section>
      </Container>
    </div>
  );
}

function DirectRefundDetails({
  compact = false,
  envelope,
  bankCode,
  setBankCode,
  accountNumber,
  setAccountNumber,
  accountHolder,
  setAccountHolder,
  mutation,
  mutationError,
  onConfirmRecipient,
  onRespond,
  showPartialForm,
  setShowPartialForm,
  partialAmount,
  setPartialAmount,
}: {
  compact?: boolean;
  envelope: DirectRefundCaseEnvelope;
  bankCode: string;
  setBankCode: (v: string) => void;
  accountNumber: string;
  setAccountNumber: (v: string) => void;
  accountHolder: string;
  setAccountHolder: (v: string) => void;
  mutation: MutationState;
  mutationError: string | null;
  onConfirmRecipient: () => void;
  onRespond: (rt: "ReceivedInFull" | "NotReceived" | "PartiallyReceived", receivedAmountVnd?: number) => void;
  showPartialForm: boolean;
  setShowPartialForm: (v: boolean) => void;
  partialAmount: string;
  setPartialAmount: (v: string) => void;
}) {
  const { case: c, serverNowUtc } = envelope;
  const badge = statusBadge(c.status);
  const countdown = useCountdown(
    c.pendingTransfer?.confirmationDeadlineAtUtc ?? null,
    serverNowUtc,
  );

  return (
    <div className={compact ? 'grid items-start gap-3 text-sm md:grid-cols-2' : 'mt-6 space-y-4 text-sm'}>
      {/* Status header */}
      <div className={`rounded-xl border border-slate-200 bg-slate-50 p-4 ${compact ? 'md:col-span-2' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Booking
            </p>
            <p className="mt-1 font-mono font-bold text-[#1C2928]">
              {c.bookingCode}
            </p>
          </div>
          <div className="text-right">
            <p className="mb-2 text-xl font-bold tabular-nums text-[#174B4A]">{formatVnd(c.refundAmountVnd)}</p>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${badge.tone}`}>{badge.label}</span>
          </div>
        </div>
        <p className="mt-3 text-slate-600">{statusDescription(c.status)}</p>
      </div>

      {/* Core details */}
      <dl className={`divide-y divide-slate-100 rounded-xl border border-slate-200 ${compact ? 'md:row-span-4' : ''}`}>
        <Row label="Reason" value={sourceLabel(c.sourceType)} />
        <Row label="Opened" value={formatDt(c.createdAtUtc)} />
        {c.completedAtUtc && (
          <Row label="Completed" value={formatDt(c.completedAtUtc)} />
        )}
        {c.completionMethod && (
          <Row label="Closed by" value={completionLabel(c.completionMethod)} />
        )}
        {c.recipientBankCode && (
          <Row label="Bank" value={c.recipientBankCode} />
        )}
        {c.recipientAccountNumberMasked && (
          <Row label="Account" value={c.recipientAccountNumberMasked} mono />
        )}
        {c.recipientAccountHolder && (
          <Row label="Account holder" value={c.recipientAccountHolder} />
        )}
      </dl>

      {/* Transfer info + countdown */}
      {c.pendingTransfer && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
          <p className="font-semibold text-blue-900">Transfer reported</p>
          <dl className="space-y-1">
            <Row label="Amount reported" value={formatVnd(c.pendingTransfer.reportedAmountVnd)} />
            <Row label="Bank reference" value={c.pendingTransfer.bankReference} mono />
            <Row label="Transferred at" value={formatDt(c.pendingTransfer.actualTransferredAtUtc)} />
          </dl>
          {countdown && c.status === 'AwaitingTravelerConfirmation' && (
            <p className="mt-2 text-xs text-blue-800">
              Bạn có 72 giờ kể từ khi TO báo chuyển để xác nhận — {countdown}
            </p>
          )}
          {c.pendingTransfer.evidence.length > 0 && (
            <p className="text-xs text-slate-500">
              {c.pendingTransfer.evidence.length} evidence file(s) attached by operator.
            </p>
          )}
        </div>
      )}

      {/* Mutation error */}
      {mutationError && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {mutationError}
        </p>
      )}

      {/* AwaitingRecipient — bank account form */}
      {c.allowedActions.includes("ConfirmRecipient") && (
        <div className="rounded-xl border border-slate-200 p-4 space-y-3">
          <p className="font-semibold text-[#1C2928]">Enter your bank account</p>
          <p className="text-xs text-slate-500">Sau khi xác nhận, tài khoản này sẽ được lưu để dùng cho các lần hoàn tiền tiếp theo. Bạn có thể quản lý trong mục Tài khoản nhận hoàn tiền.</p>
          <label className="block">
            <span className="text-xs text-slate-500">Bank code (e.g. VCB)</span>
            <input
              type="text"
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#174B4A]"
              placeholder="VIETCOMBANK"
              maxLength={20}
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Account number</span>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#174B4A]"
              placeholder="0123456789"
              maxLength={30}
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Account holder name</span>
            <input
              type="text"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#174B4A]"
              placeholder="NGUYEN VAN A"
              maxLength={80}
            />
          </label>
          <ActionButton
            type="button"
            variant="primary"
            disabled={mutation === "submitting"}
            onClick={onConfirmRecipient}
          >
            {mutation === "submitting" ? "Saving…" : "Confirm account"}
          </ActionButton>
        </div>
      )}

      {/* AwaitingTravelerConfirmation — response buttons */}
      {c.allowedActions.includes("RespondToTransfer") && (
        <div className="rounded-xl border border-slate-200 p-4 space-y-3">
          <p className="font-semibold text-[#1C2928]">Did you receive the refund?</p>
          {!showPartialForm ? (
            <div className="flex flex-wrap gap-2">
              <ActionButton
                type="button"
                variant="primary"
                disabled={mutation === "submitting"}
                onClick={() => onRespond("ReceivedInFull")}
              >
                Nhận đủ
              </ActionButton>
              <ActionButton
                type="button"
                variant="secondary"
                disabled={mutation === "submitting"}
                onClick={() => setShowPartialForm(true)}
              >
                Nhận thiếu
              </ActionButton>
              <ActionButton
                type="button"
                variant="outline"
                disabled={mutation === "submitting"}
                onClick={() => onRespond("NotReceived")}
              >
                Chưa nhận
              </ActionButton>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-slate-600">Nhập số tiền bạn đã nhận được:</p>
              <input
                type="number"
                min={1}
                max={c.refundAmountVnd}
                value={partialAmount}
                onChange={(e) => setPartialAmount(e.target.value)}
                placeholder={`Tối đa ${formatVnd(c.refundAmountVnd)}`}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#174B4A]"
              />
              <div className="flex gap-2">
                <ActionButton
                  type="button"
                  variant="primary"
                  disabled={mutation === "submitting" || !partialAmount || Number(partialAmount) <= 0}
                  onClick={() => {
                    const amt = Number(partialAmount);
                    if (amt > 0) onRespond("PartiallyReceived", amt);
                  }}
                >
                  Xác nhận
                </ActionButton>
                <ActionButton
                  type="button"
                  variant="outline"
                  disabled={mutation === "submitting"}
                  onClick={() => { setShowPartialForm(false); setPartialAmount(""); }}
                >
                  Hủy
                </ActionButton>
              </div>
            </div>
          )}
          {mutation === "submitting" && (
            <p className="text-xs text-slate-500">Submitting…</p>
          )}
        </div>
      )}

      {/* Disputed — info only */}
      {c.status === "Disputed" && (
        <p className="rounded-xl bg-orange-50 p-3 text-xs text-orange-900">
          Your dispute has been forwarded to TripMate. No further action is required from you at this time.
        </p>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="text-slate-500">{label}</dt>
      <dd
        className={`text-right font-semibold text-slate-800 ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
