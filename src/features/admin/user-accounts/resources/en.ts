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
  statusDialog: {
    cancelLabel: 'Cancel',
    reasonPlaceholder: 'Explain why this account access needs to change',
    lock: {
      title: 'Lock user account',
      subtitle: 'Administrative moderation action',
      description: 'This captures an administrative lock action and rationale pending backend directory integration.',
      reasonCategoryLabel: 'Lock reason',
      reasonCategories: [
        'Violation of tour safety & travel regulations',
        'Payment fraud or irregular chargebacks',
        'Unresolved severe traveler complaints',
        'Other violation (detailed in internal notes)',
      ],
      reasonLabel: 'Internal moderation notes',
      internalNotesPlaceholder: 'Enter detailed violation findings or rationale (admin internal view)...',
      durationPermanentTitle: 'Indefinite Administrative Lock',
      durationPermanentDesc:
        'Under SRS V2 BR-117, account locks remain in effect until explicitly unlocked by an Administrator via UC-49.',
      warningTitle: 'Important notice:',
      warningBody:
        'This dialog captures administrator lock rationale pending backend integration. When connected, locking this account will terminate active sessions and suspend marketplace listings according to platform governance policy.',
      confirmLabel: 'Confirm account lock',
    },
  },
} as const;
