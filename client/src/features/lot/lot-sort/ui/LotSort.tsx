import { Icon } from '@/shared/ui'

import styles from './LotSort.module.css'

// TODO: заглушка — выбор сортировки пока не реализован
export const LotSort = () => (
  <button type="button" className={styles.trigger}>
    По времени
    <Icon name="downArrow" size={16} className={styles.arrow} />
  </button>
)
