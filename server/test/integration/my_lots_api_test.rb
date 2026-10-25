require "test_helper"

class MyLotsApiTest < ActionDispatch::IntegrationTest
  test "только мои лоты во всех статусах, новые сверху" do
    lots(:camry_unsold).update_columns(created_at: 2.days.ago)
    lots(:camry_active).update_columns(created_at: 1.day.ago)

    get "/api/v1/my/lots", headers: auth_headers(users(:one))

    assert_response :success
    assert_equal lots(:camry_active, :camry_unsold).map(&:id), response.parsed_body.map { |row| row["lotId"] }
    assert_equal %w[active unsold], response.parsed_body.map { |row| row["status"] }
  end

  test "строка содержит цену, ставки и даты торгов" do
    get "/api/v1/my/lots", headers: auth_headers(users(:two))

    row = response.parsed_body.sole
    lot = lots(:model_3_upcoming)
    assert_equal "upcoming", row["status"]
    assert_equal "Tesla Model 3", row["title"]
    assert_equal 280_000_000, row["startingPrice"]
    assert_equal 0, row["bidCount"]
    assert_equal lot.starts_at.iso8601, row["startsAt"]
    assert_nil row["buyer"]
  end

  test "у проданного лота — замаскированный покупатель" do
    lot = lots(:camry_active)
    lot.update_columns(ends_at: 1.minute.ago) # торги закончились со ставками — фаза sold

    get "/api/v1/my/lots", headers: auth_headers(users(:one))

    row = response.parsed_body.find { |item| item["lotId"] == lot.id }
    assert_equal "sold", row["status"]
    assert_equal "s***two", row["buyer"]
  end

  test "без лотов — пустой список, без авторизации — 401" do
    get "/api/v1/my/lots", headers: auth_headers(users(:three))
    assert_equal [], response.parsed_body

    get "/api/v1/my/lots"
    assert_response :unauthorized
  end
end
