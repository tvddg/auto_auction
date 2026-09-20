class User < ApplicationRecord
  has_secure_password

  has_many :refresh_sessions, dependent: :delete_all

  normalizes :email, with: ->(email) { email.to_s.strip.downcase }
  normalizes :phone, with: ->(phone) { Phone.normalize(phone) }

  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP, message: "введите корректный email" }
  validates :password, length: { minimum: 8, message: "минимум 8 символов" }, allow_nil: true
  validates :phone, presence: true, uniqueness: true, format: { with: Phone::FORMAT, message: "введите номер в формате +7XXXXXXXXXX" }

  def phone_verified? = phone_verified_at.present?
end
