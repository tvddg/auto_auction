import { cn } from '@/shared/lib'

import styles from './FormError.module.css'

/** Ошибка формы целиком: то, что сервер не привязал к конкретному полю. */
export const FormError = ({ message, className }: { message: string | null; className?: string }) =>
  message === null ? null : (
    <p className={cn(styles.error, className)} role="alert">
      {message}
    </p>
  )
