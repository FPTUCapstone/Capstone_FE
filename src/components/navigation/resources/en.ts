/**
 * Shared English resource strings for PublicNavigation.
 * Follows Report 3 SRS CR-09 / Resource file convention.
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
    partnerWorkspace: 'Partner Workspace',
    partnerProfile: 'Business Profile',
    partnerApplication: 'Partner Application',
    partnerMenuAria: 'Partner account menu',
    logOut: 'Log out',
    operatorRoleBadge: 'Partner',
  },
  drawer: {
    openAria: 'Open navigation menu',
    closeAria: 'Close menu',
    title: 'Menu',
    navAria: 'Mobile navigation menu',
    poisDesc: 'Curated heritage & cultural points of interest',
    planDesc: 'Optimize circadian rhythms & schedules',
    toursDesc: 'Verified local experiences & security escrow',
    weatherDesc: 'Dynamic weather rerouting system',
    destinationsDesc: 'Explore Da Nang, Hoi An, Hue',
    myItinerariesDesc: 'Your saved travel plans',
    partnerDesc: 'Registration & Tour Operator Workspace',
  },
} as const;

export type PublicNavigationResources = typeof publicNavigationEn;
