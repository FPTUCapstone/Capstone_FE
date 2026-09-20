export const POI_CATEGORY_PREVIEW_ENABLED = process.env.NODE_ENV !== 'production' && ['1', 'true'].includes(
  process.env.NEXT_PUBLIC_POI_CATEGORY_PREVIEW?.toLowerCase() ?? '',
);

// FIXTURE: visual preview only. These IDs are never rendered in the default production build.
export const POI_CATEGORY_PREVIEW_FIXTURES = [
  { id: 1, name: 'Danh lam & Di sản' },
  { id: 2, name: 'Thiên nhiên' },
  { id: 3, name: 'Bãi biển' },
  { id: 4, name: 'Văn hóa' },
] as const;
