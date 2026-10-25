import { useId } from 'react'

import { Icon } from '@/shared/ui'

import { useFiltersStore } from '../model/filters.store'
import { formatPriceRange, formatYearRange } from '../lib/format'
import styles from './LotFilters.module.css'
import { LotFiltersPanel } from './LotFiltersPanel'

export const LotFilters = () => {
  const panelId = useId()
  const brandsId = useFiltersStore((state) => state.brandsId)
  const minYear = useFiltersStore((state) => state.minYear)
  const maxYear = useFiltersStore((state) => state.maxYear)
  const minPrice = useFiltersStore((state) => state.minPrice)
  const maxPrice = useFiltersStore((state) => state.maxPrice)
  const unsetFilter = useFiltersStore((state) => state.unsetFilter)

  const brandsLabel = brandsId?.length ? brandsId.join(', ') : null
  const yearsLabel = formatYearRange(minYear, maxYear)
  const priceLabel = formatPriceRange(minPrice, maxPrice)

  const chips = [
    brandsLabel && {
      key: 'brands',
      label: brandsLabel,
      onRemove: () => unsetFilter('brandsId'),
    },
    yearsLabel && {
      key: 'years',
      label: yearsLabel,
      onRemove: () => {
        unsetFilter('minYear')
        unsetFilter('maxYear')
      },
    },
    priceLabel && {
      key: 'price',
      label: priceLabel,
      onRemove: () => {
        unsetFilter('minPrice')
        unsetFilter('maxPrice')
      },
    },
  ].filter((chip) => !!chip)

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.openButton}
        popoverTarget={panelId}
        aria-label={chips.length ? `Фильтры, выбрано: ${chips.length}` : 'Фильтры'}
      >
        <Icon name="filters" size={16} />
        {chips.length > 0 && <span className={styles.count}>{chips.length}</span>}
      </button>

      {chips.map((chip) => (
        <div key={chip.key} className={styles.chip}>
          <span>{chip.label}</span>
          <button
            type="button"
            className={styles.remove}
            onClick={chip.onRemove}
            aria-label={`Сбросить фильтр: ${chip.label}`}
          >
            ×
          </button>
        </div>
      ))}

      <LotFiltersPanel id={panelId} />
    </div>
  )
}
