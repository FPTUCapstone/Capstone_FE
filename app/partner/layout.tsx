import type { ReactNode } from 'react';
import { PartnerOnboardingBoundary } from '@/features/operator/contracts/PartnerOnboardingBoundary';

export default function PartnerLayout({ children }: { children: ReactNode }) { return <PartnerOnboardingBoundary>{children}</PartnerOnboardingBoundary>; }
