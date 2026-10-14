export const landingContentEn = {
  errors: {
    required: 'This field is required.',
    // SRS_MESSAGE_GAP: the SRS has no message for these three cases yet.
    imageTooLarge: 'The image must not exceed 5 MB.',
    imageUnsupportedType: 'The image must be a JPEG, PNG or WebP file.',
    invalidPeriod: 'The display end date must not be before the display start date.',
    tourUnavailable: 'This tour package is currently unavailable for booking.',
    forbidden: 'You do not have permission to access this function.',
    unavailable:
      'TripMate is temporarily unable to process your request. Please check your connection and try again.',
    conflict: 'The landing page content changed since you opened it. Reload to continue.',
    validation: 'Some content is invalid. Check the highlighted fields and try again.',
  },
  screen: {
    eyebrow: 'Landing page content',
    title: 'Landing Page Content Management',
    description:
      'Edit the content shown on the public TripMate landing page. Saving a draft never changes the public page; only publishing does.',
    loading: 'Loading landing page content…',
    pendingBadge: 'Backend integration pending',
    pendingTitle: 'Landing page content is not connected yet',
    retry: 'Retry',
    reload: 'Reload',
  },
  editor: {
    hero: {
      title: 'Hero',
      headline: 'Headline',
      subHeadline: 'Sub-headline',
      backgroundImage: 'Background Image',
      ctaLabel: 'Call-to-action Label',
      ctaTarget: 'Call-to-action Target',
    },
    destinations: {
      title: 'Featured destinations',
      itemLabel: 'Destination',
      name: 'Name',
      image: 'Image',
      description: 'Description',
      add: 'Add destination',
      remove: 'Remove destination',
      moveUp: 'Move destination up',
      moveDown: 'Move destination down',
    },
    tours: {
      title: 'Featured tours',
      empty: 'No approved tours are available.',
      loadFailed: 'Approved tours could not be loaded.',
    },
    banner: {
      title: 'Promotional banner',
      image: 'Banner Image',
      link: 'Link',
      displayStart: 'Display start',
      displayEnd: 'Display end',
    },
    image: {
      choose: 'Choose image',
      remove: 'Remove image',
      uploading: 'Uploading…',
      none: 'No image selected.',
    },
    publishDialog: {
      title: 'Publish landing page content',
      body: 'Publishing makes this version visible on the public landing page. The current published version is kept in the version history.',
      confirm: 'Publish',
      cancel: 'Cancel',
    },
    actions: {
      publish: 'Publish',
      saveDraft: 'Save Draft',
      preview: 'Preview',
      hidePreview: 'Hide preview',
      cancel: 'Cancel',
    },
    preview: { title: 'Preview', note: 'This preview is not published.' },
  },
  versionPanel: {
    title: 'Versions',
    publishedHeading: 'Published version',
    versionLabel: 'Version',
    publishedBy: 'Published by',
    publishedAt: 'Published at',
    historyHeading: 'Version history',
    noHistory: 'No earlier versions.',
    restore: 'Restore Previous Version',
  },
  success: {
    draftSaved: 'Operation completed successfully.',
    // SRS_MESSAGE_GAP: MSG148 has no row in the SRS message table.
    published: 'The landing page content was published.',
  },
} as const;

export type ContentErrorKey = keyof typeof landingContentEn.errors;
