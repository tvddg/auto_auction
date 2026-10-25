Rails.application.routes.draw do
  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      namespace :auth do
        post "login", to: "sessions#create"
        post "refresh", to: "sessions#refresh"
        post "logout", to: "sessions#destroy"
        get "me", to: "sessions#show"

        post "registration", to: "registrations#create"
        post "registration/resend", to: "registrations#resend"
        post "registration/confirm", to: "registrations#confirm"
      end

      # Пути в единственном числе — как в контракте API
      resources :cars, path: "car", only: %i[index create show]
      resources :lots, path: "lot", only: %i[index show create update destroy] do
        # Лента принятых ставок лота: GET /api/v1/lot/:lot_id/bids
        resources :bids, only: :index
      end
      resources :bids, path: "bid", only: :create

      # Данные текущего пользователя: «Мои ставки» и «Мои лоты»
      namespace :my do
        resources :bids, only: :index
        resources :lots, only: :index
      end
      # Фото для черновика лота: файл загружается сразу, к лоту привязывается в POST /lot
      resources :photos, path: "photo", only: :create

      # Только для разработки: пополнение депозита, пока нет настоящих платежей
      unless Rails.env.production?
        namespace :dev do
          post "deposit", to: "deposits#create"
        end
      end
    end
  end
end
