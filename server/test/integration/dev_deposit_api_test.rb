require "test_helper"

class DevDepositApiTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:three)
    @headers = auth_headers(@user)
  end

  test "пополнение прибавляет сумму к депозиту и возвращает новый баланс" do
    post "/api/v1/dev/deposit", params: { amountCents: 50_000 }, headers: @headers, as: :json

    assert_response :success
    assert_equal 1_000_050_000, response.parsed_body["depositCents"]
    assert_equal 1_000_050_000, @user.reload.deposit_cents
  end

  test "после пополнения ставка проходит проверку депозита" do
    @user.update!(deposit_cents: 0)
    post "/api/v1/dev/deposit", params: { amountCents: 167_500_000 }, headers: @headers, as: :json

    post "/api/v1/bid", params: { lotId: lots(:camry_active).id, amountCents: 167_500_000 },
                        headers: @headers.merge("Idempotency-Key" => SecureRandom.uuid), as: :json
    assert_response :created
  end

  test "некорректная сумма отклоняется и депозит не меняется" do
    [ 0, -1, 1.5, "много", nil, Api::V1::Dev::DepositsController::MAX_TOP_UP_CENTS + 1 ].each do |amount|
      post "/api/v1/dev/deposit", params: { amountCents: amount }, headers: @headers, as: :json

      assert_response :unprocessable_content, amount.inspect
    end
    assert_equal 1_000_000_000, @user.reload.deposit_cents
  end

  test "без авторизации — 401" do
    post "/api/v1/dev/deposit", params: { amountCents: 50_000 }, as: :json

    assert_response :unauthorized
  end
end
