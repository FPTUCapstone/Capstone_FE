export const adminUserAccountsEn = {
  moderation: {
    lock: {
      label: 'Lock account',
      reasonLabel: 'Reason for locking',
      confirmationTitle: 'Lock account',
      confirmLabel: 'Confirm lock',
    },
    unlock: {
      label: 'Unlock account',
      reasonLabel: 'Reason for unlocking',
      confirmationTitle: 'Unlock account',
      confirmLabel: 'Confirm unlock',
    },
    messages: {
      MSG130: 'Are you sure you want to continue? This action may not be reversible.',
      MSG189: 'Account locked. The account holder has been notified.',
      MSG190: 'Account unlocked. The account holder has been notified.',
    },
    reasonSummary: 'Reason',
    cancelLabel: 'Cancel',
    closeLabel: 'Close confirmation',
    updatingLabel: 'Updating…',
    dismissToastLabel: 'Dismiss notification',
    updateFailed: 'Account update failed.',
    unavailable: 'Account management is temporarily unavailable.',
  },
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
    returnToDashboardLabel: 'Return to Administration Dashboard',
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
