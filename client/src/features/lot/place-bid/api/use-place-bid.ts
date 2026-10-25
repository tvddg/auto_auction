import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createBid, type CreateBidDto } from '@/entities/bid'
import { lotKeys } from '@/entities/lot'

type PlaceBidVariables = { dto: CreateBidDto; idempotencyKey: string }

/**
 * После любого ответа сервера перезапрашиваем лот, ленту и каталог: ставка принята — цена выросла;
 * отклонена как amount_too_low — значит, нас перебили, и нужно показать актуальную цену.
 */
export const usePlaceBid = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ dto, idempotencyKey }: PlaceBidVariables) => createBid(dto, idempotencyKey),
    onSettled: () => queryClient.invalidateQueries({ queryKey: lotKeys.root }),
  })
}
