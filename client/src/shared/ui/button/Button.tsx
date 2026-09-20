import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/shared/lib'

import styles from './Button.module.css'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'md' | 'lg'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  iconLeft?: ReactNode
  trailing?: ReactNode
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  iconLeft,
  trailing,
  disabled,
  children,
  className,
  type = 'button',
  ...rest
}: ButtonProps) => (
  <button
    {...rest}
    type={type}
    disabled={disabled ?? loading}
    aria-busy={loading || undefined}
    className={cn(
      styles.button,
      styles[variant],
      size === 'lg' && styles.lg,
      fullWidth && styles.fullWidth,
      Boolean(trailing) && styles.spaceBetween,
      className,
    )}
  >
    <span className={styles.label}>
      {loading ? <span className={styles.spinner} /> : iconLeft}
      {children}
    </span>
    {trailing ? <span className={styles.trailing}>{trailing}</span> : null}
  </button>
)
