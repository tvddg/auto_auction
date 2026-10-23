module BidSerializer
  module_function

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
