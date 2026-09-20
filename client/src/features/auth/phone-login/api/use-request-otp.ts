import { useMutation } from '@tanstack/react-query'

import { requestOtp, type RequestOtpDto } from '@/entities/session'

import { usePhoneLoginStore } from '../model/phone-login.store'

export const useRequestOtp = () => {
  const startCodeStep = usePhoneLoginStore((state) => state.startCodeStep)

  return useMutation({
    mutationFn: (dto: RequestOtpDto) => requestOtp(dto),
    onSuccess: (challenge) => startCodeStep(challenge),
  })
}
