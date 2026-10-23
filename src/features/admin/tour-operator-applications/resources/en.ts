/**
 * Tour Operator application review copy (CR-09: English, resource-backed).
 *
 * The detailed UC-50/UC-51 sections cite message identifiers whose meaning differs from the
 * message appendix, so the UI renders semantic copy and never message codes. Permission and
 * service-failure copy follows the appendix meaning of the generic permission and failure
 * messages.
 */
export const tourOperatorApplicationEn = {
  common: {
    notAvailable: 'Not available',
  },
  invalidId: {
    title: 'Invalid Application ID',
    body: 'The provided application parameter is not a valid numeric user ID.',
  },
  header: {
    back: 'Back to Admin Console',
    applicationNumber: (userId: number) => `Application #${userId}`,
    fallbackTitle: (userId: number) => `Tour Operator #${userId}`,
    approve: 'Approve Application',
    reject: 'Reject Application',
    approvalBlocked: 'A Business License document is required before approval.',
  },
  status: {
    pending: 'Pending Approval',
    approved: 'Approved',
    rejected: 'Rejected',
  },
  company: {
    title: 'Company Legal Profile',
    userId: (userId: number) => `User ID: #${userId}`,
    companyName: 'Company Name',
    taxCode: 'Tax Code',
    businessLicense: 'Business License Number',
    contactPhone: 'Contact Phone',
    businessAddress: 'Business Address',
    reviewedBy: 'Reviewed By (Administrator ID)',
    reviewedById: (reviewerId: number) => `#${reviewerId}`,
    reviewedAt: 'Reviewed At',
    rejectionReason: 'Rejection Reason',
  },
  documents: {
    title: 'Submitted Verification Documents',
    count: (count: number) => `${count} document(s) uploaded`,
    missingTitle: 'Mandatory Document Missing or Rejected',
    missingBody: 'Approval requires a valid Business License document.',
    missingLicense: 'Missing Business License document.',
    empty: 'No verification documents uploaded.',
    typeLabels: {
      BusinessLicense: 'Business License',
      TaxCode: 'Tax Code Certificate',
    } as Record<string, string>,
    status: {
      submitted: 'Submitted',
      approved: 'Approved',
      rejected: 'Rejected',
    },
    uploadedAt: (value: string) => `Uploaded: ${value}`,
    viewFile: 'View File',
    linkUnavailable: 'File link unavailable',
  },
  approve: {
    title: 'Approve Application',
    subtitle: 'Account Activation Confirmation',
    blockedTitle: 'Approval Blocked',
    blockedBody: 'The mandatory Business License document is missing or rejected.',
    question: (companyName: string) =>
      `Are you sure you want to approve the Tour Operator application for ${companyName}?`,
    effects: [
      'The user account status will change to Active.',
      'The operator approval status will change to Approved.',
      'Submitted documents will be marked as Approved.',
      'An audit log entry and an activation notification will be generated.',
    ],
    cancel: 'Cancel',
    confirm: 'Confirm Approval',
    successFallback: (companyName: string) => `Tour Operator "${companyName}" approved.`,
  },
  reject: {
    title: 'Reject Application',
    subtitle: (companyName: string) => `Application for "${companyName}"`,
    reasonLabel: 'Reason for Rejection',
    placeholder: 'Enter the specific reason to send to the applicant (for example, an invalid licence number or an expired document).',
    counter: (length: number, max: number) => `${length} / ${max} characters`,
    visibilityNote: 'The applicant will be able to view this reason and correct the application.',
    reasonRequired: 'Enter a rejection reason.',
    reasonTooLong: (max: number) => `The rejection reason must not exceed ${max} characters.`,
    cancel: 'Cancel',
    confirm: 'Confirm Rejection',
    successFallback: (companyName: string) => `Application rejected for "${companyName}".`,
  },
  toast: {
    dismiss: 'Dismiss notification',
  },
  reconcile: {
    title: 'Application details need to be refreshed',
    body: 'The decision was recorded, but the latest application details could not be loaded. Refresh before taking any further action.',
    retry: 'Refresh application',
  },
  errors: {
    loadTitle: 'Application Load Error',
    retry: 'Retry Loading',
    signIn: 'Sign in again',
    sessionExpired: 'Your administrator session has expired. Sign in again to continue.',
    forbidden: 'You do not have permission to access this function.',
    notFound: (userId: number) => `Tour Operator application #${userId} was not found.`,
    serviceUnavailable:
      'TripMate is temporarily unable to process your request. Please check your connection and try again.',
    network: 'Could not reach the application service. Please try again.',
    unconfirmed:
      'The result of this decision could not be confirmed. Refresh the application to check its current status.',
    unexpected: 'An unexpected error occurred. Please try again.',
  },
} as const;
