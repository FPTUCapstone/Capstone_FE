let pending: { token: string; expires: number } | undefined;

// This confirmation lives only in the current document and expires if navigation never completes.
export function rememberRouteCreation() {
  const token = crypto.randomUUID();
  pending = { token, expires: Date.now() + 30_000 };
  return token;
}

export function takeRouteCreation(token?: string | null) {
  const confirmation = pending;
  pending = undefined;
  return Boolean(confirmation && confirmation.token === token && confirmation.expires > Date.now());
}
