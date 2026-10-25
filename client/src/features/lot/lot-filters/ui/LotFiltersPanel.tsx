import { useId, useRef, useState, type SubmitEvent, type ToggleEvent } from 'react'

import { Button, FormField, TextInput } from '@/shared/ui'

import { onlyDigits, parseDraft, toDraft, type FiltersDraft, type FiltersErrors } from '../lib/draft'
import { useFiltersStore } from '../model/filters.store'
import styles from './LotFiltersPanel.module.css'

type LotFiltersPanelProps = {
  id: string
}

/** Выпадающее окно фильтров. Открывается кнопкой с popoverTarget={id}. */
export const LotFiltersPanel = ({ id }: LotFiltersPanelProps) => {
  const panelRef = useRef<HTMLFormElement>(null)
  const brandsId = useId()
  const yearsId = useId()
  const priceId = useId()

  const [draft, setDraft] = useState<FiltersDraft>(() => toDraft(useFiltersStore.getState()))
  const [errors, setErrors] = useState<FiltersErrors>({})

  const update = (key: keyof FiltersDraft, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
    setErrors({})
  }

  // При каждом открытии начинаем с текущих фильтров: незаконченные правки не переживают закрытие
  const handleToggle = (event: ToggleEvent<HTMLFormElement>) => {
    if (event.newState !== 'open') return
    setDraft(toDraft(useFiltersStore.getState()))
    setErrors({})
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    const { values, errors: nextErrors } = parseDraft(draft)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    useFiltersStore.setState(values)
    panelRef.current?.hidePopover()
  }

  const handleReset = () => {
    useFiltersStore.getState().unsetAll()
    panelRef.current?.hidePopover()
  }

  const numberInput = (key: keyof FiltersDraft, placeholder: string, ariaLabel: string, inputId?: string) => (
    <TextInput
      id={inputId}
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder}
      aria-label={ariaLabel}
      value={draft[key]}
      className={styles.input}
      onChange={(event) => update(key, onlyDigits(event.target.value))}
    />
  )

  return (
    <form
      ref={panelRef}
      id={id}
      popover="auto"
      className={styles.panel}
      onToggle={handleToggle}
      onSubmit={handleSubmit}
      noValidate
    >
      <h2 className={styles.title}>Фильтры</h2>

      <FormField label="Марки" htmlFor={brandsId}>
        <TextInput
          id={brandsId}
          autoComplete="off"
          placeholder="Toyota, BMW"
          value={draft.brands}
          className={styles.input}
          onChange={(event) => update('brands', event.target.value)}
        />
      </FormField>

      <FormField label="Год выпуска" htmlFor={yearsId} error={errors.years}>
        <div className={styles.range}>
          {numberInput('minYear', 'от', 'Год выпуска от', yearsId)}
          {numberInput('maxYear', 'до', 'Год выпуска до')}
        </div>
      </FormField>

      <FormField label="Цена, ₽" htmlFor={priceId} error={errors.price}>
        <div className={styles.range}>
          {numberInput('minPrice', 'от', 'Цена от', priceId)}
          {numberInput('maxPrice', 'до', 'Цена до')}
        </div>
      </FormField>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={handleReset}>Сбросить</Button>
        <Button type="submit">Применить</Button>
      </div>
    </form>
  )
}
