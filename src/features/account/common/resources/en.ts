/**
 * Common English resource strings for the Traveler Account workspace.
 * Follows Report 3 SRS V2 CR-09 (English UI & resource file requirement).
 */
export const accountCommonEn = {
  navigation: {
    workspaceNavAria: 'Account navigation',
    tabs: {
      profile: 'Personal Profile',
      preferences: 'Travel Preferences',
      favorites: 'Favorite Places',
      security: 'Security & Password',
      trips: 'My Trips',
      complaints: 'My Complaints',
    },
  },
} as const;

export type AccountCommonResources = typeof accountCommonEn;
