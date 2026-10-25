# Относительные адреса превью (/api/v1/storage/representations/redirect/…).
# Относительные — чтобы работать и напрямую, и через dev-прокси клиента без настройки хоста.
# Превью создаётся при первом запросе и дальше берётся из кеша.
module PhotoPaths
  module_function

  # attachable — вложение (photo.image) или ещё не привязанный blob из черновика
  def card(attachable) = path(attachable.variant(LotPhoto::CARD_VARIANT))

  def full(attachable) = path(attachable.variant(LotPhoto::FULL_VARIANT))

  def path(variant) = Rails.application.routes.url_helpers.rails_representation_path(variant, only_path: true)
end
