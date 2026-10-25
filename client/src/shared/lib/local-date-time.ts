/**
 * Дата-время в формате <input type="datetime-local">: «2026-10-25T14:30», местное время без часового пояса.
 * В таком виде значение хранится в черновиках; в UTC переводим только при отправке на сервер.
 */
export type LocalDateTime = string

const pad = (value: number) => String(value).padStart(2, '0')

export const toLocalDateTime = (date: Date): LocalDateTime =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`

/** Строка без пояса разбирается как местное время. Пустое или битое значение — null. */
export const parseLocalDateTime = (value: LocalDateTime): Date | null => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export const addDays = (date: Date, days: number) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

export const isSameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime()

/** Округление вверх до шага в минутах, без секунд: 14:31:20 → 14:35 при шаге 5. */
export const ceilToMinutes = (date: Date, step: number) => {
  const result = new Date(date)
  result.setSeconds(0, 0)
  if (result < date) result.setMinutes(result.getMinutes() + 1)
  const remainder = result.getMinutes() % step
  if (remainder) result.setMinutes(result.getMinutes() + step - remainder)
  return result
}
