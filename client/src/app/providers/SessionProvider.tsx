import { useQueryClient } from '@tanstack/react-query'
import { useEffect, type PropsWithChildren } from 'react'

import { useCurrentUserQuery, useSessionStore } from '@/entities/session'
import { authToken, onUnauthorized } from '@/shared/api'

export const SessionProvider = ({ children }: PropsWithChildren) => {
  const queryClient = useQueryClient()

  // Проверяем сохранённую сессию при старте: мёртвый токен без живой refresh-cookie
  // даст 401 → emitUnauthorized → сброс сессии, и закрытые разделы отправят на вход
  useCurrentUserQuery()

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
