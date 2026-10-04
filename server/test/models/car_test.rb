require "test_helper"

class CarTest < ActiveSupport::TestCase
  REQUIRED_FIELDS = %i[seller brand model color year body_type mileage vin transmission drive_type fuel_type horse_power city].freeze

  def build_car(**overrides)
    Car.new({
      seller: users(:one),
      brand: "BMW",
      model: "X5",
      color: "Синий",
      year: 2020,
      body_type: :suv,
      mileage: 60_000,
      vin: "WBAKS610X00C12345",
      transmission: :automatic,
      drive_type: :awd,
      fuel_type: :diesel,
      horse_power: 249,
      engine_volume_cc: 2993,
      city: "Казань"
    }.merge(overrides))
  end

  test "машина со всеми обязательными полями сохраняется" do
    car = build_car

    assert car.save, car.errors.full_messages.to_sentence
    assert_equal users(:one), car.reload.seller
  end

  test "без обязательных полей машина не сохраняется" do
    car = Car.new

    assert_not car.save
    REQUIRED_FIELDS.each { |field| assert car.errors.key?(field), "нет ошибки для #{field}" }
  end

  test "пустые строки в текстовых полях считаются незаполненными" do
    car = build_car(brand: "  ", city: "")

    assert_not car.valid?
    assert car.errors.key?(:brand)
    assert car.errors.key?(:city)
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

  test "VIN приводится к верхнему регистру и очищается от пробелов" do
    car = build_car(vin: "  wbaks610x00c12345 ")

    assert car.valid?, car.errors.full_messages.to_sentence
    assert_equal "WBAKS610X00C12345", car.vin
  end

  test "некорректный VIN отклоняется" do
    {
      "короче 17 символов" => "WBAKS610X00C1234",
      "длиннее 17 символов" => "WBAKS610X00C123456",
      "содержит I" => "WBAKS610I00C12345",
      "содержит O" => "WBAKS610O00C12345",
      "содержит Q" => "WBAKS610Q00C12345",
      "содержит кириллицу" => "WBAKS610Х00C12345",
      "содержит спецсимволы" => "WBAKS610-00C12345"
    }.each do |reason, vin|
      car = build_car(vin: vin)

      assert_not car.valid?, "VIN #{reason} прошёл валидацию"
      assert car.errors.key?(:vin)
    end
  end

  test "повторяющийся VIN отклоняется" do
    car = build_car(vin: cars(:camry).vin)

    assert_not car.valid?
    assert car.errors.key?(:vin)
  end

  test "некорректный пробег отклоняется" do
    [-1, 1.5, "много"].each do |mileage|
      car = build_car(mileage: mileage)

      assert_not car.valid?, "пробег #{mileage.inspect} прошёл валидацию"
      assert car.errors.key?(:mileage)
    end
  end

  test "нулевой пробег допустим" do
    assert build_car(mileage: 0).valid?
  end

  test "некорректный год отклоняется" do
    [1899, 2101, 2020.5, "давно"].each do |year|
      car = build_car(year: year)

      assert_not car.valid?, "год #{year.inspect} прошёл валидацию"
      assert car.errors.key?(:year)
    end
  end

  test "некорректная мощность отклоняется" do
    [0, -100, 2001, 150.5, "много"].each do |horse_power|
      car = build_car(horse_power: horse_power)

      assert_not car.valid?, "мощность #{horse_power.inspect} прошла валидацию"
      assert car.errors.key?(:horse_power)
    end
  end

  test "некорректный объём двигателя отклоняется" do
    [499, 10_001, 0, -1600, 1998.5, "большой"].each do |engine_volume_cc|
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
end
