import type { ReactNode } from 'react'

import { cn } from '@/shared/lib'

import styles from './FormField.module.css'

export type FormFieldProps = {
  htmlFor?: string
  label: ReactNode
  aside?: ReactNode
  error?: string | null
  errorId?: string
  children: ReactNode
  className?: string
}

export const FormField = ({ htmlFor, label, aside, error, errorId, children, className }: FormFieldProps) => (
  <div className={cn(styles.field, className)}>
    <div className={styles.header}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
      </label>
      {aside ? <div className={styles.aside}>{aside}</div> : null}
    </div>

    {children}

    {error ? (
      <p className={styles.error} id={errorId} role="alert">
        {error}
      </p>
    ) : null}
  </div>
)
