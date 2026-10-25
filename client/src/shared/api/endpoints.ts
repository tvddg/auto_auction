export const apiEndpoints = {
  auth: {
    login: '/auth/login',
    registration: '/auth/registration',
    registrationResend: '/auth/registration/resend',
    registrationConfirm: '/auth/registration/confirm',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  lots: {
    list: '/lot',
    byId: (id: string) => `/lot/${encodeURIComponent(id)}`,
    bids: (id: string) => `/lot/${encodeURIComponent(id)}/bids`,
  },
  bids: {
    create: '/bid',
    mine: '/my/bids',
  },
  photos: {
    upload: '/photo',
  },
  cars: {
    list: '/car',
    byId: (id: string) => `/car/${encodeURIComponent(id)}`,
  },
} as const
