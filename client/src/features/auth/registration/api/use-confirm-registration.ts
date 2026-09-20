import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  confirmRegistration,
  sessionKeys,
  useSessionStore,
  type ConfirmRegistrationDto,
} from '@/entities/session'

import { useRegistrationStore } from '../model/registration.store'

/** Шаг 2: верный код создаёт пользователя и сразу открывает сессию. */
export const useConfirmRegistration = () => {
  const queryClient = useQueryClient()
  const signIn = useSessionStore((state) => state.signIn)
  const reset = useRegistrationStore((state) => state.reset)

  return useMutation({
    mutationFn: (dto: ConfirmRegistrationDto) => confirmRegistration(dto),
    onSuccess: (result) => {
      signIn({ accessToken: result.accessToken, user: result.user })
      queryClient.setQueryData(sessionKeys.currentUser(), result.user)
      reset()
    },
  })
}
