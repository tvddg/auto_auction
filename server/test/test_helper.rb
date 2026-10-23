ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all

    # Add more helper methods to be used by all tests here...
  end
end

module ApiTestHelpers
  FIXTURE_PASSWORD = "password123".freeze

  # Входит через настоящий эндпоинт и отдаёт заголовок с access-токеном
  def auth_headers(user)
    post "/api/v1/auth/login", params: { email: user.email, password: FIXTURE_PASSWORD }, as: :json
    raise "Не удалось войти как #{user.email}: #{response.body}" unless response.successful?

    { "Authorization" => "Bearer #{response.parsed_body["accessToken"]}" }
  end

  def error_code = response.parsed_body.dig("error", "code")
end

ActionDispatch::IntegrationTest.include(ApiTestHelpers)
