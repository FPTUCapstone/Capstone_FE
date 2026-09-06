import { AuthShell } from '@/components/layout/AuthShell';
import { TravelerRegistrationForm } from '@/features/traveler/registration/TravelerRegistrationForm';

export function TravelerRegistrationPage() {
  return (
    <AuthShell eyebrow="Traveler registration" title="Prepare a journey that fits you." description="Create a Traveler account to continue from public discovery into approved TripMate planning experiences.">
      <TravelerRegistrationForm />
    </AuthShell>
  );
}
