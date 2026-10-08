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
      preferencesBadge: 'UC-09',
      security: 'Security & Password',
      trips: 'My Trips',
      tripsBadge: 'UC-32',
    },
  },
} as const;

export type AccountCommonResources = typeof accountCommonEn;
