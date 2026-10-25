require "test_helper"

class CarsApiTest < ActionDispatch::IntegrationTest
  VALID_CAR = {
    brand: "BMW", model: "X5", trim: "xDrive30d", year: 2020, bodyType: "suv", transmission: "automatic",
    driveType: "awd", fuelType: "diesel", horsePower: 249, engineVolumeCc: 2993, description: "Рестайлинг"
  }.freeze

  test "создание машины возвращает её в camelCase со строковыми enum'ами" do
    assert_difference -> { Car.count } do
      post "/api/v1/car", params: VALID_CAR, headers: auth_headers(users(:three)), as: :json
    end
    assert_response :created

    body = response.parsed_body
    assert body["id"].present?
    VALID_CAR.each { |key, value| assert_equal value, body[key.to_s], key }
  end

  test "электромобиль создаётся без объёма двигателя" do
    params = VALID_CAR.merge(fuelType: "electric").except(:engineVolumeCc)

    post "/api/v1/car", params:, headers: auth_headers(users(:three)), as: :json
    assert_response :created
    assert_nil response.parsed_body["engineVolumeCc"]
  end

  test "без авторизации машину создать нельзя" do
    post "/api/v1/car", params: VALID_CAR, as: :json

    assert_response :unauthorized
  end

  test "без обязательных полей — ошибка валидации по каждому полю" do
    post "/api/v1/car", params: {}, headers: auth_headers(users(:three)), as: :json

    assert_response :unprocessable_content
    assert_equal "validation_error", error_code
    details = response.parsed_body.dig("error", "details")
    %w[brand model year bodyType transmission driveType fuelType horsePower].each { |field| assert details.key?(field), field }
  end

  test "некорректные значения отклоняются" do
    post "/api/v1/car", params: VALID_CAR.merge(bodyType: "spaceship", year: 1800), headers: auth_headers(users(:three)), as: :json

    assert_response :unprocessable_content
    assert_equal %w[bodyType year], response.parsed_body.dig("error", "details").keys.sort
  end

  test "такая же комплектация — 409 с id существующей машины" do
    camry = cars(:camry)
    params = {
      brand: camry.brand, model: camry.model, trim: camry.trim, year: camry.year, bodyType: camry.body_type,
      transmission: camry.transmission, driveType: camry.drive_type, fuelType: camry.fuel_type,
      horsePower: camry.horse_power, engineVolumeCc: camry.engine_volume_cc, description: "Другое описание"
    }

    assert_no_difference -> { Car.count } do
      post "/api/v1/car", params:, headers: auth_headers(users(:three)), as: :json
    end
    assert_response :conflict
    assert_equal "car_exists", error_code
    assert_equal camry.id, response.parsed_body.dig("error", "existingId")
  end

  test "машину может получить кто угодно" do
    get "/api/v1/car/#{cars(:model_3).id}"

    assert_response :success
    assert_equal "Tesla", response.parsed_body["brand"]
    assert_equal "electric", response.parsed_body["fuelType"]
  end

  test "несуществующая машина — 404" do
    get "/api/v1/car/#{SecureRandom.uuid}"
    assert_response :not_found

    get "/api/v1/car/not-a-uuid"
    assert_response :not_found
    assert_equal "not_found", error_code
  end

  # --- поиск по справочнику ---

  def ids = response.parsed_body.map { |car| car["id"] }

  test "список без поиска публичный, отсортирован по марке и отдаёт общее количество" do
    get "/api/v1/car"

    assert_response :success
    assert_equal cars(:model_3, :camry).map(&:id), ids # Tesla раньше Toyota
    assert_equal "2", response.headers["X-Total-Count"]
  end

  test "поиск по марке, модели и комплектации без учёта регистра" do
    { "toyota" => [ :camry ], "MODEL 3" => [ :model_3 ], "prest" => [ :camry ], "lada" => [] }.each do |q, expected|
      get "/api/v1/car", params: { q: }

      assert_equal expected.map { |name| cars(name).id }, ids, q
      assert_equal expected.size.to_s, response.headers["X-Total-Count"], q
    end
  end

  test "VIN в поиске машин не участвует — он принадлежит лоту" do
    get "/api/v1/car", params: { q: lots(:camry_active).vin }

    assert_empty response.parsed_body
  end

  test "спецсимволы LIKE ищутся как обычные символы" do
    get "/api/v1/car", params: { q: "%" }

    assert_empty response.parsed_body
  end

  test "пагинация" do
    get "/api/v1/car", params: { limit: 1, page: 2 }

    assert_equal [ cars(:camry).id ], ids
    assert_equal "2", response.headers["X-Total-Count"]
  end

  test "некорректные limit и page — 422" do
    get "/api/v1/car", params: { limit: CarCatalog::MAX_LIMIT + 1, page: 0 }

    assert_response :unprocessable_content
    assert_equal %w[limit page], response.parsed_body.dig("error", "details").keys.sort
  end
end
