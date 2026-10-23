require "test_helper"

class LotTest < ActiveSupport::TestCase
  VIN = "XTAGFK330NY123456".freeze

  # Новый экземпляр с собственным VIN: у лотов из фикстур VIN уже заняты открытыми лотами
  def build_lot(**overrides)
    Lot.new({
      car: cars(:camry),
      seller: users(:one),
      vin: VIN,
      mileage: 15_000,
      color: "Серый",
      city: "Самара",
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
    assert_equal users(:one), lot.seller
    assert_equal 120_000_000, lot.current_price_cents
    assert_equal 0, lot.bid_count
    assert_nil lot.leader
  end

  test "идущий лот со ставками и лидером сохраняется" do
    lot = build_lot(status: :active, starts_at: 1.hour.ago, current_price_cents: 130_000_000, bid_count: 2, leader: users(:two))

    assert lot.save, lot.errors.full_messages.to_sentence
    assert_equal users(:two), lot.reload.leader
  end

  test "одна комплектация может продаваться в нескольких лотах сразу" do
    assert build_lot.save
    assert build_lot(vin: "XTAGFK330NY654321", seller: users(:two)).save
  end

  test "фикстуры валидны" do
    Lot.find_each { |lot| assert lot.valid?, "#{lot.status}: #{lot.errors.full_messages.to_sentence}" }
  end

  # --- неполные данные ---

  test "без обязательных полей лот не сохраняется" do
    lot = Lot.new

    assert_not lot.save
    %i[car seller vin mileage color city starting_price_cents current_price_cents starts_at ends_at].each do |field|
      assert lot.errors.key?(field), "нет ошибки для #{field}"
    end
  end

  test "без машины или продавца лот не сохраняется" do
    %i[car seller].each do |field|
      lot = build_lot(field => nil)

      assert_not lot.valid?
      assert lot.errors.key?(field)
    end
  end

  test "пустые строки в цвете и городе считаются незаполненными" do
    lot = build_lot(color: "  ", city: "")

    assert_not lot.valid?
    assert lot.errors.key?(:color)
    assert lot.errors.key?(:city)
  end

  # --- VIN и пробег ---

  test "VIN приводится к верхнему регистру и очищается от пробелов" do
    lot = build_lot(vin: "  xtagfk330ny123456 ")

    assert lot.valid?, lot.errors.full_messages.to_sentence
    assert_equal VIN, lot.vin
  end

  test "некорректный VIN отклоняется" do
    {
      "короче 17 символов" => "XTAGFK330NY12345",
      "длиннее 17 символов" => "XTAGFK330NY1234567",
      "содержит I" => "XTAGFK330IY123456",
      "содержит O" => "XTAGFK330OY123456",
      "содержит Q" => "XTAGFK330QY123456",
      "содержит кириллицу" => "XТAGFK330NY123456",
      "содержит спецсимволы" => "XTAGFK330-Y123456"
    }.each do |reason, vin|
      lot = build_lot(vin: vin)

      assert_not lot.valid?, "VIN #{reason} прошёл валидацию"
      assert lot.errors.key?(:vin)
    end
  end

  test "второй открытый лот с тем же VIN отклоняется" do
    build_lot.save!

    %i[upcoming active].each do |status|
      lot = build_lot(status: status)

      assert_not lot.valid?, "второй лот в статусе #{status} прошёл валидацию"
      assert lot.errors.key?(:vin)
    end
  end

  test "закрытые лоты не мешают выставить машину с тем же VIN снова" do
    build_lot(status: :unsold).save!
    build_lot(status: :cancelled).save!

    assert build_lot.save
  end

  test "некорректный пробег отклоняется" do
    [ -1, 1.5, "много" ].each do |mileage|
      lot = build_lot(mileage: mileage)

      assert_not lot.valid?, "пробег #{mileage.inspect} прошёл валидацию"
      assert lot.errors.key?(:mileage)
    end
  end

  test "нулевой пробег допустим" do
    assert build_lot(mileage: 0).valid?
  end

  # --- цены, даты, ставки ---

  test "отрицательная или дробная стартовая цена отклоняется" do
    [ -1, 100.5, "дорого" ].each do |price|
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

    [ starts_at, starts_at - 1.second ].each do |ends_at|
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
    lot = build_lot(bid_count: 1, leader: users(:one))

    assert_not lot.valid?
    assert lot.errors.key?(:leader)
  end

  test "неизвестный статус отклоняется" do
    lot = build_lot(status: :paused)

    assert_not lot.valid?
    assert lot.errors.key?(:status)
  end

  # --- фаза лота ---

  test "фаза открытого лота определяется временем" do
    lot = build_lot(starts_at: Time.current, ends_at: 1.hour.from_now)

    assert_equal "upcoming", lot.phase(lot.starts_at - 1.second)
    assert_equal "active", lot.phase(lot.starts_at)
    assert_equal "active", lot.phase(lot.ends_at - 1.second)
    assert_equal "unsold", lot.phase(lot.ends_at)

    lot.bid_count = 1
    assert_equal "sold", lot.phase(lot.ends_at)
  end

  test "фаза закрытого лота равна его статусу" do
    %i[sold unsold cancelled].each do |status|
      assert_equal status.to_s, build_lot(status: status).phase(2.days.from_now)
    end
  end

  test "фазы фикстур" do
    assert_equal "active", lots(:camry_active).phase
    assert_equal "unsold", lots(:camry_unsold).phase
    assert_equal "upcoming", lots(:model_3_upcoming).phase
  end

  test "in_phase совпадает с фазой лота" do
    build_lot(vin: "XTAGFK330NY000001", status: :active, starts_at: 3.days.ago, ends_at: 1.day.ago, current_price_cents: 130_000_000, bid_count: 1, leader: users(:two)).save!
    build_lot(vin: "XTAGFK330NY000002", status: :cancelled).save!

    %w[upcoming active sold unsold].each do |phase|
      expected = Lot.all.select { |lot| lot.phase == phase }.map(&:id).sort
      assert_equal expected, Lot.in_phase(phase).ids.sort, "фаза #{phase}"
    end

    assert_equal Lot.all.select { |lot| lot.phase.in?(%w[sold unsold]) }.map(&:id).sort, Lot.in_phase("finished").ids.sort
    assert_empty Lot.in_phase("unknown")
  end

  test "менять лот может только продавец" do
    lot = lots(:camry_active)

    assert lot.manageable_by?(users(:one))
    assert_not lot.manageable_by?(users(:two))
    assert_not lot.manageable_by?(nil)
  end

  test "редактировать можно только лот до старта" do
    assert lots(:model_3_upcoming).editable?
    assert_not lots(:camry_active).editable?
    assert_not lots(:camry_unsold).editable?
  end

  # --- ограничения базы в обход валидаций ---

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

  test "база отклоняет некорректный VIN" do
    assert_check_violation "lots_vin_format", build_db_lot(vin: "XTAGFK330OY123456")
  end

  test "база отклоняет отрицательный пробег" do
    assert_check_violation "lots_mileage_non_negative", build_db_lot(mileage: -1)
  end

  test "база отклоняет пустые обязательные поля" do
    lot = build_db_lot
    lot.save!

    # Каждая попытка в своём savepoint: ошибка базы прерывает всю транзакцию теста
    %i[starts_at vin color city seller_id].each do |column|
      assert_raises(ActiveRecord::NotNullViolation, "#{column} может быть пустым") do
        Lot.transaction(requires_new: true) { lot.update_columns(column => nil) }
      end
    end
  end

  test "база не допускает два открытых лота с одним VIN" do
    build_lot.save!

    assert_raises(ActiveRecord::RecordNotUnique) { build_db_lot(status: :active).save(validate: false) }
  end

  test "база отклоняет несуществующие машину и продавца" do
    %i[car_id seller_id].each do |column|
      lot = build_db_lot
      lot[column] = SecureRandom.uuid

      assert_raises(ActiveRecord::InvalidForeignKey, "#{column} без внешнего ключа") do
        Lot.transaction(requires_new: true) { lot.save(validate: false) }
      end
    end
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
