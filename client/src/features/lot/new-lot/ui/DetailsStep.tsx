import { useId, useState, type SubmitEvent } from 'react'

import { NavigateKeepingState, useNavigateKeepingState } from '@/shared/lib'
import { Button, DateTimePicker, FormField, TextInput } from '@/shared/ui'

import { hasErrors, minEndsAt, normalizeVin, onlyDigits, validateDetails, type FormErrors } from '../lib/form'
import { newLotPaths } from '../lib/steps'
import type { LotDetailsDraft } from '../model/drafts.store'
import { useActiveDraft } from '../model/use-active-draft'
import styles from './NewLot.module.css'
import { StepHeader } from './StepHeader'

type FieldOptions = {
  placeholder?: string
  normalize?: (value: string) => string
  maxLength?: number
}

/** Шаг 2: данные конкретного экземпляра и условия торгов. На сервер пока ничего не уходит. */
export const DetailsStep = () => {
  const { draft, update } = useActiveDraft()
  const navigate = useNavigateKeepingState()
  const fieldId = useId()
  const [errors, setErrors] = useState<FormErrors<LotDetailsDraft>>({})

  // Перескок по ссылке без выбранной машины — возвращаем на шаг 1
  if (!draft.car) return <NavigateKeepingState to={newLotPaths.car(draft.id)} />

  const details = draft.details

  const setField = (key: keyof LotDetailsDraft, value: string) => {
    update({ details: { [key]: value } })
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validateDetails(details)
    setErrors(nextErrors)
    if (!hasErrors(nextErrors)) navigate(newLotPaths.review(draft.id))
  }

  const field = (key: keyof LotDetailsDraft, label: string, options: FieldOptions = {}) => (
    <FormField label={label} htmlFor={`${fieldId}-${key}`} error={errors[key]}>
      <TextInput
        id={`${fieldId}-${key}`}
        value={details[key]}
        placeholder={options.placeholder}
        maxLength={options.maxLength}
        inputMode={options.normalize === onlyDigits ? 'numeric' : undefined}
        autoComplete="off"
        invalid={Boolean(errors[key])}
        onChange={(event) => setField(key, options.normalize ? options.normalize(event.target.value) : event.target.value)}
      />
    </FormField>
  )

  // Нижние границы: начало — не раньше текущего момента, окончание — не раньше чем через 3 дня после начала
  const dateField = (key: 'startsAt' | 'endsAt', label: string, min: Date) => (
    <FormField label={label} htmlFor={`${fieldId}-${key}`} error={errors[key]}>
      <DateTimePicker
        id={`${fieldId}-${key}`}
        dialogTitle={label}
        value={details[key]}
        min={min}
        invalid={Boolean(errors[key])}
        onChange={(value) => setField(key, value)}
      />
    </FormField>
  )

  return (
    <form className={styles.step} onSubmit={handleSubmit} noValidate>
      <StepHeader caption="Шаг 2 из 3" title="Объявление" backTo={newLotPaths.car(draft.id)} />

      <div className={styles.card}>
        <span className={styles.cardTitle}>{draft.car.title}</span>
        <span className={styles.muted}>{draft.car.specs}</span>
      </div>

      {field('vin', 'VIN', { placeholder: 'JTNB11HK103456789', normalize: normalizeVin, maxLength: 17 })}
      <div className={styles.row}>
        {field('mileage', 'Пробег, км', { placeholder: '87000', normalize: onlyDigits })}
        {field('color', 'Цвет', { placeholder: 'Чёрный' })}
      </div>
      <div className={styles.row}>
        {field('city', 'Город', { placeholder: 'Москва' })}
        {field('startingPrice', 'Стартовая цена, ₽', { placeholder: '1500000', normalize: onlyDigits })}
      </div>
      {dateField('startsAt', 'Начало торгов', new Date())}
      {dateField('endsAt', 'Окончание торгов', minEndsAt(details.startsAt))}

      <div className={styles.actions}>
        <Button type="submit" size="lg" trailing="→">
          К проверке
        </Button>
      </div>
    </form>
  )
}
