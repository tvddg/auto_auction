import { useIsAuthenticated } from '@/entities/session'
import { OAuthProviders } from '@/features/auth/oauth-login'
import { AuthIntentTabs, PhoneLoginForm } from '@/features/auth/phone-login'
import { cn } from '@/shared/lib'
import { Divider } from '@/shared/ui'

import styles from './AuthPanel.module.css'
import { SessionSummary } from './SessionSummary'

export const AuthPanel = ({ className }: { className?: string }) => {
  const isAuthenticated = useIsAuthenticated()

  if (isAuthenticated) {
    return (
      <div className={cn(styles.root, className)}>
        <SessionSummary />
      </div>
    )
  }

  return (
    <div className={cn(styles.root, className)}>
      <AuthIntentTabs />
      <PhoneLoginForm />

      <Divider label="или" />
      <OAuthProviders />

      <p className={styles.legal}>
        Продолжая, вы принимаете правила площадки. Ставка — юридически значимое действие.
      </p>
    </div>
  )
}
