import { useNavigate } from 'react-router'

import { useCurrentUserQuery, useSessionUser } from '@/entities/session'
import { useLogout } from '@/features/auth/logout'
import { getErrorMessage } from '@/shared/api'
import { formatPhone, formatRubles, normalizePhoneDigits } from '@/shared/lib'
import { Button } from '@/shared/ui'
import { Header } from '@/widgets/header'
import { NavBar } from '@/widgets/nav-bar'

import styles from './ProfilePage.module.css'

const formatSince = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

/** /profile — данные аккаунта и выход. Маршрут закрыт RequireAuth, так что сессия здесь всегда есть. */
export const ProfilePage = () => {
  const user = useSessionUser()
  // Баланс мог измениться, пока профиль был закрыт, — перезапрашиваем при каждом открытии
  const currentUserQuery = useCurrentUserQuery({ refetchOnMount: 'always' })
  const logout = useLogout()
  const navigate = useNavigate()

  // Сначала уходим в каталог, потом выходим. Наоборот нельзя: после сброса сессии RequireAuth
  // уведёт на /auth и размонтирует страницу, а колбэки из mutate у размонтированного компонента
  // не вызываются. Сессию сбрасывает сам useLogout — его колбэки срабатывают и после ухода со страницы.
  const handleLogout = () => {
    navigate('/catalog', { replace: true })
    logout.mutate()
  }

  let content
  if (user) {
    const initial = (user.name || user.email).charAt(0).toUpperCase()

    content = (
      <>
        <div className={styles.identity}>
          <span className={styles.avatar} aria-hidden>{initial}</span>
          <div className={styles.identityText}>
            <h1 className={styles.name}>{user.name || 'Имя не указано'}</h1>
            <span className={styles.muted}>На площадке с {formatSince(user.createdAt)}</span>
          </div>
        </div>

        <section className={styles.balance}>
          <span className={styles.balanceLabel}>Баланс</span>
          <span className={styles.balanceValue}>{formatRubles(user.depositCents)}</span>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>Контакты</h2>
          <dl className={styles.list}>
            <div className={styles.row}>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div className={styles.row}>
              <dt>Телефон</dt>
              <dd>{formatPhone(normalizePhoneDigits(user.phone))}</dd>
            </div>
          </dl>
        </section>

        <Button variant="secondary" size="lg" fullWidth onClick={handleLogout}>
          Выйти
        </Button>
      </>
    )
  } else if (currentUserQuery.isError) {
    content = (
      <div className={styles.state}>
        <p>{getErrorMessage(currentUserQuery.error)}</p>
        <Button variant="secondary" onClick={() => currentUserQuery.refetch()}>Повторить</Button>
      </div>
    )
  } else {
    // После перезагрузки токен уже есть, а профиль ещё грузится
    content = <p className={styles.state}>Загружаем профиль…</p>
  }

  return (
    <>
      <Header />
      <main className={styles.page}>{content}</main>
      <NavBar />
    </>
  )
}
