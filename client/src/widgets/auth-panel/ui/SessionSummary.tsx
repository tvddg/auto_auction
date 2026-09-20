import { useCurrentUserQuery, useSessionUser } from '@/entities/session'
import { useLogout } from '@/features/auth/logout'
import { formatPhone, normalizePhoneDigits } from '@/shared/lib'
import { Button } from '@/shared/ui'

import styles from './SessionSummary.module.css'


export const SessionSummary = () => {
  const user = useSessionUser()
  const currentUserQuery = useCurrentUserQuery()
  const logoutMutation = useLogout()

  const phone = user?.phone ?? ''

  return (
    <section className={styles.root}>
      <h2 className={styles.title}>Вы вошли</h2>
      <p className={styles.phone}>{phone ? formatPhone(normalizePhoneDigits(phone)) : '—'}</p>
      <p className={styles.meta}>
        {currentUserQuery.isPending
          ? 'Загружаем профиль…'
          : 'Профиль загружен. Сессия продлевается автоматически через cookie.'}
      </p>

      <Button variant="secondary" onClick={() => logoutMutation.mutate()} loading={logoutMutation.isPending}>
        Выйти
      </Button>
    </section>
  )
}
