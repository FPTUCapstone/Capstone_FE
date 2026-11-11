import "server-only";

import { cookies } from "next/headers";

import { fetchBackend } from "@/lib/server/backend";

export const REFRESH_COOKIE = "tripmate_refresh";

export async function bookingAccessToken(
  signal: AbortSignal,
): Promise<{ token: string } | { status: 401 | 403 | 503 }> {
  const refresh = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!refresh) return { status: 401 };

  let response: Response;
  try {
    response = await fetchBackend("/api/v1/auth/web/refresh", {
      method: "POST",
      headers: { Cookie: `${REFRESH_COOKIE}=${encodeURIComponent(refresh)}` },
      signal,
    });
  } catch {
    return { status: 503 };
  }
  // A browser session is invalid only when the refresh endpoint says so.
  // Treat gateway/Backend failures as transient: the UI must offer retry
  // instead of signing a valid user out.
  if (!response.ok) return { status: response.status === 401 ? 401 : 503 };

  const body: unknown = await response.json().catch(() => null);
  const data =
    body && typeof body === "object" && "data" in body ? body.data : null;
  if (!data || typeof data !== "object" || !("role" in data))
    return { status: 401 };
  if (data.role !== "Traveler" && data.role !== "TourOperator") {
    return { status: 403 };
  }
  if (
    !("accessToken" in data) ||
    typeof data.accessToken !== "string" ||
    !data.accessToken
  ) {
    return { status: 401 };
  }
  return { token: data.accessToken };
}
