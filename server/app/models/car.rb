class Car < ApplicationRecord
  VIN_FORMAT = /\A[A-HJ-NPR-Z0-9]{17}\z/

  belongs_to :seller, class_name: "User"
  has_many :lots, dependent: :restrict_with_error

  enum :body_type, { sedan: 0, hatchback: 1, liftback: 2, wagon: 3, coupe: 4, convertible: 5, suv: 6, minivan: 7, pickup: 8, van: 9 }, validate: true
  enum :transmission, { manual: 0, automatic: 1, robot: 2, cvt: 3 }, validate: true
  enum :drive_type, { fwd: 0, rwd: 1, awd: 2 }, validate: true
  enum :fuel_type, { petrol: 0, diesel: 1, hybrid: 2, electric: 3, lpg: 4 }, validate: true

  normalizes :vin, with: ->(vin) { vin.to_s.strip.upcase }
  normalizes :brand, :model, :trim, :color, :city, with: ->(value) { value.to_s.squish.presence }

  validates :brand, :model, :color, :city, presence: true
  validates :vin, presence: true, uniqueness: true, format: { with: VIN_FORMAT, message: "VIN — 17 символов, латиница и цифры без I, O, Q" }
  validates :year, numericality: { only_integer: true, in: 1900..2100 }
  validates :mileage, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :horse_power, numericality: { only_integer: true, in: 1..2000 }
  validates :engine_volume_cc, numericality: { only_integer: true, in: 500..10_000 }, allow_nil: true
  validates :engine_volume_cc, presence: true, unless: :electric?
end
