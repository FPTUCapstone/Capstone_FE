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

import {
  proxyGetBookingCancellationPreview,
  proxyPostBookingCancellation,
} from "./cancellationProxy";

const KEY = "3f1c2a7e-4b8d-4e6f-9a1b-2c3d4e5f6a7b";

function postRequest(body: unknown, key: string | null = KEY) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (key !== null) headers["Idempotency-Key"] = key;
  return new Request("https://tripmate.test/api/v1/bookings/42/cancellation", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function signedInTraveler() {
  mocks.cookies.mockResolvedValue({ get: () => ({ value: "refresh" }) });
  mocks.fetchBackend.mockResolvedValueOnce(
    new Response(
      JSON.stringify({ data: { role: "Traveler", accessToken: "access-token" } }),
      { status: 200 },
    ),
  );
}

describe("proxyPostBookingCancellation", () => {
  it("returns 401 without a refresh cookie", async () => {
    mocks.cookies.mockResolvedValue({ get: () => undefined });

    const response = await proxyPostBookingCancellation(postRequest({}), "42");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ errorCode: "UNAUTHENTICATED" });
    expect(mocks.fetchBackend).not.toHaveBeenCalled();
  });

  it("rejects a missing or malformed Idempotency-Key without calling the backend", async () => {
    const response = await proxyPostBookingCancellation(
      postRequest({}, "not-a-guid"),
      "42",
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ errorCode: "INVALID_IDEMPOTENCY_KEY" });
    expect(mocks.fetchBackend).not.toHaveBeenCalled();
  });

  it("forwards the key, bearer token and cancellation body to the backend", async () => {
    signedInTraveler();
    mocks.fetchBackend.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { bookingId: 42, status: "Cancelled" } }), {
        status: 200,
      }),
    );

    const response = await proxyPostBookingCancellation(
      postRequest({ reasonCategory: "CUSTOMER_REQUEST", reasonDetail: "Cannot travel", confirmed: true }),
      "42",
    );

    expect(response.status).toBe(200);
    const [path, init] = mocks.fetchBackend.mock.calls[1];
    expect(path).toBe("/api/v1/bookings/42/cancellation");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer access-token");
    expect(init.headers["Idempotency-Key"]).toBe(KEY);
    expect(JSON.parse(init.body)).toEqual({
      reasonCategory: "CUSTOMER_REQUEST",
      reasonDetail: "Cannot travel",
      confirmed: true,
    });
  });

  it("passes the confirmation-required error code through to the caller", async () => {
    signedInTraveler();
    mocks.fetchBackend.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ errorCode: "booking.cancellation.confirmation_required", title: "raw" }),
        { status: 422 },
      ),
    );

    const response = await proxyPostBookingCancellation(postRequest({}), "42");

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      errorCode: "booking.cancellation.confirmation_required",
    });
  });

  it("does not leak unknown backend error details", async () => {
    signedInTraveler();
    mocks.fetchBackend.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ errorCode: "internal.stack", detail: "SQL exception at line 42" }),
        { status: 500 },
      ),
    );

    const response = await proxyPostBookingCancellation(postRequest({}), "42");

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ errorCode: "CANCELLATION_UNAVAILABLE" });
  });
});

describe("proxyGetBookingCancellationPreview", () => {
  it("returns the backend preview payload for the booking", async () => {
    signedInTraveler();
    mocks.fetchBackend.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: { canCancel: true, blockingReasonCode: "booking.cancellation.confirmation_required", estimatedRefundAmount: 0 },
        }),
        { status: 200 },
      ),
    );

    const response = await proxyGetBookingCancellationPreview(
      new Request("https://tripmate.test/api/v1/bookings/42/cancellation-preview"),
      "42",
    );

    expect(response.status).toBe(200);
    expect(mocks.fetchBackend.mock.calls[1][0]).toBe("/api/v1/bookings/42/cancellation-preview");
    expect(await response.json()).toEqual({
      canCancel: true,
      blockingReasonCode: "booking.cancellation.confirmation_required",
      estimatedRefundAmount: 0,
    });
  });
});
