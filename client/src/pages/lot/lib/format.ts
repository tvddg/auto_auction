import { driveTypeLabels, fuelTypeLabels, transmissionLabels } from '@/entities/car'
import type { LotDetail, LotStatus } from '@/entities/lot'

/** «1 мин», «3 ч», а старше суток — дата. */
export const formatAgo = (iso: string, now = Date.now()) => {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return 'только что'
  if (minutes < 60) return `${minutes} мин`
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} ч`
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

const bidsForms: Record<Intl.LDMLPluralRule, string> = {
  zero: 'ставок', one: 'ставка', two: 'ставки', few: 'ставки', many: 'ставок', other: 'ставки',
}
const pluralRules = new Intl.PluralRules('ru-RU')
export const formatBidCount = (count: number) => `${count} ${bidsForms[pluralRules.select(count)]}`

export const formatEngine = (car: LotDetail['carInfo']) =>
  car.engineVolume
    ? `${(car.engineVolume / 1000).toFixed(1)} ${fuelTypeLabels[car.fuelType].toLowerCase()}`
    : fuelTypeLabels[car.fuelType].toLowerCase()

/** «2016 · 74 000 км · АКПП · передний · 2.0 бензин» — строка под заголовком, как в макете. */
export const formatSpecsLine = (car: LotDetail['carInfo']) =>
  [
    car.year,
    `${car.mileage.toLocaleString('ru-RU')} км`,
    transmissionLabels[car.transmission],
    driveTypeLabels[car.driveType].toLowerCase(),
    formatEngine(car),
  ].join(' · ')

export const statusLabels: Record<LotStatus, string> = {
  active: 'Идут торги',
  upcoming: 'Скоро старт',
  sold: 'Продан',
  unsold: 'Не продан',
  cancelled: 'Снят с торгов',
}
