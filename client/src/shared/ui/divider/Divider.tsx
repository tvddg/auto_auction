import { cn } from '@/shared/lib'

import styles from './Divider.module.css'

export type DividerProps = {
  label?: string
  className?: string
}

export const Divider = ({ label, className }: DividerProps) =>
  label === undefined ? (
    <hr className={cn(styles.line, className)} />
  ) : (
    <div className={cn(styles.labelled, className)} role="separator" aria-orientation="horizontal">
      {label}
    </div>
  )
