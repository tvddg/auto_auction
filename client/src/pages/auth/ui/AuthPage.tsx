import { AuthPanel } from '@/widgets/auth-panel'
import { BrandIntro } from '@/widgets/brand-intro'

import styles from './AuthPage.module.css'

export const AuthPage = () => (
  <main className={styles.page}>
    <div className={styles.layout}>
      <BrandIntro className={styles.intro} />
      <div className={styles.separator} />
      <AuthPanel className={styles.panel} />
    </div>
  </main>
)
