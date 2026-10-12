export const adminUserAccountsEn = {
  directory: {
    eyebrow: 'Account Governance',
    title: 'User Account Management',
    description:
      'Search traveler and operator accounts, review account access, and manage lock status from one administration workspace.',
    pendingBadge: 'Backend integration pending',
    pendingTitle: 'User account operations are not connected yet',
    pendingDescription:
      'The account directory and account-status operations will be available after their Backend contracts are deployed.',
    searchLabel: 'Search accounts',
    searchPlaceholder: 'Search is unavailable until Backend integration',
    statusFilterLabel: 'Account status filter',
    statusFilterPlaceholder: 'All account statuses',
    operationsLabel: 'Account operations unavailable',
    lockUnavailableLabel: 'Lock account unavailable',
    unlockUnavailableLabel: 'Unlock account unavailable',
    returnToStaffLabel: 'Return to Staff Workspace',
  },
  detail: {
    eyebrow: 'Account Governance',
    title: 'Account details unavailable',
    pendingBadge: 'Backend integration pending',
    pendingDescription:
      'Account details and account-status operations will become available after the Backend directory contract is deployed.',
    requestedAccountIdLabel: 'Requested account ID',
    operationsLabel: 'Account status operations unavailable',
    backToDirectoryLabel: 'Back to User Account Management',
  },
} as const;
