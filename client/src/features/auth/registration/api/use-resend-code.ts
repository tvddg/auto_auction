import { useMutation } from '@tanstack/react-query'

import { resendRegistrationCode } from '@/entities/session'

import { useRegistrationStore } from '../model/registration.store'

/** Повторная отправка кода по той же заявке: сервер сам следит за интервалом. */
export const useResendCode = () => {
  const goToCodeStep = useRegistrationStore((state) => state.goToCodeStep)

  return useMutation({
    mutationFn: (registrationId: string) => resendRegistrationCode(registrationId),
    onSuccess: (challenge) => goToCodeStep(challenge),
  })
}
