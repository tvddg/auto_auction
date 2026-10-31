require "test_helper"

class BidPlacementTest < ActiveSupport::TestCase
  include ActionCable::TestHelper

  # camry_active: продавец one, лидер two, цена 165 000 000, шаг для неё 2 500 000
  MIN_NEXT_BID = 167_500_000

  setup do
    @lot = lots(:camry_active)
  end

  def place(user: users(:three), amount: MIN_NEXT_BID, lot: @lot, key: SecureRandom.uuid, now: Time.current)
    BidPlacement.call(lot:, user:, amount_cents: amount, idempotency_key: key, now:)
  end

  test "принятая ставка получает следующий номер и обновляет лот" do
    result = place

    assert_not result.replayed
    assert result.bid.accepted?
    assert_equal 4, result.bid.seq

    @lot.reload
    assert_equal MIN_NEXT_BID, @lot.current_price_cents
    assert_equal users(:three), @lot.leader
    assert_equal 4, @lot.bid_count
  end

  test "ставка ровно в текущую цену плюс шаг принимается, на копейку меньше — нет" do
    assert place(amount: MIN_NEXT_BID - 1).bid.rejected_as_amount_too_low?
    assert place(amount: MIN_NEXT_BID).bid.accepted?
  end

  test "отклонённая ставка сохраняется в журнал и не меняет лот" do
    assert_difference -> { Bid.rejected.count } do
      result = place(amount: 1)
      assert result.bid.persisted?
      assert_nil result.bid.seq
    end

    assert_equal 165_000_000, @lot.reload.current_price_cents
    assert_equal 3, @lot.bid_count
  end

  test "продавец не может ставить на свой лот" do
    assert place(user: users(:one)).bid.rejected_as_own_lot?
  end

  test "лидер не может перебивать сам себя" do
    assert place(user: users(:two)).bid.rejected_as_already_leading?
  end

  test "до старта торгов ставка отклоняется" do
    lot = lots(:model_3_upcoming)

    assert place(lot:, user: users(:three), amount: 300_000_000).bid.rejected_as_lot_not_active?
  end

  test "после окончания торгов ставка отклоняется" do
    assert place(now: @lot.ends_at).bid.rejected_as_lot_ended?
  end

  test "на закрытый или снятый лот ставка отклоняется" do
    assert place(lot: lots(:camry_unsold)).bid.rejected_as_lot_ended?

    @lot.cancelled!
    assert place.bid.rejected_as_lot_ended?
  end

  test "депозит должен покрывать всю сумму ставки" do
    users(:three).update!(deposit_cents: MIN_NEXT_BID - 1)
    assert place.bid.rejected_as_insufficient_deposit?

    users(:three).update!(deposit_cents: MIN_NEXT_BID)
    assert place.bid.accepted?
  end

  test "повтор с тем же ключом возвращает исходную ставку и ничего не меняет" do
    key = SecureRandom.uuid
    first = place(key:)

    assert_no_difference -> { Bid.count } do
      second = place(key:)

      assert second.replayed
      assert_equal first.bid, second.bid
    end
    assert_equal 4, @lot.reload.bid_count
  end

  test "повтор отклонённой ставки возвращает ту же отклонённую ставку" do
    key = SecureRandom.uuid
    first = place(amount: 1, key:)

    assert_equal first.bid, place(amount: 1, key:).bid
  end

  test "тот же ключ для другой суммы или другого лота — ошибка" do
    key = SecureRandom.uuid
    place(key:)

    assert_raises(BidPlacement::KeyReused) { place(key:, amount: MIN_NEXT_BID + 1) }
    assert_raises(BidPlacement::KeyReused) { place(key:, lot: lots(:model_3_upcoming)) }
  end

  test "ставки по очереди перебивают друг друга" do
    place(user: users(:three), amount: MIN_NEXT_BID)
    result = place(user: users(:two), amount: MIN_NEXT_BID + 2_500_000)

    assert result.bid.accepted?
    assert_equal 5, result.bid.seq
    assert_equal users(:two), @lot.reload.leader
    assert_equal [ 1, 2, 3, 4, 5 ], @lot.bids.since(0).pluck(:seq)
  end

  test "без настроенного шага ставка не принимается и не сохраняется" do
    BidStep.delete_all

    assert_no_difference -> { Bid.count } do
      assert_raises(BidStep::NotConfigured) { place }
    end
  end

  test "принятая ставка рассылает событие подписчикам лота" do
    assert_broadcast_on(LotChannel.broadcasting_for(@lot), { type: "bid_placed", lotId: @lot.id }) { place }
  end

  test "отклонённая ставка и повтор ничего не рассылают" do
    key = SecureRandom.uuid
    place(key:)

    assert_no_broadcasts(LotChannel.broadcasting_for(@lot)) do
      place(amount: 1)
      place(key:)
    end
  end
end
