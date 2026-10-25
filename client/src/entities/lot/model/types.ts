import type { BodyType, DriveType, FuelType, Transmission } from '@/entities/car'

/** Карточка каталога в том виде, в каком её отдаёт GET /lot. Цены — в копейках, даты — ISO-строки. */
type LotCardBaseDto = {
  id: string
  title: string
  imageUrl: string | null
  shortInfo: {
    year: number
    mileage: number
    gear: string
  }
  price: number
  betsAmount: number
  inFeatured: boolean
}

export type LotCardDto = LotCardBaseDto &
  (
    | { status: 'active'; remainingTime: number }
    | { status: 'upcoming'; startDate: string }
    | { status: 'sold' | 'unsold'; dealDate: string }
  )

/** Фаза лота в фильтре каталога: finished — sold и unsold вместе. */
export type LotListStatus = 'active' | 'upcoming' | 'finished' | 'sold' | 'unsold'
export type LotListSort = 'date' | 'cost' | 'year'
export type LotListOrder = 'asc' | 'desc'

/** Параметры каталога без пагинации. Цены — в копейках. */
export type LotListFilters = {
  status?: LotListStatus
  brands?: string[]
  minYear?: number
  maxYear?: number
  minPrice?: number
  maxPrice?: number
  q?: string
  sort?: LotListSort
  order?: LotListOrder
}

export type LotListPage = {
  items: LotCardDto[]
  total: number
  page: number
}

/** Тело POST /lot. Цена — в копейках, даты — ISO-строки, фото — signedId из POST /photo по порядку. */
export type CreateLotDto = {
  carId: string
  vin: string
  mileage: number
  color: string
  city: string
  startingPriceCents: number
  startsAt: string
  endsAt: string
  photoIds: string[]
}

/** Фото опубликованного лота. Адреса относительные (/api/v1/storage/…). */
export type LotPhoto = {
  id: string
  url: string
  thumbUrl: string
}

/** Ответ POST /photo: файл загружен, но к лоту ещё не привязан. */
export type UploadedPhoto = {
  signedId: string
  url: string
}

/** Ответ POST /lot и PATCH /lot/:id. */
export type Lot = Omit<CreateLotDto, 'photoIds'> & {
  id: string
  userId: string
  status: 'upcoming' | 'active' | 'sold' | 'unsold' | 'cancelled'
  currentPriceCents: number
  bidCount: number
  photos: LotPhoto[]
}

/** Фаза лота: для открытого вычисляется по времени, см. GET /lot. */
export type LotStatus = Lot['status']

/** Ответ GET /lot/:id — страница лота. Суммы — в копейках. */
export type LotDetail = {
  id: string
  carInfo: {
    brand: string
    model: string
    trim: string | null
    color: string
    year: number
    bodyType: BodyType
    vin: string
    mileage: number
    transmission: Transmission
    driveType: DriveType
    fuelType: FuelType
    horsePower: number
    /** см³; null у электромобилей */
    engineVolume: number | null
    city: string
    description: string | null
  }
  sellerInfo: { name: string | null }
  status: LotStatus
  startingPrice: number
  currentPrice: number
  startsAt: string
  endsAt: string
  bidCount: number
  photos: LotPhoto[]
  /** Шаг ставки для текущей цены; null, если шаги не настроены */
  bidStep: number | null
  /** Текущая цена + шаг — меньше сервер не примет */
  minNextBid: number | null
  /** Только для вошедшего пользователя */
  viewer: {
    isSeller: boolean
    isLeader: boolean
    /** Только продавцу: что сделает удаление — удалит, снимет с торгов или нельзя (null) */
    removal: LotRemoval | null
  } | null
}

export type LotRemoval = 'delete' | 'cancel'

/** Строка ленты ставок: участник замаскирован, свои ставки помечены isMine. */
export type BidFeedItem = {
  id: string
  seq: number
  amountCents: number
  bidder: string
  isMine: boolean
  createdAt: string
}

export type BidFeed = {
  items: BidFeedItem[]
  total: number
}
