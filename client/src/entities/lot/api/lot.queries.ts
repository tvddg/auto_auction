import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'

import type { LotListFilters } from '../model/types'

import { fetchLot, fetchLotBids, fetchLots, LOTS_PAGE_SIZE } from './lot.api'

export const lotKeys = {
  root: ['lots'] as const,
  list: (filters: LotListFilters) => [...lotKeys.root, 'list', filters] as const,
  detail: (id: string) => [...lotKeys.root, 'detail', id] as const,
  bids: (id: string) => [...lotKeys.root, 'detail', id, 'bids'] as const,
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

/** Пока идут торги, цену и ленту обновляем опросом; потом заменим на WebSocket. */
export const LOT_POLL_INTERVAL_MS = 5000

export const useLotQuery = (id: string) =>
  useQuery({
    queryKey: lotKeys.detail(id),
    queryFn: ({ signal }) => fetchLot(id, signal),
    // Опрашиваем, только пока торги идут: у завершённого или будущего лота цена не меняется
    refetchInterval: (query) => (query.state.data?.status === 'active' ? LOT_POLL_INTERVAL_MS : false),
  })

export const useLotBidsQuery = (id: string, { poll }: { poll: boolean }) =>
  useQuery({
    queryKey: lotKeys.bids(id),
    queryFn: ({ signal }) => fetchLotBids(id, signal),
    refetchInterval: poll ? LOT_POLL_INTERVAL_MS : false,
  })
