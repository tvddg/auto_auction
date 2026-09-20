import { useQueryClient } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'

import { useSessionStore } from '@/entities/session'
import { authToken, onUnauthorized } from '@/shared/api'

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    const dropSession = () => {
      useSessionStore.getState().reset()
      queryClient.clear()
    }

    const unsubscribeUnauthorized = onUnauthorized(dropSession)
    const unsubscribeToken = authToken.subscribe((token) => {
      if (token === null) dropSession()
    })

    return () => {
      unsubscribeUnauthorized()
      unsubscribeToken()
    }
  }, [queryClient])

  return children
}
