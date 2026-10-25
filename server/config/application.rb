require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Server
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.1

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w[assets tasks])

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

    # Only loads a smaller set of middleware suitable for API only apps.
    # Middleware like session, flash, cookies can be added back manually.
    # Skip views, helpers and assets when generating a new resource.
    config.api_only = true

    # Refresh-токен живёт в httpOnly-cookie, поэтому cookies возвращаем в стек.
    config.middleware.use ActionDispatch::Cookies

    # Во всех таблицах первичные ключи — uuid. Генераторы (в том числе миграция Active Storage)
    # должны делать так же, иначе active_storage_attachments.record_id станет bigint и не сможет
    # ссылаться на записи с uuid.
    config.generators do |generator|
      generator.orm :active_record, primary_key_type: :uuid
    end

    # Файлы и превью Active Storage отдаются под /api, чтобы их пропускал dev-прокси клиента
    # (он проксирует только /api) и всё API жило под одним префиксом.
    config.active_storage.routes_prefix = "/api/v1/storage"
    config.active_storage.variant_processor = :vips
  end
end
