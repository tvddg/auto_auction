# Короткоживущий токен доступа: подписанный payload без похода в базу.
# Живёт в localStorage клиента, поэтому TTL маленький, а продление — через refresh-cookie.
module AccessToken
  extend ActiveSupport::Concern
  TTL = 15.minutes

  private

  def generateToken(user:, session:)
    verifier.generate({ uid: user.id, sid: session.id }, expires_in: TTL)
  end

  def user_for(token)
    payload = verifier.verified(token.to_s)
    return nil if payload.blank?

    payload = payload.with_indifferent_access
    return nil unless RefreshSession.active.exists?(id: payload[:sid])

    User.find_by(id: payload[:uid])
  end

  def verifier = Rails.application.message_verifier("auth/access_token")
end
