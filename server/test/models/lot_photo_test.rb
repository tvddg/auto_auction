require "test_helper"

class LotPhotoTest < ActiveSupport::TestCase
  include ActiveJob::TestHelper

  def image(name = "car.jpg")
    ActiveStorage::Blob.create_and_upload!(io: file_fixture(name).open, filename: name, content_type: Marcel::MimeType.for(file_fixture(name).open))
  end

  test "фото с картинкой и позицией сохраняется" do
    photo = lots(:camry_active).photos.build(position: 0, image: image)

    assert photo.save, photo.errors.full_messages.to_sentence
  end

  test "без картинки фото не сохраняется" do
    photo = lots(:camry_active).photos.build(position: 0)

    assert_not photo.valid?
    assert photo.errors.key?(:image)
  end

  test "отрицательная позиция и повтор позиции в лоте отклоняются" do
    lot = lots(:camry_active)
    lot.photos.create!(position: 0, image: image)

    assert_not lot.photos.build(position: -1, image: image).valid?
    assert_not lot.photos.build(position: 0, image: image).valid?
    assert lots(:model_3_upcoming).photos.build(position: 0, image: image).valid?
  end

  test "фото лота упорядочены по позиции" do
    lot = lots(:camry_active)
    lot.photos.create!(position: 1, image: image("car.png"))
    lot.photos.create!(position: 0, image: image)

    assert_equal [ 0, 1 ], lot.reload.photos.map(&:position)
  end

  test "база не допускает две фотографии на одной позиции" do
    lot = lots(:camry_active)
    lot.photos.create!(position: 0, image: image)

    assert_raises(ActiveRecord::RecordNotUnique) do
      LotPhoto.new(lot:, position: 0).save(validate: false)
    end
  end

  test "непривязанные файлы старше месяца удаляются задачей очистки" do
    old = image
    old.update_column(:created_at, 31.days.ago)
    fresh = image
    attached = lots(:camry_active).photos.create!(position: 0, image: image).image.blob
    attached.update_column(:created_at, 31.days.ago)

    assert_enqueued_jobs 1, only: ActiveStorage::PurgeJob do
      PurgeUnattachedBlobsJob.perform_now
    end
    assert fresh.reload
  end
end
