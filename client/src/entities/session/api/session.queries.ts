import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { useSessionStore } from '../model/session.store'

import { fetchCurrentUser } from './session.api'

export const sessionKeys = {
  root: ['session'] as const,
  currentUser: () => [...sessionKeys.root, 'current-user'] as const,
}

/**
 * Профиль текущего пользователя. По умолчанию берётся из кеша (5 минут);
 * refetchOnMount: 'always' — для экранов, где важны свежие данные, например баланс в профиле.
 */
export const useCurrentUserQuery = ({ refetchOnMount }: { refetchOnMount?: 'always' } = {}) => {
  const isAuthenticated = useSessionStore((state) => state.status === 'authenticated')
  const setUser = useSessionStore((state) => state.setUser)

  const query = useQuery({
    queryKey: sessionKeys.currentUser(),
    queryFn: ({ signal }) => fetchCurrentUser(signal),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    refetchOnMount,
  })

  useEffect(() => {
    if (query.data) setUser(query.data)
  }, [query.data, setUser])

  return query
}
