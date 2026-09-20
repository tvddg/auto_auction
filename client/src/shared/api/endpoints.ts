
export const apiEndpoints = {
  auth: {
    requestOtp: '/auth/otp',
    verifyOtp: '/auth/otp/verify',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
  },
} as const
