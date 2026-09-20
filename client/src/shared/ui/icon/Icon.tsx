import carIcon from '@/assets/car.png'
import gosuslugiIcon from '@/assets/gosuslugi.png'
import grayClockIcon from '@/assets/gray-clock.png'
import guardIcon from '@/assets/guard.png'
import mailIcon from '@/assets/mail.png'
import phoneIcon from '@/assets/phone.png'
import redClockIcon from '@/assets/red-clock.png'
import { cn } from '@/shared/lib'

import styles from './Icon.module.css'

export const iconSources = {
  car: carIcon,
  gosuslugi: gosuslugiIcon,
  grayClock: grayClockIcon,
  guard: guardIcon,
  mail: mailIcon,
  phone: phoneIcon,
  redClock: redClockIcon,
} as const

export type IconName = keyof typeof iconSources

type IconProps = {
  name: IconName
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
