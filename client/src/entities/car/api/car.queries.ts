import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { searchCars } from './car.api'

export const carKeys = {
  root: ['cars'] as const,
  search: (query: string) => [...carKeys.root, 'search', query] as const,
}

export const useCarSearchQuery = (query: string) =>
  useQuery({
    queryKey: carKeys.search(query),
    queryFn: ({ signal }) => searchCars(query, signal),
    // Пока печатают следующий запрос, показываем прежние результаты, а не пустой экран
    placeholderData: keepPreviousData,
  })
