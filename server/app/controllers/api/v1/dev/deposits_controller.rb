module Api
  module V1
    module Dev
      class DepositsController < Api::V1::BaseController
        MAX_TOP_UP_CENTS = 100_000_000_000 # 1 000 000 000 ₽ за раз

        before_action -> { head :not_found if Rails.env.production? }
        before_action :authenticate!

        # POST /api/v1/dev/deposit
        def create
          amount = Integer(params[:amountCents].to_s, 10, exception: false)
          unless amount&.between?(1, MAX_TOP_UP_CENTS)
            message = "Сумма — целое число копеек от 1 до #{MAX_TOP_UP_CENTS}"
            return render_error(:unprocessable_content, "validation_error", message, details: { amountCents: [ message ] })
          end

          # Атомарно прибавляем, чтобы параллельные пополнения не затирали друг друга
          User.update_counters(current_user.id, deposit_cents: amount)

          render json: { depositCents: current_user.reload.deposit_cents }
        end
      end
    end
  end
end
