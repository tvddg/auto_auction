const asBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined || value === '') return fallback
  return value === 'true' || value === '1'
}

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  enableApiMock: asBoolean(import.meta.env.VITE_ENABLE_API_MOCK, import.meta.env.DEV),
  isDev: import.meta.env.DEV,
} as const
