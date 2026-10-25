require "test_helper"

class MyBidsApiTest < ActionDispatch::IntegrationTest
  # camry_active: принятые ставки two (155 и 165 млн, лидер) и three (160 млн), цена 165 млн

  test "лот с моей ставкой: моя максимальная ставка, текущая цена и лидерство" do
    get "/api/v1/my/bids", headers: auth_headers(users(:three))

    assert_response :success
    assert_equal 1, response.parsed_body.size

    row = response.parsed_body.first
    assert_equal lots(:camry_active).id, row["lotId"]
    assert_equal "Toyota Camry Prestige", row["title"]
    assert_equal 160_000_000, row["myBid"]
    assert_equal 165_000_000, row["currentPrice"]
    assert_equal false, row["isLeader"]
    assert_equal lots(:camry_active).ends_at.iso8601, row["endsAt"]
  end

  test "у лидера моя ставка — максимальная из нескольких" do
    get "/api/v1/my/bids", headers: auth_headers(users(:two))

    row = response.parsed_body.first
    assert_equal 165_000_000, row["myBid"]
    assert row["isLeader"]
  end

  test "только отклонённые ставки не считаются" do
    # У users(:one) — отклонённые ставки на свой лот и на лот до старта
    get "/api/v1/my/bids", headers: auth_headers(users(:one))

    assert_equal [], response.parsed_body
  end

  test "завершённые торги в «Мои ставки» не попадают" do
    lots(:camry_active).update_columns(ends_at: 1.minute.ago)
    get "/api/v1/my/bids", headers: auth_headers(users(:three))

    assert_equal [], response.parsed_body
  end

  test "без авторизации — 401" do
    get "/api/v1/my/bids"

    assert_response :unauthorized
  end
end
