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
    title: 'Revenue & Analytics',
    subtitle:
      'Review gross revenue, platform commission, completed refunds, and net earnings for your tour packages.',
    demoNoticeTitle: 'Demo Finance Mode Active',
    demoNoticeDesc:
      'Financial metrics displayed below are calculated from deterministic demo fixtures for testing. Authoritative calculations in production are server-verified.',
    pendingNoticeTitle: 'Backend Integration Pending',

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
    formatXlsx: 'Excel Spreadsheet (.xlsx)',
    formatCsv: 'CSV Document (.csv)',
    formatPdf: 'PDF Document (.pdf)',
    csvFormatSupportedBadge: 'Real CSV Download',
    binaryFormatPendingBadge: 'Pending Binary Export Integration',
    binaryFormatPendingNotice:
      'Binary Excel (.xlsx) and PDF (.pdf) generation is pending backend export integration. In Demo mode, only CSV (.csv) triggers a downloadable file.',
    productionExportDisabledNotice:
      'Export is unavailable in Production mode until backend revenue export integration is complete.',
    scopeLabel: 'Content Scope',
    scopeSummary: 'Summary metrics only',
    scopeSummaryHelp: 'Summary metrics cards only',
    scopeDetailed: 'Summary and tour package details',
    scopeDetailedHelp:
      'Includes summary metrics and full per-tour itemized breakdown',
    simulateAsyncLabel: 'Simulate Large Async Export (Demo UI Preview)',
    simulateAsyncHelp:
      'Local UI preview only. Genuine background export jobs are pending backend integration.',
    exportBtn: 'Export File',
    exportingBtn: 'Generating Export…',
    cancelBtn: 'Cancel',
    asyncTitle: 'Demo Async Export Simulation',
    asyncDesc:
      'Demo UI simulation only. No background export job was created and no notification will be sent. Genuine asynchronous exporting is pending backend integration.',
    demoWatermarkNotice:
      'DEMO: This file was generated in demo mode for UI validation purposes only.',
  },

  payouts: {
    title: 'Payout Settlement',
    subtitle:
      'Review closed settlement periods, beneficiary bank details, and track payout request history.',
    demoNoticeTitle: 'Demo Payout Mode Active',
    demoNoticeDesc:
      'Settlement calculations and payout requests below operate on deterministic demo fixtures. Production transactions require server-side gateway processing.',
    pendingNoticeTitle: 'Backend Integration Pending',

    periods: {
      title: 'Settlement Periods',
      subtitle: 'Closed accounting periods eligible for payout requests.',
      colPeriod: 'Settlement Period',
      colCompletedTours: 'Completed Tours',
      colGross: 'Gross Revenue',
      colCommission: 'Commission',
      colPayable: 'Payable Net Amount',
      colStatus: 'Period Status',
      colAction: 'Action',
      statusClosed: 'Closed',
      statusOpen: 'Open (Ongoing)',
      btnRequestPayout: 'Request Payout',
      badgePending: 'Pending Confirmation',
      badgeSettled: 'Settled',
      ineligibleHelp: 'Requires a closed period with at least 1 completed tour',
      belowMinHelp: 'Payable amount must be at least 5,000,000 ₫',
      pendingExistsHelp: 'A payout request is already pending for this period',
      emptyPeriods: 'No settlement periods available for this account.',
    },

    bank: {
      title: 'Beneficiary Bank Account',
      subtitle: 'Bank account configured for receiving payout settlements.',
      accountHolder: 'Account Holder',
      bankName: 'Bank Name',
      accountNumber: 'Account Number',
      editBtn: 'Edit Bank Details',
      saveBtn: 'Save Bank Details',
      cancelBtn: 'Cancel',
      savedSuccess: 'Beneficiary bank details updated successfully.',
    },

    history: {
      title: 'Payout Request History',
      subtitle: 'Track submitted payout requests and administrative settlement status.',
      colRequestCode: 'Request Code',
      colPeriod: 'Period',
      colRequestedAmount: 'Requested Amount',
      colStatus: 'Status',
      colRequestedDate: 'Requested Date',
      colSettledDate: 'Settled Date',
      colActions: 'Actions',
      btnCancelRequest: 'Cancel Request',
      statusPending: 'Pending Confirmation',
      statusSettled: 'Settled',
      statusRejected: 'Rejected',
      statusCancelled: 'Cancelled',
      emptyHistory: 'No payout requests have been submitted yet.',
    },
  },

  requestDialog: {
    title: 'Submit Payout Request',
    subtitle:
      'Review payable settlement amount and confirm payout submission for administrator confirmation.',
    periodLabel: 'Selected Period',
    completedToursLabel: 'Completed Tours',
    grossRevenueLabel: 'Gross Revenue',
    commissionLabel: 'Platform Commission',
    payableAmountLabel: 'Payable Net Amount',
    payableAmountNotice:
      'The payable payout amount is computed from verified bookings reduced by commission and completed refunds. This amount is server-authoritative and cannot be modified.',
    bankConfirmationTitle: 'Destination Bank Account',
    confirmCheckbox:
      'I confirm the beneficiary bank information is correct and request settlement for this closed period.',
    submitBtn: 'Confirm Payout Request',
    submittingBtn: 'Submitting Request…',
    cancelBtn: 'Cancel',
  },

  cancelDialog: {
    title: 'Cancel Payout Request',
    subtitle:
      'Are you sure you want to cancel payout request {code} for {amount}?',
    explanation:
      'Once cancelled, this payout request will be closed and the settlement period will become eligible for a new payout request.',
    confirmBtn: 'Confirm Cancellation',
    cancellingBtn: 'Cancelling…',
    keepBtn: 'Keep Request',
  },

  messages: {
    MSG01: 'Please complete all required fields.',
    MSG29: 'End date must be on or after start date.',
    MSG115: 'Revenue report generated successfully.',
    MSG116: 'Revenue report exported successfully.',
    MSG117: 'Failed to generate export file. Please retry.',
    MSG118: 'Payout request submitted successfully and placed in administrator confirmation queue.',
    MSG119: 'A payout request for this settlement period is already pending confirmation.',
    MSG120: 'Payable amount is below the configured minimum payout threshold of 5,000,000 ₫.',
    MSG126: 'Access denied. You can only view and manage financial data for your own tour packages.',
    MSG127: 'An unexpected system error occurred. Please retry your request.',
    MSG128: 'No financial records match the selected criteria.',
    MSG129: 'Payout request cancelled successfully. The settlement period is now requestable again.',
    MSG106: 'Download was interrupted. The file remains available in export history.',
    PENDING_BE_INTEGRATION:
      'Finance and payout services are pending backend API integration. No financial values are fabricated in production.',
    DEMO_ASYNC_EXPORT_SIMULATION:
      'Demo UI simulation only. No background export job was created and no notification will be sent. Genuine asynchronous exporting is pending backend integration.',
  },
} as const;
