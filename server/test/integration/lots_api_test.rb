require "test_helper"

class LotsApiTest < ActionDispatch::IntegrationTest
  NEW_VIN = "XTAGFK330NY123456".freeze

  def valid_lot_params(**overrides)
    {
      carId: cars(:camry).id, vin: NEW_VIN, mileage: 15_000, color: "Серый", city: "Самара",
      startingPriceCents: 120_000_000, startsAt: 1.day.from_now.iso8601, endsAt: 3.days.from_now.iso8601
    }.merge(overrides)
  end

  def create_lot(seller: users(:three), **overrides)
    Lot.create!(
      car: cars(:camry), seller:, vin: NEW_VIN, mileage: 15_000, color: "Серый", city: "Самара",
      starting_price_cents: 120_000_000, starts_at: 1.day.from_now, ends_at: 3.days.from_now, **overrides
    )
  end

  def ids = response.parsed_body.map { |card| card["id"] }

  # --- каталог ---

  test "каталог публичный и отдаёт карточки всех лотов, кроме снятых" do
    create_lot(status: :cancelled)
    get "/api/v1/lot"

    assert_response :success
    assert_equal lots(:camry_active, :camry_unsold, :model_3_upcoming).map(&:id).sort, ids.sort
    assert_equal "3", response.headers["X-Total-Count"]
  end

  test "карточка зависит от фазы лота" do
    get "/api/v1/lot"
    cards = response.parsed_body.index_by { |card| card["id"] }

    active = cards.fetch(lots(:camry_active).id)
    assert_equal "active", active["status"]
    assert_equal "Toyota Camry Prestige", active["title"]
    assert_equal({ "year" => 2019, "mileage" => 87_000, "gear" => "АКПП" }, active["shortInfo"])
    assert_equal 165_000_000, active["price"]
    assert_equal 3, active["betsAmount"]
    assert_nil active["imageUrl"]
    assert_equal false, active["inFeatured"]
    assert_in_delta 2.hours.in_milliseconds, active["remainingTime"], 60_000

    upcoming = cards.fetch(lots(:model_3_upcoming).id)
    assert_equal "upcoming", upcoming["status"]
    assert_equal lots(:model_3_upcoming).starts_at.iso8601, upcoming["startDate"]
    assert_not upcoming.key?("remainingTime")

    unsold = cards.fetch(lots(:camry_unsold).id)
    assert_equal "unsold", unsold["status"]
    assert_equal lots(:camry_unsold).ends_at.iso8601, unsold["dealDate"]
  end

  test "фильтр по статусу" do
    { "active" => [ :camry_active ], "upcoming" => [ :model_3_upcoming ], "finished" => [ :camry_unsold ], "unsold" => [ :camry_unsold ], "sold" => [] }.each do |status, expected|
      get "/api/v1/lot", params: { status: }

      assert_equal expected.map { |name| lots(name).id }.sort, ids.sort, status
    end
  end

  test "фильтры по марке, году и цене" do
    get "/api/v1/lot", params: { brands: [ "tesla" ] }
    assert_equal [ lots(:model_3_upcoming).id ], ids

    get "/api/v1/lot", params: { brands: "Toyota,BMW" }
    assert_equal 2, ids.size

    get "/api/v1/lot", params: { minYear: 2020 }
    assert_equal [ lots(:model_3_upcoming).id ], ids

    get "/api/v1/lot", params: { maxYear: 2019, minPrice: 170_000_000 }
    assert_equal [ lots(:camry_unsold).id ], ids

    get "/api/v1/lot", params: { maxPrice: 165_000_000 }
    assert_equal [ lots(:camry_active).id ], ids
  end

  test "поиск по марке, модели и комплектации без учёта регистра" do
    get "/api/v1/lot", params: { q: "model 3" }
    assert_equal [ lots(:model_3_upcoming).id ], ids

    get "/api/v1/lot", params: { q: "PRESTIGE" }
    assert_equal 2, ids.size

    get "/api/v1/lot", params: { q: "100%" }
    assert_empty response.parsed_body
  end

  test "сортировка по дате, цене и году" do
    get "/api/v1/lot", params: { sort: "cost", order: "asc" }
    assert_equal lots(:camry_active, :camry_unsold, :model_3_upcoming).map(&:id), ids

    get "/api/v1/lot", params: { sort: "date" }
    assert_equal lots(:model_3_upcoming, :camry_active, :camry_unsold).map(&:id), ids

    get "/api/v1/lot", params: { sort: "year", order: "desc" }
    assert_equal lots(:model_3_upcoming).id, ids.first
  end

  test "пагинация" do
    get "/api/v1/lot", params: { sort: "cost", order: "asc", limit: 2, page: 2 }

    assert_equal [ lots(:model_3_upcoming).id ], ids
    assert_equal "3", response.headers["X-Total-Count"]

    get "/api/v1/lot", params: { limit: 2, page: 3 }
    assert_response :success
    assert_empty response.parsed_body
  end

  test "пустой результат — 200 с пустым массивом" do
    get "/api/v1/lot", params: { brands: "Lada" }

    assert_response :success
    assert_equal [], response.parsed_body
    assert_equal "0", response.headers["X-Total-Count"]
  end

  test "некорректные параметры каталога — 422 с подробностями" do
    get "/api/v1/lot", params: { limit: 0, page: "x", status: "paused", sort: "color", order: "up", minPrice: -1 }

    assert_response :unprocessable_content
    assert_equal %w[limit minPrice order page sort status], response.parsed_body.dig("error", "details").keys.sort
  end

  test "limit больше максимума отклоняется" do
    get "/api/v1/lot", params: { limit: LotCatalog::MAX_LIMIT + 1 }

    assert_response :unprocessable_content
  end

  # --- страница лота ---

  test "страница лота публичная и содержит машину и продавца" do
    get "/api/v1/lot/#{lots(:camry_active).id}"

    assert_response :success
    body = response.parsed_body
    assert_equal "active", body["status"]
    assert_equal 150_000_000, body["startingPrice"]
    assert_equal 165_000_000, body["currentPrice"]
    assert_equal 3, body["bidCount"]
    assert_equal({ "name" => nil, "phone" => "+79990000001" }, body["sellerInfo"])

    car = body["carInfo"]
    assert_equal "JTNB11HK103456789", car["vin"]
    assert_equal "Черный", car["color"]
    assert_equal "Москва", car["city"]
    assert_equal "sedan", car["bodyType"]
    assert_equal "automatic", car["transmission"]
    assert_equal 2487, car["engineVolume"]
  end

  test "несуществующий лот — 404" do
    get "/api/v1/lot/#{SecureRandom.uuid}"

    assert_response :not_found
  end

  # --- создание ---

  test "создание лота — 201, продавец берётся из токена" do
    post "/api/v1/lot", params: valid_lot_params(userId: users(:two).id, status: "sold"), headers: auth_headers(users(:three)), as: :json

    assert_response :created
    body = response.parsed_body
    assert_equal users(:three).id, body["userId"]
    assert_equal "upcoming", body["status"]
    assert_equal 120_000_000, body["currentPriceCents"]
    assert_equal 0, body["bidCount"]
    assert_equal NEW_VIN, body["vin"]
  end

  test "без авторизации лот не создаётся" do
    post "/api/v1/lot", params: valid_lot_params, as: :json

    assert_response :unauthorized
  end

  test "без обязательных полей — 422 по каждому полю" do
    post "/api/v1/lot", params: {}, headers: auth_headers(users(:three)), as: :json

    assert_response :unprocessable_content
    details = response.parsed_body.dig("error", "details")
    %w[car vin mileage color city startingPriceCents startsAt endsAt].each { |field| assert details.key?(field), field }
  end

  test "некорректные данные — 422" do
    post "/api/v1/lot", params: valid_lot_params(vin: "SHORT", mileage: -1, endsAt: 1.day.ago.iso8601, carId: SecureRandom.uuid),
                        headers: auth_headers(users(:three)), as: :json

    assert_response :unprocessable_content
    assert_equal %w[car endsAt mileage vin], response.parsed_body.dig("error", "details").keys.sort
  end

  test "VIN уже в открытом лоте — 409" do
    post "/api/v1/lot", params: valid_lot_params(vin: lots(:camry_active).vin.downcase), headers: auth_headers(users(:three)), as: :json

    assert_response :conflict
    assert_equal "lot_already_published", error_code
  end

  # --- изменение ---

  test "продавец меняет лот до старта, текущая цена следует за стартовой" do
    lot = create_lot
    patch "/api/v1/lot/#{lot.id}", params: { startingPriceCents: 130_000_000, endsAt: 5.days.from_now.iso8601 },
                                   headers: auth_headers(users(:three)), as: :json

    assert_response :success
    assert_equal 130_000_000, response.parsed_body["startingPriceCents"]
    assert_equal 130_000_000, response.parsed_body["currentPriceCents"]
    assert_equal 130_000_000, lot.reload.current_price_cents
  end

  test "менять машину лота нельзя" do
    lot = create_lot
    patch "/api/v1/lot/#{lot.id}", params: { carId: cars(:model_3).id }, headers: auth_headers(users(:three)), as: :json

    assert_response :unprocessable_content
    assert response.parsed_body.dig("error", "details").key?("carId")
    assert_equal cars(:camry), lot.reload.car
  end

  test "пустое изменение и некорректные данные — 422" do
    lot = create_lot
    headers = auth_headers(users(:three))

    patch "/api/v1/lot/#{lot.id}", params: { vin: "XTAGFK330NY000000" }, headers:, as: :json
    assert_response :unprocessable_content

    patch "/api/v1/lot/#{lot.id}", params: { startingPriceCents: -1 }, headers:, as: :json
    assert_response :unprocessable_content
  end

  test "чужой лот менять нельзя — 403" do
    patch "/api/v1/lot/#{lots(:model_3_upcoming).id}", params: { startingPriceCents: 1 }, headers: auth_headers(users(:three)), as: :json

    assert_response :forbidden
    assert_equal 280_000_000, lots(:model_3_upcoming).reload.starting_price_cents
  end

  test "после старта торгов лот не меняется — 409" do
    patch "/api/v1/lot/#{lots(:camry_active).id}", params: { startingPriceCents: 1 }, headers: auth_headers(users(:one)), as: :json

    assert_response :conflict
    assert_equal "lot_not_editable", error_code
  end

  test "без авторизации — 401, несуществующий лот — 404" do
    patch "/api/v1/lot/#{lots(:model_3_upcoming).id}", params: { startingPriceCents: 1 }, as: :json
    assert_response :unauthorized

    patch "/api/v1/lot/#{SecureRandom.uuid}", params: { startingPriceCents: 1 }, headers: auth_headers(users(:one)), as: :json
    assert_response :not_found
  end

  # --- удаление ---

  test "лот без ставок удаляется из базы" do
    lot = create_lot

    assert_difference -> { Lot.count }, -1 do
      delete "/api/v1/lot/#{lot.id}", headers: auth_headers(users(:three))
    end
    assert_response :no_content
  end

  test "лот со ставками снимается с торгов" do
    [ lots(:camry_active), lots(:model_3_upcoming) ].each do |lot|
      assert_no_difference -> { Lot.count } do
        delete "/api/v1/lot/#{lot.id}", headers: auth_headers(lot.seller)
      end
      assert_response :no_content
      assert lot.reload.cancelled?
    end
  end

  test "завершённый или уже снятый лот со ставками — 409" do
    lot = lots(:camry_active)
    lot.update!(status: :sold)
    delete "/api/v1/lot/#{lot.id}", headers: auth_headers(users(:one))
    assert_response :conflict

    lot.update!(status: :cancelled)
    delete "/api/v1/lot/#{lot.id}", headers: auth_headers(users(:one))
    assert_response :conflict
    assert_equal "lot_finished", error_code
  end

  test "чужой лот удалить нельзя — 403" do
    assert_no_difference -> { Lot.count } do
      delete "/api/v1/lot/#{lots(:camry_unsold).id}", headers: auth_headers(users(:three))
    end
    assert_response :forbidden
  end

  test "без авторизации удалить нельзя — 401" do
    delete "/api/v1/lot/#{lots(:camry_unsold).id}"

    assert_response :unauthorized
  end
end
