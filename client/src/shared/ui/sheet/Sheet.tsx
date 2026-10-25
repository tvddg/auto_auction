import { useEffect, useId, useImperativeHandle, useRef, type ReactNode, type Ref } from 'react'

import { cn } from '@/shared/lib'

import styles from './Sheet.module.css'

export type SheetHandle = {
  /** Закрыть с анимацией — так же, как кнопкой «×» или Esc. */
  close: () => void
}

export type SheetProps = {
  title: ReactNode
  /** Вызывается, когда шторка закрылась и анимация закрытия доиграла. Здесь родитель уводит с маршрута. */
  onClosed: () => void
  ref?: Ref<SheetHandle>
  children: ReactNode
  className?: string
}

/**
 * Шторка снизу поверх всего интерфейса.
 *
 * <dialog> + showModal() кладёт шторку в верхний слой браузера: она выше любых z-index,
 * страница под ней становится неактивной, Esc закрывает, фокус возвращается туда, откуда открыли.
 * Анимации выезда и закрытия — в Sheet.module.css (@starting-style + transition-behavior: allow-discrete).
 */
export const Sheet = ({ title, onClosed, ref, children, className }: SheetProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const onClosedRef = useRef(onClosed)
  const titleId = useId()

  useImperativeHandle(ref, () => ({ close: () => dialogRef.current?.close() }), [])

  useEffect(() => {
    onClosedRef.current = onClosed
  }, [onClosed])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (!dialog.open) dialog.showModal()

    // Событие close приходит и от кнопки «×», и от Esc, и от close() из кода. В этот момент элемент
    // ещё в DOM и проигрывает анимацию закрытия — ждём её и только потом отдаём управление родителю.
    const handleClose = () => {
      const animations = dialog.getAnimations({ subtree: true })
      void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => onClosedRef.current())
    }

    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [])

  return (
    <dialog ref={dialogRef} className={cn(styles.sheet, className)} aria-labelledby={titleId}>
      <header className={styles.header}>
        <h2 id={titleId} className={styles.title}>{title}</h2>
        <button
          type="button"
          className={styles.close}
          onClick={() => dialogRef.current?.close()}
          aria-label="Закрыть"
        >
          ×
        </button>
      </header>

      <div className={styles.body}>{children}</div>
    </dialog>
  )
}
