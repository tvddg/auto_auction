# Фото лота: файл — во вложении Active Storage, порядок — в position (0 — обложка в каталоге).
class LotPhoto < ApplicationRecord
  CONTENT_TYPES = %w[image/jpeg image/png image/webp].freeze
  MAX_BYTES = 15.megabytes
  MAX_PER_LOT = 20

  # Превью делаются лениво при первом запросе и кешируются (active_storage_variant_records).
  # Те же трансформации годятся и для blob'ов, которые ещё не привязаны к лоту (фото в черновике).
  CARD_VARIANT = { resize_to_limit: [ 640, 640 ] }.freeze
  FULL_VARIANT = { resize_to_limit: [ 1600, 1600 ] }.freeze

  belongs_to :lot
  # dependent: :purge_later по умолчанию — удалили фото, файл удалится с диска фоновой задачей
  has_one_attached :image

  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, uniqueness: { scope: :lot_id }
  validate :image_is_supported

  # Подходит ли загруженный файл: тип определён по содержимому (Marcel), а не по расширению
  def self.acceptable_blob?(blob) = CONTENT_TYPES.include?(blob.content_type) && blob.byte_size <= MAX_BYTES

  private

  def image_is_supported
    if !image.attached?
      errors.add(:image, "не прикреплено")
    elsif !self.class.acceptable_blob?(image.blob)
      errors.add(:image, "должно быть JPEG, PNG или WebP до #{MAX_BYTES / 1.megabyte} МБ")
    end
  end
end
