module RefreshCookie
  extend ActiveSupport::Concern
  include AccessToken

  COOKIE_NAME = :refresh_token
  # Cookie уходит только на эндпоинты авторизации, остальному API она не нужна.
  COOKIE_PATH = "/api/v1/auth".freeze

  private

  def set_refresh_cookie(token, expires_at)
    cookies[COOKIE_NAME] = {
      value: token,
      httponly: true,
      secure: Rails.env.production?,
      same_site: :lax,
      path: COOKIE_PATH,
      expires: expires_at
    }
  end

  def delete_refresh_cookie
    cookies.delete(COOKIE_NAME, path: COOKIE_PATH)
  end

  def refresh_cookie_value = cookies[COOKIE_NAME]

  # Единый ответ на успешную авторизацию: access-токен в теле, refresh — в cookie.
  def render_authenticated(user)
    session, token = RefreshSession.start!(user:, request:)
    set_refresh_cookie(token, session.expires_at)

    render json: {
      accessToken: generateToken(user:, session:),
      expiresIn: AccessToken::TTL.to_i,
      user: UserSerializer.call(user)
    }
  end
end
