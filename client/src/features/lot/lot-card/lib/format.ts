const pad = (value: number) => String(value).padStart(2, '0')

export const formatPrice = (value: number) => `${value.toLocaleString('ru-RU')} ₽`

export const formatMileage = (value: number) => `${value.toLocaleString('ru-RU')} км`

export const formatRemaining = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
}

export const formatDay = (date: Date) =>
  date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '')

export const formatTime = (date: Date) =>
  date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

const betsForms: Record<Intl.LDMLPluralRule, string> = {
  zero: 'ставок',
  one: 'ставка',
  two: 'ставки',
  few: 'ставки',
  many: 'ставок',
  other: 'ставки',
}
const pluralRules = new Intl.PluralRules('ru-RU')

export const formatBets = (count: number) => `${count} ${betsForms[pluralRules.select(count)]}`
