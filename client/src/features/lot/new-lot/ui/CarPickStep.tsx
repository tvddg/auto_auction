import { useState } from 'react'

import { formatCarSpecs, formatCarTitle, useCarSearchQuery, type Car } from '@/entities/car'
import { getErrorMessage } from '@/shared/api'
import { cn, useDebouncedValue, useNavigateKeepingState } from '@/shared/lib'
import { Button, SearchField } from '@/shared/ui'

import { newLotPaths } from '../lib/steps'
import { useActiveDraft } from '../model/use-active-draft'
import styles from './NewLot.module.css'
import { StepHeader } from './StepHeader'

const SEARCH_DEBOUNCE_MS = 300

/** Шаг 1: выбрать машину из справочника или перейти к созданию своей. */
export const CarPickStep = () => {
  const { draft, update } = useActiveDraft()
  const navigate = useNavigateKeepingState()

  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS)
  const search = useCarSearchQuery(debouncedQuery)

  const selectCar = (car: Car) => {
    update({ car: { id: car.id, title: formatCarTitle(car), specs: formatCarSpecs(car) } })
    navigate(newLotPaths.details(draft.id))
  }

  let results
  if (search.isPending) {
    results = <p className={styles.muted}>Ищем…</p>
  } else if (search.isError) {
    results = <p className={styles.muted}>{getErrorMessage(search.error)}</p>
  } else if (search.data.length === 0) {
    results = <p className={styles.muted}>Ничего не нашли. Добавьте машину сами — это займёт минуту.</p>
  } else {
    results = (
      <ul className={styles.list}>
        {search.data.map((car) => (
          <li key={car.id}>
            <button
              type="button"
              className={cn(styles.card, car.id === draft.car?.id && styles.cardSelected)}
              onClick={() => selectCar(car)}
            >
              <span className={styles.cardTitle}>{formatCarTitle(car)}</span>
              <span className={styles.muted}>{formatCarSpecs(car)}</span>
            </button>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className={styles.step}>
      <StepHeader caption="Шаг 1 из 4" title="Машина" backTo={newLotPaths.root} />

      {draft.car && (
        <div className={styles.notice}>
          <div>
            <div className={styles.cardTitle}>{draft.car.title}</div>
            <div className={styles.muted}>{draft.car.specs}</div>
          </div>
          <Button onClick={() => navigate(newLotPaths.details(draft.id))}>Продолжить с этой машиной</Button>
        </div>
      )}

      <SearchField
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Марка, модель или комплектация"
        aria-label="Поиск машины в справочнике"
        autoFocus
      />

      {results}

      <div className={styles.notice}>
        <span className={styles.muted}>Нет подходящей машины?</span>
        <Button variant="secondary" onClick={() => navigate(newLotPaths.carNew(draft.id))}>
          Добавить свою
        </Button>
      </div>
    </div>
  )
}
