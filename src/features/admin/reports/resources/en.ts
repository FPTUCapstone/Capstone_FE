export const statisticalReportsEn = {
  navigation: {
    brandAriaLabel: 'TripMate Admin Dashboard',
    navAriaLabel: 'Admin navigation',
    dashboard: 'Dashboard',
    tourReviews: 'Tour Reviews',
    statisticalReports: 'Statistical Reports',
    algorithmSettings: 'Algorithm Settings',
    auditLogs: 'Audit Logs',
    securityLabel: 'Security',
    securityTitle: 'Change administrator password',
    logoutError: 'Unable to sign out of the administration workspace. Please try again.',
  },
  accessDenied: {
    eyebrow: 'Administrator Access Only',
    title: 'Access Restricted',
    message: 'You do not have permission to access this function.',
    detail:
      'Only an active Administrator account may generate and export platform statistical reports.',
    returnToSignIn: 'Return to Administrator Sign In',
    returnToDashboard: 'Return to Workspace',
  },
  header: {
    eyebrow: 'Platform Governance & Business Intelligence',
    title: 'Statistical Reports',
    subtitle:
      'Generate and export aggregated platform statistics from completed, closed reporting periods across TripMate.',
    timezoneBadge: 'Timezone: Asia/Ho_Chi_Minh (dd/MM/yyyy)',
    currencyBadge: 'Currency: VND',
  },
  modeBanner: {
    groupAriaLabel: 'Reporting data source mode',
    productionTab: 'Production Mode (Live API)',
    demoTab: 'Interactive Demo Mode (Fixtures)',
    productionBadge: 'Pending Backend Integration',
    demoBadge: 'DEMO FIXTURE DATA — Not Production Authority',
    productionNotice:
      'Backend statistical aggregation and report export endpoints are not yet connected on this environment. Production mode preserves your selected criteria without fabricating platform statistics or generating synthetic export files.',
    demoNotice:
      'Interactive Demo mode uses deterministic closed-period fixture datasets to preview all five report types, closed-period validation, chart/table rendering, and DEMO-watermarked export workflows.',
  },
  criteriaForm: {
    sectionTitle: 'Report Criteria & Period Selection',
    sectionDescription:
      'Select a report type, a completed closed period, and optional filters, then select Generate Report.',
    reportTypeLegend: 'Report Type (Required)',
    reportTypeSelectLabel: 'Report Type',
    reportTypePlaceholder: 'Select a report type...',
    periodGranularityLegend: 'Period Granularity (Required)',
    periodSelectLabel: 'Reporting Period (Required)',
    periodPlaceholder: 'Select a reporting period...',
    optionalFiltersHeading: 'Optional Filters',
    operatorFilterLabel: 'Tour Operator',
    destinationFilterLabel: 'Destination',
    bookingTypeFilterLabel: 'Booking Type',
    generateButton: 'Generate Report',
    cancelButton: 'Cancel',
    draftModifiedNotice:
      'Draft criteria have been modified. The currently displayed report below still reflects your previously generated criteria until you select Generate Report again.',
    simulationHeading: 'Demo Failure Simulation Controls',
    simulateGenerationErrorLabel: 'Simulate system/network failure on next Generate Report',
    simulateExportErrorLabel: 'Simulate file generation failure on next Export',
  },
  reportTypes: {
    USER_GROWTH: {
      label: 'User Growth',
      description: 'New registrations, verified active accounts, and traveler vs operator onboarding.',
    },
    BOOKING_VOLUME: {
      label: 'Booking Volume',
      description: 'Completed, confirmed, and refunded bookings across tour packages and services.',
    },
    PLATFORM_REVENUE: {
      label: 'Platform Revenue',
      description:
        'Gross confirmed and completed booking value net of recorded refunds in VND.',
    },
    OPERATOR_PERFORMANCE: {
      label: 'Tour Operator Performance',
      description: 'Fulfilled departures, completion rates, and net settled booking volume by partner.',
    },
    DESTINATION_POPULARITY: {
      label: 'Destination Popularity',
      description: 'Most visited destinations, itinerary inclusions, and confirmed traveler demand.',
    },
  },
  granularities: {
    CLOSED_MONTH: 'Closed Month',
    CLOSED_QUARTER: 'Closed Quarter',
    CLOSED_YEAR: 'Closed Year',
  },
  filters: {
    operators: [
      { id: 'ALL', label: 'All Tour Operators' },
      { id: 'OP-101', label: 'Central Heritage Journeys' },
      { id: 'OP-102', label: 'Danang Coastal Expeditions' },
      { id: 'OP-103', label: 'Highland Eco Trails' },
      { id: 'OP-104', label: 'Mekong Artisan Tours (Zero Activity Period)' },
    ],
    destinations: [
      { id: 'ALL', label: 'All Destinations' },
      { id: 'DEST-DAD', label: 'Da Nang' },
      { id: 'DEST-HOI', label: 'Hoi An' },
      { id: 'DEST-HUE', label: 'Hue' },
      { id: 'DEST-DLI', label: 'Da Lat' },
      { id: 'DEST-VCS', label: 'Con Dao (No Recorded Activity)' },
    ],
    bookingTypes: [
      { id: 'ALL', label: 'All Booking Types' },
      { id: 'TOUR_PACKAGE', label: 'Tour Package Bookings' },
      { id: 'COMMERCIAL_SERVICE', label: 'Commercial Service Bookings' },
    ],
  },
  validation: {
    requiredField: 'This field is required.',
    openPeriodRejected:
      'The selected period is not yet closed. A statistical report can only be generated and exported from a closed period so that reported figures cannot change after export.',
  },
  states: {
    idleTitle: 'Ready to Generate Statistical Report',
    idleDescription:
      'Configure your report type, closed period, and optional filters above, then select Generate Report to view aggregated summary figures and charts.',
    pendingBackendTitle: 'Pending Backend Statistical Aggregation Contract',
    pendingBackendDescription:
      'Your report criteria have been validated and preserved. Live platform statistical aggregation and file export will become active once the Backend reporting endpoint is deployed. No synthetic figures are displayed in Production mode.',
    noDataTitle: 'No Statistical Data Available',
    noDataMessage: 'No records found matching your criteria.',
    noDataDescription:
      'Your selected report type, closed period, and filters remain preserved above so you can adjust your filter scope and generate again.',
    generationErrorTitle: 'Unable to Aggregate Statistical Report',
    generationErrorMessage:
      'TripMate is temporarily unable to process your request. Please check your connection and try again.',
    retryGenerateButton: 'Retry Generate Report',
  },
  results: {
    appliedHeaderTitle: 'Generated Report Result',
    demoWatermarkBadge: 'DEMO STATISTICAL DATASET',
    appliedCriteriaSummaryLabel: 'Applied Report Scope',
    periodWindowLabel: 'Closed Period Window',
    generatedTimestampLabel: 'Generated On',
    summarySectionTitle: 'Aggregated Summary Figures',
    revenueFormulaTitle: 'Platform Revenue Calculation Breakdown (VND)',
    revenueFormulaNote:
      'Computed from Confirmed and Completed bookings, net of recorded refunds (Demo fixture calculation).',
    confirmedGrossLabel: 'Confirmed Bookings Gross',
    completedGrossLabel: 'Completed Bookings Gross',
    recordedRefundsLabel: 'Less Recorded Refunds',
    netPlatformRevenueLabel: 'Net Platform Revenue',
    chartSectionTitle: 'Visual Trend & Distribution Chart',
    chartSvgAriaLabel: 'Bar chart of aggregated platform statistics for the applied closed period',
    tableFallbackTitle: 'Accessible Tabular Data Breakdown',
    tableCaptionPrefix: 'Detailed tabular breakdown for',
    shareOfTotalSuffix: 'of period total',
  },
  exportPanel: {
    sectionTitle: 'Export Statistical Report',
    sectionDescription:
      'Export produces a file in the selected format reflecting the exact report type, closed period, and filters currently applied in the generated result.',
    formatLegend: 'Export Format',
    formatSelectLabel: 'Export Format',
    formats: {
      EXCEL: 'Excel (.xlsx)',
      CSV: 'CSV (.csv)',
      PDF: 'PDF (.pdf)',
    },
    exportButton: 'Export',
    retryExportButton: 'Retry Export',
    disabledProductionReason:
      'Export is unavailable in Production mode until the Backend statistical reporting endpoint is connected.',
    disabledNoGeneratedReportReason:
      'Generate a valid closed-period report with available records before exporting.',
    exportSuccessTitle: 'Demo Report Export Delivered',
    exportSuccessMessage:
      'The statistical report file has been generated from the currently displayed result and delivered.',
    exportErrorTitle: 'Export File Generation Failed',
    exportErrorMessage:
      'The report file could not be generated at this time. The displayed report result remains intact; please try again.',
    demoFileBadge: 'DEMO EXPORT FILE — NOT PRODUCTION ACCOUNTING DATA',
    fileNameLabel: 'Delivered File',
    auditEntryLabel: 'Recorded Audit Log Preview',
    previewHeading: 'Exported File Content Preview',
  },
} as const;
