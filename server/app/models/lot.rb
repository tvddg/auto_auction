class Lot < ApplicationRecord
  OPEN_STATUSES = %i[upcoming active].freeze

  belongs_to :car
  belongs_to :leader, class_name: "User", optional: true
  has_many :bids, dependent: :restrict_with_error

  # Номера open-статусов (0, 1) зашиты в частичный уникальный индекс по car_id
  enum :status, { upcoming: 0, active: 1, sold: 2, unsold: 3, cancelled: 4 }, validate: true

  before_validation -> { self.current_price_cents ||= starting_price_cents }, on: :create

  validates :starting_price_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :current_price_cents, numericality: { only_integer: true }
  validates :bid_count, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :starts_at, :ends_at, presence: true
  validates :car_id, uniqueness: { conditions: -> { where(status: OPEN_STATUSES) }, message: "уже выставлена на аукцион" }, if: :open?
  validates :leader, presence: true, if: -> { bid_count.to_i.positive? }

  validate :current_price_not_below_start
  validate :ends_after_start
  validate :leader_is_not_seller

  def open? = status&.to_sym.in?(OPEN_STATUSES)

  private

  def current_price_not_below_start
    return if current_price_cents.nil? || starting_price_cents.nil?

    errors.add(:current_price_cents, "не может быть ниже стартовой цены") if current_price_cents < starting_price_cents
  end

  def ends_after_start
    return if starts_at.nil? || ends_at.nil?

    errors.add(:ends_at, "должно быть позже начала") unless ends_at > starts_at
  end

  def leader_is_not_seller
    errors.add(:leader, "не может быть продавцом машины") if leader && car && leader_id == car.seller_id
  end
end
