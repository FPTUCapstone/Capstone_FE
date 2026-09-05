export const ROUTES = {
  home: '/',
  signIn: '/sign-in',
  register: '/register',
  verifyAccount: '/verify-account',
  forgotPassword: '/forgot-password',
  partner: {
    register: '/partner/register',
    application: '/partner/application',
    resubmitApplication: '/partner/application/resubmit',
  },
  admin: {
    login: '/admin/login',
    forgotPassword: '/admin/forgot-password',
    dashboard: '/admin',
    tourReviews: '/admin/tours/reviews',
    tourReview: (id: string) => `/admin/tours/reviews/${id}`,
  },
} as const;
