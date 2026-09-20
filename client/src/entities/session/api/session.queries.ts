import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { useSessionStore } from '../model/session.store'

import { fetchCurrentUser } from './session.api'

export const sessionKeys = {
  root: ['session'] as const,
  currentUser: () => [...sessionKeys.root, 'current-user'] as const,
}

export const useCurrentUserQuery = () => {
  const isAuthenticated = useSessionStore((state) => state.status === 'authenticated')
  const setUser = useSessionStore((state) => state.setUser)

  const query = useQuery({
    queryKey: sessionKeys.currentUser(),
    queryFn: ({ signal }) => fetchCurrentUser(signal),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (query.data) setUser(query.data)
  }, [query.data, setUser])

  return query
}
