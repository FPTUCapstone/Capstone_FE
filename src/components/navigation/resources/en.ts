/**
 * Shared English resource strings for PublicNavigation.
 * Follows Report 3 SRS V2 CR-09 (English UI & resource file requirement).
 */
export const publicNavigationEn = {
  brandAria: 'TripMate Landing Page',
  navAria: 'Public navigation',
  links: {
    explore: 'Explore',
    destinations: 'Destinations',
    smartItinerary: 'Smart Itinerary',
    weatherRerouting: 'Weather Rerouting',
    localTours: 'Local Tours',
    forPartners: 'For Partners',
  },
  account: {
    profileAria: 'Account and profile',
    restoringAria: 'Restoring session',
    restoringSrText: 'Restoring session…',
    register: 'Register',
    signIn: 'Sign in',
  },
} as const;

export type PublicNavigationResources = typeof publicNavigationEn;
