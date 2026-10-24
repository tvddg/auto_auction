import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'

import type { LotListFilters } from '../model/types'

import { fetchLots, LOTS_PAGE_SIZE } from './lot.api'

export const lotKeys = {
  root: ['lots'] as const,
  list: (filters: LotListFilters) => [...lotKeys.root, 'list', filters] as const,
}

/** Каталог постранично: следующая страница — по «Показать ещё». */
export const useLotsInfiniteQuery = (filters: LotListFilters) =>
  useInfiniteQuery({
    queryKey: lotKeys.list(filters),
    queryFn: ({ pageParam, signal }) => fetchLots(filters, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * LOTS_PAGE_SIZE < lastPage.total ? lastPage.page + 1 : undefined,
    // При смене фильтров показываем прежний список, пока грузится новый
    placeholderData: keepPreviousData,
  })
