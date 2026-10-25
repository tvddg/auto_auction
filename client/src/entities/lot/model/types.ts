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

/** Тело POST /lot. Цена — в копейках, даты — ISO-строки. */
export type CreateLotDto = {
  carId: string
  vin: string
  mileage: number
  color: string
  city: string
  startingPriceCents: number
  startsAt: string
  endsAt: string
}

/** Ответ POST /lot и PATCH /lot/:id. */
export type Lot = CreateLotDto & {
  id: string
  userId: string
  status: 'upcoming' | 'active' | 'sold' | 'unsold' | 'cancelled'
  currentPriceCents: number
  bidCount: number
}
