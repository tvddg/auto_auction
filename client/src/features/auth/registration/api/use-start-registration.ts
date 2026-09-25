import { useMutation } from '@tanstack/react-query'
import { startRegistration, type StartRegistrationDto } from '@/entities/session'
import { useRegistrationStore } from '../model/registration.store'

/** Шаг 1: сервер проверяет email, пароль и телефон и высылает код. */
export const useStartRegistration = () => {
    const {goToCodeStep} = useRegistrationStore();

    return useMutation({
        mutationFn: (dto: StartRegistrationDto) => startRegistration(dto),
        onSuccess: (challenge) => goToCodeStep(challenge),
    })
}
