import { useMutation, useQueryClient } from '@tanstack/react-query'

import { sessionKeys, useSessionStore, verifyOtp, type VerifyOtpDto } from '@/entities/session'

import { usePhoneLoginStore } from '../model/phone-login.store'

export const useVerifyOtp = () => {
  const queryClient = useQueryClient()
  const signIn = useSessionStore((state) => state.signIn)
  const resetForm = usePhoneLoginStore((state) => state.reset)

  return useMutation({
    mutationFn: (dto: VerifyOtpDto) => verifyOtp(dto),
    onSuccess: (result) => {
      signIn({ accessToken: result.accessToken, user: result.user })
      queryClient.setQueryData(sessionKeys.currentUser(), result.user)
      resetForm()
    },
  })
}
