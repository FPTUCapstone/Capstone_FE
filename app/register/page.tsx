import type { Metadata } from 'next';

import { TravelerRegistrationPage } from '@/features/traveler/registration/TravelerRegistrationPage';

export const metadata: Metadata = { title: 'Traveler Registration' };

export default function RegisterPage() {
  return <TravelerRegistrationPage />;
}
