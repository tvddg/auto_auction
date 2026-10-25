class Lot < ApplicationRecord
  OPEN_STATUSES = %i[upcoming active].freeze
  VIN_FORMAT = /\A[A-HJ-NPR-Z0-9]{17}\z/

  belongs_to :car
  belongs_to :seller, class_name: "User"
  belongs_to :leader, class_name: "User", optional: true
  has_many :bids, dependent: :restrict_with_error
  # Порядок фото — по position; первая — обложка. destroy, а не delete: у фото колбэк удаляет файл
  has_many :photos, -> { order(:position) }, class_name: "LotPhoto", dependent: :destroy, inverse_of: :lot

  # Номера open-статусов (0, 1) зашиты в частичный уникальный индекс по vin
  enum :status, { upcoming: 0, active: 1, sold: 2, unsold: 3, cancelled: 4 }, validate: true

  # Фоновой задачи, переводящей статусы, пока нет, поэтому у открытого лота фазу задаёт время:
  # до старта — upcoming, между стартом и концом — active, после конца — sold или unsold по наличию ставок.
  scope :open_lots, -> { where(status: OPEN_STATUSES) }
  scope :ended_open, ->(now = Time.current) { open_lots.where(ends_at: ..now) }
  scope :in_phase, ->(phase, now = Time.current) {
    case phase.to_s
    when "upcoming" then open_lots.where("lots.starts_at > ?", now)
    when "active" then open_lots.where("lots.starts_at <= :now AND lots.ends_at > :now", now:)
    when "sold" then where(status: :sold).or(ended_open(now).where(bid_count: 1..))
    when "unsold" then where(status: :unsold).or(ended_open(now).where(bid_count: 0))
    when "finished" then where(status: %i[sold unsold]).or(ended_open(now))
    else none
    end
  }

  before_validation -> { self.current_price_cents ||= starting_price_cents }, on: :create

  normalizes :vin, with: ->(vin) { vin.to_s.strip.upcase }
  normalizes :color, :city, with: ->(value) { value.to_s.squish.presence }

  validates :vin, presence: true, format: { with: VIN_FORMAT, message: "VIN — 17 символов, латиница и цифры без I, O, Q" }
  validates :vin, uniqueness: { conditions: -> { open_lots }, message: "уже выставлен на аукцион" }, if: :open?
  validates :mileage, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :color, :city, presence: true
  validates :starting_price_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :current_price_cents, numericality: { only_integer: true }
  validates :bid_count, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :starts_at, :ends_at, presence: true
  validates :leader, presence: true, if: -> { bid_count.to_i.positive? }
  validates :photos, length: { maximum: LotPhoto::MAX_PER_LOT, message: "не больше #{LotPhoto::MAX_PER_LOT}" }

  validate :current_price_not_below_start
  validate :ends_after_start
  validate :leader_is_not_seller

  def open? = status&.to_sym.in?(OPEN_STATUSES)

  # Фаза лота для API и бизнес-правил — см. комментарий к scope :in_phase
  def phase(now = Time.current)
    return status unless open?
    return "upcoming" if now < starts_at
    return "active" if now < ends_at

    bid_count.positive? ? "sold" : "unsold"
  end

  # Править и снимать лот может только продавец; модераторы добавятся здесь же
  def manageable_by?(user) = user.present? && seller_id == user.id

  def editable?(now = Time.current) = phase(now) == "upcoming"

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
    errors.add(:leader, "не может быть продавцом машины") if leader_id.present? && leader_id == seller_id
  end
end
