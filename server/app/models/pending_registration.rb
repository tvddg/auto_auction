class PendingRegistration < ApplicationRecord
  CODE_TTL = 60.seconds
  RESEND_AFTER = 60.seconds
  MAX_ATTEMPTS = 5
  LIFETIME = 30.minutes

  normalizes :email, with: ->(email) { email.to_s.strip.downcase }
  normalizes :phone, with: ->(phone) { PhoneHelper.normalizePhone(phone) }

  scope :fresh, -> { where(created_at: LIFETIME.ago..) }

  def self.open!(email:, password:, phone:, ip: nil)
    code = VerificationCodeHelper.generateCode
    registration = create!(
      email:, phone:, request_ip: ip,
      password_digest: BCrypt::Password.create(password),
      code_digest: VerificationCodeHelper.digestCode(code),
      expires_at: CODE_TTL.from_now,
      last_sent_at: Time.current
    )

    [ registration, code ]
  end

  def resend!
    code = VerificationCodeHelper.generateCode
    update!(code_digest: VerificationCodeHelper.digestCode(code), expires_at: CODE_TTL.from_now,
            last_sent_at: Time.current, attempts: 0)
    code
  end

  def code_expired? = expires_at <= Time.current
  def attempts_exceeded? = attempts >= MAX_ATTEMPTS
  def resend_allowed_at = last_sent_at + RESEND_AFTER
  def resend_allowed? = resend_allowed_at <= Time.current
  def seconds_until_resend = [ (resend_allowed_at - Time.current).ceil, 0 ].max
  def matches_code?(code) = VerificationCodeHelper.codeMatches?(code_digest, code)

  # Шаг 2: код верный — превращаем заявку в пользователя.
  def confirm!
    transaction do
      user = User.new(email:, phone:, phone_verified_at: Time.current)
      user.password_digest = password_digest
      user.save!
      destroy!
      user
    end
  end
end
