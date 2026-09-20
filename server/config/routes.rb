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
    end
  end
end
