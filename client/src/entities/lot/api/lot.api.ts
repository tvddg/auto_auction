import { apiEndpoints, apiRequestWithHeaders } from '@/shared/api'

import type { LotCardDto, LotListFilters, LotListPage } from '../model/types'

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
