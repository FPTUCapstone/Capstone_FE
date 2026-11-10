/**
 * Centralized English resources for Tour Operator Finance workspace (UC-44, UC-45, UC-46).
 * Adheres strictly to CR-09 (100% English UI, zero hard-coded presentation strings).
 */

export const financeEn = {
  nav: {
    brandTitle: 'TripMate',
    roleBadge: 'Operator',
    demoBadge: 'Demo',
    verifiedPartner: 'Verified Partner',
    dashboard: 'Dashboard',
    tours: 'Tour Packages',
    coupons: 'Discount Coupons',
    bookings: 'Customer Bookings',
    revenue: 'Revenue & Analytics',
    payouts: 'Payout Settlement',
    signOut: 'Sign Out',
  },

  revenue: {
    formulaDecisionStatus: 'SRS_FINANCIAL_FORMULA_DECISION_PENDING',
    title: 'Revenue & Analytics',
    subtitle:
      'Review gross revenue, platform commission, completed refunds, and net earnings for your tour packages.',
    demoNoticeTitle: 'Demo Finance Mode Active',
    demoNoticeDesc:
      'Financial metrics displayed below are non-authoritative estimates calculated from deterministic demo fixtures for testing. The SRS formula conflict between revenue reporting and payout settlement remains pending Product/BA decision; authoritative production calculations require backend verification.',
    pendingNoticeTitle: 'Backend Integration Pending',
    refreshBtn: 'Refresh',
    tourFiltersLoading: 'Loading tour filters…',
    tourFiltersError: 'Unable to load tour filters. Please try again.',
    retryTourFiltersBtn: 'Retry tour filters',
    lastUpdatedPrefix: 'Updated',
    lastUpdatedNever: 'Not loaded yet',

    filters: {
      title: 'Filter Criteria',
      startDate: 'Start Date',
      endDate: 'End Date',
      granularity: 'Period Granularity',
      granularityDaily: 'Daily',
      granularityWeekly: 'Weekly',
      granularityMonthly: 'Monthly',
      tourPackage: 'Tour Package',
      allTours: 'All Tour Packages',
      applyBtn: 'Apply Filters',
      resetBtn: 'Reset',
      exportBtn: 'Export Report',
    },

    summary: {
      grossRevenue: 'Gross Revenue',
      grossRevenueHelp: 'Verified booking payments before commission',
      platformCommission: 'Platform Commission',
      platformCommissionHelp: 'Platform fee ({rate}% rate)',
      netAmount: 'Net Amount',
      netAmountHelp: 'Gross revenue minus commission and refunds',
      totalBookings: 'Total Bookings',
      totalBookingsHelp: 'Confirmed and completed customer bookings',
      totalParticipants: 'Total Participants',
      totalParticipantsHelp: 'Total travelers across eligible bookings',
      refundedAmount: 'Refunded Amount',
      refundedAmountHelp: 'Completed customer refunds within this period',
    },

    settlement: {
      title: 'Settlement Breakdown',
      subtitle: 'How gross revenue becomes your net payout for this period.',
      grossRevenue: 'Gross Revenue',
      discountsGiven: 'Discounts Given',
      paymentsReceived: 'Payments Received',
      refundedAmount: 'Refunded Amount',
      netSales: 'Net Sales',
      platformCommission: 'Platform Commission',
      netPayout: 'Net Payout',
      formulaHint: 'Payments Received − Refunds − Commission = Net Payout',
    },

    chart: {
      title: 'Revenue Trend',
      subtitle: 'Revenue, refunds, and net earnings over the selected period.',
      emptyChart: 'No revenue records to display in trend chart for this period.',
      toggleTable: 'Toggle Chart Data Table',
      periodHeader: 'Period',
      grossHeader: 'Gross Revenue',
      refundsHeader: 'Refunds',
      netHeader: 'Net Amount',
      bookingsHeader: 'Bookings',
      ariaChartLabel: 'Revenue trend chart over selected period',
    },

    detailTable: {
      title: 'Tour Package Breakdown',
      subtitle: 'Financial breakdown aggregated by tour package.',
      colTour: 'Tour Package',
      colBookings: 'Bookings',
      colParticipants: 'Participants',
      colGross: 'Gross Revenue',
      colRefunded: 'Refunded',
      colCommission: 'Commission',
      colNet: 'Net Amount',
      empty: 'No tour packages generated revenue within the selected criteria.',
      showingRange: 'Showing {start} to {end} of {total} tour packages',
      pageIndicator: 'Page {page} of {totalPages}',
      prevBtn: 'Previous',
      nextBtn: 'Next',
    },
  },

  exportDialog: {
    title: 'Export Revenue Report',
    subtitle:
      'Download financial report matching currently applied filters for accounting and reconciliation.',
    closeDialogAria: 'Close dialog',
    appliedSummaryTitle: 'Applied Filter Summary',
    filterPeriod: 'Period Range',
    filterGranularity: 'Granularity',
    filterTour: 'Tour Scope',
    allToursLabel: 'All Tour Packages',
    formatLabel: 'Export File Format',
    formatXlsxOnly: 'Excel Spreadsheet (.xlsx)',
    demoNotSupportedNotice:
      'Export requires the live backend integration and is unavailable while previewing with Demo mode data.',
    scopeLabel: 'Content Scope',
    scopeSummary: 'Summary metrics only',
    scopeSummaryHelp: 'Summary metrics cards only',
    scopeDetailed: 'Summary and tour package details',
    scopeDetailedHelp:
      'Includes summary metrics and full per-tour itemized breakdown',
    exportBtn: 'Export File',
    exportingBtn: 'Generating Export…',
    cancelBtn: 'Cancel',
    closeBtn: 'Close',
    queuedTitle: 'Export Queued',
    queuedDesc:
      'This report is large and is being generated in the background. Check Export History below once it is ready.',
  },

  exportHistory: {
    title: 'Export History',
    subtitle: 'Your recent revenue report exports, newest first.',
    refreshBtn: 'Refresh History',
    colRequested: 'Requested',
    colStatus: 'Status',
    colExpires: 'Expires',
    colActions: 'Actions',
    statusQueued: 'Queued',
    statusProcessing: 'Processing',
    statusReady: 'Ready',
    statusFailed: 'Failed',
    statusExpired: 'Expired',
    downloadBtn: 'Download',
    downloadingBtn: 'Downloading…',
    retryBtn: 'Retry',
    empty: 'No exports yet. Use Export Report above to create one.',
  },

  // The UC-46 "available balance" / settlement-months / payout-request-history sections were
  // removed along with that model (DAILY-PAYOUT-TRANSFER). Only the beneficiary bank account
  // block remains; the new model's settlement history lives in a separate feature
  // (src/features/operator/payout-settlements), not this finance workspace resource file.
  payouts: {
    title: 'Beneficiary Bank Account',
    subtitle: 'Manage the bank account that receives your automatic daily settlement transfers.',
    demoNoticeTitle: 'Demo Payout Mode Active',
    demoNoticeDesc:
      'The bank account below operates on deterministic demo fixtures for testing. Local demo edits are not persisted to production.',

    bank: {
      title: 'Beneficiary Bank Account',
      subtitle: 'Bank account configured for receiving automatic payout transfers.',
      accountHolder: 'Account Holder',
      bankName: 'Bank Name',
      accountNumber: 'Account Number',
      notSet: 'Not set',
      editBtn: 'Edit Bank Details',
      saveBtn: 'Save Bank Details',
      cancelBtn: 'Cancel',
      savedSuccess: 'Beneficiary bank details updated successfully.',
      accountNumberPlaceholder: 'Enter new account number',
    },
  },

  messages: {
    MSG01: 'Please complete all required fields.',
    MSG29: 'End date must be on or after start date.',
    MSG115: 'Revenue report generated successfully.',
    MSG116: 'Revenue report exported successfully.',
    MSG117: 'Failed to generate export file. Please retry.',
    MSG126: 'Access denied. You can only view and manage financial data for your own tour packages.',
    MSG127: 'An unexpected system error occurred. Please retry your request.',
    MSG128: 'No financial records match the selected criteria.',
    MSG129: 'Operation completed successfully.',
    MSG106: 'Download was interrupted. The file remains available in export history.',
    PENDING_BE_INTEGRATION:
      'Finance and payout services are pending backend API integration. No financial values are fabricated in production.',
    BACKEND_INTEGRATION_PENDING: 'Backend integration pending',
    DEMO_ASYNC_EXPORT_SIMULATION:
      'Demo UI simulation only. No background export job was created and no notification will be sent. Genuine asynchronous exporting is pending backend integration.',
  },
} as const;
