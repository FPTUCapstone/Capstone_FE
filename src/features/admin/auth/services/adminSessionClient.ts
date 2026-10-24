export async function signOutAdminSession(): Promise<void> {
  const response = await fetch('/api/admin/session', {
    method: 'DELETE',
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error('Admin session logout failed');
  }
}
