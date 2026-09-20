import { cn } from '@/shared/lib'

import { iconSources, type IconName } from './icon-sources'
import styles from './Icon.module.css'

type IconProps = {
  name: IconName
  /** Размер в px. Исходники растровые, поэтому не увеличиваем их сверх оригинала. */
  size?: number
  className?: string
}

export const Icon = ({ name, size = 20, className }: IconProps) => (
  <img
    src={iconSources[name]}
    alt=""
    aria-hidden
    draggable={false}
    width={size}
    height={size}
    className={cn(styles.icon, className)}
  />
)
