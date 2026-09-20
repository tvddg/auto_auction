require "test_helper"

class AuthFlowTest < ActionDispatch::IntegrationTest
  EMAIL = "ivan@example.com".freeze
  PASSWORD = "supersecret".freeze
  PHONE = "+79260000000".freeze

  test "регистрация в два шага, вход, продление и выход" do
    # Шаг 1: заявка с email, паролем и телефоном — пользователя ещё нет
    assert_no_difference -> { User.count } do
      post "/api/v1/auth/registration", params: { email: EMAIL, password: PASSWORD, phone: "8 926 000-00-00" }, as: :json
    end
    assert_response :success

    challenge = response.parsed_body
    assert_equal PHONE, challenge["phone"]
    assert_equal PendingRegistration::CODE_TTL.to_i, challenge["expiresIn"]
    code = challenge["devCode"]
    assert_match(/\A\d{4}\z/, code)

    # Неверный код аккаунт не создаёт
    post "/api/v1/auth/registration/confirm", params: { registrationId: challenge["registrationId"], code: "0000" }, as: :json
    assert_response :unprocessable_content
    assert_equal "invalid_code", response.parsed_body.dig("error", "code") unless code == "0000"

    # Шаг 2: верный код создаёт пользователя и открывает сессию
    post "/api/v1/auth/registration/confirm", params: { registrationId: challenge["registrationId"], code: }, as: :json
    assert_response :success

    body = response.parsed_body
    assert_equal EMAIL, body.dig("user", "email")
    assert_equal PHONE, body.dig("user", "phone")
    assert body.dig("user", "phoneVerified")
    assert body["accessToken"].present?
    assert cookies[:refresh_token].present?
    assert_equal 0, PendingRegistration.count

    # Токен пускает в /me
    get "/api/v1/auth/me", headers: bearer(body["accessToken"])
    assert_response :success
    assert_equal EMAIL, response.parsed_body["email"]

    # Вход по email и паролю
    post "/api/v1/auth/login", params: { email: EMAIL, password: PASSWORD }, as: :json
    assert_response :success
    access_token = response.parsed_body["accessToken"]
    assert access_token.present?

    # Продление по cookie выдаёт новый access-токен
    post "/api/v1/auth/refresh"
    assert_response :success
    refreshed = response.parsed_body["accessToken"]
    assert refreshed.present?

    get "/api/v1/auth/me", headers: bearer(refreshed)
    assert_response :success

    # Выход гасит сессию: старый токен больше не работает
    post "/api/v1/auth/logout"
    assert_response :no_content

    get "/api/v1/auth/me", headers: bearer(refreshed)
    assert_response :unauthorized

    post "/api/v1/auth/refresh"
    assert_response :unauthorized
  end

  test "вход с неверным паролем" do
    create_user

    post "/api/v1/auth/login", params: { email: EMAIL, password: "wrong-password" }, as: :json
    assert_response :unauthorized
    assert_equal "invalid_credentials", response.parsed_body.dig("error", "code")
  end

  test "регистрация проверяет email, пароль и телефон" do
    post "/api/v1/auth/registration", params: { email: "not-an-email", password: "123", phone: "+7926" }, as: :json
    assert_response :unprocessable_content

    details = response.parsed_body.dig("error", "details")
    assert details.key?("email")
    assert details.key?("password")
    assert details.key?("phone")
  end

  test "занятый email и телефон отклоняются" do
    create_user

    post "/api/v1/auth/registration", params: { email: EMAIL, password: PASSWORD, phone: "+79261111111" }, as: :json
    assert_response :unprocessable_content
    assert_equal "email_taken", response.parsed_body.dig("error", "code")

    post "/api/v1/auth/registration", params: { email: "other@example.com", password: PASSWORD, phone: PHONE }, as: :json
    assert_response :unprocessable_content
    assert_equal "phone_taken", response.parsed_body.dig("error", "code")
  end

  test "повторная отправка кода раньше времени отклоняется" do
    post "/api/v1/auth/registration", params: { email: EMAIL, password: PASSWORD, phone: PHONE }, as: :json
    registration_id = response.parsed_body["registrationId"]

    post "/api/v1/auth/registration/resend", params: { registrationId: registration_id }, as: :json
    assert_response :too_many_requests

    travel PendingRegistration::RESEND_AFTER + 1.second do
      post "/api/v1/auth/registration/resend", params: { registrationId: registration_id }, as: :json
      assert_response :success
    end
  end

  test "истёкший код не подтверждает регистрацию" do
    post "/api/v1/auth/registration", params: { email: EMAIL, password: PASSWORD, phone: PHONE }, as: :json
    challenge = response.parsed_body

    travel PendingRegistration::CODE_TTL + 1.second do
      post "/api/v1/auth/registration/confirm",
           params: { registrationId: challenge["registrationId"], code: challenge["devCode"] }, as: :json
      assert_response :unprocessable_content
      assert_equal "code_expired", response.parsed_body.dig("error", "code")
    end

    assert_equal 0, User.count
  end

  test "без токена профиль недоступен" do
    get "/api/v1/auth/me"
    assert_response :unauthorized
    assert_equal "unauthorized", response.parsed_body.dig("error", "code")
  end

  private

  def bearer(token) = { "Authorization" => "Bearer #{token}" }

  def create_user
    User.create!(email: EMAIL, password: PASSWORD, phone: PHONE, phone_verified_at: Time.current)
  end
end
