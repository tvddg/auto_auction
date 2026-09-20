import { useRef, type ClipboardEvent, type CSSProperties, type KeyboardEvent } from 'react'

import { cn } from '@/shared/lib'

import styles from './OtpInput.module.css'

export type OtpInputProps = {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  invalid?: boolean
  autoFocus?: boolean
  id?: string
  'aria-label'?: string
  'aria-describedby'?: string
  className?: string
}

const onlyDigits = (value: string) => value.replace(/\D/g, '')

const EMPTY_CELL = ' '

export const isOtpFilled = (value: string, length = 4): boolean =>
  value.length === length && !value.includes(EMPTY_CELL)

export const OtpInput = ({
  value,
  onChange,
  length = 4,
  disabled = false,
  invalid = false,
  autoFocus = false,
  id,
  className,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}: OtpInputProps) => {
  const cellsRef = useRef<Array<HTMLInputElement | null>>([])

  const focusCell = (index: number) => {
    const cell = cellsRef.current[Math.min(Math.max(index, 0), length - 1)]
    cell?.focus()
    cell?.select()
  }

  const writeAt = (index: number, digits: string) => {
    const chars = value.padEnd(length, ' ').split('')
    digits.split('').forEach((digit, offset) => {
      if (index + offset < length) chars[index + offset] = digit
    })

    onChange(chars.join('').replace(/\s/g, '').slice(0, length))
    focusCell(index + digits.length)
  }

  const handleChange = (index: number, raw: string) => {
    const digits = onlyDigits(raw)
    if (digits.length === 0) {
      const chars = value.split('')
      chars[index] = ''
      onChange(chars.join(''))
      return
    }

    writeAt(index, digits)
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !value[index]) {
      event.preventDefault()
      const chars = value.split('')
      chars[index - 1] = ''
      onChange(chars.join(''))
      focusCell(index - 1)
      return
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusCell(index - 1)
      return
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusCell(index + 1)
    }
  }

  const handlePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    const digits = onlyDigits(event.clipboardData.getData('text'))
    if (digits.length === 0) return

    event.preventDefault()
    writeAt(index, digits.slice(0, length - index))
  }

  return (
    <div
      className={cn(styles.root, className)}
      style={{ '--otp-length': length } as CSSProperties}
      role="group"
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          id={index === 0 ? id : undefined}
          ref={(node) => {
            cellsRef.current[index] = node
          }}
          className={cn(styles.cell, value[index] && styles.filled, invalid && styles.invalid)}
          value={value[index] ?? ''}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          onFocus={(event) => event.target.select()}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          inputMode="numeric"
          type="text"
          maxLength={1}
          aria-invalid={invalid || undefined}
          aria-label={`Цифра ${index + 1} из ${length}`}
        />
      ))}
    </div>
  )
}
