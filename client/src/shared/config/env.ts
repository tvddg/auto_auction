export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  cableUrl: import.meta.env.VITE_CABLE_URL ?? '/cable',
  isDev: import.meta.env.DEV,
} as const
