import { useMutation } from '@tanstack/react-query'

import { deleteLot } from '@/entities/lot'

export const useDeleteLot = () =>
  useMutation({
    mutationFn: (lotId: string) => deleteLot(lotId),
  })
