export const adminRoutesEn = {
  directory: {
    eyebrow: 'Master Data Governance',
    title: 'Route Master Data',
    description:
      'Manage system route corridors, transit paths, and distance metrics used by scheduling and discovery algorithms.',
    createRouteButton: 'Create New Route',
    pendingBadge: 'Backend integration pending',
    pendingTitle: 'Route catalog operations are not connected yet',
    pendingDescription:
      'The route directory, route creation, and route updating will be available after their Backend contracts are deployed.',
    searchLabel: 'Search routes',
    searchPlaceholder: 'Search is unavailable until Backend integration',
    filterLabel: 'Mode filter',
    filterPlaceholder: 'All transportation modes',
    returnToStaffLabel: 'Return to Staff Workspace',
    emptyTitle: 'No routes available',
    emptyDescription:
      'Routes will appear here once connected to the Route Master Data service.',
  },
  create: {
    eyebrow: 'Route Authoring',
    title: 'Create New Route',
    description:
      'Define a new transportation corridor between key origins, waypoints, and destinations.',
    pendingBadge: 'Backend integration pending',
    pendingDescription:
      'Route creation will persist to the database once the Route Master Data API is connected.',
    form: {
      nameLabel: 'Route Name',
      namePlaceholder: 'e.g., Da Nang Airport to Hoi An Ancient Town',
      originLabel: 'Origin Location',
      originPlaceholder: 'Starting point coordinates or address',
      destinationLabel: 'Destination Location',
      destinationPlaceholder: 'Ending point coordinates or address',
      modeLabel: 'Transportation Mode',
      modeOptions: {
        driving: 'Driving (Car / Taxi)',
        motorcycle: 'Motorcycle / Scooter',
        transit: 'Public Transit / Shuttle Bus',
        walking: 'Walking / Pedestrian',
      },
      distanceLabel: 'Estimated Distance (km)',
      distancePlaceholder: 'e.g., 28.5',
      durationLabel: 'Estimated Duration (minutes)',
      durationPlaceholder: 'e.g., 45',
      descriptionLabel: 'Route Description / Notes',
      descriptionPlaceholder: 'Road conditions, tolls, scenic highlights, or restrictions',
      activeLabel: 'Active for Scheduling Algorithms',
      submitDisabledLabel: 'Save Route (Unavailable)',
      cancelLabel: 'Cancel',
    },
    backToDirectoryLabel: 'Back to Route Master Data',
  },
  update: {
    eyebrow: 'Route Management',
    title: 'Update Route',
    pendingBadge: 'Backend integration pending',
    pendingDescription:
      'Route details and updates will be available after the Route Master Data API is deployed.',
    requestedRouteIdLabel: 'Requested Route ID',
    backToDirectoryLabel: 'Back to Route Master Data',
    submitDisabledLabel: 'Save Changes (Unavailable)',
  },
} as const;
