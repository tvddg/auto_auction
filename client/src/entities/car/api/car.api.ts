import { apiEndpoints, apiRequest } from '@/shared/api'

import type { Car, CreateCarDto } from '../model/types'

export const CAR_SEARCH_LIMIT = 20

export const searchCars = (query: string, signal?: AbortSignal) => {
  const params = new URLSearchParams({ limit: String(CAR_SEARCH_LIMIT) })
  if (query) params.set('q', query)

  return apiRequest<Car[]>(`${apiEndpoints.cars.list}?${params}`, { signal })
}

export const fetchCar = (id: string, signal?: AbortSignal) =>
  apiRequest<Car>(apiEndpoints.cars.byId(id), { signal })

/** 409 car_exists приходит как ApiError с existingId — см. features/lot/new-lot. */
export const createCar = (dto: CreateCarDto) =>
  apiRequest<Car>(apiEndpoints.cars.list, { method: 'POST', body: dto })
