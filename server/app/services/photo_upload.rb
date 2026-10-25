# Загрузка фото для черновика лота (POST /photo). Файл сохраняется сразу, но к лоту пока не привязан:
# клиент хранит signed_id в черновике и передаёт его при публикации — см. LotPhotoBlobs.
class PhotoUpload
  class Invalid < StandardError; end

  def self.call(...) = new(...).call

  def initialize(file:, user:)
    @file = file
    @user = user
  end

  def call
    raise Invalid, "Прикрепите файл в поле file" unless @file.respond_to?(:read) && @file.respond_to?(:original_filename)
    raise Invalid, "Файл больше #{LotPhoto::MAX_BYTES / 1.megabyte} МБ" if @file.size > LotPhoto::MAX_BYTES

    # Тип — только по первым байтам файла (магической сигнатуре). Ни заголовку от клиента, ни
    # расширению не верим: identify у Active Storage при непонятном содержимом берёт тип из имени,
    # и текстовый «photo.jpg» прошёл бы как image/jpeg.
    content_type = Marcel::MimeType.for(@file)
    @file.rewind
    raise Invalid, "Поддерживаются JPEG, PNG и WebP" unless LotPhoto::CONTENT_TYPES.include?(content_type)

    # uploader_id нужен, чтобы при публикации нельзя было прикрепить чужой файл
    ActiveStorage::Blob.create_and_upload!(
      io: @file,
      filename: @file.original_filename,
      content_type:,
      metadata: { "uploader_id" => @user.id },
      identify: false
    )
  end
end
