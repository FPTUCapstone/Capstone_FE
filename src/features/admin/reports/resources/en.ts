export const statisticalReportsEn = {
  metadata: {
    title: 'Statistical Reports | TripMate Admin Console',
    description:
      'Generate and export aggregated platform statistics from closed reporting periods.',
  },
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
      'Only a verified active Administrator session may generate and export platform statistical reports.',
    unverifiedSessionNotice:
      'Your administration session could not be verified against the Backend authentication boundary. Please sign in again with an active Administrator account.',
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
    groupAriaLabel: 'Reporting data source status',
    productionModeHeading: 'Production Reporting Workspace',
    demoModeHeading: 'Non-Production Demo Fixture Workspace (?demo=true)',
    productionBadge: 'Pending Backend Integration',
    demoBadge: 'DEMO FIXTURE DATA — Not Production Authority',
    productionNotice:
      'Backend statistical aggregation, accounting-period closure verification, and report export endpoints are not yet connected on this environment. Production mode preserves your requested criteria without fabricating platform statistics or generating synthetic export files.',
    demoNotice:
      'Development-only Demo mode (?demo=true) uses deterministic closed and open period fixtures to preview all five report types, closed-period validation, chart/table rendering, and DEMO-watermarked export workflows.',
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
    draftResetAnnouncement:
      'Draft report criteria reset to last applied configuration.',
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
  periods: {
    production: {
      '2026-09': 'September 2026 (01/09/2026 – 30/09/2026)',
      '2026-08': 'August 2026 (01/08/2026 – 31/08/2026)',
      '2026-07': 'July 2026 (01/07/2026 – 31/07/2026)',
      '2026-Q3': 'Q3 2026 (01/07/2026 – 30/09/2026)',
      '2026-Q2': 'Q2 2026 (01/04/2026 – 30/06/2026)',
      '2025': 'FY 2025 (01/01/2025 – 31/12/2025)',
      '2024': 'FY 2024 (01/01/2024 – 31/12/2024)',
    },
    demo: {
      '2026-09': 'September 2026 (01/09/2026 – 30/09/2026 • Closed Fixture)',
      '2026-08': 'August 2026 (01/08/2026 – 31/08/2026 • Closed Fixture)',
      '2026-07': 'July 2026 (01/07/2026 – 31/07/2026 • Closed Fixture)',
      '2026-10-OPEN': 'October 2026 (01/10/2026 – Present • Current Open Month Fixture)',
      '2026-Q3': 'Q3 2026 (01/07/2026 – 30/09/2026 • Closed Fixture)',
      '2026-Q2': 'Q2 2026 (01/04/2026 – 30/06/2026 • Closed Fixture)',
      '2026-Q4-OPEN': 'Q4 2026 (01/10/2026 – Present • Current Open Quarter Fixture)',
      '2025': 'FY 2025 (01/01/2025 – 31/12/2025 • Closed Fixture)',
      '2024': 'FY 2024 (01/01/2024 – 31/12/2024 • Closed Fixture)',
      '2026-OPEN': 'FY 2026 (01/01/2026 – Present • Current Open Year Fixture)',
    },
  },
  units: {
    vndSuffix: 'VND',
  },
  filters: {
    allOperatorsLabel: 'All Tour Operators',
    allDestinationsLabel: 'All Destinations',
    productionDynamicFiltersNotice:
      'Dynamic Tour Operator and Destination filters will become available after Backend reporting integration.',
    demoOperators: {
      'OP-101': 'Central Heritage Journeys',
      'OP-102': 'Danang Coastal Expeditions',
      'OP-103': 'Highland Eco Trails',
      'OP-104': 'Mekong Artisan Tours (Zero Activity Period)',
    },
    demoDestinations: {
      'DEST-DAD': 'Da Nang',
      'DEST-HOI': 'Hoi An',
      'DEST-HUE': 'Hue',
      'DEST-DLI': 'Da Lat',
      'DEST-VCS': 'Con Dao (No Recorded Activity)',
    },
    bookingTypes: {
      ALL: 'All Booking Types',
      TOUR_PACKAGE: 'Tour Package Bookings',
      COMMERCIAL_SERVICE: 'Commercial Service Bookings',
    },
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
      'Your requested report criteria have been preserved. Authoritative accounting-period closure verification, live platform statistical aggregation, and file export will become active once the Backend reporting endpoint is deployed. No synthetic figures are displayed in Production mode.',
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
    appliedPeriodPrefix: 'Period:',
    appliedOperatorPrefix: 'Operator:',
    appliedDestinationPrefix: 'Destination:',
    appliedBookingTypePrefix: 'Booking Type:',
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
  reportTemplates: {
    emptyTableHeaders: [
      'Segment',
      'Primary Metric',
      'Secondary Metric',
      'Status / Share',
    ] as const,
    PLATFORM_REVENUE: {
      chartUnitLabel: 'Net Revenue (VND)',
      tableHeaders: [
        'Revenue Segment',
        'Confirmed + Completed Gross (VND)',
        'Recorded Refunds (VND)',
        'Net Revenue (VND)',
      ] as const,
      segmentSecondaryLabel: 'Confirmed + Completed Net',
      segments: {
        culturalHeritage: 'Cultural & Heritage Tours',
        coastalIsland: 'Coastal & Island Packages',
        highlandEco: 'Highland & Eco Experiences',
      },
      metrics: {
        netPlatformRevenue: {
          label: 'Net Platform Revenue',
          contextNote: 'Confirmed + Completed bookings minus recorded refunds (Demo)',
        },
        confirmedGross: {
          label: 'Confirmed Bookings Gross',
          contextNote: 'Verified confirmed booking settlements in period',
        },
        completedGross: {
          label: 'Completed Bookings Gross',
          contextNote: 'Fulfilled completed trip and tour settlements',
        },
        recordedRefunds: {
          label: 'Recorded Refunds Deducted',
          contextNote: 'Processed traveler refund deductions in period',
        },
      },
    },
    USER_GROWTH: {
      chartUnitLabel: 'Registered Accounts',
      tableHeaders: [
        'Registration Channel',
        'New Accounts',
        'Verified Active Accounts',
        'Period Share',
      ] as const,
      segmentSecondaryLabel: 'Verified Accounts',
      segments: {
        directWeb: 'Direct Web Registrations',
        mobileApp: 'Mobile App Registrations',
        partnerReferral: 'Partner & Referral Sign-Ups',
      },
      metrics: {
        totalNewAccounts: {
          label: 'Total New Registrations',
          contextNote: 'Combined Traveler and Tour Operator sign-ups (Demo)',
        },
        newTravelers: {
          label: 'New Traveler Accounts',
          contextNote: 'Registered travelers during closed period',
        },
        newOperators: {
          label: 'New Tour Operator Accounts',
          contextNote: 'Partner onboarding registrations in period',
        },
        verifiedActive: {
          label: 'Verified Active Accounts',
          contextNote: 'Completed email verification and active status',
        },
      },
    },
    BOOKING_VOLUME: {
      chartUnitLabel: 'Bookings Count',
      tableHeaders: [
        'Booking Status Category',
        'Booking Count',
        'Associated Value (VND)',
        'Settlement State',
      ] as const,
      segments: {
        completed: 'Completed Bookings',
        confirmed: 'Confirmed Bookings',
        cancelledRefunded: 'Cancelled & Refunded',
      },
      settlementStates: {
        fulfilled: 'Fulfilled',
        activeConfirmed: 'Active Confirmed',
        refundRecorded: 'Refund Recorded',
      },
      metrics: {
        totalBookings: {
          label: 'Total Recorded Bookings',
          contextNote: 'All booking transactions in closed period (Demo)',
        },
        completedBookings: {
          label: 'Completed Bookings',
          contextNote: 'Fulfilled departures and services',
        },
        confirmedBookings: {
          label: 'Confirmed Bookings',
          contextNote: 'Paid and scheduled confirmed bookings',
        },
        settledBookingValue: {
          label: 'Net Settled Booking Value',
          contextNote: 'Net VND booking value after refunds',
        },
      },
    },
    OPERATOR_PERFORMANCE: {
      chartUnitLabel: 'Net Settled Volume (VND)',
      tableHeaders: [
        'Tour Operator',
        'Fulfilled Departures',
        'Completion Rate',
        'Net Settled Volume (VND)',
      ] as const,
      completionSuffix: 'Completion',
      segments: {
        op101: 'Central Heritage Journeys',
        op102: 'Danang Coastal Expeditions',
        op103: 'Highland Eco Trails',
      },
      metrics: {
        activeOperators: {
          label: 'Evaluated Tour Operators',
          contextNote: 'Approved operators included in report scope (Demo)',
        },
        fulfilledDepartures: {
          label: 'Fulfilled Tour Departures',
          contextNote: 'Departures completed without operational incident',
        },
        completionRate: {
          label: 'Average Completion Rate',
          contextNote: 'Ratio of completed to scheduled departures',
        },
        operatorNetRevenue: {
          label: 'Net Settled Tour Volume',
          contextNote: 'Confirmed + Completed bookings net of refunds',
        },
      },
    },
    DESTINATION_POPULARITY: {
      chartUnitLabel: 'Completed Traveler Visits',
      tableHeaders: [
        'Destination',
        'Completed Visits',
        'Itinerary Inclusions',
        'Associated Net Revenue (VND)',
      ] as const,
      segments: {
        daNang: 'Da Nang',
        hoiAn: 'Hoi An',
        hue: 'Hue',
        daLat: 'Da Lat',
      },
      metrics: {
        completedVisits: {
          label: 'Completed Traveler Visits',
          contextNote: 'Verified completed trip visits across POIs (Demo)',
        },
        itineraryInclusions: {
          label: 'Itinerary POI Inclusions',
          contextNote: 'Times destination POIs were scheduled in itineraries',
        },
        topDestination: {
          label: 'Leading Destination',
          contextNote: 'Highest combined booking and itinerary share',
        },
        associatedRevenue: {
          label: 'Associated Net Booking Value',
          contextNote: 'Confirmed + Completed bookings net of refunds',
        },
      },
    },
  },
  exportArtifact: {
    fileNamePrefix: 'DEMO-TripMate',
    watermarkHeader: '[DEMO FIXTURE EXPORT — NOT PRODUCTION ACCOUNTING DATA]',
    reportTypePrefix: 'Report Type',
    closedPeriodPrefix: 'Closed Period',
    appliedFiltersPrefix: 'Applied Filters',
    operatorKeyLabel: 'Operator',
    destinationKeyLabel: 'Destination',
    bookingTypeKeyLabel: 'BookingType',
    exportFormatPrefix: 'Export Format',
    exportedDatePrefix: 'Exported Date (Asia/Ho_Chi_Minh)',
    sectionDivider: '---',
    columnSeparator: ' | ',
    auditRecordPrefix: 'DEMO Audit Record: StatisticalReportExported',
    auditReportTypeKey: 'ReportType',
    auditPeriodKey: 'Period',
    auditFormatKey: 'Format',
    auditDateKey: 'Date',
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
