/**
 * English resource strings for Tour Operator Coupon Management (UC-38, UC-39, Screen #81, #82, #83).
 * Follows Report 3 SRS V2 CR-09 (English UI & resource file requirement).
 * Business rule and application message codes are decoupled from UI copy per SRS internal conflict remediation.
 */
export const couponEn = {
  metadata: {
    title: 'Coupon Management | Tour Operator Workspace',
    description: 'Create and manage promotional coupons and discount campaigns for tour packages.',
  },
  list: {
    title: 'Coupon Management',
    description: 'Create and manage promotional coupons for your tour packages.',
    createButton: 'Create Coupon',
    kpi: {
      total: 'Total Coupons',
      totalSubtext: 'Across all statuses',
      active: 'Active Coupons',
      activeSubtext: 'Available for immediate booking',
      redemptions: 'Total Redemptions',
      redemptionsSubtext: 'Customer bookings completed',
      occupied: 'Occupied coupon slots',
      occupiedSubtext: 'Bookings awaiting payment and paid bookings',
    },
    filterTabs: {
      all: 'All',
      active: 'Active',
      scheduled: 'Scheduled',
      inactive: 'Inactive',
      ariaLabel: 'Coupon status filter',
    },
    table: {
      codeAndName: 'Code & Campaign Name',
      discount: 'Discount',
      usageProgress: 'Usage Progress',
      validityPeriod: 'Validity Period',
      scope: 'Tour Scope',
      status: 'Status',
      actions: 'Actions',
      usagesCount: '{count} used',
      usagesLimit: '{limit} max',
      occupiedCount: '{count} occupied',
      unlimited: 'Unlimited',
      allTours: 'All Tour Packages',
      toursCount: '{count} tour packages',
      editAction: 'Edit',
    },
    pagination: {
      showing: 'Showing {start} to {end} of {total} coupons',
      previous: 'Previous',
      next: 'Next',
      page: 'Page {current} of {total}',
    },
    empty: {
      title: 'No coupons found',
      description: 'No coupons match the selected filter criteria.',
    },
    authorizationRequired: 'Only approved tour operators can manage coupons.',
    loadError: 'Unable to load coupons.',
    retry: 'Retry',
    banners: {
      productionTitle: 'Production Mode — PENDING_BE_INTEGRATION',
      productionBody:
        'Backend coupon management endpoints are currently under development. The workspace operates in truthful read-only mode without mocking or state loss.',
    },
  },
  statuses: {
    active: 'Active',
    scheduled: 'Scheduled',
    inactive: 'Inactive',
    expired: 'Expired',
    unknown: 'Unknown',
  },
  create: {
    title: 'Create Coupon',
    subtitle: 'Configure discount conditions and eligible tours for travelers.',
    backAria: 'Return to promotional coupons list',
    sections: {
      general: 'General Information',
      discount: 'Discount Terms',
      validity: 'Validity Period & Limits',
      scope: 'Eligible Tour Scope',
    },
    fields: {
      couponCode: 'Coupon Code',
      couponCodePlaceholder: 'e.g., SUMMER2026',
      couponCodeHelp: 'Unique uppercase alphanumeric code for travelers to enter at checkout.',
      name: 'Campaign Name',
      namePlaceholder: 'e.g., Early Summer Discount',
      nameHelp: 'Internal or display name describing the promotional campaign.',
      discountType: 'Discount Type',
      discountTypePercentage: 'Percentage (%)',
      discountTypeFlat: 'Fixed Amount (VND)',
      discountValue: 'Discount Value',
      discountValuePercentageHelp: 'Enter a percentage from 1 to 100.',
      discountValueFlatHelp: 'Enter fixed discount amount in VND.',
      maxDiscountAmount: 'Maximum Discount Amount (VND)',
      maxDiscountAmountPlaceholder: 'Optional cap (leave blank if unlimited)',
      maxDiscountAmountHelp: 'Maximum monetary cap applied when using percentage discount.',
      minSpend: 'Minimum Spend (VND)',
      minSpendPlaceholder: '0',
      minSpendHelp: 'Minimum booking subtotal required before coupon applies.',
      usageLimit: 'Total Usage Limit',
      usageLimitHelp: 'Total number of times this coupon can be redeemed across all travelers.',
      usageLimitPerTraveler: 'Per-Traveler Usage Limit',
      usageLimitPerTravelerPlaceholder: '1',
      usageLimitPerTravelerHelp: 'Maximum times an individual traveler account can redeem this coupon.',
      validFrom: 'Valid From',
      validTo: 'Valid To',
      appliesToAllTours: 'Apply to all tour packages owned by you',
      selectSpecificTours: 'Select specific tour packages',
      selectedToursCount: '{count} tours selected',
      noEligibleToursTitle: 'No eligible tours',
      noEligibleToursHelp:
        'At least one owned eligible tour package is required to create or update a coupon.',
    },
    actions: {
      cancel: 'Cancel',
      submit: 'Create Coupon',
      submitting: 'Creating Coupon...',
    },
    notices: {
      productionPending:
        'Backend coupon persistence is currently under development (PENDING_BE_INTEGRATION). Coupons cannot be saved to the live production database.',
      success: 'Coupon created successfully.',
      genericError: 'Failed to create coupon. Please review the form inputs.',
    },
  },
  update: {
    title: 'Edit Coupon {code}',
    subtitle: 'Update promotional rules and eligible tour packages.',
    backAria: 'Return to promotional coupons list',
    couponCodeNote: 'Coupon code cannot be changed after creation.',
    statusAction: {
      activate: 'Reactivate Coupon',
      deactivate: 'Deactivate Coupon',
      expiredBlocked: 'Coupon has expired — Cannot be reactivated',
    },
    actions: {
      sectionTitle: 'Actions',
      cancel: 'Cancel',
      save: 'Save Changes',
      saving: 'Saving Changes...',
      reloadLatest: 'Reload latest coupon and discard this draft',
    },
    formAriaLabel: 'Update coupon',
    readOnly: 'read-only',
    discountTypeLabel: 'Discount type',
    timezone: 'Asia/Ho_Chi_Minh',
    metrics: {
      occupied: 'Occupied coupon slots',
      limitMaximum: 'of {limit} maximum',
      remaining: 'Remaining usages',
      available: 'available redemptions',
      from: 'from {date}',
      unlimited: 'Unlimited',
    },
    usage: {
      unlimited: 'Unlimited',
      unlimitedPerTraveler: 'Unlimited per traveler',
      occupiedMinimum:
        'Minimum {count} occupied slots. Pending unpaid bookings can later release a slot.',
      redeemedMinimum: 'Minimum {count} already redeemed bookings.',
      currentlyFull:
        'This coupon currently has no available slots. A pending unpaid booking may release a slot if it expires or is cancelled.',
    },
    scopeSelection:
      '{count} currently eligible tour(s) selected. New tours are added only when you update this coupon again.',
    bookingPreservation: {
      title: 'Existing booking discounts are preserved',
      occupied:
        'Pending-payment and paid bookings occupy these slots. An unpaid booking that expires or is cancelled releases its slot. Changes to coupon terms affect only future bookings; existing booking discounts stay fixed.',
      redeemed:
        '{count} customer bookings have already used this coupon. Changes to coupon terms affect only future bookings; existing booking discounts stay fixed.',
    },
    notices: {
      success: 'Coupon updated successfully.',
      statusSuccess: 'Coupon status updated successfully.',
      genericError: 'Failed to update coupon. Please review the form inputs.',
      expiredExtension:
        'Coupon updated. Activate it separately before travelers can use it.',
    },
  },
  dialog: {
    deactivateTitle: 'Deactivate coupon {code}?',
    activateTitle: 'Reactivate coupon {code}?',
    deactivateDesc:
      'The coupon will be marked as Inactive and can no longer be applied to new bookings.',
    deactivateNotice:
      'Note: {count} customer bookings have already used this coupon. Previously applied discounts remain unchanged.',
    activateDesc:
      'The coupon will be marked as Active (or Scheduled based on dates) and travelers can resume using it during checkout.',
    cancelBtn: 'Cancel',
    confirmDeactivate: 'Confirm Deactivation',
    confirmActivate: 'Confirm Reactivation',
    processing: 'Processing...',
  },
  errors: {
    requiredField: 'This field is required.',
    requiredSummary: 'Please fill in all required fields.',
    duplicateCode: 'Coupon code already exists in the system.',
    invalidNumeric:
      'Discount value, usage limit, or minimum spend must be valid positive numbers.',
    invalidPercentage: 'Percentage discount cannot exceed 100%.',
    usageLimitBelowCount: 'Usage limit cannot be lower than the recorded redemptions count.',
    invalidValidityPeriod:
      'Invalid validity period. Start date must not be later than end date, and end date cannot be in the past.',
    expiredReactivationBlocked:
      'Cannot reactivate an expired coupon. Please update the end date before activating.',
    unauthorizedTourScope:
      'Selected tours include packages not owned by your tour operator account.',
    noEligibleTours:
      'No eligible tours available. At least one owned eligible tour package is required to configure a coupon.',
    unauthorizedOwner:
      'Access denied. You can only view and manage coupons for your own tour operator account.',
    selectAtLeastOneTour: 'Please select at least one tour package or apply to all tours.',
    systemError: 'A system error occurred. Please try again later.',
    notFound: 'The requested coupon was not found.',
    pendingBe: 'This feature is pending backend integration.',
    invalidVietnamDateTime: 'Enter a valid date and time in Vietnam time.',
  },
  page: {
    loadingList: 'Loading promotional coupons...',
    loadingForm: 'Loading coupon form...',
    loadingDetails: 'Loading coupon details...',
    loadingDefault: 'Loading...',
    unauthorizedTitle: 'Access Denied',
    notFoundTitle: 'Coupon Not Found',
    unableToLoadTitle: 'Unable to Load Coupon',
    backToList: 'Back to Coupons List',
    requestedId: 'Requested identifier: {id}',
  },
} as const;

export type CouponResources = typeof couponEn;
