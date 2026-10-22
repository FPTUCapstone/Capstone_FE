import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  fetchBackend: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/lib/server/backend", () => ({
  fetchBackend: mocks.fetchBackend,
}));

import { proxyGetBookingRefundProgress } from "./refundProgressProxy";

function request() {
  return new Request("https://tripmate.test/api/v1/bookings/42/refund");
}

function refreshResponse(role: "Traveler" | "TourOperator" | "Administrator") {
  return new Response(
    JSON.stringify({ data: { role, accessToken: "access-token" } }),
    { status: 200 },
  );
}

describe("proxyGetBookingRefundProgress", () => {
  it("returns 401 without a refresh cookie", async () => {
    mocks.cookies.mockResolvedValue({ get: () => undefined });

    const response = await proxyGetBookingRefundProgress(request(), "42");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ errorCode: "UNAUTHENTICATED" });
    expect(mocks.fetchBackend).not.toHaveBeenCalled();
  });

  it("returns 403 when the refreshed role cannot view refunds", async () => {
    mocks.cookies.mockResolvedValue({ get: () => ({ value: "refresh" }) });
    mocks.fetchBackend.mockResolvedValueOnce(refreshResponse("Administrator"));

    const response = await proxyGetBookingRefundProgress(request(), "42");

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ errorCode: "FORBIDDEN" });
  });

  it("returns 503 when refreshing the browser session fails", async () => {
    mocks.cookies.mockResolvedValue({ get: () => ({ value: "refresh" }) });
    mocks.fetchBackend.mockRejectedValueOnce(new Error("offline"));

    const response = await proxyGetBookingRefundProgress(request(), "42");

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ errorCode: "REFUND_UNAVAILABLE" });
  });

  it.each([404, 500])(
    "preserves 404 and safely maps backend %s",
    async (status) => {
      mocks.cookies.mockResolvedValue({ get: () => ({ value: "refresh" }) });
      mocks.fetchBackend
        .mockResolvedValueOnce(refreshResponse("Traveler"))
        .mockResolvedValueOnce(new Response("{}", { status }));

      const response = await proxyGetBookingRefundProgress(request(), "42");

      expect(response.status).toBe(status === 404 ? 404 : 503);
      expect((await response.json()).errorCode).toBe(
        status === 404 ? "REFUND_NOT_FOUND" : "REFUND_UNAVAILABLE",
      );
    },
  );
});
