import type { LotDetailsDraft, LotDraft } from '../model/drafts.store'

/** Обязательные поля объявления в порядке формы — с короткими подписями для «нет VIN и цены» */
const DETAIL_LABELS: Record<keyof LotDetailsDraft, string> = {
  vin: 'VIN',
  mileage: 'пробега',
  color: 'цвета',
  city: 'города',
  startingPrice: 'цены',
  startsAt: 'даты старта',
  endsAt: 'даты окончания',
}

export type DraftProgress = {
  /** 0–100: машина и 7 полей объявления; фото необязательны и не считаются */
  percent: number
  /** Чего не хватает, по порядку формы: «машины», «VIN», «цены»… */
  missing: string[]
}

export const draftProgress = (draft: LotDraft): DraftProgress => {
  const missing: string[] = []
  if (!draft.car) missing.push('машины')
  ;(Object.keys(DETAIL_LABELS) as (keyof LotDetailsDraft)[]).forEach((key) => {
    if (!draft.details[key].trim()) missing.push(DETAIL_LABELS[key])
  })

  const total = Object.keys(DETAIL_LABELS).length + 1
  return { percent: Math.round(((total - missing.length) / total) * 100), missing }
}

/** «нет VIN и цены», «нет машины, VIN и ещё 4» */
export const formatMissing = (missing: string[]) => {
  if (missing.length === 0) return 'готов к публикации'
  if (missing.length <= 2) return `нет ${missing.join(' и ')}`
  return `нет ${missing.slice(0, 2).join(', ')} и ещё ${missing.length - 2}`
}
