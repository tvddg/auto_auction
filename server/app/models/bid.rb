class Bid < ApplicationRecord
  belongs_to :lot
  belongs_to :user

  # Номер rejected (1) зашит в CHECK-ограничения и частичный индекс по сумме
  enum :status, { accepted: 0, rejected: 1 }, validate: true
  enum :rejection_reason, {
    lot_not_active: 0,
    lot_ended: 1,
    amount_too_low: 2,
    own_lot: 3,
    already_leading: 4,
    insufficient_deposit: 5
  }, prefix: :rejected_as, validate: { allow_nil: true }

  # Принятые ставки лота после указанного номера — для догрузки при реконнекте
  scope :since, ->(seq) { accepted.where(seq: (seq.to_i + 1)..).order(:seq) }

  validates :amount_cents, numericality: { only_integer: true, greater_than: 0 }
  validates :idempotency_key, presence: true, uniqueness: { scope: :user_id }

  with_options if: :accepted? do
    validates :seq, numericality: { only_integer: true, greater_than: 0 }, uniqueness: { scope: :lot_id }
    validates :amount_cents, uniqueness: { scope: :lot_id, conditions: -> { accepted }, message: "уже поставлена в этом лоте" }
    validates :rejection_reason, absence: true
  end

  with_options if: :rejected? do
    validates :rejection_reason, presence: true
    validates :seq, absence: true
  end
end
