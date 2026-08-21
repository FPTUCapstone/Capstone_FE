export const ROUTES = {
  home: '/',
  admin: {
    login: '/admin/login',
    dashboard: '/admin',
    tourReviews: '/admin/tours/reviews',
    tourReview: (id: string) => `/admin/tours/reviews/${id}`,
  },
} as const;
