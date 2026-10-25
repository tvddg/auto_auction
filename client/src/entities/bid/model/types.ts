export type RejectionReason =
  | 'lot_not_active'
  | 'lot_ended'
  | 'amount_too_low'
  | 'own_lot'
  | 'already_leading'
  | 'insufficient_deposit'

/** Ответ POST /bid. Отклонённая ставка приходит не сюда, а ошибкой с code = причине отказа. */
export type Bid = {
  id: string
  lotId: string
  userId: string
  amountCents: number
  status: 'accepted' | 'rejected'
  rejectionReason: RejectionReason | null
  idempotencyKey: string
  seq: number | null
  createdAt: string
}

export type CreateBidDto = {
  lotId: string
  amountCents: number
}

/** Строка «Моих ставок» (GET /my/bids): лот с идущими торгами, где у меня есть принятая ставка. */
export type MyBid = {
  lotId: string
  title: string
  imageUrl: string | null
  /** Моя максимальная ставка, в копейках */
  myBid: number
  currentPrice: number
  isLeader: boolean
  bidCount: number
  endsAt: string
}
