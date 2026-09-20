import { useMutation, useQueryClient } from '@tanstack/react-query'

import { logout, useSessionStore } from '@/entities/session'

export const useLogout = () => {
  const queryClient = useQueryClient()
  const reset = useSessionStore((state) => state.reset)

  return useMutation({
    mutationFn: () => logout(),
    onSettled: () => {
      reset()
      queryClient.clear()
    },
  })
}
