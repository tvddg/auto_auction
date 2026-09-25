module Api
  module V1
    module Auth
      class SessionsController < Api::V1::BaseController
        include RefreshCookie
        include AccessToken

        before_action :authenticate!, only: :show

        rate_limit to: 10, within: 1.minute,
                   by: -> { request.remote_ip },
                   with: -> { render_too_many_requests("Слишком много попыток входа. Попробуйте через минуту") },
                   only: :create

        # POST /api/v1/auth/login
        def create
          user = User.find_by(email: params[:email].to_s.strip.downcase)

          unless user&.authenticate(params[:password].to_s)
            return render_error(:unauthorized, "invalid_credentials", "Неверный email или пароль")
          end

          render_authenticated(user)
        end

        # POST /api/v1/auth/refresh — продление сессии по httpOnly-cookie
        def refresh
          session = RefreshSession.find_active(refresh_cookie_value)

          if session.nil?
            delete_refresh_cookie
            return render_unauthorized("Сессия истекла, войдите заново")
          end

          set_refresh_cookie(session.rotate!, session.expires_at)

          render json: {
            accessToken: generateToken(user: session.user, session:),
            expiresIn: AccessToken::TTL.to_i
          }
        end

        # POST /api/v1/auth/logout
        def destroy
          RefreshSession.find_active(refresh_cookie_value)&.destroy
          delete_refresh_cookie

          head :no_content
        end

        # GET /api/v1/auth/me
        def show
          render json: UserSerializer.call(current_user)
        end
      end
    end
  end
end
