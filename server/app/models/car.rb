# Справочник комплектаций. Всё, что относится к конкретному экземпляру машины
# (продавец, VIN, пробег, цвет, город), хранится в лоте.
class Car < ApplicationRecord
  # По этим полям машины считаются одинаковыми — их же покрывает уникальный индекс index_cars_on_configuration
  CONFIGURATION_ATTRIBUTES = %i[brand model trim year body_type transmission drive_type fuel_type horse_power engine_volume_cc].freeze

  has_many :lots, dependent: :restrict_with_error

  enum :body_type, { sedan: 0, hatchback: 1, liftback: 2, wagon: 3, coupe: 4, convertible: 5, suv: 6, minivan: 7, pickup: 8, van: 9 }, validate: true
  enum :transmission, { manual: 0, automatic: 1, robot: 2, cvt: 3 }, validate: true
  enum :drive_type, { fwd: 0, rwd: 1, awd: 2 }, validate: true
  enum :fuel_type, { petrol: 0, diesel: 1, hybrid: 2, electric: 3, lpg: 4 }, validate: true

  normalizes :brand, :model, :trim, with: ->(value) { value.to_s.squish.presence }

  validates :brand, :model, presence: true
  validates :year, numericality: { only_integer: true, in: 1900..2100 }
  validates :horse_power, numericality: { only_integer: true, in: 1..2000 }
  validates :engine_volume_cc, numericality: { only_integer: true, in: 500..10_000 }, allow_nil: true
  validates :engine_volume_cc, presence: true, unless: :electric?

  # Уже существующая машина с той же комплектацией (nil в trim и объёме тоже должен совпадать)
  def similar
    self.class.where(slice(*CONFIGURATION_ATTRIBUTES)).where.not(id:).first
  end

  def title = [ brand, model, trim ].compact.join(" ")
end
