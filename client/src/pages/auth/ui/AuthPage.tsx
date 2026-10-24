import { Navigate, useLocation } from 'react-router'

import { useIsAuthenticated } from '@/entities/session'
import { getReturnTo } from '@/shared/lib'
import { AuthPanel } from '@/widgets/auth-panel'
import { BrandIntro } from '@/widgets/brand-intro'

import styles from './AuthPage.module.css'

export const AuthPage = () => {
  const isAuthenticated = useIsAuthenticated()
  const location = useLocation()

  // После входа или регистрации — туда, откуда пришли (по умолчанию в каталог)
  if (isAuthenticated) return <Navigate to={getReturnTo(location.state)} replace />

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <BrandIntro className={styles.intro} />
        <div className={styles.separator} />
        <AuthPanel className={styles.panel} />
      </div>
    </main>
  )
}
