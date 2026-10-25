import { apiEndpoints, apiRequest } from '@/shared/api'

import type { Bid, CreateBidDto } from '../model/types'

/**
 * Ставка. idempotencyKey — UUID, общий для повторных попыток одной и той же ставки:
 * если ответ потерялся в сети и клиент повторит запрос, сервер не создаст вторую ставку,
 * а вернёт уже записанную (200 вместо 201).
 */
export const createBid = (dto: CreateBidDto, idempotencyKey: string) =>
  apiRequest<Bid>(apiEndpoints.bids.create, {
    method: 'POST',
    body: dto,
    headers: { 'Idempotency-Key': idempotencyKey },
  })
