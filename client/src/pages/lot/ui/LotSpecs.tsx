import { bodyTypeLabels, driveTypeLabels, transmissionLabels } from '@/entities/car'
import type { LotDetail } from '@/entities/lot'
import { TintedIcon, type IconName } from '@/shared/ui'

import { formatEngine } from '../lib/format'
import styles from './LotPage.module.css'

type Spec = { icon: IconName; label: string; value: string }

/** «Характеристики»: четыре главных — плитками с иконками, остальное — списком. */
export const LotSpecs = ({ car }: { car: LotDetail['carInfo'] }) => {
  const main: Spec[] = [
    { icon: 'calendar', label: 'Год', value: String(car.year) },
    { icon: 'speed', label: 'Пробег', value: `${car.mileage.toLocaleString('ru-RU')} км` },
    { icon: 'gear', label: 'КПП', value: transmissionLabels[car.transmission] },
    { icon: 'driveType', label: 'Привод', value: driveTypeLabels[car.driveType] },
  ]

  const rest: [string, string][] = [
    ['Двигатель', formatEngine(car)],
    ['Мощность', `${car.horsePower} л.с.`],
    ['Кузов', bodyTypeLabels[car.bodyType]],
    ['Цвет', car.color],
    ['VIN', car.vin],
  ]

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Характеристики</h2>

      <div className={styles.specsGrid}>
        {main.map((spec) => (
          <div key={spec.label} className={styles.specCell}>
            <TintedIcon name={spec.icon} size={22} className={styles.specIcon} />
            <div>
              <div className={styles.specLabel}>{spec.label}</div>
              <div className={styles.specValue}>{spec.value}</div>
            </div>
          </div>
        ))}
      </div>

      <dl className={styles.specList}>
        {rest.map(([label, value]) => (
          <div key={label} className={styles.specRow}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
