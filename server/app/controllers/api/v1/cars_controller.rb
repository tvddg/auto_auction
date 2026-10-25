module Api
  module V1
    # Справочник комплектаций: машину создаёт любой вошедший пользователь, читать может кто угодно.
    class CarsController < BaseController
      FIELDS = %i[brand model trim year bodyType transmission driveType fuelType horsePower engineVolumeCc description].freeze

      before_action :authenticate!, only: :create

      rescue_from CarCatalog::InvalidParams do |error|
        render_error(:unprocessable_content, "validation_error", error.message, details: error.details)
      end

      # GET /api/v1/car?q=…
      def index
        page = CarCatalog.call(params)

        # Тело — массив, как у GET /lot, поэтому общее количество отдаём заголовком
        response.headers["X-Total-Count"] = page.total.to_s
        render json: page.cars.map { |car| CarSerializer.call(car) }
      end

      # POST /api/v1/car
      def create
        car = Car.new(params.permit(*FIELDS).to_h.transform_keys(&:underscore))
        return render_validation_error(car) unless car.valid?

        similar = car.similar
        return render_car_exists(similar) if similar

        car.save!
        render json: CarSerializer.call(car), status: :created
      rescue ActiveRecord::RecordNotUnique
        # Такую же машину создали параллельно, между проверкой и вставкой
        render_car_exists(car.similar)
      end

      # GET /api/v1/car/:id
      def show
        render json: CarSerializer.call(Car.find(params[:id]))
      end

      private

      def render_car_exists(car)
        render_error(:conflict, "car_exists", "Такая машина уже есть в справочнике", existingId: car&.id)
      end
    end
  end
end
