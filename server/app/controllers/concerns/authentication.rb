module Authentication
  extend ActiveSupport::Concern
  include AccessToken

  included do
    attr_reader :current_user
  end

  private

  def authenticate!
    @current_user = user_for(bearer_token)
    render_unauthorized if @current_user.nil?
  end

  # Для публичных страниц, которые вошедшему показывают больше (например, «ваша ставка»).
  # Без токена — гость. С недействительным токеном — 401: клиент продлит сессию и повторит запрос,
  # иначе пользователь с просроченным токеном молча видел бы страницу как гость.
  def authenticate_optional!
    return if bearer_token.blank?

    @current_user = user_for(bearer_token)
    render_unauthorized if @current_user.nil?
  end

  def bearer_token = request.authorization.to_s[/\ABearer (.+)\z/, 1]
end
