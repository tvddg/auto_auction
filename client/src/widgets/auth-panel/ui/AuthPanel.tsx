import { useState } from 'react'

import { useIsAuthenticated } from '@/entities/session'
import { EmailLoginForm } from '@/features/auth/email-login'
import { RegistrationFlow, useRegistrationStore } from '@/features/auth/registration'
import { cn } from '@/shared/lib'
import { SegmentedControl } from '@/shared/ui'

import styles from './AuthPanel.module.css'
import { SessionSummary } from './SessionSummary'

type AuthMode = 'login' | 'register'

const modes = [
  { value: 'login', label: 'Вход' },
  { value: 'register', label: 'Регистрация' },
] as const satisfies ReadonlyArray<{ value: AuthMode; label: string }>

export const AuthPanel = ({ className }: { className?: string }) => {
  const isAuthenticated = useIsAuthenticated()
  const [mode, setMode] = useState<AuthMode>('login')
  const resetRegistration = useRegistrationStore((state) => state.reset)

  if (isAuthenticated) {
    return (
      <div className={cn(styles.root, className)}>
        <SessionSummary />
      </div>
    )
  }

  const handleModeChange = (next: AuthMode) => {
    if (next !== mode) 
        resetRegistration()
    setMode(next)
  }

  return (
    <div className={cn(styles.root, className)}>
      <SegmentedControl
        aria-label="Вход или регистрация"
        value={mode}
        options={modes}
        onChange={handleModeChange}
      />

      {mode === 'login' ? <EmailLoginForm /> : <RegistrationFlow />}

      <p className={styles.legal}>
        Продолжая, вы принимаете правила площадки. Ставка — юридически значимое действие.
      </p>
    </div>
  )
}
