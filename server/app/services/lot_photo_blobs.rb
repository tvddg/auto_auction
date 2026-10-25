# Превращает упорядоченный список signed_id из POST /lot в blob'ы для фото лота.
# Принимаем только файлы, которые загрузил этот же пользователь и которые ещё ни к чему не привязаны:
# адреса превью публичные и содержат signed_id, без этих проверок чужое фото можно было бы
# прикрепить к своему лоту.
class LotPhotoBlobs
  class Invalid < StandardError
    attr_reader :details

    def initialize(messages)
      @details = { photoIds: messages }
      super(messages.first)
    end
  end

  def self.call(...) = new(...).call

  def initialize(signed_ids, user:)
    @signed_ids = signed_ids
    @user = user
  end

  def call
    return [] if @signed_ids.nil?

    unless @signed_ids.is_a?(Array) && @signed_ids.all?(String)
      raise Invalid, [ "Передайте массив идентификаторов фото" ]
    end
    raise Invalid, [ "Не больше #{LotPhoto::MAX_PER_LOT} фото" ] if @signed_ids.size > LotPhoto::MAX_PER_LOT
    raise Invalid, [ "Одно и то же фото передано дважды" ] if @signed_ids.uniq.size != @signed_ids.size

    blobs = @signed_ids.map { |signed_id| ActiveStorage::Blob.find_signed(signed_id) }
    messages = []
    messages << "Часть фото не найдена — загрузите их заново" if blobs.any? { |blob| blob.nil? || !own?(blob) }
    messages << "Часть фото уже используется в другом объявлении" if blobs.compact.select { |blob| own?(blob) }.any? { |blob| blob.attachments.exists? }
    messages << "Поддерживаются JPEG, PNG и WebP" unless blobs.compact.all? { |blob| LotPhoto.acceptable_blob?(blob) }
    raise Invalid, messages if messages.any?

    blobs
  end

  private

  def own?(blob) = blob.metadata["uploader_id"] == @user.id
end
