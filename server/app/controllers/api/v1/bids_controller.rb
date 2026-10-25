module Api
  module V1
    class BidsController < BaseController
      BIGINT_MAX = 9_223_372_036_854_775_807
      UUID_FORMAT = /\A\h{8}-\h{4}-\h{4}-\h{4}-\h{12}\z/

      # Отклонённая ставка сохраняется в журнал, а клиенту уходит ошибка с кодом причины
      REJECTIONS = {
        "lot_not_active" => [ :method_not_allowed, "Торги по лоту ещё не начались" ],
        "lot_ended" => [ :method_not_allowed, "Торги по лоту завершены или лот снят" ],
        "amount_too_low" => [ :bad_request, "Ставка меньше текущей цены с учётом шага" ],
        "own_lot" => [ :forbidden, "Нельзя делать ставки на свой лот" ],
        "already_leading" => [ :conflict, "Ваша ставка уже лидирует" ],
        "insufficient_deposit" => [ :bad_request, "Недостаточно средств на депозите" ]
      }.freeze

      FEED_LIMIT = 50

      before_action :authenticate!, only: :create
      before_action :authenticate_optional!, only: :index

      rescue_from BidPlacement::KeyReused do
        render_error(:unprocessable_content, "idempotency_key_reused", "Этот ключ идемпотентности уже использован для другой ставки")
      end

      rescue_from BidStep::NotConfigured do
        render_error(:service_unavailable, "bid_steps_not_configured", "Шаг ставки не настроен. Попробуйте позже")
      end

      # GET /api/v1/lot/:lot_id/bids — принятые ставки, новые сверху. Публичная;
      # вошедшему помечаем его ставки (isMine). Отклонённые ставки — внутренний журнал, их не показываем.
      def index
        lot = Lot.find(params[:lot_id])
        bids = lot.bids.accepted.includes(:user).order(seq: :desc).limit(FEED_LIMIT)

        response.headers["X-Total-Count"] = lot.bid_count.to_s
        render json: bids.map { |bid| BidSerializer.feed(bid, viewer: current_user) }
      end

      # POST /api/v1/bid
      def create
        key = idempotency_key
        return render_error(:bad_request, "idempotency_key_required", "Передайте UUID в заголовке Idempotency-Key") unless key

        amount = Integer(params[:amountCents].to_s, 10, exception: false)
        unless amount&.between?(1, BIGINT_MAX)
          message = "Сумма ставки — целое положительное число копеек"
          return render_error(:unprocessable_content, "validation_error", message, details: { amountCents: [ message ] })
        end

        lot = Lot.find(params.require(:lotId))
        result = BidPlacement.call(lot:, user: current_user, amount_cents: amount, idempotency_key: key)
        bid = result.bid

        if bid.accepted?
          render json: BidSerializer.call(bid), status: result.replayed ? :ok : :created
        else
          status, message = REJECTIONS.fetch(bid.rejection_reason)
          render_error(status, bid.rejection_reason, message)
        end
      end

      private

      # В контракте заголовок назван Idempotency-Key; IdempotencyKey принимаем как вариант написания
      def idempotency_key
        key = request.headers["Idempotency-Key"].presence || request.headers["IdempotencyKey"].presence
        key.to_s.downcase if key&.match?(UUID_FORMAT)
      end
    end
  end
end
