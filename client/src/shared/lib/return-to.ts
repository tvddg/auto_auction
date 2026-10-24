/** Куда вернуть пользователя после входа: передаётся в state при переходе на /auth. */
export type ReturnToState = { returnTo: string }

export const DEFAULT_RETURN_TO = '/catalog'

type LocationLike = { pathname: string; search: string; hash: string }

export const buildReturnToState = (location: LocationLike): ReturnToState => ({
  returnTo: `${location.pathname}${location.search}${location.hash}`,
})

/** Принимает только внутренние пути и не возвращает обратно на /auth. */
export const getReturnTo = (state: unknown): string => {
  const value = (state as Partial<ReturnToState> | null)?.returnTo

  const isInternal = typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
  if (!isInternal || value === '/auth' || value.startsWith('/auth/') || value.startsWith('/auth?')) return DEFAULT_RETURN_TO

  return value
}
