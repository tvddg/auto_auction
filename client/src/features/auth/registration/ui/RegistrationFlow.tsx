import { useRegistrationStore } from '../model/registration.store'

import { RegistrationCodeStep } from './RegistrationCodeStep'
import { RegistrationForm } from './RegistrationForm'

export const RegistrationFlow = ({ className }: { className?: string }) => {
  const step = useRegistrationStore((state) => state.step)

  return step === 'credentials' ? (
    <RegistrationForm className={className} />
  ) : (
    <RegistrationCodeStep className={className} />
  )
}
