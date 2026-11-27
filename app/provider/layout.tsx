import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { providerServerContext } from '@/features/hotel-service-provider/server/workflowProxy';
import { ProviderWorkspaceShell } from '@/features/hotel-service-provider/components/ProviderWorkspaceShell';

export default async function ProviderLayout({ children }: { children: ReactNode }) {
  let context;
  try { context = await providerServerContext(); }
  catch { return <p role="alert" className="p-8">The authentication service is temporarily unavailable. Please reload to try again.</p>; }
  if (!context) redirect('/sign-in');
  if (context.role !== 'ServiceProvider') return <p role="alert" className="p-8">Access denied. A Service Provider account is required.</p>;
  if (context.mustChangePassword) redirect('/first-password');
  return (
    <ProviderWorkspaceShell userName={context.fullName} userEmail={context.email}>
      {children}
    </ProviderWorkspaceShell>
  );
}
