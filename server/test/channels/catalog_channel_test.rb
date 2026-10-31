require "test_helper"

class CatalogChannelTest < ActionCable::Channel::TestCase
  test "подписка стримит события всех лотов" do
    subscribe

    assert subscription.confirmed?
    assert_has_stream "lots"
  end
end
