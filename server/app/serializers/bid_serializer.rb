module BidSerializer
  module_function

  # Строка ленты ставок на странице лота: участник замаскирован, свои ставки помечены
  def feed(bid, viewer: nil)
    {
      id: bid.id,
      seq: bid.seq,
      amountCents: bid.amount_cents,
      bidder: mask_bidder(bid.user),
      isMine: viewer.present? && bid.user_id == viewer.id,
      createdAt: bid.created_at.iso8601
    }
  end

  # «dmitry77@mail.ru» → «d***y77»: узнать себя можно, вычислить другого участника — нет
  def mask_bidder(user)
    handle = user.name.presence || user.email.split("@").first.to_s
    return "#{handle.first}***" if handle.length < 6

    "#{handle.first}***#{handle.last(3)}"
  end

  def call(bid)
    {
      id: bid.id,
      lotId: bid.lot_id,
      userId: bid.user_id,
      amountCents: bid.amount_cents,
      status: bid.status,
      rejectionReason: bid.rejection_reason,
      idempotencyKey: bid.idempotency_key,
      seq: bid.seq,
      createdAt: bid.created_at.iso8601
    }
  end
end
