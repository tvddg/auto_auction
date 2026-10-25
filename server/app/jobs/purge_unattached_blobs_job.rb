# Фото для черновиков загружаются до публикации лота. Если черновик бросили, файл так и остаётся
# непривязанным — удаляем такие спустя месяц. Срок большой, потому что черновики живут в браузере
# сколько угодно; фото из более старого черновика при публикации придётся загрузить заново.
class PurgeUnattachedBlobsJob < ApplicationJob
  queue_as :default

  MAX_AGE = 30.days

  def perform
    ActiveStorage::Blob.unattached.where(created_at: ..MAX_AGE.ago).find_each(&:purge_later)
  end
end
