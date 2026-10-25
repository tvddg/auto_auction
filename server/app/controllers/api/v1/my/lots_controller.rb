module Api
  module V1
    module My
      # «Мои лоты»: все опубликованные лоты пользователя в любом статусе, новые сверху.
      # Черновики живут в браузере и сюда не входят — их добавляет клиент.
      class LotsController < Api::V1::BaseController
        before_action :authenticate!

        # GET /api/v1/my/lots
        def index
          now = Time.current
          lots = Lot.where(seller: current_user)
            .includes(:car, :leader, photos: { image_attachment: :blob })
            .order(created_at: :desc, id: :desc)

          render json: lots.map { |lot| LotSerializer.my_lot(lot, now:) }
        end
      end
    end
  end
end
