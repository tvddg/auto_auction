class RefreshSession < ApplicationRecord
  TTL = 30.days

  belongs_to :user

  scope :active, -> { where(expires_at: Time.current..) }

  def self.start!(user:, request: nil)
    token = generate_token
    session = create!(
      user:, token_digest: digest(token), expires_at: TTL.from_now,
      last_used_at: Time.current, user_agent: request&.user_agent, ip: request&.remote_ip
    )

    [ session, token ]
  end

  def self.find_active(token)
    return nil if token.blank?

    active.find_by(token_digest: digest(token))
  end

  def self.generate_token = SecureRandom.urlsafe_base64(32)

  def self.digest(token)
    OpenSSL::HMAC.hexdigest("SHA256", Rails.application.secret_key_base, token.to_s)
  end

  def rotate!
    token = self.class.generate_token
    update!(token_digest: self.class.digest(token), expires_at: TTL.from_now, last_used_at: Time.current)
    token
  end
end
