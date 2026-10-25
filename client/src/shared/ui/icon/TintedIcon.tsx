import type { CSSProperties } from 'react'

import { cn } from '@/shared/lib'

import { iconSources, type IconName } from './icon-sources'
import styles from './TintedIcon.module.css'

type TintedIconProps = {
  name: IconName
  /** Размер в px; по умолчанию — чуть больше текста (1.1em). */
  size?: number
  className?: string
}

/**
 * PNG как маска: иконка красится в цвет текста (currentcolor), а не в цвет исходника.
 * Нужна, когда одна и та же иконка стоит на разном фоне — например, тёмный молоток на красной кнопке.
 */
export const TintedIcon = ({ name, size, className }: TintedIconProps) => (
  <span
    aria-hidden
    className={cn(styles.icon, className)}
    style={{ '--icon': `url(${iconSources[name]})`, ...(size && { width: size, height: size }) } as CSSProperties}
  />
)
