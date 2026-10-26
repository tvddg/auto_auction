require "test_helper"

# Сквозные сценарии жизни лота через API — в том порядке, в каком их проходит клиент:
# продавец находит или создаёт машину, загружает фото, публикует лот; лот появляется в каталоге;
# покупатель открывает страницу лота и делает ставку; продавец удаляет лот или снимает его с торгов.
class LotLifecycleTest < ActionDispatch::IntegrationTest
  STARTING_PRICE = 100_000_000 # 1 000 000 ₽
  STEP = 1_000_000             # шаг для цен до 1 000 000 ₽ включительно (фикстура bid_steps)
  FIRST_BID = STARTING_PRICE + STEP
  # После первой ставки цена 1 010 000 ₽ — уже следующий диапазон (до 3 млн ₽), шаг там 25 000 ₽
  NEXT_STEP = 2_500_000
  SECOND_BID = FIRST_BID + NEXT_STEP

  setup do
    @seller = users(:three)
    @buyer = users(:two)
    @seller_headers = auth_headers(@seller)
    @buyer_headers = auth_headers(@buyer)
  end

  # --- Happy path ---

  test "лот с машиной из справочника и без фото: публикация, ставка покупателя, снятие владельцем" do
    # 1. Продавец находит машину в справочнике
    get "/api/v1/car", params: { q: "camry" }
    assert_response :success
    car_id = response.parsed_body.sole["id"]

    # 2. Публикует лот без фото — старт через минуту
    lot_id = publish_lot(car_id:, vin: "XTAGFK330NY100001")
    assert_equal "upcoming", response.parsed_body["status"]
    assert_equal STARTING_PRICE, response.parsed_body["currentPriceCents"]
    assert_equal [], response.parsed_body["photos"]

    # 3. Лот виден в каталоге среди «Скоро старт», без обложки
    get "/api/v1/lot", params: { status: "upcoming", q: "XTAGFK330NY100001" }
    card = response.parsed_body.sole
    assert_equal lot_id, card["id"]
    assert_nil card["imageUrl"]

    # 4. До старта ставка не принимается
    place_bid(lot_id, FIRST_BID)
    assert_response :method_not_allowed
    assert_equal "lot_not_active", error_code

    # 5. Торги начались — покупатель видит минимальную ставку и делает её
    travel 2.minutes
    get "/api/v1/lot/#{lot_id}", headers: @buyer_headers
    assert_equal "active", response.parsed_body["status"]
    assert_equal FIRST_BID, response.parsed_body["minNextBid"]
    assert_equal({ "isSeller" => false, "isLeader" => false, "removal" => nil }, response.parsed_body["viewer"])

    place_bid(lot_id, response.parsed_body["minNextBid"])
    assert_response :created
    assert_equal "accepted", response.parsed_body["status"]
    assert_equal 1, response.parsed_body["seq"]

    # 6. Цена, лидер, лента и «Мои ставки» обновились
    assert_lot_after_first_bid(lot_id)

    # 7. Продавец видит лот со ставкой в «Моих лотах» и может только снять его с торгов
    get "/api/v1/my/lots", headers: @seller_headers
    row = response.parsed_body.sole
    assert_equal [ "active", 1, FIRST_BID ], row.values_at("status", "bidCount", "currentPrice")

    get "/api/v1/lot/#{lot_id}", headers: @seller_headers
    assert_equal "cancel", response.parsed_body.dig("viewer", "removal")

    assert_no_difference -> { Lot.count } do
      delete "/api/v1/lot/#{lot_id}", headers: @seller_headers
    end
    assert_response :no_content

    # 8. Лот снят: пропал из каталога и «Моих ставок», но страница и история ставок остались
    assert_lot_cancelled(lot_id)
  end

  test "лот со своей машиной и фото: фото по порядку в каталоге и на странице, ставка, снятие с торгов" do
    # 1. Продавец добавляет в справочник машину, которой там нет
    post "/api/v1/car", headers: @seller_headers, as: :json, params: {
      brand: "Skoda", model: "Octavia", trim: "1.8 TSI", year: 2018, bodyType: "liftback",
      transmission: "robot", driveType: "fwd", fuelType: "petrol", horsePower: 180, engineVolumeCc: 1798
    }
    assert_response :created
    car_id = response.parsed_body["id"]

    # 2. Загружает два фото — пока они не привязаны ни к какому лоту
    photo_ids = %w[car.png car.jpg].map do |name|
      post "/api/v1/photo", params: { file: fixture_file_upload(name) }, headers: @seller_headers
      assert_response :created
      response.parsed_body["signedId"]
    end

    # 3. Публикует лот с фото в выбранном порядке
    lot_id = publish_lot(car_id:, vin: "TMBJG7NE0J0100002", photo_ids:)
    assert_equal 2, response.parsed_body["photos"].size

    # 4. В каталоге обложка — первое фото; на странице лота — оба по порядку
    get "/api/v1/lot", params: { status: "upcoming", q: "octavia" }
    card = response.parsed_body.sole
    assert_equal "Skoda Octavia 1.8 TSI", card["title"]
    assert_match %r{/car\.png\z}, card["imageUrl"]

    get "/api/v1/lot/#{lot_id}"
    urls = response.parsed_body["photos"].map { |photo| photo["url"] }
    assert_match %r{/car\.png\z}, urls[0]
    assert_match %r{/car\.jpg\z}, urls[1]
    assert_equal "liftback", response.parsed_body.dig("carInfo", "bodyType")

    # 5. Торги начались — покупатель ставит
    travel 2.minutes
    place_bid(lot_id, FIRST_BID)
    assert_response :created
    assert_lot_after_first_bid(lot_id)

    # 6. Продавец снимает лот с торгов — фото остаются у снятого лота
    assert_no_difference -> { LotPhoto.count } do
      delete "/api/v1/lot/#{lot_id}", headers: @seller_headers
    end
    assert_response :no_content
    assert_lot_cancelled(lot_id)
  end

  test "лот без ставок владелец удаляет полностью — вместе с фото" do
    post "/api/v1/photo", params: { file: fixture_file_upload("car.jpg") }, headers: @seller_headers
    lot_id = publish_lot(car_id: cars(:model_3).id, vin: "5YJ3E1EA7MF100003", photo_ids: [ response.parsed_body["signedId"] ])

    get "/api/v1/lot/#{lot_id}", headers: @seller_headers
    assert_equal "delete", response.parsed_body.dig("viewer", "removal")

    assert_difference -> { Lot.count } => -1, -> { LotPhoto.count } => -1 do
      assert_enqueued_with(job: ActiveStorage::PurgeJob) do # файл фото удаляется с диска фоновой задачей
        delete "/api/v1/lot/#{lot_id}", headers: @seller_headers
      end
    end
    assert_response :no_content

    get "/api/v1/lot/#{lot_id}"
    assert_response :not_found

    get "/api/v1/my/lots", headers: @seller_headers
    assert_equal [], response.parsed_body
  end

  # --- Ответвления ---

  test "удалить чужой лот нельзя — ни покупателю, ни гостю" do
    lot_id = publish_lot(car_id: cars(:camry).id, vin: "XTAGFK330NY100004")
    travel 2.minutes
    place_bid(lot_id, FIRST_BID)

    delete "/api/v1/lot/#{lot_id}", headers: @buyer_headers
    assert_response :forbidden
    assert_equal "forbidden", error_code

    delete "/api/v1/lot/#{lot_id}"
    assert_response :unauthorized

    # Лот не тронут: торги идут, ставка на месте, покупателю удаление не предлагается
    get "/api/v1/lot/#{lot_id}", headers: @buyer_headers
    assert_equal [ "active", 1 ], response.parsed_body.values_at("status", "bidCount")
    assert_nil response.parsed_body.dig("viewer", "removal")
  end

  test "повторная ставка: тот же запрос не дублируется, новая ставка лидера отклоняется" do
    lot_id = publish_lot(car_id: cars(:camry).id, vin: "XTAGFK330NY100005")
    travel 2.minutes

    # Первая ставка
    key = SecureRandom.uuid
    place_bid(lot_id, FIRST_BID, key:)
    assert_response :created
    bid_id = response.parsed_body["id"]

    # Тот же запрос ещё раз (например, ответ потерялся в сети и клиент повторил) — та же ставка, 200
    assert_no_difference -> { Bid.count } do
      place_bid(lot_id, FIRST_BID, key:)
    end
    assert_response :ok
    assert_equal bid_id, response.parsed_body["id"]

    # Новая ставка, пока покупатель и так лидирует, — отказ already_leading, он попадает в журнал
    assert_difference -> { Bid.rejected.count } => 1, -> { Bid.accepted.count } => 0 do
      place_bid(lot_id, SECOND_BID)
    end
    assert_response :conflict
    assert_equal "already_leading", error_code

    # Цена и число ставок не изменились
    get "/api/v1/lot/#{lot_id}"
    assert_equal [ FIRST_BID, 1 ], response.parsed_body.values_at("currentPrice", "bidCount")
  end

  test "после снятия с торгов ставки не принимаются, а перебитый участник видит, что его перебили" do
    lot_id = publish_lot(car_id: cars(:camry).id, vin: "XTAGFK330NY100006")
    travel 2.minutes

    # Покупатель ставит, третий участник его перебивает
    place_bid(lot_id, FIRST_BID)
    other_headers = auth_headers(users(:one))
    place_bid(lot_id, SECOND_BID, headers: other_headers)
    assert_response :created

    get "/api/v1/my/bids", headers: @buyer_headers
    row = response.parsed_body.find { |bid| bid["lotId"] == lot_id }
    assert_equal [ FIRST_BID, SECOND_BID, false ], row.values_at("myBid", "currentPrice", "isLeader")

    # Продавец снимает лот — дальше ставки отклоняются как lot_ended
    delete "/api/v1/lot/#{lot_id}", headers: @seller_headers
    assert_response :no_content

    place_bid(lot_id, SECOND_BID + NEXT_STEP)
    assert_response :method_not_allowed
    assert_equal "lot_ended", error_code
  end

  private

  def publish_lot(car_id:, vin:, photo_ids: nil)
    params = {
      carId: car_id, vin:, mileage: 54_000, color: "Белый", city: "Казань",
      startingPriceCents: STARTING_PRICE, startsAt: 1.minute.from_now.iso8601, endsAt: 4.days.from_now.iso8601
    }
    params[:photoIds] = photo_ids if photo_ids

    post "/api/v1/lot", params:, headers: @seller_headers, as: :json
    assert_response :created
    assert_equal @seller.id, response.parsed_body["userId"]
    response.parsed_body["id"]
  end

  def place_bid(lot_id, amount, key: SecureRandom.uuid, headers: @buyer_headers)
    post "/api/v1/bid", params: { lotId: lot_id, amountCents: amount }, headers: headers.merge("Idempotency-Key" => key), as: :json
  end

  def assert_lot_after_first_bid(lot_id)
    get "/api/v1/lot/#{lot_id}", headers: @buyer_headers
    body = response.parsed_body
    # Шаг сменился вместе с диапазоном цены — минимальная следующая ставка это учитывает
    assert_equal [ FIRST_BID, 1, SECOND_BID ], body.values_at("currentPrice", "bidCount", "minNextBid")
    assert body.dig("viewer", "isLeader")

    get "/api/v1/lot/#{lot_id}/bids", headers: @buyer_headers
    assert_equal [ [ FIRST_BID, true ] ], response.parsed_body.map { |bid| bid.values_at("amountCents", "isMine") }

    # У покупателя есть и ставки из фикстур — смотрим только на этот лот
    get "/api/v1/my/bids", headers: @buyer_headers
    row = response.parsed_body.find { |bid| bid["lotId"] == lot_id }
    assert_equal [ FIRST_BID, true ], row.values_at("myBid", "isLeader")
  end

  def assert_lot_cancelled(lot_id)
    get "/api/v1/lot/#{lot_id}"
    assert_equal "cancelled", response.parsed_body["status"]
    assert_equal 1, response.parsed_body["bidCount"]

    get "/api/v1/lot"
    assert_not_includes response.parsed_body.map { |card| card["id"] }, lot_id

    get "/api/v1/my/bids", headers: @buyer_headers
    assert_not_includes response.parsed_body.map { |bid| bid["lotId"] }, lot_id

    get "/api/v1/my/lots", headers: @seller_headers
    assert_equal "cancelled", response.parsed_body.sole["status"]
  end
end
