module Api
  module V1
    module Auth
      # Регистрация в два шага: сначала email + пароль + телефон, затем код из СМС.
      # Пользователь появляется в базе только после подтверждения телефона.
      class RegistrationsController < Api::V1::BaseController
        include RefreshCookie

        MIN_PASSWORD_LENGTH = 8

        rate_limit to: 5, within: 1.minute,
                   by: -> { request.remote_ip },
                   with: -> { render_too_many_requests("Слишком много заявок. Попробуйте через минуту") },
                   only: %i[create resend]

        # POST /api/v1/auth/registration
        def create
          email = params[:email].to_s.strip.downcase
          password = params[:password].to_s
          phone = PhoneHelper.normalizePhone(params[:phone])

          details = validate_credentials(email:, password:, phone:)
          return render_error(:unprocessable_content, "validation_error", "Проверьте данные", details:) if details.any?

          if User.exists?(email:)
            return render_error(:unprocessable_content, "email_taken", "Аккаунт с таким email уже есть",
                                details: { email: [ "Этот email уже зарегистрирован" ] })
          end

          if User.exists?(phone:)
            return render_error(:unprocessable_content, "phone_taken", "Этот телефон уже привязан к аккаунту",
                                details: { phone: [ "Телефон уже зарегистрирован" ] })
          end

          registration, code = PendingRegistration.open!(email:, password:, phone:, ip: request.remote_ip)
          SmsDelivery.call(phone: registration.phone, code:)

          render json: challenge_payload(registration, code)
        end

        # POST /api/v1/auth/registration/resend
        def resend
          registration = find_registration
          return if performed?

          unless registration.resend_allowed?
            return render_too_many_requests("Новый код можно запросить через #{registration.seconds_until_resend} с")
          end

          code = registration.resend!
          SmsDelivery.call(phone: registration.phone, code:)

          render json: challenge_payload(registration, code)
        end

        # POST /api/v1/auth/registration/confirm — шаг 2
        def confirm
          registration = find_registration
          return if performed?

          if registration.code_expired?
            return render_error(:unprocessable_content, "code_expired", "Срок действия кода истёк. Запросите новый")
          end

          if registration.attempts_exceeded?
            return render_error(:unprocessable_content, "too_many_attempts", "Слишком много попыток. Запросите новый код")
          end

          unless registration.matches_code?(params[:code])
            registration.increment!(:attempts)
            return render_error(:unprocessable_content, "invalid_code", "Неверный код из СМС",
                                details: { code: [ "Неверный код" ] })
          end

          render_authenticated(registration.confirm!)
        end

        private

        def validate_credentials(email:, password:, phone:)
          details = {}
          details[:email] = [ "Введите корректный email" ] unless URI::MailTo::EMAIL_REGEXP.match?(email)
          details[:password] = [ "Минимум #{MIN_PASSWORD_LENGTH} символов" ] if password.length < MIN_PASSWORD_LENGTH
          details[:phone] = [ "Введите номер полностью" ] unless PhoneHelper.phoneValid?(phone)
          details
        end

        def find_registration
          registration = PendingRegistration.fresh.find_by(id: params[:registrationId])

          if registration.nil?
            render_error(:unprocessable_content, "registration_not_found", "Заявка устарела. Начните регистрацию заново")
          end

          registration
        end

        def challenge_payload(registration, code)
          payload = {
            registrationId: registration.id,
            phone: registration.phone,
            expiresIn: PendingRegistration::CODE_TTL.to_i,
            resendAfter: PendingRegistration::RESEND_AFTER.to_i
          }
          # Код возвращаем только вне production — чтобы разработка шла без СМС-провайдера.
          payload[:devCode] = code unless Rails.env.production?

          payload
        end
      end
    end
  end
end
