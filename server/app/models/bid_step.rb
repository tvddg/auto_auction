# Шаг ставки по диапазонам цены: строка действует для цен до upper_bound_cents включительно,
# строка без upper_bound_cents — для всех цен выше остальных диапазонов.
class BidStep < ApplicationRecord
  class NotConfigured < StandardError; end

  validates :step_cents, numericality: { only_integer: true, greater_than: 0 }
  validates :upper_bound_cents, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
  validates :upper_bound_cents, uniqueness: true

  def self.step_for(price_cents)
    step = where(upper_bound_cents: price_cents..).or(where(upper_bound_cents: nil))
      .order(Arel.sql("upper_bound_cents ASC NULLS LAST"))
      .pick(:step_cents)

    step || raise(NotConfigured, "Нет шага ставки для цены #{price_cents}")
  end
end
