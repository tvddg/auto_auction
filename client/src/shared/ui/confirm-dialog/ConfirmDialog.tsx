import { useEffect, useId, useRef, type MouseEvent, type ReactNode, type SyntheticEvent } from 'react'

import { Button } from '../button/Button'
import { FormError } from '../form-error/FormError'
import styles from './ConfirmDialog.module.css'

export type ConfirmDialogProps = {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  /** danger — для необратимых действий */
  tone?: 'primary' | 'danger'
  loading?: boolean
  error?: string | null
  onConfirm: () => void
  /** Отмена, Esc или клик по затемнению */
  onCancel: () => void
}

/**
 * Окно подтверждения поверх всего: <dialog> + showModal() — страница под ним неактивна,
 * Esc закрывает, фокус возвращается на кнопку, которая окно открыла.
 * Управляется пропом open: родитель решает, когда показать и когда спрятать.
 */
export const ConfirmDialog = ({
  open,
  title,
  children,
  confirmLabel,
  tone = 'primary',
  loading = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Esc: браузер сам закрывает окно — сообщаем родителю, чтобы open тоже стал false.
  // Пока идёт запрос, закрыть нельзя: иначе результат придёт в уже закрытое окно.
  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault()
    if (!loading) onCancel()
  }

  // Браузер может закрыть окно и сам (повторный Esc закрывает даже при отменённом cancel) —
  // тогда сообщаем родителю, иначе open останется true и окно больше не откроется
  const handleClose = () => {
    if (open) onCancel()
  }

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget && !loading) onCancel()
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClose={handleClose}
      onClick={handleBackdropClick}
    >
      <div className={styles.content}>
        <h2 id={titleId} className={styles.title}>{title}</h2>
        <div className={styles.body}>{children}</div>
        <FormError message={error ?? null} />
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Отмена</Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </dialog>
  )
}
