require "test_helper"

class BidsApiTest < ActionDispatch::IntegrationTest
  # camry_active: продавец one, лидер two, цена 165 000 000, шаг 2 500 000
  MIN_NEXT_BID = 167_500_000

  setup do
    @lot = lots(:camry_active)
    @headers = auth_headers(users(:three))
  end

  def post_bid(amount: MIN_NEXT_BID, lot: @lot, key: SecureRandom.uuid, headers: @headers, key_header: "Idempotency-Key")
    post "/api/v1/bid", params: { lotId: lot.id, amountCents: amount }, headers: headers.merge(key_header => key), as: :json
  end

  test "принятая ставка — 201 со ставкой в camelCase" do
    key = SecureRandom.uuid
    post_bid(key:)

    assert_response :created
    body = response.parsed_body
    assert_equal @lot.id, body["lotId"]
    assert_equal users(:three).id, body["userId"]
    assert_equal MIN_NEXT_BID, body["amountCents"]
    assert_equal "accepted", body["status"]
    assert_nil body["rejectionReason"]
    assert_equal key, body["idempotencyKey"]
    assert_equal 4, body["seq"]
    assert body["createdAt"].present?
  end

  test "повтор запроса с тем же ключом — 200 с той же ставкой" do
    key = SecureRandom.uuid
    post_bid(key:)
    bid_id = response.parsed_body["id"]

    assert_no_difference -> { Bid.count } do
      post_bid(key:)
    end
    assert_response :ok
    assert_equal bid_id, response.parsed_body["id"]
  end

  test "ключ принимается и в заголовке IdempotencyKey" do
    post_bid(key_header: "IdempotencyKey")

    assert_response :created
  end

  test "без ключа или с ключом не в формате UUID — 400" do
    post "/api/v1/bid", params: { lotId: @lot.id, amountCents: MIN_NEXT_BID }, headers: @headers, as: :json
    assert_response :bad_request
    assert_equal "idempotency_key_required", error_code

    post_bid(key: "not-a-uuid")
    assert_response :bad_request
  end

  test "тот же ключ для другой ставки — 422" do
    key = SecureRandom.uuid
    post_bid(key:)
    post_bid(key:, amount: MIN_NEXT_BID + 1)

    assert_response :unprocessable_content
    assert_equal "idempotency_key_reused", error_code
  end

  test "отказы отдаются со статусом и кодом причины и сохраняются в журнал" do
    {
      [ users(:one), MIN_NEXT_BID, @lot ] => [ :forbidden, "own_lot" ],
      [ users(:two), MIN_NEXT_BID, @lot ] => [ :conflict, "already_leading" ],
      [ users(:three), MIN_NEXT_BID - 1, @lot ] => [ :bad_request, "amount_too_low" ],
      [ users(:three), 300_000_000, lots(:model_3_upcoming) ] => [ :method_not_allowed, "lot_not_active" ],
      [ users(:three), 200_000_000, lots(:camry_unsold) ] => [ :method_not_allowed, "lot_ended" ]
    }.each do |(user, amount, lot), (status, code)|
      assert_difference -> { Bid.rejected.count }, 1, code do
        post_bid(amount:, lot:, headers: auth_headers(user))
      end
      assert_response status, code
      assert_equal code, error_code
    end
  end

  test "недостаточный депозит — 400 insufficient_deposit" do
    users(:three).update!(deposit_cents: 0)
    post_bid

    assert_response :bad_request
    assert_equal "insufficient_deposit", error_code
  end

  test "некорректная сумма — 422 без записи в журнал" do
    [ 0, -1, 1.5, "много", nil, 10**20 ].each do |amount|
      assert_no_difference -> { Bid.count } do
        post_bid(amount:)
      end
      assert_response :unprocessable_content, amount.inspect
      assert response.parsed_body.dig("error", "details").key?("amountCents")
    end
  end

  test "без лота — 422, несуществующий лот — 404" do
    post "/api/v1/bid", params: { amountCents: MIN_NEXT_BID }, headers: @headers.merge("Idempotency-Key" => SecureRandom.uuid), as: :json
    assert_response :unprocessable_content

    post "/api/v1/bid", params: { lotId: SecureRandom.uuid, amountCents: MIN_NEXT_BID }, headers: @headers.merge("Idempotency-Key" => SecureRandom.uuid), as: :json
    assert_response :not_found
  end

  test "без авторизации — 401" do
    post_bid(headers: {})

    assert_response :unauthorized
  end

  test "без настроенного шага — 503" do
    BidStep.delete_all
    post_bid

    assert_response :service_unavailable
    assert_equal "bid_steps_not_configured", error_code
  end
end
