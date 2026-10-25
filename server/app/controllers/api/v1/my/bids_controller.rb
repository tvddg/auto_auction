module Api
  module V1
    module My
      # «Мои ставки»: лоты с идущими торгами, где у пользователя есть принятая ставка.
      # Завершённые и отслеживаемые лоты сюда не входят.
      class BidsController < Api::V1::BaseController
        before_action :authenticate!

        # GET /api/v1/my/bids
        def index
          now = Time.current
          my_bids = Bid.accepted.where(user: current_user)

          lots = Lot.in_phase("active", now)
            .where(id: my_bids.select(:lot_id))
            .includes(:car, photos: { image_attachment: :blob })
            .order(:ends_at, :id) # сначала те, где торги кончатся раньше

          # Моя ставка на лоте — максимальная из принятых: одним запросом на все лоты
          my_max = my_bids.where(lot_id: lots.map(&:id)).group(:lot_id).maximum(:amount_cents)

          render json: lots.map { |lot| LotSerializer.my_bid(lot, my_bid_cents: my_max.fetch(lot.id), viewer: current_user) }
        end
      end
    end
  end
end
