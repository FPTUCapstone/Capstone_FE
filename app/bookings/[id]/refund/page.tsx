import { DirectRefundCasePage } from "@/features/bookings/components/DirectRefundCasePage";
import { bookingAccessToken } from "@/features/bookings/services/bookingBffAuth";
import { RefundProgressPage } from "@/features/bookings/components/RefundProgressPage";
import { fetchBackend } from "@/lib/server/backend";

async function detectDirectRefundCaseId(bookingId: string): Promise<string | null> {
  try {
    const signal = AbortSignal.timeout(8_000);
    const auth = await bookingAccessToken(signal);
    if ("status" in auth) return null;

    const res = await fetchBackend(
      `/api/v1/traveler/direct-refunds/by-booking/${encodeURIComponent(bookingId)}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${auth.token}`, Accept: "application/json" },
        signal,
      },
    );
    if (!res.ok) return null;

    const body: unknown = await res.json().catch(() => null);
    const caseId = body && typeof body === "object" && "caseId" in body
      ? (body as { caseId: unknown }).caseId
      : null;
    if (typeof caseId === "number" && Number.isSafeInteger(caseId) && caseId > 0) {
      return String(caseId);
    }
    return null;
  } catch {
    return null;
  }
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ caseId?: string }>;
}) {
  const { id } = await params;
  const { caseId: qsCaseId } = await searchParams;

  // Explicit caseId in URL → use it directly
  if (qsCaseId && /^[1-9]\d*$/.test(qsCaseId)) {
    return <DirectRefundCasePage bookingId={id} caseId={qsCaseId} />;
  }

  // Auto-detect: check if a DirectRefundCase exists for this booking
  const detectedCaseId = await detectDirectRefundCaseId(id);
  if (detectedCaseId) {
    return <DirectRefundCasePage bookingId={id} caseId={detectedCaseId} />;
  }

  // Fallback: old gateway-based refund
  return <RefundProgressPage bookingId={id} />;
}
