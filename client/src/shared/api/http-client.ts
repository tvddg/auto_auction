import { env } from '@/shared/config'

import { ApiError, apiErrorCodes, type ApiErrorBody } from './api-error'
import { authToken } from './auth-token'
import { apiEndpoints } from './endpoints'
import { mockFetch } from './mock'
import { emitUnauthorized } from './unauthorized'

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export type RequestConfig = {
  method?: HttpMethod
  body?: unknown
  signal?: AbortSignal
  /** Подставлять ли Authorization: Bearer. По умолчанию — да. */
  withAuth?: boolean
  /** Пробовать ли обновить токен при 401. По умолчанию — да. */
  withRefresh?: boolean
}

const CSRF_COOKIE = 'XSRF-TOKEN'
const CSRF_HEADER = 'X-CSRF-Token'

const readCookie = (name: string): string | null => {
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null
}

const buildRequest = (path: string, config: RequestConfig): [string, RequestInit] => {
  const method = config.method ?? 'GET'
  const headers = new Headers({ Accept: 'application/json' })

  let body: string | undefined
  if (config.body !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(config.body)
  }

  if (config.withAuth !== false) {
    const token = authToken.get()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  if (method !== 'GET') {
    const csrfToken = readCookie(CSRF_COOKIE)
    if (csrfToken) headers.set(CSRF_HEADER, csrfToken)
  }

  return [
    `${env.apiBaseUrl}${path}`,
    {
      method,
      headers,
      body,
      signal: config.signal,
      // Cookie сессии (refresh-токен) ходят с каждым запросом.
      credentials: 'include',
    },
  ]
}

const sendRequest = async (path: string, config: RequestConfig): Promise<Response> => {
  const [url, init] = buildRequest(path, config)

  try {
    return env.enableApiMock ? await mockFetch(url, init) : await fetch(url, init)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError({
      status: 0,
      code: apiErrorCodes.networkError,
      message: 'Нет связи с сервером. Проверьте подключение',
    })
  }
}

let refreshRequest: Promise<boolean> | null = null

const refreshAccessToken = (): Promise<boolean> => {
  refreshRequest ??= (async () => {
    try {
      const response = await sendRequest(apiEndpoints.auth.refresh, {
        method: 'POST',
        withAuth: false,
        withRefresh: false,
      })
      if (!response.ok) return false

      const data = (await response.json()) as { accessToken?: string }
      if (!data.accessToken) return false

      authToken.set(data.accessToken)
      return true
    } catch {
      return false
    } finally {
      refreshRequest = null
    }
  })()

  return refreshRequest
}

const parseResponse = async <T>(response: Response): Promise<T> => {
  const isJson = response.headers.get('Content-Type')?.includes('application/json') ?? false
  const payload: unknown = response.status === 204 || !isJson ? null : await response.json()

  if (response.ok) return payload as T

  const error = (payload as ApiErrorBody | null)?.error
  throw new ApiError({
    status: response.status,
    code: error?.code ?? (response.status === 401 ? apiErrorCodes.unauthorized : apiErrorCodes.unknownError),
    message: error?.message,
    details: error?.details,
  })
}

export const apiRequest = async <T>(path: string, config: RequestConfig = {}): Promise<T> => {
  let response = await sendRequest(path, config)

  const canRetry = response.status === 401 && config.withRefresh !== false && config.withAuth !== false
  if (canRetry) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      response = await sendRequest(path, config)
    } else if (authToken.get()) {
      authToken.clear()
      emitUnauthorized()
    }
  }

  return parseResponse<T>(response)
}
