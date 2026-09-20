import { useCurrentUserQuery, useSessionUser } from '@/entities/session'
import { useLogout } from '@/features/auth/logout'
import { formatPhone, normalizePhoneDigits } from '@/shared/lib'
import { Button } from '@/shared/ui'

import styles from './SessionSummary.module.css'

export const SessionSummary = () => {
  const user = useSessionUser()
  const currentUserQuery = useCurrentUserQuery()
  const logoutMutation = useLogout()

  return (
    <section className={styles.root}>
      <h2 className={styles.title}>Вы вошли</h2>
      <p className={styles.email}>{user?.email ?? '—'}</p>
      <p className={styles.meta}>
        {user?.phone ? `Телефон ${formatPhone(normalizePhoneDigits(user.phone))} подтверждён. ` : ''}
        {currentUserQuery.isPending
          ? 'Загружаем профиль…'
          : 'Сессия продлевается автоматически через cookie.'}
      </p>

      <Button variant="secondary" onClick={() => logoutMutation.mutate()} loading={logoutMutation.isPending}>
        Выйти
      </Button>
    </section>
  )
}
