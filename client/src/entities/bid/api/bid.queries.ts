import { useQuery } from '@tanstack/react-query'

import { fetchMyBids } from './bid.api'

export const bidKeys = {
  root: ['bids'] as const,
  mine: () => [...bidKeys.root, 'mine'] as const,
}

/** Пока открыта страница «Мои ставки», статус «лидер / перебита» обновляем опросом */
export const MY_BIDS_POLL_INTERVAL_MS = 5000

export const useMyBidsQuery = () =>
  useQuery({
    queryKey: bidKeys.mine(),
    queryFn: ({ signal }) => fetchMyBids(signal),
    refetchInterval: MY_BIDS_POLL_INTERVAL_MS,
  })
