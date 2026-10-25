module Api
  module V1
    # Каталог и страница лота публичные; создавать может любой вошедший пользователь,
    # изменять и снимать — только продавец (Lot#manageable_by?).
    class LotsController < BaseController
      CREATE_FIELDS = %i[carId vin mileage color city startingPriceCents startsAt endsAt].freeze
      UPDATE_FIELDS = %i[startingPriceCents startsAt endsAt].freeze

      before_action :authenticate!, only: %i[create update destroy]
      before_action :authenticate_optional!, only: :show
      before_action :find_managed_lot, only: %i[update destroy]

      rescue_from LotCatalog::InvalidParams, LotPhotoBlobs::Invalid do |error|
        render_error(:unprocessable_content, "validation_error", error.message, details: error.details)
      end

      # GET /api/v1/lot
      def index
        now = Time.current
        page = LotCatalog.call(params, now:)

        # Тело — массив по контракту, поэтому общее количество отдаём заголовком
        response.headers["X-Total-Count"] = page.total.to_s
        render json: page.lots.map { |lot| LotSerializer.card(lot, now:) }
      end

      # GET /api/v1/lot/:id
      def show
        lot = Lot.includes(:car, :seller, photos: { image_attachment: :blob }).find(params[:id])
        render json: LotSerializer.detail(lot, viewer: current_user)
      end

      # POST /api/v1/lot
      def create
        lot = Lot.new(lot_attributes(CREATE_FIELDS).merge(seller: current_user, status: :upcoming))
        return render_already_published if lot.vin.present? && Lot.open_lots.exists?(vin: lot.vin)

        # Фото — упорядоченный список signed_id файлов, загруженных заранее через POST /photo
        blobs = LotPhotoBlobs.call(params[:photoIds], user: current_user)

        # Лот и его фото — одной транзакцией: если что-то не сохранилось, не останется лота без фото
        Lot.transaction do
          lot.save!
          blobs.each_with_index { |blob, position| lot.photos.create!(position:, image: blob) }
        end

        render json: LotSerializer.call(lot), status: :created
      rescue ActiveRecord::RecordNotUnique
        # Тот же VIN выставили параллельно, между проверкой и вставкой
        render_already_published
      end

      # PATCH /api/v1/lot/:id
      def update
        return render_error(:conflict, "lot_not_editable", "Изменять можно только лот, торги по которому ещё не начались") unless @lot.editable?

        if params.key?(:carId)
          message = "Машину лота менять нельзя"
          return render_error(:unprocessable_content, "validation_error", message, details: { carId: [ message ] })
        end

        attributes = lot_attributes(UPDATE_FIELDS)
        return render_error(:unprocessable_content, "validation_error", "Передайте хотя бы одно поле для изменения") if attributes.empty?

        @lot.assign_attributes(attributes)
        # До старта ставок нет, поэтому текущая цена всегда равна стартовой
        @lot.current_price_cents = @lot.starting_price_cents if @lot.starting_price_cents_changed?
        @lot.save!

        render json: LotSerializer.call(@lot)
      end

      # DELETE /api/v1/lot/:id — без ставок лот удаляется, со ставками снимается с торгов
      def destroy
        case @lot.removal_mode
        when :delete then @lot.destroy!
        when :cancel then @lot.cancelled!
        else return render_error(:conflict, "lot_finished", "Лот уже завершён или снят с торгов")
        end

        head :no_content
      end

      private

      def find_managed_lot
        @lot = Lot.find(params[:id])
        render_forbidden("Изменять лот может только продавец") unless @lot.manageable_by?(current_user)
      end

      def lot_attributes(fields) = params.permit(*fields).to_h.transform_keys(&:underscore)

      def render_already_published
        render_error(:conflict, "lot_already_published", "Машина с этим VIN уже выставлена на аукцион")
      end
    end
  end
end
