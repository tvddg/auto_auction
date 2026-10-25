import { apiEndpoints, apiRequest, apiRequestWithHeaders } from '@/shared/api'

import type { BidFeed, BidFeedItem, CreateLotDto, Lot, LotCardDto, LotDetail, LotListFilters, LotListPage, UploadedPhoto } from '../model/types'

export const LOTS_PAGE_SIZE = 20

const toSearchParams = (filters: LotListFilters, page: number): URLSearchParams => {
  const params = new URLSearchParams({ page: String(page), limit: String(LOTS_PAGE_SIZE) })

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === '') return

    if (Array.isArray(value)) value.forEach((item) => params.append(`${key}[]`, item))
    else params.set(key, String(value))
  })

  return params
}

export const fetchLots = async (filters: LotListFilters, page: number, signal?: AbortSignal): Promise<LotListPage> => {
  const { data, headers } = await apiRequestWithHeaders<LotCardDto[]>(
    `${apiEndpoints.lots.list}?${toSearchParams(filters, page)}`,
    { signal },
  )

  return { items: data, total: Number(headers.get('X-Total-Count') ?? data.length), page }
}

/** 409 lot_already_published — VIN уже в открытом лоте; 422 — ошибки по полям в details. */
export const createLot = (dto: CreateLotDto) =>
  apiRequest<Lot>(apiEndpoints.lots.list, { method: 'POST', body: dto })

/** Загружает фото для черновика. Сервер проверяет тип по содержимому: JPEG, PNG или WebP до 15 МБ. */
export const uploadPhoto = (file: File, signal?: AbortSignal) => {
  const body = new FormData()
  body.append('file', file)

  return apiRequest<UploadedPhoto>(apiEndpoints.photos.upload, { method: 'POST', body, signal })
}

export const fetchLot = (id: string, signal?: AbortSignal) =>
  apiRequest<LotDetail>(apiEndpoints.lots.byId(id), { signal })

/** Последние принятые ставки, новые сверху; общее число — из X-Total-Count. */
export const fetchLotBids = async (id: string, signal?: AbortSignal): Promise<BidFeed> => {
  const { data, headers } = await apiRequestWithHeaders<BidFeedItem[]>(apiEndpoints.lots.bids(id), { signal })
  return { items: data, total: Number(headers.get('X-Total-Count') ?? data.length) }
}
