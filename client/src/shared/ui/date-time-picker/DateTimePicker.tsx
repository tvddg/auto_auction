import { useRef, useState, type MouseEvent } from 'react'

import {
  ceilToMinutes,
  cn,
  isSameDay,
  parseLocalDateTime,
  startOfDay,
  toLocalDateTime,
  type LocalDateTime,
} from '@/shared/lib'

import { Button } from '../button/Button'
import { SelectInput } from '../select-input/SelectInput'
import textInputStyles from '../text-input/TextInput.module.css'
import styles from './DateTimePicker.module.css'

const MINUTE_STEP = 5
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const MINUTES = Array.from({ length: 60 / MINUTE_STEP }, (_, index) => index * MINUTE_STEP)

const pad = (value: number) => String(value).padStart(2, '0')
const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)
const shiftMonth = (month: Date, delta: number) => new Date(month.getFullYear(), month.getMonth() + delta, 1)
const withTime = (day: Date, hours: number, minutes: number) =>
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes)

const formatValue = (date: Date) =>
  date.toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const formatMonth = (month: Date) => {
  const label = month.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** Ячейки календаря: пустые до первого числа (неделя с понедельника), затем дни месяца. */
const monthCells = (month: Date): (Date | null)[] => {
  const offset = (month.getDay() + 6) % 7
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1))
  return [...Array<null>(offset).fill(null), ...days]
}

export type DateTimePickerProps = {
  id?: string
  value: LocalDateTime
  onChange: (value: LocalDateTime) => void
  /** Самое раннее допустимое значение. Всё раньше — недоступно для выбора. */
  min?: Date
  placeholder?: string
  invalid?: boolean
  /** Заголовок окна, например «Начало торгов». */
  dialogTitle: string
}

/**
 * Поле даты и времени с собственным окном выбора вместо нативного datetime-local.
 * Окно — <dialog> + showModal(): поверх всего, в том числе поверх шторки, Esc закрывает.
 * Выбор применяется только по «Готово» — до этого правки живут в локальном состоянии окна.
 */
export const DateTimePicker = ({
  id,
  value,
  onChange,
  min,
  placeholder = 'Выберите дату и время',
  invalid = false,
  dialogTitle,
}: DateTimePickerProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)

  // Состояние окна; задаётся заново при каждом открытии
  const [selected, setSelected] = useState<Date>(() => new Date())
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(new Date()))
  // Нижнюю границу фиксируем в момент открытия, иначе «сейчас» уплывало бы, пока окно открыто
  const [lowerBound, setLowerBound] = useState<Date | null>(null)

  const current = parseLocalDateTime(value)

  const clamp = (date: Date, bound: Date | null) => (bound && date < bound ? new Date(bound) : date)

  const open = () => {
    const bound = min ? ceilToMinutes(min, MINUTE_STEP) : null
    const initial = clamp(ceilToMinutes(current ?? bound ?? new Date(), MINUTE_STEP), bound)

    setLowerBound(bound)
    setSelected(initial)
    setViewMonth(startOfMonth(initial))
    dialogRef.current?.showModal()
  }

  // Любая правка проходит через clamp: например, выбрали сегодня, а время осталось утренним — подтянется к границе
  const update = (next: Date) => setSelected(clamp(next, lowerBound))

  const handleDone = () => {
    onChange(toLocalDateTime(selected))
    dialogRef.current?.close()
  }

  // Клик по затемнению: в этот момент target — сам <dialog>, содержимое лежит во внутреннем блоке
  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) event.currentTarget.close()
  }

  const isBoundDay = lowerBound !== null && isSameDay(selected, lowerBound)
  const hourOptions = HOURS.map((hour) => ({
    value: String(hour),
    label: pad(hour),
    disabled: isBoundDay && hour < lowerBound.getHours(),
  }))
  const minuteOptions = MINUTES.map((minute) => ({
    value: String(minute),
    label: pad(minute),
    disabled: isBoundDay && selected.getHours() === lowerBound.getHours() && minute < lowerBound.getMinutes(),
  }))

  const today = new Date()
  const canGoBack = !lowerBound || viewMonth > startOfMonth(lowerBound)

  return (
    <>
      <button
        type="button"
        id={id}
        className={cn(textInputStyles.wrapper, invalid && textInputStyles.invalid, styles.trigger)}
        aria-invalid={invalid || undefined}
        aria-haspopup="dialog"
        onClick={open}
      >
        <span className={current ? styles.value : styles.placeholder}>
          {current ? formatValue(current) : placeholder}
        </span>
      </button>

      <dialog ref={dialogRef} className={styles.dialog} aria-label={dialogTitle} onClick={handleBackdropClick}>
        <div className={styles.content}>
          <h3 className={styles.title}>{dialogTitle}</h3>

          <div className={styles.monthHeader}>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => setViewMonth(shiftMonth(viewMonth, -1))}
              disabled={!canGoBack}
              aria-label="Предыдущий месяц"
            >
              ‹
            </button>
            <span className={styles.month}>{formatMonth(viewMonth)}</span>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => setViewMonth(shiftMonth(viewMonth, 1))}
              aria-label="Следующий месяц"
            >
              ›
            </button>
          </div>

          <div className={styles.grid}>
            {WEEKDAYS.map((weekday) => (
              <span key={weekday} className={styles.weekday}>{weekday}</span>
            ))}
            {monthCells(viewMonth).map((day, index) =>
              day === null ? (
                <span key={`empty-${index}`} />
              ) : (
                <button
                  key={day.getTime()}
                  type="button"
                  className={cn(
                    styles.day,
                    isSameDay(day, today) && styles.today,
                    isSameDay(day, selected) && styles.selected,
                  )}
                  disabled={lowerBound !== null && day < startOfDay(lowerBound)}
                  aria-pressed={isSameDay(day, selected)}
                  aria-label={day.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  onClick={() => update(withTime(day, selected.getHours(), selected.getMinutes()))}
                >
                  {day.getDate()}
                </button>
              ),
            )}
          </div>

          <div className={styles.time}>
            <span className={styles.timeLabel}>Время</span>
            <SelectInput
              aria-label="Часы"
              value={String(selected.getHours())}
              options={hourOptions}
              onChange={(event) => update(withTime(selected, Number(event.target.value), selected.getMinutes()))}
            />
            <span aria-hidden>:</span>
            <SelectInput
              aria-label="Минуты"
              value={String(selected.getMinutes())}
              options={minuteOptions}
              onChange={(event) => update(withTime(selected, selected.getHours(), Number(event.target.value)))}
            />
          </div>

          <p className={styles.preview}>{formatValue(selected)}</p>

          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => dialogRef.current?.close()}>Отмена</Button>
            <Button onClick={handleDone}>Готово</Button>
          </div>
        </div>
      </dialog>
    </>
  )
}
