export type VerificationFlow = 'operator' | 'operator-mobile';

type VerificationFlowInput = {
  flow?: string;
  continueUrl?: string;
};

function asVerificationFlow(value: string | null | undefined): VerificationFlow | undefined {
  return value === 'operator' || value === 'operator-mobile' ? value : undefined;
}

export function resolveVerificationFlow({
  flow,
  continueUrl,
}: VerificationFlowInput): VerificationFlow | undefined {
  const directFlow = asVerificationFlow(flow);
  if (directFlow) return directFlow;
  if (!continueUrl) return undefined;

  try {
    const continued = new URL(continueUrl);
    if (continued.pathname !== '/verify-email') return undefined;
    return asVerificationFlow(continued.searchParams.get('flow'));
  } catch {
    return undefined;
  }
}
