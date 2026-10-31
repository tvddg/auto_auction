# Приём ставки. Под блокировкой лота проверяет правила, выдаёт порядковый номер
# и обновляет цену, лидера и счётчик. Отклонённые ставки тоже сохраняются — это журнал попыток.
# Повтор с тем же ключом идемпотентности возвращает уже записанную ставку, ничего не меняя.
class BidPlacement
  Result = Data.define(:bid, :replayed)

  # Ключ уже использован этим пользователем для другой ставки
  class KeyReused < StandardError; end

  def self.call(...) = new(...).call

  def initialize(lot:, user:, amount_cents:, idempotency_key:, now: Time.current)
    @lot = lot
    @user = user
    @amount_cents = amount_cents
    @idempotency_key = idempotency_key
    @now = now
  end

  def call
    existing = find_existing
    return replay(existing) if existing

    res = @lot.with_lock do
      # Параллельный запрос с тем же ключом мог успеть, пока ждали блокировку
      existing = find_existing
      return replay(existing) if existing

      Result.new(bid: place, replayed: false)
    end
    unless res.bid.status == "rejected"
        LotChannel.broadcast_to(@lot, { type: "bid_placed", lotId: @lot.id })
    end
    res
  rescue ActiveRecord::RecordNotUnique
    # Тот же ключ одновременно пришёл на другой лот: он заблокирован отдельно, разрулил уникальный индекс
    replay(find_existing || raise)
  end

  private

  def find_existing = Bid.find_by(user: @user, idempotency_key: @idempotency_key)

  def replay(bid)
    raise KeyReused unless bid.lot_id == @lot.id && bid.amount_cents == @amount_cents

    Result.new(bid:, replayed: true)
  end

  def place
    reason = rejection_reason
    return create_bid(status: :rejected, rejection_reason: reason) if reason

    bid = create_bid(status: :accepted, seq: @lot.bids.accepted.maximum(:seq).to_i + 1)
    @lot.update!(current_price_cents: @amount_cents, leader: @user, bid_count: @lot.bid_count + 1)
    bid
  end

  def create_bid(**attributes)
    @lot.bids.create!(user: @user, amount_cents: @amount_cents, idempotency_key: @idempotency_key, **attributes)
  end

  def rejection_reason
    return :own_lot if @lot.seller_id == @user.id

    case @lot.phase(@now)
    when "upcoming" then return :lot_not_active
    when "active" then nil
    else return :lot_ended
    end

    return :already_leading if @lot.leader_id == @user.id
    return :amount_too_low if @amount_cents < minimum_amount
    return :insufficient_deposit if @user.deposit_cents < @amount_cents

    nil
  end

  def minimum_amount = @lot.min_next_bid_cents
end
