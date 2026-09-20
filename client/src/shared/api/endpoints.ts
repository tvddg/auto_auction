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
} as const
