require "test_helper"

class LotChannelTest < ActionCable::Channel::TestCase
  test "подписка на существующий лот стримит его события" do
    lot = lots(:camry_active)
    subscribe lot_id: lot.id

    assert subscription.confirmed?
    assert_has_stream_for lot
  end

  test "подписка на несуществующий лот отклоняется" do
    subscribe lot_id: 0

    assert subscription.rejected?
  end
end
