module ApiErrors
  extend ActiveSupport::Concern

  included do
    rescue_from ActionController::ParameterMissing do |error|
      render_error(:unprocessable_content, "validation_error", "Не хватает параметра #{error.param}")
    end

    rescue_from ActiveRecord::RecordInvalid do |error|
      render_validation_error(error.record)
    end
  end

  private

  # Единый формат ошибок: { "error": { "code", "message", "details" } }
  def render_error(status, code, message, details: nil)
    payload = { code:, message: }
    payload[:details] = details if details.present?

    render json: { error: payload }, status:
  end

  def render_validation_error(record)
    details = record.errors.to_hash.transform_keys { |key| key.to_s.camelize(:lower) }
    render_error(:unprocessable_content, "validation_error", record.errors.full_messages.first || "Проверьте данные", details:)
  end

  def render_unauthorized(message = "Требуется авторизация")
    render_error(:unauthorized, "unauthorized", message)
  end

  def render_too_many_requests(message = "Слишком много запросов. Попробуйте позже")
    render_error(:too_many_requests, "too_many_requests", message)
  end
end
