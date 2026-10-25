import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createLot, lotKeys, type CreateLotDto } from '@/entities/lot'

/** POST /lot: лот сразу публикуется (статус upcoming). После успеха каталог устарел — перезапрашиваем. */
export const usePublishLot = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: CreateLotDto) => createLot(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: lotKeys.root }),
  })
}
