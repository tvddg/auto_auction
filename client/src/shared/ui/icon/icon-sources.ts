import carIcon from '@/assets/car.png'
import gosuslugiIcon from '@/assets/gosuslugi.png'
import grayClockIcon from '@/assets/gray-clock.png'
import guardIcon from '@/assets/guard.png'
import mailIcon from '@/assets/mail.png'
import phoneIcon from '@/assets/phone.png'
import redClockIcon from '@/assets/red-clock.png'
import locationIcon from '@/assets/location.png'
import notificationIcon from '@/assets/notification.png'

export const iconSources = {
  car: carIcon,
  gosuslugi: gosuslugiIcon,
  grayClock: grayClockIcon,
  guard: guardIcon,
  mail: mailIcon,
  phone: phoneIcon,
  redClock: redClockIcon,
  location: locationIcon,
  notification: notificationIcon
} as const

export type IconName = keyof typeof iconSources
