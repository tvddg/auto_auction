import type { SelectHTMLAttributes } from 'react'

import { cn } from '@/shared/lib'

import textInputStyles from '../text-input/TextInput.module.css'
import styles from './SelectInput.module.css'

export type SelectOption<T extends string = string> = { value: T; label: string }

export type SelectInputProps<T extends string> = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & {
  options: ReadonlyArray<SelectOption<T>>
  /** Текст пустого варианта, если значение ещё не выбрано. */
  placeholder?: string
  invalid?: boolean
}

/** Нативный <select>, оформленный как TextInput: та же обёртка и нижняя линия. */
export const SelectInput = <T extends string>({
  options,
  placeholder,
  invalid = false,
  className,
  ...rest
}: SelectInputProps<T>) => (
  <div className={cn(textInputStyles.wrapper, invalid && textInputStyles.invalid)}>
    <select {...rest} aria-invalid={invalid || undefined} className={cn(styles.select, className)}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  </div>
)
