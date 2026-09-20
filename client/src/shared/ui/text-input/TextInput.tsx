import type { InputHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/shared/lib'

import styles from './TextInput.module.css'

export type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  iconLeft?: ReactNode
  invalid?: boolean
  wrapperClassName?: string
}

export const TextInput = ({
  iconLeft,
  invalid = false,
  wrapperClassName,
  className,
  disabled,
  ...rest
}: TextInputProps) => (
  <div
    className={cn(
      styles.wrapper,
      invalid && styles.invalid,
      disabled && styles.disabled,
      wrapperClassName,
    )}
  >
    {iconLeft}
    <input
      {...rest}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      className={cn(styles.input, className)}
    />
  </div>
)
