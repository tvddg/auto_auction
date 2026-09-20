import type { AuthIntent } from '@/entities/session'
import { SegmentedControl } from '@/shared/ui'

import { usePhoneLoginStore } from '../model/phone-login.store'

const options = [
  { value: 'login', label: 'Вход' },
  { value: 'register', label: 'Регистрация' },
] as const satisfies ReadonlyArray<{ value: AuthIntent; label: string }>

export const AuthIntentTabs = ({ className }: { className?: string }) => {
  const intent = usePhoneLoginStore((state) => state.intent)
  const setIntent = usePhoneLoginStore((state) => state.setIntent)

  return (
    <SegmentedControl
      className={className}
      aria-label="Вход или регистрация"
      value={intent}
      options={options}
      onChange={setIntent}
    />
  )
}
