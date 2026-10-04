require "test_helper"

class LotTest < ActiveSupport::TestCase
  setup do
    # У машин из фикстур уже есть открытые лоты, поэтому для новых лотов нужна свободная машина
    @car = Car.create!(
      seller: users(:one), brand: "Lada", model: "Vesta", color: "Серый", year: 2022,
      body_type: :sedan, mileage: 15_000, vin: "XTAGFK330NY123456", transmission: :manual,
      drive_type: :fwd, fuel_type: :petrol, horse_power: 106, engine_volume_cc: 1596, city: "Самара"
    )
  end

  def build_lot(**overrides)
    Lot.new({
      car: @car,
      status: :upcoming,
      starting_price_cents: 120_000_000,
      starts_at: 1.day.from_now,
      ends_at: 3.days.from_now
    }.merge(overrides))
  end

  # --- корректные данные ---

  test "лот с полными корректными данными сохраняется" do
    lot = build_lot

    assert lot.save, lot.errors.full_messages.to_sentence
    lot.reload
    assert lot.upcoming?
    assert_equal 120_000_000, lot.current_price_cents
    assert_equal 0, lot.bid_count
    assert_nil lot.leader
  end

  test "идущий лот со ставками и лидером сохраняется" do
    lot = build_lot(status: :active, starts_at: 1.hour.ago, current_price_cents: 130_000_000, bid_count: 2, leader: users(:two))

    assert lot.save, lot.errors.full_messages.to_sentence
    assert_equal users(:two), lot.reload.leader
  end

  test "фикстуры валидны" do
    Lot.find_each { |lot| assert lot.valid?, "#{lot.status}: #{lot.errors.full_messages.to_sentence}" }
  end

  # --- неполные данные ---

  test "без обязательных полей лот не сохраняется" do
    lot = Lot.new

    assert_not lot.save
    %i[car starting_price_cents current_price_cents starts_at ends_at].each do |field|
      assert lot.errors.key?(field), "нет ошибки для #{field}"
    end
  end

  test "без машины лот не сохраняется" do
    lot = build_lot(car: nil)

    assert_not lot.valid?
    assert lot.errors.key?(:car)
  end

  test "без даты окончания лот не сохраняется" do
    lot = build_lot(ends_at: nil)

    assert_not lot.valid?
    assert lot.errors.key?(:ends_at)
  end

  # --- некорректные данные: валидации модели ---

  test "отрицательная или дробная стартовая цена отклоняется" do
    [-1, 100.5, "дорого"].each do |price|
      lot = build_lot(starting_price_cents: price)

      assert_not lot.valid?, "стартовая цена #{price.inspect} прошла валидацию"
      assert lot.errors.key?(:starting_price_cents)
    end
  end

  test "текущая цена ниже стартовой отклоняется" do
    lot = build_lot(current_price_cents: 119_999_999)

    assert_not lot.valid?
    assert lot.errors.key?(:current_price_cents)
  end

  test "окончание не позже начала отклоняется" do
    starts_at = 1.day.from_now

    [starts_at, starts_at - 1.second].each do |ends_at|
      lot = build_lot(starts_at: starts_at, ends_at: ends_at)

      assert_not lot.valid?
      assert lot.errors.key?(:ends_at)
    end
  end

  test "отрицательное число ставок отклоняется" do
    lot = build_lot(bid_count: -1)

    assert_not lot.valid?
    assert lot.errors.key?(:bid_count)
  end

  test "ставки без лидера отклоняются" do
    lot = build_lot(bid_count: 1)

    assert_not lot.valid?
    assert lot.errors.key?(:leader)
  end

  test "продавец не может быть лидером своего лота" do
    lot = build_lot(bid_count: 1, leader: @car.seller)

    assert_not lot.valid?
    assert lot.errors.key?(:leader)
  end

  test "неизвестный статус отклоняется" do
    lot = build_lot(status: :paused)

    assert_not lot.valid?
    assert lot.errors.key?(:status)
  end

  test "второй открытый лот на ту же машину отклоняется" do
    build_lot.save!

    %i[upcoming active].each do |status|
      lot = build_lot(status: status)

      assert_not lot.valid?, "второй лот в статусе #{status} прошёл валидацию"
      assert lot.errors.key?(:car_id)
    end
  end

  test "закрытые лоты не мешают выставить машину снова" do
    build_lot(status: :unsold).save!
    build_lot(status: :cancelled).save!

    assert build_lot.save
  end

  # --- некорректные данные: ограничения базы в обход валидаций ---

  test "база отклоняет отрицательную стартовую цену" do
    assert_check_violation "lots_starting_price_non_negative", build_db_lot(starting_price_cents: -1, current_price_cents: 0)
  end

  test "база отклоняет текущую цену ниже стартовой" do
    assert_check_violation "lots_current_price_not_below_start", build_db_lot(current_price_cents: 1)
  end

  test "база отклоняет окончание не позже начала" do
    assert_check_violation "lots_ends_after_start", build_db_lot(ends_at: 1.day.ago)
  end

  test "база отклоняет отрицательное число ставок" do
    assert_check_violation "lots_bid_count_non_negative", build_db_lot(bid_count: -1)
  end

  test "база отклоняет пустые обязательные поля" do
    lot = build_db_lot
    lot.save!

    assert_raises(ActiveRecord::NotNullViolation) { lot.update_columns(starts_at: nil) }
  end

  test "база не допускает два открытых лота на одну машину" do
    build_lot.save!

    assert_raises(ActiveRecord::RecordNotUnique) { build_db_lot(status: :active).save(validate: false) }
  end

  test "база отклоняет несуществующую машину" do
    lot = build_db_lot
    lot.car_id = SecureRandom.uuid

    assert_raises(ActiveRecord::InvalidForeignKey) { lot.save(validate: false) }
  end

  private

  # save(validate: false) пропускает before_validation, поэтому текущую цену задаём явно
  def build_db_lot(**overrides)
    build_lot(**{ current_price_cents: 120_000_000 }.merge(overrides))
  end

  def assert_check_violation(constraint, lot)
    error = assert_raises(ActiveRecord::CheckViolation) { lot.save(validate: false) }
    assert_includes error.message, constraint
  end
end
