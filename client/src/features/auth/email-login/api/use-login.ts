import { useMutation, useQueryClient } from '@tanstack/react-query'

import { login, sessionKeys, useSessionStore, type LoginDto } from '@/entities/session'

export const useLogin = () => {
  const queryClient = useQueryClient()
  const signIn = useSessionStore((state) => state.signIn)

  return useMutation({
    mutationFn: (dto: LoginDto) => login(dto),
    onSuccess: (result) => {
      signIn({ accessToken: result.accessToken, user: result.user })
      queryClient.setQueryData(sessionKeys.currentUser(), result.user)
    },
  })
}
