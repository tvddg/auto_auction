require "test_helper"

class CarTest < ActiveSupport::TestCase
  REQUIRED_FIELDS = %i[brand model year body_type transmission drive_type fuel_type horse_power].freeze

  def build_car(**overrides)
    Car.new({
      brand: "BMW",
      model: "X5",
      trim: "xDrive30d",
      year: 2020,
      body_type: :suv,
      transmission: :automatic,
      drive_type: :awd,
      fuel_type: :diesel,
      horse_power: 249,
      engine_volume_cc: 2993
    }.merge(overrides))
  end

  test "машина со всеми обязательными полями сохраняется" do
    car = build_car

    assert car.save, car.errors.full_messages.to_sentence
    assert car.reload.suv?
  end

  test "без обязательных полей машина не сохраняется" do
    car = Car.new

    assert_not car.save
    REQUIRED_FIELDS.each { |field| assert car.errors.key?(field), "нет ошибки для #{field}" }
  end

  test "пустые строки в текстовых полях считаются незаполненными" do
    car = build_car(brand: "  ", trim: "")

    assert_not car.valid?
    assert car.errors.key?(:brand)
    assert_nil car.trim
  end

  test "электромобиль сохраняется без объёма двигателя" do
    car = build_car(fuel_type: :electric, engine_volume_cc: nil)

    assert car.save, car.errors.full_messages.to_sentence
    assert_nil car.reload.engine_volume_cc
  end

  test "без объёма двигателя неэлектрическая машина не сохраняется" do
    %i[petrol diesel hybrid lpg].each do |fuel_type|
      car = build_car(fuel_type: fuel_type, engine_volume_cc: nil)

      assert_not car.valid?, "#{fuel_type} без объёма прошёл валидацию"
      assert car.errors.key?(:engine_volume_cc)
    end
  end

  test "некорректный год отклоняется" do
    [ 1899, 2101, 2020.5, "давно" ].each do |year|
      car = build_car(year: year)

      assert_not car.valid?, "год #{year.inspect} прошёл валидацию"
      assert car.errors.key?(:year)
    end
  end

  test "некорректная мощность отклоняется" do
    [ 0, -100, 2001, 150.5, "много" ].each do |horse_power|
      car = build_car(horse_power: horse_power)

      assert_not car.valid?, "мощность #{horse_power.inspect} прошла валидацию"
      assert car.errors.key?(:horse_power)
    end
  end

  test "некорректный объём двигателя отклоняется" do
    [ 499, 10_001, 0, -1600, 1998.5, "большой" ].each do |engine_volume_cc|
      car = build_car(engine_volume_cc: engine_volume_cc)

      assert_not car.valid?, "объём #{engine_volume_cc.inspect} прошёл валидацию"
      assert car.errors.key?(:engine_volume_cc)
    end
  end

  test "граничные значения допустимы" do
    assert build_car(year: 1900, horse_power: 1, engine_volume_cc: 500).valid?
    assert build_car(year: 2100, horse_power: 2000, engine_volume_cc: 10_000).valid?
  end

  test "неизвестное значение enum отклоняется" do
    car = build_car(fuel_type: :steam, body_type: :spaceship)

    assert_not car.valid?
    assert car.errors.key?(:fuel_type)
    assert car.errors.key?(:body_type)
  end

  # --- похожие машины ---

  test "similar находит машину с той же комплектацией без учёта описания" do
    existing = cars(:camry)
    car = build_car(**existing.slice(*Car::CONFIGURATION_ATTRIBUTES).symbolize_keys, description: "Другое описание")

    assert_equal existing, car.similar
  end

  test "similar учитывает пустую комплектацию как значение" do
    existing = cars(:model_3)

    assert_equal existing, build_car(**existing.slice(*Car::CONFIGURATION_ATTRIBUTES).symbolize_keys).similar
    assert_nil build_car(**existing.slice(*Car::CONFIGURATION_ATTRIBUTES).symbolize_keys, trim: "Long Range").similar
  end

  test "отличие в любом поле комплектации делает машину новой" do
    base = cars(:camry).slice(*Car::CONFIGURATION_ATTRIBUTES).symbolize_keys

    { year: 2020, horse_power: 200, engine_volume_cc: 2000, transmission: :cvt }.each do |field, value|
      assert_nil build_car(**base, field => value).similar, "#{field} не учитывается"
    end
  end

  test "сохранённая машина не считается похожей на саму себя" do
    assert_nil cars(:camry).similar
  end

  test "база отклоняет вторую машину с той же комплектацией" do
    car = build_car(**cars(:model_3).slice(*Car::CONFIGURATION_ATTRIBUTES).symbolize_keys)

    assert_raises(ActiveRecord::RecordNotUnique) { car.save(validate: false) }
  end

  test "название собирается из марки, модели и комплектации" do
    assert_equal "Toyota Camry Prestige", cars(:camry).title
    assert_equal "Tesla Model 3", cars(:model_3).title
  end
end
