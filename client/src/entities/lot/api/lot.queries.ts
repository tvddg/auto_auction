import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'

import type { LotListFilters } from '../model/types'

import { fetchLot, fetchLotBids, fetchLots, fetchMyLots, LOTS_PAGE_SIZE } from './lot.api'

export const lotKeys = {
  root: ['lots'] as const,
  list: (filters: LotListFilters) => [...lotKeys.root, 'list', filters] as const,
  detail: (id: string) => [...lotKeys.root, 'detail', id] as const,
  bids: (id: string) => [...lotKeys.root, 'detail', id, 'bids'] as const,
  mine: () => [...lotKeys.root, 'mine'] as const,
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

export const useLotQuery = (id: string) =>
  useQuery({
    queryKey: lotKeys.detail(id),
    queryFn: ({ signal }) => fetchLot(id, signal),
  })

export const useLotBidsQuery = (id: string) =>
  useQuery({
    queryKey: lotKeys.bids(id),
    queryFn: ({ signal }) => fetchLotBids(id, signal),
  })

/** «Мои лоты». Пока у продавца идут торги, цена и число ставок меняются — обновляем раз в 10 секунд */
export const useMyLotsQuery = () =>
  useQuery({
    queryKey: lotKeys.mine(),
    queryFn: ({ signal }) => fetchMyLots(signal),
    refetchInterval: (query) => (query.state.data?.some((lot) => lot.status === 'active') ? 10_000 : false),
  })
