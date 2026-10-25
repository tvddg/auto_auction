# Фото загружаются через POST /api/v1/photo — с авторизацией, лимитом частоты и проверкой типа.
# Встроенная прямая загрузка Active Storage (POST …/storage/direct_uploads) работает без авторизации
# и позволила бы кому угодно складывать файлы на диск, поэтому отключаем её.
Rails.application.config.to_prepare do
  ActiveStorage::DirectUploadsController.before_action { head :not_found }
end
