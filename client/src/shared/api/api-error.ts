
export const apiErrorCodes = {
  networkError: 'network_error',
  unauthorized: 'unauthorized',
  invalidCode: 'invalid_code',
  codeExpired: 'code_expired',
  tooManyRequests: 'too_many_requests',
  validationError: 'validation_error',
  unknownError: 'unknown_error',
} as const

export type ApiErrorCode = string

export type ApiErrorBody = {
  error?: {
    code?: string
    message?: string
    details?: Record<string, string[]>
  }
}

export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  readonly details: Record<string, string[]> | undefined

  constructor(params: {
    status: number
    code?: ApiErrorCode
    message?: string
    details?: Record<string, string[]>
  }) {
    super(params.message ?? 'Не удалось выполнить запрос')
    this.name = 'ApiError'
    this.status = params.status
    this.code = params.code ?? apiErrorCodes.unknownError
    this.details = params.details
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError

/** Текст ошибки, который можно показать пользователю. */
export const getErrorMessage = (error: unknown, fallback = 'Что-то пошло не так. Попробуйте ещё раз'): string => {
  if (isApiError(error)) return error.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}
