export const adminRoutesEn = {
  directory: {
    eyebrow: 'Master Data Governance',
    title: 'Route Master Data',
    description:
      'Manage system route corridors, transit paths, and distance metrics between active Points of Interest used by scheduling and discovery algorithms.',
    createRouteButton: 'Create Route',
    pendingBadge: 'Backend integration pending',
    pendingTitle: 'Route catalog operations are not connected yet',
    pendingDescription:
      'The route directory, route creation, and route updating will be available after the Route Master Data Backend contracts are deployed.',
    searchLabel: 'Search routes',
    searchPlaceholder: 'Search by origin or destination POI is unavailable until Backend integration',
    filterLabel: 'Transport Mode filter',
    filterPlaceholder: 'All transport modes',
    emptyTitle: 'No routes available',
    emptyDescription:
      'Routes will appear here once connected to the Route Master Data service.',
    returnToDashboardLabel: 'Return to Administration Dashboard',
  },
  create: {
    eyebrow: 'Route Authoring',
    title: 'Create Route',
    description:
      'Define a new transportation route between two active Points of Interest with distance, estimated travel time, and transport mode.',
    pendingBadge: 'Backend integration pending',
    pendingDescription:
      'Route creation, active Point of Interest lookup, and map polyline calculation will be available after the Route Master Data API is deployed.',
    form: {
      originLabel: 'Origin Point of Interest',
      originPlaceholder: 'Active Origin POI selection unavailable until Backend integration',
      destinationLabel: 'Destination Point of Interest',
      destinationPlaceholder: 'Active Destination POI selection unavailable until Backend integration',
      distanceLabel: 'Distance (km)',
      distancePlaceholder: 'e.g., 28.5',
      durationLabel: 'Estimated Travel Time (minutes)',
      durationPlaceholder: 'e.g., 45',
      modeLabel: 'Transport Mode',
      modeOptions: {
        driving: 'Driving (Car / Taxi)',
        motorcycle: 'Motorcycle / Scooter',
        transit: 'Public Transit / Shuttle Bus',
        walking: 'Walking / Pedestrian',
      },
      noteLabel: 'Route Note',
      notePlaceholder: 'Road conditions, tolls, scenic highlights, or transit notes',
      mapPreviewLabel: 'Route Map Preview',
      mapPreviewPendingTitle: 'Interactive route map preview is pending Backend & map service integration',
      mapPreviewPendingDescription:
        'Origin/Destination coordinates and turn-by-turn polyline rendering require active POI records and the Route Master Data service.',
      submitDisabledLabel: 'Create Route (Unavailable)',
      cancelLabel: 'Cancel',
    },
    backToDirectoryLabel: 'Back to Route Master Data',
  },
  update: {
    eyebrow: 'Route Management',
    title: 'Update Route',
    pendingBadge: 'Backend integration pending',
    pendingDescription:
      'Route details, endpoint updates, and status transitions will be available after the Route Master Data API is deployed.',
    requestedRouteIdLabel: 'Requested Route ID',
    operationsLabel: 'Route Governance Operations',
    deactivateUnavailableLabel: 'Deactivate Route unavailable',
    activateUnavailableLabel: 'Activate Route unavailable',
    backToDirectoryLabel: 'Back to Route Master Data',
    submitDisabledLabel: 'Save Changes (Unavailable)',
  },
} as const;
