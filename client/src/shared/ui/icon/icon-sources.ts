import calendarIcon from '@/assets/calendar.png'
import carIcon from '@/assets/car.png'
import driveTypeIcon from '@/assets/drivetype.png'
import gearIcon from '@/assets/gear.png'
import hammerIcon from '@/assets/hammer.png'
import infoIcon from '@/assets/info.png'
import penIcon from '@/assets/pen.png'
import shareIcon from '@/assets/share.png'
import speedIcon from '@/assets/speed.png'
import gosuslugiIcon from '@/assets/gosuslugi.png'
import grayClockIcon from '@/assets/gray-clock.png'
import guardIcon from '@/assets/guard.png'
import mailIcon from '@/assets/mail.png'
import phoneIcon from '@/assets/phone.png'
import redClockIcon from '@/assets/red-clock.png'
import locationIcon from '@/assets/location.png'
import notificationIcon from '@/assets/notification.png'
import searchIcon from '@/assets/search.png'
import filtersIcon from '@/assets/filters.png'
import downArrowIcon from '@/assets/down-arrow.png'
import catalogIcon from '@/assets/catalog.png'
import betsIcon from '@/assets/bets.png'
import profileIcon from '@/assets/profile.png'

export const iconSources = {
  calendar: calendarIcon,
  car: carIcon,
  driveType: driveTypeIcon,
  gear: gearIcon,
  hammer: hammerIcon,
  info: infoIcon,
  pen: penIcon,
  share: shareIcon,
  speed: speedIcon,
  gosuslugi: gosuslugiIcon,
  grayClock: grayClockIcon,
  guard: guardIcon,
  mail: mailIcon,
  phone: phoneIcon,
  redClock: redClockIcon,
  location: locationIcon,
  notification: notificationIcon,
  search: searchIcon,
  filters: filtersIcon,
  downArrow: downArrowIcon,
  catalog: catalogIcon,
  bets: betsIcon,
  profile: profileIcon,
} as const

export type IconName = keyof typeof iconSources
