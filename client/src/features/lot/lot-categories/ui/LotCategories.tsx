import { cn } from '@/shared/lib'

import { LOT_CATEGORIES, useLotCategory } from '../model/lot-category'
import styles from './LotCategories.module.css'

export const LotCategories = () => {
  const [category, setCategory] = useLotCategory()

  return (
    <div className={styles.root} role="tablist" aria-label="Категории лотов">
      {LOT_CATEGORIES.map((option) => {
        const isActive = option.value === category

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={cn(styles.tab, isActive && styles.active)}
            onClick={() => setCategory(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
