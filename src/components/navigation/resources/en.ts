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
    myItineraries: 'My Itineraries',
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
    quickPlan: 'Plan Trip',
    mobilePlan: 'Plan',
  },
  drawer: {
    openAria: 'Open navigation menu',
    closeAria: 'Close menu',
    title: 'Menu',
    navAria: 'Mobile navigation menu',
    poisDesc: 'Points of Interest',
    planDesc: 'Smart Itinerary',
    toursDesc: 'Curated Local Tours',
    myItinerariesDesc: 'Saved Itineraries',
    partnerDesc: 'Partner Portal',
  },
} as const;

export type PublicNavigationResources = typeof publicNavigationEn;
