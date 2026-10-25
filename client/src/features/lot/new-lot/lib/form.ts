import type { CreateCarDto } from '@/entities/car'
import type { CreateLotDto } from '@/entities/lot'
import { addDays, parseLocalDateTime } from '@/shared/lib'

import type { CarFormDraft, DraftCar, LotDetailsDraft, LotDraft } from '../model/drafts.store'

/**
 * Клиентская проверка — только то, что видно без сервера: обязательные поля, формат VIN, порядок дат.
 * Диапазоны и уникальность проверяет сервер, его ошибки показываем по полям через getFieldError.
 */
export type FormErrors<T> = Partial<Record<keyof T, string>>

const REQUIRED = 'Обязательное поле'
const VIN_FORMAT = /^[A-HJ-NPR-Z0-9]{17}$/

export const onlyDigits = (value: string) => value.replace(/\D/g, '')

/** VIN всегда заглавными и без пробелов — так же нормализует сервер. */
export const normalizeVin = (value: string) => value.toUpperCase().replace(/\s/g, '')

export const hasErrors = (errors: object) => Object.keys(errors).length > 0

export const validateCarForm = (form: CarFormDraft): FormErrors<CarFormDraft> => {
  const errors: FormErrors<CarFormDraft> = {}
  const required: (keyof CarFormDraft)[] = ['brand', 'model', 'year', 'bodyType', 'transmission', 'driveType', 'fuelType', 'horsePower']

  required.forEach((key) => {
    if (!form[key].trim()) errors[key] = REQUIRED
  })
  if (form.fuelType && form.fuelType !== 'electric' && !form.engineVolumeCc) errors.engineVolumeCc = REQUIRED

  return errors
}

export const validateDetails = (details: LotDetailsDraft): FormErrors<LotDetailsDraft> => {
  const errors: FormErrors<LotDetailsDraft> = {}

  ;(Object.keys(details) as (keyof LotDetailsDraft)[]).forEach((key) => {
    if (!details[key].trim()) errors[key] = REQUIRED
  })

  if (details.vin && !VIN_FORMAT.test(details.vin)) errors.vin = 'VIN — 17 символов: латиница и цифры, без I, O, Q'

  // Те же правила, что задают нижнюю границу в окнах выбора даты. Проверяем и здесь:
  // черновик могли открыть через несколько дней — и сохранённое начало уже в прошлом
  const startsAt = parseLocalDateTime(details.startsAt)
  const endsAt = parseLocalDateTime(details.endsAt)
  if (startsAt && startsAt < new Date()) errors.startsAt = 'Начало торгов не может быть в прошлом'
  if (startsAt && endsAt && endsAt < minEndsAt(details.startsAt)) {
    errors.endsAt = `Торги длятся не меньше ${MIN_AUCTION_DAYS} дней от начала`
  }

  return errors
}

/** Минимальная длительность торгов. */
export const MIN_AUCTION_DAYS = 3

/** Нижняя граница окончания: начало + 3 дня, а пока начало не выбрано — сейчас + 3 дня. */
export const minEndsAt = (startsAt: string) => addDays(parseLocalDateTime(startsAt) ?? new Date(), MIN_AUCTION_DAYS)

const optionalText = (value: string) => value.trim() || null

export const toCreateCarDto = (form: CarFormDraft): CreateCarDto => ({
  brand: form.brand.trim(),
  model: form.model.trim(),
  trim: optionalText(form.trim),
  year: Number(form.year),
  bodyType: form.bodyType as CreateCarDto['bodyType'],
  transmission: form.transmission as CreateCarDto['transmission'],
  driveType: form.driveType as CreateCarDto['driveType'],
  fuelType: form.fuelType as CreateCarDto['fuelType'],
  horsePower: Number(form.horsePower),
  // У электромобиля объёма нет — даже если поле заполнили до смены топлива
  engineVolumeCc: form.fuelType === 'electric' || !form.engineVolumeCc ? null : Number(form.engineVolumeCc),
  description: optionalText(form.description),
})

/** Рубли → копейки, datetime-local (местное время) → ISO в UTC. */
export const toCreateLotDto = (car: DraftCar, details: LotDraft['details'], photos: LotDraft['photos']): CreateLotDto => ({
  carId: car.id,
  vin: details.vin,
  mileage: Number(details.mileage),
  color: details.color.trim(),
  city: details.city.trim(),
  startingPriceCents: Number(details.startingPrice) * 100,
  startsAt: new Date(details.startsAt).toISOString(),
  endsAt: new Date(details.endsAt).toISOString(),
  photoIds: photos.map((photo) => photo.signedId),
})

export const formatRubles = (rubles: string) => `${Number(rubles).toLocaleString('ru-RU')} ₽`

export const formatLocalDateTime = (value: string) =>
  new Date(value).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
