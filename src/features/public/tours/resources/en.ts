export const devTourSearchCopy = {
  title: 'Tour Search V2 — Development',
  notice: 'Functional test only. Semantic ranking has no relevance threshold; hybrid uses experimental RRF configuration. This is not production search.',
  keyword: 'What experience are you looking for?', destination: 'Destination', startDate: 'Start date', endDate: 'End date',
  minPrice: 'Minimum price (VND)', maxPrice: 'Maximum price (VND)', durationDays: 'Duration (days)',
  category: 'Category', minimumRating: 'Minimum rating', sort: 'Sort order', mode: 'Search mode', pageSize: 'Results per page',
  allCategories: 'All active categories', defaultSort: 'Backend default', search: 'Search tours', reset: 'Reset filters',
  results: 'Search results', loading: 'Searching tours…', empty: 'No matching tours.', retry: 'Retry search',
  categoryFailure: 'Categories could not be loaded. Retry to load the active server catalogue.', retryCategories: 'Retry categories',
  invalidResponse: 'The development server returned an invalid search response.',
  unavailable: 'Development search is temporarily unavailable. Please retry.',
  invalidFilters: 'The search filters are invalid.',
  requestFailed: 'Development search could not return complete results. Please retry after the corpus and vectors are verified.',
  ratingUnknown: 'Not yet rated', rating: 'Rating',
} as const;

export const DEV_SEARCH_ERRORS: Readonly<Record<string, string>> = {
  'DevSearch.CorpusTooLarge': 'The semantic test corpus exceeds 256 tours. No partial results were returned.',
  'DevSearch.IndexIncomplete': 'Vectors are missing, stale, or use an incompatible model. No partial results were returned.',
  'DevSearch.InvalidVector': 'The vector data is invalid. No partial results were returned.',
  'DevSearch.InvalidCandidates': 'The vector candidate set is invalid. No partial results were returned.',
  'DevSearch.DependencyUnavailable': 'The embedding or vector service is unavailable. No partial results were returned.',
  'DevSearch.SqlUnavailable': 'SQL validation is unavailable. No unverified results were returned.',
};
