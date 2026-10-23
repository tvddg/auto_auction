# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

# Шаг ставки по диапазонам текущей цены. ПРИМЕРНЫЕ значения — замените на утверждённые.
# upper_bound_cents: nil — диапазон без верхней границы.
[
  { upper_bound_cents: 50_000_000, step_cents: 500_000 },     # до 500 000 ₽ — шаг 5 000 ₽
  { upper_bound_cents: 100_000_000, step_cents: 1_000_000 },  # до 1 000 000 ₽ — шаг 10 000 ₽
  { upper_bound_cents: 300_000_000, step_cents: 2_500_000 },  # до 3 000 000 ₽ — шаг 25 000 ₽
  { upper_bound_cents: nil, step_cents: 5_000_000 }           # выше — шаг 50 000 ₽
].each do |attributes|
  BidStep.find_or_create_by!(upper_bound_cents: attributes[:upper_bound_cents]) do |step|
    step.step_cents = attributes[:step_cents]
  end
end
