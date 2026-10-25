require "test_helper"

class PhotosApiTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:three)
    @headers = auth_headers(@user)
  end

  def upload(name, headers: @headers)
    post "/api/v1/photo", params: { file: fixture_file_upload(name) }, headers:
  end

  def lot_params(photo_ids)
    {
      carId: cars(:camry).id, vin: "XTAGFK330NY123456", mileage: 15_000, color: "Серый", city: "Самара",
      startingPriceCents: 120_000_000, startsAt: 1.day.from_now.iso8601, endsAt: 5.days.from_now.iso8601,
      photoIds: photo_ids
    }
  end

  def uploaded_id(name = "car.jpg", headers: @headers)
    upload(name, headers:)
    response.parsed_body["signedId"]
  end

  # --- загрузка ---

  test "загрузка JPEG и PNG — 201 с signedId и адресом превью" do
    %w[car.jpg car.png].each do |name|
      assert_difference -> { ActiveStorage::Blob.count } do
        upload(name)
      end
      assert_response :created

      body = response.parsed_body
      assert body["signedId"].present?
      assert_match %r{\A/api/v1/storage/representations/redirect/}, body["url"]

      blob = ActiveStorage::Blob.find_signed(body["signedId"])
      assert_equal @user.id, blob.metadata["uploader_id"]
      assert_empty blob.attachments
    end
  end

  test "текстовый файл с расширением .jpg отклоняется — тип определяется по содержимому" do
    assert_no_difference -> { ActiveStorage::Blob.count } do
      upload("fake.jpg")
    end

    assert_response :unprocessable_content
    assert response.parsed_body.dig("error", "details").key?("file")
  end

  test "без файла — 422" do
    post "/api/v1/photo", params: {}, headers: @headers

    assert_response :unprocessable_content
  end

  test "без авторизации загрузить нельзя" do
    upload("car.jpg", headers: {})

    assert_response :unauthorized
  end

  test "встроенная прямая загрузка Active Storage отключена" do
    post "/api/v1/storage/direct_uploads",
         params: { blob: { filename: "car.jpg", byte_size: 10, checksum: "x", content_type: "image/jpeg" } }, as: :json

    assert_response :not_found
  end

  test "превью по адресу из ответа открывается" do
    upload("car.jpg")
    get response.parsed_body["url"]

    assert_response :redirect
    follow_redirect!
    assert_response :success
    assert_equal "image/jpeg", response.media_type
  end

  # --- публикация лота с фото ---

  test "лот с фото: порядок сохраняется, первая — обложка в каталоге" do
    ids = [ uploaded_id("car.png"), uploaded_id("car.jpg") ]

    post "/api/v1/lot", params: lot_params(ids), headers: @headers, as: :json
    assert_response :created

    lot = Lot.find(response.parsed_body["id"])
    assert_equal [ 0, 1 ], lot.photos.map(&:position)
    assert_equal ids.map { |id| ActiveStorage::Blob.find_signed(id) }, lot.photos.map { |photo| photo.image.blob }
    assert_equal 2, response.parsed_body["photos"].size

    get "/api/v1/lot", params: { status: "upcoming", q: "XTAGFK330NY123456" }
    cover = response.parsed_body.first["imageUrl"]
    assert_match %r{/car\.png\z}, cover
  end

  test "страница лота отдаёт фото по порядку" do
    ids = [ uploaded_id("car.jpg"), uploaded_id("car.png") ]
    post "/api/v1/lot", params: lot_params(ids), headers: @headers, as: :json

    get "/api/v1/lot/#{response.parsed_body["id"]}"

    photos = response.parsed_body["photos"]
    assert_equal 2, photos.size
    assert_match %r{/car\.jpg\z}, photos.first["url"]
    assert photos.all? { |photo| photo["id"].present? && photo["thumbUrl"].present? }
  end

  test "лот без фото публикуется, обложки нет" do
    post "/api/v1/lot", params: lot_params(nil).except(:photoIds), headers: @headers, as: :json

    assert_response :created
    assert_equal [], response.parsed_body["photos"]
  end

  test "чужое, несуществующее и повторное фото — 422, лот не создаётся" do
    foreign = uploaded_id("car.jpg", headers: auth_headers(users(:two)))
    own = uploaded_id("car.jpg")

    {
      "чужое" => [ foreign ],
      "несуществующее" => [ "not-a-signed-id" ],
      "дубль" => [ own, own ],
      "не массив" => "oops"
    }.each do |reason, ids|
      assert_no_difference -> { Lot.count } do
        post "/api/v1/lot", params: lot_params(ids), headers: @headers, as: :json
      end
      assert_response :unprocessable_content, reason
      assert response.parsed_body.dig("error", "details").key?("photoIds"), reason
    end
  end

  test "уже привязанное к другому лоту фото повторно не прикрепить" do
    id = uploaded_id
    post "/api/v1/lot", params: lot_params([ id ]), headers: @headers, as: :json
    assert_response :created

    post "/api/v1/lot", params: lot_params([ id ]).merge(vin: "XTAGFK330NY654321"), headers: @headers, as: :json

    assert_response :unprocessable_content
    assert_includes response.parsed_body.dig("error", "details", "photoIds").join, "уже используется"
  end

  test "больше лимита фото — 422" do
    ids = Array.new(LotPhoto::MAX_PER_LOT + 1) { |index| "id-#{index}" }
    post "/api/v1/lot", params: lot_params(ids), headers: @headers, as: :json

    assert_response :unprocessable_content
  end

  test "удаление лота без ставок удаляет и его фото" do
    post "/api/v1/lot", params: lot_params([ uploaded_id ]), headers: @headers, as: :json
    lot_id = response.parsed_body["id"]

    assert_difference -> { LotPhoto.count }, -1 do
      assert_enqueued_with(job: ActiveStorage::PurgeJob) do
        delete "/api/v1/lot/#{lot_id}", headers: @headers
      end
    end
    assert_response :no_content
  end
end
