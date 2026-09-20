import { cn } from '@/shared/lib'
import { Icon } from '@/shared/ui'

import styles from './BrandIntro.module.css'

const features = [
  { icon: 'guard', label: 'Проверка ПТС' },
  { icon: 'redClock', label: 'Антиснайпинг' },
] as const

export const BrandIntro = ({ className }: { className?: string }) => (
  <header className={cn(styles.root, className)}>
    <div className={styles.logo}>
      <Icon name="car" size={24} />
    </div>

    <h1 className={styles.title}>Автоторг</h1>

    <p className={styles.subtitle}>
      Аукцион автомобилей. Ставки от частных лиц, дилеров и корпоративных продавцов.
    </p>

    <ul className={styles.features}>
      {features.map((feature) => (
        <li key={feature.label} className={styles.feature}>
          <Icon name={feature.icon} size={16} />
          {feature.label}
        </li>
      ))}
    </ul>
  </header>
)
