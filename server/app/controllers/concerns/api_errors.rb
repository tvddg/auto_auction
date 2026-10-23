module ApiErrors
  extend ActiveSupport::Concern
  
  included do
    rescue_from ActionController::ParameterMissing do |error|
      render_error(:unprocessable_content, "validation_error", "Не хватает параметра #{error.param}")
    end

    rescue_from ActiveRecord::RecordInvalid do |error|
      render_validation_error(error.record)
    end

    rescue_from ActiveRecord::RecordNotFound do
      render_error(:not_found, "not_found", "Ничего не найдено")
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

  # 403, а не 401: на 401 клиент пытается обновить токен и разлогинивает пользователя
  def render_forbidden(message = "Недостаточно прав")
    render_error(:forbidden, "forbidden", message)
  end

  def render_too_many_requests(message = "Слишком много запросов. Попробуйте позже")
    render_error(:too_many_requests, "too_many_requests", message)
  end
end
