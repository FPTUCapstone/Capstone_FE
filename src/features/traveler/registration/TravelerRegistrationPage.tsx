import { AuthShell } from '@/components/layout/AuthShell';
import { TravelerRegistrationForm } from '@/features/traveler/registration/TravelerRegistrationForm';

export function TravelerRegistrationPage() {
  return (
    <AuthShell
      eyebrow="Traveler registration"
      title="Plan the journey around what matters to you."
      description="Create a Traveler account for approved planning, discovery and booking functions."
      points={['📍 Discover Central Vietnam', '📅 Prepare future journeys']}
    >
      <TravelerRegistrationForm />
    </AuthShell>
  );
}
