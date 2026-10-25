import { useId, useState, type SubmitEvent } from 'react'

import {
  BODY_TYPES,
  bodyTypeLabels,
  DRIVE_TYPES,
  driveTypeLabels,
  formatCarSpecs,
  formatCarTitle,
  FUEL_TYPES,
  fuelTypeLabels,
  TRANSMISSIONS,
  transmissionLabels,
  type Car,
} from '@/entities/car'
import { getFieldError, getFormError } from '@/shared/api'
import { useNavigateKeepingState } from '@/shared/lib'
import { Button, FormError, FormField, SelectInput, TextInput } from '@/shared/ui'

import { useCreateCar } from '../api/use-create-car'
import { hasErrors, onlyDigits, toCreateCarDto, validateCarForm, type FormErrors } from '../lib/form'
import { newLotPaths } from '../lib/steps'
import type { CarFormDraft } from '../model/drafts.store'
import { useActiveDraft } from '../model/use-active-draft'
import styles from './NewLot.module.css'
import { StepHeader } from './StepHeader'

const toOptions = <T extends string>(values: readonly T[], labels: Record<T, string>) =>
  values.map((value) => ({ value, label: labels[value] }))

const bodyTypeOptions = toOptions(BODY_TYPES, bodyTypeLabels)
const transmissionOptions = toOptions(TRANSMISSIONS, transmissionLabels)
const driveTypeOptions = toOptions(DRIVE_TYPES, driveTypeLabels)
const fuelTypeOptions = toOptions(FUEL_TYPES, fuelTypeLabels)

/** Шаг 1б: своя машина. Создаётся в справочнике сразу по отправке формы — независимо от лота. */
export const CarCreateStep = () => {
  const { draft, update } = useActiveDraft()
  const navigate = useNavigateKeepingState()
  const form = draft.carForm
  const fieldId = useId()

  const createCar = useCreateCar()
  const [errors, setErrors] = useState<FormErrors<CarFormDraft>>({})
  // Такая комплектация уже есть — предлагаем выбрать её, а не создавать дубль
  const [existingCar, setExistingCar] = useState<Car | null>(null)

  // Каждое изменение сразу пишется в черновик (и через persist — в localStorage)
  const setField = (key: keyof CarFormDraft, value: string) => {
    update({ carForm: { [key]: value } })
    setErrors((prev) => ({ ...prev, [key]: undefined }))
    setExistingCar(null)
  }

  const selectCar = (car: Car) => {
    update({ car: { id: car.id, title: formatCarTitle(car), specs: formatCarSpecs(car) } })
    navigate(newLotPaths.details(draft.id))
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validateCarForm(form)
    setErrors(nextErrors)
    if (hasErrors(nextErrors) || createCar.isPending) return

    createCar.mutate(toCreateCarDto(form), {
      onSuccess: ({ car, existed }) => (existed ? setExistingCar(car) : selectCar(car)),
    })
  }

  // Своя ошибка (не заполнено) важнее серверной; серверные приходят в details с теми же ключами
  const errorFor = (key: keyof CarFormDraft) => errors[key] ?? getFieldError(createCar.error, key)
  const id = (key: keyof CarFormDraft) => `${fieldId}-${key}`

  const text = (key: keyof CarFormDraft, label: string, options: { placeholder?: string; digits?: boolean } = {}) => (
    <FormField label={label} htmlFor={id(key)} error={errorFor(key)}>
      <TextInput
        id={id(key)}
        value={form[key]}
        placeholder={options.placeholder}
        inputMode={options.digits ? 'numeric' : undefined}
        autoComplete="off"
        invalid={Boolean(errorFor(key))}
        onChange={(event) => setField(key, options.digits ? onlyDigits(event.target.value) : event.target.value)}
      />
    </FormField>
  )

  const select = <T extends string>(key: keyof CarFormDraft, label: string, options: { value: T; label: string }[]) => (
    <FormField label={label} htmlFor={id(key)} error={errorFor(key)}>
      <SelectInput
        id={id(key)}
        value={form[key]}
        options={options}
        placeholder="Выберите"
        invalid={Boolean(errorFor(key))}
        onChange={(event) => setField(key, event.target.value)}
      />
    </FormField>
  )

  return (
    <form className={styles.step} onSubmit={handleSubmit} noValidate>
      <StepHeader caption="Шаг 1 из 3" title="Новая машина" backTo={newLotPaths.car(draft.id)} />
      <p className={styles.muted}>Машина попадёт в общий справочник — её смогут выбрать и другие продавцы.</p>

      {/* Ошибки по полям показываются у полей; здесь — только общие (сеть, 500 и т. п.) */}
      <FormError message={getFormError(createCar.error)} />

      <div className={styles.row}>
        {text('brand', 'Марка', { placeholder: 'Toyota' })}
        {text('model', 'Модель', { placeholder: 'Camry' })}
      </div>
      <div className={styles.row}>
        {text('trim', 'Комплектация', { placeholder: 'Необязательно' })}
        {text('year', 'Год выпуска', { placeholder: '2019', digits: true })}
      </div>
      <div className={styles.row}>
        {select('bodyType', 'Кузов', bodyTypeOptions)}
        {select('transmission', 'Коробка', transmissionOptions)}
      </div>
      <div className={styles.row}>
        {select('driveType', 'Привод', driveTypeOptions)}
        {select('fuelType', 'Топливо', fuelTypeOptions)}
      </div>
      <div className={styles.row}>
        {text('horsePower', 'Мощность, л.с.', { placeholder: '181', digits: true })}
        {/* У электромобиля объёма нет — поле прячем, а при отправке объём не уходит */}
        {form.fuelType !== 'electric' && text('engineVolumeCc', 'Объём, см³', { placeholder: '2487', digits: true })}
      </div>
      {text('description', 'Описание', { placeholder: 'Необязательно' })}

      {existingCar && (
        <div className={styles.notice} role="status">
          <span>Такая машина уже есть в справочнике:</span>
          <div>
            <div className={styles.cardTitle}>{formatCarTitle(existingCar)}</div>
            <div className={styles.muted}>{formatCarSpecs(existingCar)}</div>
          </div>
          <Button onClick={() => selectCar(existingCar)}>Использовать её</Button>
        </div>
      )}

      <div className={styles.actions}>
        <Button type="submit" size="lg" loading={createCar.isPending} trailing="→">
          Добавить и продолжить
        </Button>
      </div>
    </form>
  )
}
